import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generate, hashPrompt, main, verifyArtifacts } from "@gis-engine/cli";
import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// generate.ts — hashPrompt
// ---------------------------------------------------------------------------

describe("cli-generate-hashPrompt", () => {
  it("returns sha256:<64-hex> format", () => {
    const hash = hashPrompt("Create a map with GeoJSON points");
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(hash).toHaveLength(71); // "sha256:" (7) + 64 hex chars
  });

  it("is deterministic — same input yields same hash", () => {
    const a = hashPrompt("hello world");
    const b = hashPrompt("hello world");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = hashPrompt("prompt one");
    const b = hashPrompt("prompt two");
    expect(a).not.toBe(b);
  });

  it("matches the normalizeWorkbenchProviderPlan regex", () => {
    const hash = hashPrompt("test prompt");
    // normalizeWorkbenchProviderPlan validates: /^sha256:[A-Za-z0-9._:-]{1,96}$/
    expect(hash).toMatch(/^sha256:[A-Za-z0-9._:-]{1,96}$/);
  });
});

// ---------------------------------------------------------------------------
// no raw prompt retention
// ---------------------------------------------------------------------------

describe("cli-no-raw-prompt-retention", () => {
  it("hashPrompt output does not contain the original prompt text", () => {
    const prompt = "Create a map showing earthquake data in Japan";
    const hash = hashPrompt(prompt);
    expect(hash).not.toContain(prompt);
    expect(hash).not.toContain("earthquake");
    expect(hash).not.toContain("Japan");
  });

  it("hash is irreversible — not base64 or similar reversible encoding", () => {
    const prompt = "Show me population density across major cities in the world";
    const hash = hashPrompt(prompt);

    // The hash value after "sha256:" is 64 hex chars — far smaller than long prompts
    const hexPart = hash.slice(7); // strip "sha256:"
    expect(hexPart).toHaveLength(64);

    // Verify it is purely hex after the prefix
    expect(hexPart).toMatch(/^[0-9a-f]{64}$/);

    // Attempt base64 decode — should not yield the original prompt
    const decoded = Buffer.from(hexPart, "base64").toString("utf-8");
    expect(decoded).not.toContain(prompt);

    // The hash does not contain any recognizable substring of the prompt
    expect(hash).not.toContain("population");
    expect(hash).not.toContain("density");
  });
});

// ---------------------------------------------------------------------------
// generate.ts — delivery summary
// ---------------------------------------------------------------------------

