import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, verifyArtifacts } from "@gis-engine/cli";
import { EvidenceRecordSchema, verifyEvidenceRecord } from "@gis-engine/engine/evidence";
import Ajv from "ajv";
import { describe, expect, it, vi } from "vitest";

const ajv = new Ajv({ strict: false });

async function generateInto(
  projectName: string,
  extraArgs: string[] = [],
): Promise<{ dir: string; projectDir: string }> {
  const dir = mkdtempSync(join(tmpdir(), `gis-${projectName}-`));
  const cwd = process.cwd();
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  process.chdir(dir);
  try {
    await main([
      projectName,
      "--generate",
      "--provider",
      "mock",
      "--prompt",
      "Show parks in NYC",
      "--yes",
      ...extraArgs,
    ]);
    return { dir, projectDir: join(dir, projectName) };
  } finally {
    process.chdir(cwd);
    logSpy.mockRestore();
    errorSpy.mockRestore();
    vi.restoreAllMocks();
  }
}

/**
 * Re-hash `evidence.json` into `artifact-manifest.json` so the package is internally consistent at the
 * manifest level again. Without this the tamper below would be caught by the pre-existing sha256 check
 * and the test would prove nothing about the cross-check it targets.
 */
function reanchorManifest(projectDir: string): void {
  const manifestPath = join(projectDir, "artifact-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const bytes = readFileSync(join(projectDir, "evidence.json"));
  const entry = (manifest.files as Array<Record<string, unknown>>).find((file) => file.path === "evidence.json");
  if (!entry) throw new Error("evidence.json must be listed in artifact-manifest.json");
  entry.bytes = bytes.byteLength;
  entry.sha256 = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
}

describe("CLI evidence export", () => {
  it("writes a schema-valid EvidenceRecord and links it into the manifest", async () => {
    const { dir, projectDir } = await generateInto("evidence-valid");
    try {
      const record = JSON.parse(readFileSync(join(projectDir, "evidence.json"), "utf-8"));
      const manifest = JSON.parse(readFileSync(join(projectDir, "artifact-manifest.json"), "utf-8"));

      expect(ajv.compile(EvidenceRecordSchema)(record)).toBe(true);
      expect(manifest.files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "evidence.json", role: "evidence", required: true }),
          expect.objectContaining({ path: "evidence-verifier.mjs", role: "evidence" }),
        ]),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps every recorded artifact path a clean relative POSIX path", async () => {
    // Task 6's verifier refuses, before any read, a path with a `..` segment, a leading `/`, a drive
    // letter, a backslash form or a NUL. A single `path.join` on the export side would silently make
    // the whole package unverifiable on Windows, so the invariant is pinned where the record is built.
    // `vite-ts` is the template that emits nested paths (`src/main.ts`); the default `static-html`
    // template is flat and would leave the loop below checking only single-segment names.
    const { dir, projectDir } = await generateInto("evidence-paths", ["--template", "vite-ts"]);
    try {
      const record = JSON.parse(readFileSync(join(projectDir, "evidence.json"), "utf-8"));
      const paths = (record.artifacts as Array<{ path: string }>).map((artifact) => artifact.path);

      expect(paths.length).toBeGreaterThan(0);
      expect(paths).toContain("src/main.ts");
      for (const path of paths) {
        expect(path).not.toContain("\\");
        expect(path).not.toContain("\0");
        expect(path.startsWith("/")).toBe(false);
        expect(path.startsWith("./")).toBe(false);
        expect(path.split("/")).not.toContain("..");
      }
      expect(new Set(paths).size).toBe(paths.length);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("produces a package the trust-tier verifier recomputes clean", async () => {
    const { dir, projectDir } = await generateInto("evidence-verify");
    try {
      const record = JSON.parse(readFileSync(join(projectDir, "evidence.json"), "utf-8"));

      const result = await verifyEvidenceRecord(record, {
        readArtifact: async (path) => new Uint8Array(readFileSync(join(projectDir, path))),
      });

      // 消费者契约见 Task 5 Step 4：绿与否只看 `result.ok`（断言全绿 **且** 无 error 诊断）。
      expect(result.ok).toBe(true);
      expect(result.assertions.filter((entry) => entry.status === "failed")).toEqual([]);
      expect(result.assertions.map((entry) => entry.status)).toContain("not-covered");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("catches a byte-level swap of evidence.json through the manifest", async () => {
    const { dir, projectDir } = await generateInto("evidence-tamper");
    try {
      // Same tamper pattern tests/cli/generate.test.ts:282 already uses for map.json.
      expect(verifyArtifacts({ projectDir }).ok).toBe(true);

      const record = JSON.parse(readFileSync(join(projectDir, "evidence.json"), "utf-8"));
      writeFileSync(join(projectDir, "evidence.json"), `${JSON.stringify({ ...record, issuer: "attacker" })}\n`);

      const tampered = verifyArtifacts({ projectDir });
      expect(tampered.ok).toBe(false);
      expect(tampered.summary.hashMismatchCount + tampered.summary.byteMismatchCount).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("CLI evidence export rejects a record that under-attests the package", () => {
  /**
   * `artifact-manifest.json` is the byte-level anchor for the whole exported package, and the
   * `EvidenceRecord` inside it is the third party's file list. If the two are never compared, a package
   * can carry a record that quietly drops a file from `artifacts[]` — the manifest still hashes every
   * file it lists, and `evidence-verifier.mjs` still reports `ok: true` for the shorter list, so nobody
   * notices the evidence surface shrank. These cases rewrite the record *and* re-anchor the manifest, so
   * only the cross-check can catch them.
   */
  it("flags a record whose artifacts[] omit a file the manifest hashes", async () => {
    const { dir, projectDir } = await generateInto("evidence-underreport");
    try {
      const recordPath = join(projectDir, "evidence.json");
      const record = JSON.parse(readFileSync(recordPath, "utf-8"));
      const dropped = (record.artifacts as Array<{ path: string }>).find((artifact) => artifact.path === "map.json");
      expect(dropped, "the generated record must attest map.json").toBeDefined();
      record.artifacts = (record.artifacts as Array<{ path: string }>).filter(
        (artifact) => artifact.path !== "map.json",
      );
      writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");
      reanchorManifest(projectDir);

      // Without the cross-check the package is manifest-consistent, so `ok` would stay true.
      const result = verifyArtifacts({ projectDir });
      expect(result.ok).toBe(false);
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        "ARTIFACT_MANIFEST.EVIDENCE_ARTIFACT_MISSING",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("flags a record that attests a file the manifest does not hash", async () => {
    const { dir, projectDir } = await generateInto("evidence-overreport");
    try {
      const recordPath = join(projectDir, "evidence.json");
      const record = JSON.parse(readFileSync(recordPath, "utf-8"));
      const anchor = (record.artifacts as Array<{ path: string; bytes: number; sha256: string }>).find(
        (artifact) => artifact.path === "map.json",
      );
      expect(anchor, "the generated record must attest map.json").toBeDefined();
      record.artifacts = [
        ...(record.artifacts as unknown[]),
        { ...anchor, path: "not-in-the-manifest.json" },
      ] as typeof record.artifacts;
      writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");
      reanchorManifest(projectDir);

      const result = verifyArtifacts({ projectDir });
      expect(result.ok).toBe(false);
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        "ARTIFACT_MANIFEST.EVIDENCE_ARTIFACT_UNLISTED",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps an untouched exported package cross-check clean", async () => {
    const { dir, projectDir } = await generateInto("evidence-cross-check-clean");
    try {
      const result = verifyArtifacts({ projectDir });
      expect(result.ok).toBe(true);
      expect(result.diagnostics).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("CLI evidence export cross-check diagnostic codes", () => {
  /**
   * `evidence.json`'s on-disk shape before Task 7 replaced it with the `EvidenceRecord`: a
   * `GenerationEvidenceBundle` tool view, whose `delivery` block carries exactly the fields the retired
   * `summary.delivery` cross-check used to pull against the published bundle. Any package exported before
   * the format swap parses as JSON but has no `artifacts` array, so this is the record the
   * `EVIDENCE_RECORD_INVALID` branch exists for — pinned as behaviour, not as reasoning.
   */
  function legacyBundleShape(promptHash: string): Record<string, unknown> {
    return {
      promptHash,
      status: "ready",
      targetDomains: ["map"],
      toolSequence: ["get_context_summary", "export_example_app"],
      summary: {},
      validation: { valid: true, stats: { sourceCount: 1, layerCount: 1 }, diagnostics: [] },
      commandEvidence: { usedApplyCommands: true, commandCount: 1, committed: 1, rolledBack: 0 },
      plannerEvidence: { provided: true, retainedRawPrompt: false, acceptedIntentFields: [] },
      spatialQueryEvidence: { requested: false, checks: [] },
      snapshotEvidence: { requested: false },
      exportEvidence: { ready: true },
      delivery: {
        status: "ready",
        acceptance: { state: "ready" },
        sections: [{ id: "map", state: "ready" }],
        sourceReadiness: [],
        spatialQueryReadiness: [],
        confirmationRequired: false,
        confirmations: [],
        followUps: [],
      },
      exampleEvidence: { exampleId: "ai-map-workbench", writesFiles: false, fileCount: 0 },
      diagnostics: [],
    };
  }

  it("reports EVIDENCE_RECORD_UNREADABLE for an endorsed evidence.json that is not parseable", async () => {
    const { dir, projectDir } = await generateInto("evidence-unreadable");
    try {
      const recordPath = join(projectDir, "evidence.json");
      // Truncated JSON: the manifest hash matches the bytes on disk, so the per-entry pass stays green and
      // only the cross-check's read side can see this.
      writeFileSync(recordPath, '{"schemaVersion": "evidence-record.v0.1", "artifacts": [', "utf-8");
      reanchorManifest(projectDir);

      // Constraint 7: a corrupt record is answered with a diagnostic, never with a thrown error.
      const result = verifyArtifacts({ projectDir });
      expect(result.ok).toBe(false);
      expect(result.diagnostics).toEqual([
        expect.objectContaining({
          severity: "error",
          code: "ARTIFACT_MANIFEST.EVIDENCE_RECORD_UNREADABLE",
          path: "evidence.json",
          message: expect.stringContaining("Could not read the evidence record"),
        }),
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports EVIDENCE_RECORD_INVALID for a package still exporting the pre-Task-7 bundle", async () => {
    const { dir, projectDir } = await generateInto("evidence-legacy-bundle");
    try {
      const recordPath = join(projectDir, "evidence.json");
      const generated = JSON.parse(readFileSync(recordPath, "utf-8")) as { origin: { promptHash: string } };
      writeFileSync(
        recordPath,
        `${JSON.stringify(legacyBundleShape(generated.origin.promptHash), null, 2)}\n`,
        "utf-8",
      );
      reanchorManifest(projectDir);

      const result = verifyArtifacts({ projectDir });
      expect(result.ok).toBe(false);
      expect(result.diagnostics).toEqual([
        expect.objectContaining({
          severity: "error",
          code: "ARTIFACT_MANIFEST.EVIDENCE_RECORD_INVALID",
          path: "evidence.json/artifacts",
          message: expect.stringContaining("artifacts array"),
        }),
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports EVIDENCE_ARTIFACT_MISMATCH when the record's byte facts disagree with the manifest", async () => {
    const { dir, projectDir } = await generateInto("evidence-fact-mismatch");
    try {
      const recordPath = join(projectDir, "evidence.json");
      const record = JSON.parse(readFileSync(recordPath, "utf-8"));
      const wrongSha = `sha256:${"0".repeat(64)}`;
      record.artifacts = (record.artifacts as Array<{ path: string; bytes: number; sha256: string }>).map(
        (artifact) => {
          // Both legs of the fact comparison: a well-formed sha256 pointing at other content, and a byte
          // count off by one. The manifest still matches both files on disk, so nothing else can see it.
          if (artifact.path === "map.json") return { ...artifact, sha256: wrongSha };
          if (artifact.path === "preflight.json") return { ...artifact, bytes: artifact.bytes + 1 };
          return artifact;
        },
      );
      writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");
      reanchorManifest(projectDir);

      const result = verifyArtifacts({ projectDir });
      expect(result.ok).toBe(false);
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "error",
            code: "ARTIFACT_MANIFEST.EVIDENCE_ARTIFACT_MISMATCH",
            path: "map.json",
          }),
          expect.objectContaining({
            severity: "error",
            code: "ARTIFACT_MANIFEST.EVIDENCE_ARTIFACT_MISMATCH",
            path: "preflight.json",
          }),
        ]),
      );
      expect(result.diagnostics).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("CLI evidence export rejection path", () => {
  /**
   * `buildEvidenceRecord` already rejects an over-budget record (Task 4). What this pins is the CLI
   * branch: the package must not ship a half-written `evidence.json`, and the process must say so
   * through `process.exitCode` rather than by throwing a natural-language error.
   */
  it("does not write evidence.json and exits 1 when the builder rejects the record", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-evidence-reject-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const previousExitCode = process.exitCode;
    vi.resetModules();
    vi.doMock("@gis-engine/engine/evidence", async (importOriginal) => {
      const actual = await importOriginal<Record<string, unknown>>();
      return {
        ...actual,
        buildEvidenceRecord: () => ({
          ok: false,
          diagnostics: [
            {
              severity: "error",
              code: "EVIDENCE.RECORD_INVALID",
              message: "Evidence record exceeds the 1048576 byte budget.",
              path: "/",
            },
          ],
        }),
      };
    });
    process.chdir(dir);
    try {
      const cli = await import("@gis-engine/cli");
      await cli.main(["rejected-map", "--generate", "--provider", "mock", "--prompt", "Show parks", "--yes"]);

      expect(process.exitCode).toBe(1);
      expect(vi.mocked(errorSpy).mock.calls.flat().join("\n")).toContain("Evidence record rejected");
      // No half-written evidence surface survives: the whole staging directory is discarded.
      expect(existsSync(join(dir, "rejected-map", "evidence.json"))).toBe(false);
      expect(existsSync(join(dir, "rejected-map"))).toBe(false);
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      errorSpy.mockRestore();
      vi.doUnmock("@gis-engine/engine/evidence");
      vi.resetModules();
      process.exitCode = previousExitCode;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