describe("cli-generate-delivery-summary", () => {
  it("writes review-ready delivery evidence without raw prompt retention", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-generate-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);

      const result = await generate({
        projectName: "reviewable-map",
        provider: "mock",
        prompt: "Create a map showing private customer locations in Berlin",
        dryRun: false,
      });

      const summary = JSON.parse(readFileSync(join(dir, "reviewable-map", "delivery-summary.json"), "utf-8"));
      const evidence = JSON.parse(readFileSync(join(dir, "reviewable-map", "evidence.json"), "utf-8"));
      const preflight = JSON.parse(readFileSync(join(dir, "reviewable-map", "preflight.json"), "utf-8"));
      const review = readFileSync(join(dir, "reviewable-map", "REVIEW.md"), "utf-8");
      const manifest = JSON.parse(readFileSync(join(dir, "reviewable-map", "artifact-manifest.json"), "utf-8"));
      const mapBytes = readFileSync(join(dir, "reviewable-map", "map.json"));

      expect(result.files).toContain("preflight.json");
      expect(result.files).toContain("delivery-summary.json");
      expect(result.files).toContain("REVIEW.md");
      expect(result.files).toContain("artifact-manifest.json");
      expect(summary.retainedRawPrompt).toBe(false);
      expect(JSON.stringify(summary)).not.toContain("private customer locations");
      expect(JSON.stringify(preflight)).not.toContain("private customer locations");
      expect(review).not.toContain("private customer locations");
      expect(JSON.stringify(manifest)).not.toContain("private customer locations");
      expect(review).toContain("# Generated Map Review");
      expect(review).toContain(`Prompt hash: ${summary.promptHash}`);
      expect(review).toContain("Raw prompt retained: no");
      expect(review).toContain(`Delivery state: ${summary.delivery.acceptance.state}`);
      expect(review).toContain(`Preflight status: ${preflight.status}`);
      expect(review).toContain("`delivery-summary.json`: compact delivery and preflight summary");
      expect(review).toContain("`artifact-manifest.json`: generated file list");
      expect(manifest).toMatchObject({
        schemaVersion: "gis-engine.generate-artifact-manifest.v1",
        projectName: "reviewable-map",
        provider: "mock",
        promptHash: summary.promptHash,
        traceId: summary.traceId,
        retainedRawPrompt: false,
      });
      expect(manifest.requiredReviewFiles).toEqual([
        "map.json",
        "preflight.json",
        "delivery-summary.json",
        "REVIEW.md",
      ]);
      expect(manifest.files.map((file: { path: string }) => file.path)).toEqual(
        result.files.filter((file) => file !== "artifact-manifest.json"),
      );
      expect(manifest.artifactCount).toBe(manifest.files.length);
      expect(manifest.files.find((file: { path: string }) => file.path === "artifact-manifest.json")).toBeUndefined();
      expect(manifest.files.find((file: { path: string }) => file.path === "map.json")).toMatchObject({
        path: "map.json",
        role: "mapspec",
        required: true,
        bytes: mapBytes.byteLength,
        sha256: `sha256:${createHash("sha256").update(mapBytes).digest("hex")}`,
      });
      expect(manifest.files.find((file: { path: string }) => file.path === "evidence.json")).toMatchObject({
        path: "evidence.json",
        role: "evidence",
        required: false,
      });
      expect(summary.preflight).toMatchObject({
        ok: preflight.ok,
        status: preflight.status,
        validation: {
          valid: preflight.validation.valid,
          sourceCount: preflight.validation.stats.sourceCount,
          layerCount: preflight.validation.stats.layerCount,
          diagnosticCounts: preflight.validation.diagnosticCounts,
        },
        sourceReadiness: {
          status: preflight.sourceReadiness.status,
          summary: preflight.sourceReadiness.summary,
        },
        pmtiles: {
          status: preflight.pmtiles.status,
          summary: preflight.pmtiles.summary,
        },
      });
      expect(summary.delivery).toMatchObject({
        status: evidence.delivery.status,
        acceptance: evidence.delivery.acceptance,
        confirmationRequired: evidence.delivery.confirmationRequired,
      });
      expect(summary.delivery.sections).toEqual(evidence.delivery.sections);
      expect(summary.delivery.sourceReadiness).toMatchObject({
        total: evidence.delivery.sourceReadiness.length,
        supported: evidence.delivery.sourceReadiness.filter((source: { state: string }) => source.state === "supported")
          .length,
        readinessOnly: evidence.delivery.sourceReadiness.filter(
          (source: { state: string }) => source.state === "readiness-only",
        ).length,
        blocked: evidence.delivery.sourceReadiness.filter((source: { state: string }) => source.state === "blocked")
          .length,
        sources: evidence.delivery.sourceReadiness,
      });
      expect(summary.delivery.spatialQueryReadiness).toEqual(evidence.delivery.spatialQueryReadiness);
      expect(summary.delivery.sourcePromotionCandidates).toEqual(evidence.delivery.sourcePromotionCandidates ?? []);
      expect(summary.delivery.confirmations).toEqual(evidence.delivery.confirmations);
      expect(summary.delivery.followUps).toEqual(evidence.delivery.followUps);
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps generated project audit artifacts schema-stable and tamper-evident", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-generate-audit-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);

      const prompt = "Create an auditable map for private delivery review";
      const result = await generate({
        projectName: "auditable-map",
        provider: "mock",
        prompt,
        dryRun: false,
      });

      const projectDir = join(dir, "auditable-map");
      const summary = JSON.parse(readFileSync(join(projectDir, "delivery-summary.json"), "utf-8"));
      const evidence = JSON.parse(readFileSync(join(projectDir, "evidence.json"), "utf-8"));
      const preflight = JSON.parse(readFileSync(join(projectDir, "preflight.json"), "utf-8"));
      const review = readFileSync(join(projectDir, "REVIEW.md"), "utf-8");
      const manifest = JSON.parse(readFileSync(join(projectDir, "artifact-manifest.json"), "utf-8"));
      const manifestFiles = manifest.files as Array<{
        path: string;
        role: string;
        required: boolean;
        bytes: number;
        sha256: string;
      }>;
      const filesByPath = new Map(manifestFiles.map((file) => [file.path, file]));

      expect(summary).toMatchObject({
        provider: "mock",
        planStatus: result.planStatus,
        commandCount: result.commandCount,
        validation: { valid: result.validationValid },
        evidenceStatus: result.evidenceStatus,
        retainedRawPrompt: false,
      });
      expect(summary.preflight).toMatchObject({
        ok: preflight.ok,
        status: preflight.status,
        diagnostics: {
          count: preflight.diagnostics.length,
          error: preflight.diagnostics.filter((diagnostic: { severity: string }) => diagnostic.severity === "error")
            .length,
          warning: preflight.diagnostics.filter((diagnostic: { severity: string }) => diagnostic.severity === "warning")
            .length,
          info: preflight.diagnostics.filter((diagnostic: { severity: string }) => diagnostic.severity === "info")
            .length,
        },
      });
      expect(summary.delivery.sections).toEqual(evidence.delivery.sections);
      expect(summary.delivery.spatialQueryReadiness).toEqual(evidence.delivery.spatialQueryReadiness);
      expect(manifest.requiredReviewFiles).toEqual([
        "map.json",
        "preflight.json",
        "delivery-summary.json",
        "REVIEW.md",
      ]);
      expect(filesByPath.get("map.json")).toMatchObject({ role: "mapspec", required: true });
      expect(filesByPath.get("preflight.json")).toMatchObject({ role: "preflight", required: true });
      expect(filesByPath.get("delivery-summary.json")).toMatchObject({
        role: "delivery-summary",
        required: true,
      });
      expect(filesByPath.get("REVIEW.md")).toMatchObject({ role: "review", required: true });
      expect(filesByPath.get("evidence.json")).toMatchObject({ role: "evidence", required: false });
      expect(filesByPath.get("artifact-manifest.json")).toBeUndefined();
      expect(review).toContain("## Review Files");
      for (const requiredFile of manifest.requiredReviewFiles) {
        expect(review).toContain(`\`${requiredFile}\``);
      }

      const artifactVerification = verifyArtifacts({ projectDir });
      expect(artifactVerification).toMatchObject({
        ok: true,
        mode: "artifact-manifest-verify",
        status: "verified",
        summary: {
          requiredFileCount: 4,
          missingFileCount: 0,
          byteMismatchCount: 0,
          hashMismatchCount: 0,
        },
      });
      expect(JSON.stringify({ summary, evidence, preflight, manifest, review })).not.toContain(prompt);

      const mapPath = join(projectDir, "map.json");
      const originalMap = readFileSync(mapPath, "utf-8");
      expect(originalMap).toContain('"0.1"');
      writeFileSync(mapPath, originalMap.replace('"0.1"', '"0.2"'), "utf-8");
      const hashTamperedVerification = verifyArtifacts({ projectDir });
      expect(hashTamperedVerification.ok).toBe(false);
      expect(hashTamperedVerification.status).toBe("blocked");
      expect(hashTamperedVerification.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        "ARTIFACT_MANIFEST.HASH_MISMATCH",
      );

      writeFileSync(mapPath, "{}\n", "utf-8");
      const byteTamperedVerification = verifyArtifacts({ projectDir });
      expect(byteTamperedVerification.ok).toBe(false);
      expect(byteTamperedVerification.status).toBe("blocked");
      expect(byteTamperedVerification.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        "ARTIFACT_MANIFEST.BYTE_MISMATCH",
      );
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// bin.ts — generate integration via main()
// ---------------------------------------------------------------------------

describe("cli-bin-generate-integration", () => {
  it("runs full generate pipeline via main() with mock provider", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-gen-main-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);

      await main(["gen-map", "--generate", "--provider", "mock", "--prompt", "Show parks in NYC"]);

      const projectDir = join(dir, "gen-map");
      expect(existsSync(join(projectDir, "map.json"))).toBe(true);
      expect(existsSync(join(projectDir, "evidence.json"))).toBe(true);
      expect(existsSync(join(projectDir, "preflight.json"))).toBe(true);
      expect(existsSync(join(projectDir, "delivery-summary.json"))).toBe(true);
      expect(existsSync(join(projectDir, "REVIEW.md"))).toBe(true);
      expect(existsSync(join(projectDir, "artifact-manifest.json"))).toBe(true);

      const map = JSON.parse(readFileSync(join(projectDir, "map.json"), "utf-8"));
      expect(map.version).toBe("0.1");
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
