import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DiagnosticCodes } from "@gis-engine/engine";
import {
  canonicalHash,
  EvidenceIssueCode,
  MAX_EVIDENCE_RECORD_BYTES,
  runEvidenceVerifierCli,
  verifyEvidenceRecord,
} from "@gis-engine/engine/evidence";
import { describe, expect, it } from "vitest";
import { buildFixture, MAP_JSON, sha256Of, validRecord } from "./fixtures/record.js";

const DIST_VERIFIER = resolve("packages/engine/dist/evidence-verifier.mjs");
// This list and `BUNDLE` in packages/engine/scripts/build-evidence-verifier.ts are the same set in the
// same order, and each names the other: the strip-and-embed lock below only proves anything about the
// modules this test actually lists, so a closure member added to the build script without being added
// here would narrow the guard's coverage in silence. The "same set, same order" claim is re-derived
// from the build script's own source instead of being left to the comment.
const BUILD_SCRIPT = "packages/engine/scripts/build-evidence-verifier.ts";
const BUNDLE_MODULES = [
  resolve("packages/engine/dist/src/evidence/canonical-stringify.js"),
  resolve("packages/engine/dist/src/evidence/record.js"),
];

describe("standalone evidence verifier", () => {
  it("emits a single file whose only runtime imports are node builtins", () => {
    const source = readFileSync(DIST_VERIFIER, "utf-8");
    // Same scanner the build script uses: a `from "…"`-only regex is bypassed by `await import("…")`,
    // which is exactly how Task 3's reachability guard was shown to be leaky.
    const specifiers = [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)"([^"]+)"/g)].map(
      (match) => match[1]!,
    );

    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(specifier.startsWith("node:")).toBe(true);
    }
  });

  it("keeps the build script's embedded closure list identical to this test's list", () => {
    const script = readFileSync(resolve(BUILD_SCRIPT), "utf-8");
    const declared = script.match(/const BUNDLE = \[([\s\S]*?)\]/);
    expect(declared, "build-evidence-verifier.ts must keep declaring BUNDLE as a single array literal").not.toBeNull();
    const members = [...declared![1].matchAll(/"([^"]+)"/g)].map((match) => resolve("packages/engine", match[1]!));
    // Same members AND same order: the strip-and-embed lock below iterates this list, so an appended
    // closure member that never reaches it is a silently unguarded member.
    expect(members).toEqual(BUNDLE_MODULES);
  });

  it("ships the compiled engine hashing modules verbatim inside the standalone file", () => {
    const verifier = readFileSync(DIST_VERIFIER, "utf-8");

    for (const module of BUNDLE_MODULES) {
      // 构建脚本只剥掉「引用闭包内模块的那几行 import」，其余逐字内嵌；这里用同一套剥除规则复算。
      // 复算必须与 build-evidence-verifier.ts 的剥除逻辑同构（同一 specifier 判定），否则这条
      // 「逐字内嵌」锁会和构建脚本各说各话。
      const inlined = readFileSync(module, "utf-8")
        .split("\n")
        .filter(
          (line) =>
            ![...line.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)"([^"]+)"/g)]
              .map((match) => match[1]!)
              .some((specifier) => !specifier.startsWith("node:") && specifier.startsWith("./")),
        )
        .join("\n");
      expect(verifier).toContain(inlined.trimEnd());
    }
  });

  it("agrees with the engine implementation on the same fixture", async () => {
    const directory = mkdtempSync(join(tmpdir(), "evidence-verifier-"));
    try {
      writeFileSync(join(directory, "evidence.json"), `${JSON.stringify(validRecord, null, 2)}\n`);
      writeFileSync(join(directory, "map.json"), MAP_JSON);

      const standalone = JSON.parse(
        execFileSync("node", [DIST_VERIFIER, join(directory, "evidence.json"), "--root", directory, "--json"], {
          encoding: "utf-8",
        }),
      );
      const engine = await verifyEvidenceRecord(validRecord, {
        readArtifact: async (path) => new TextEncoder().encode(readFileSync(join(directory, path), "utf-8")),
      });

      expect(standalone).toEqual({
        ok: engine.ok,
        assertions: engine.assertions,
        diagnostics: engine.diagnostics,
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("runs with no node_modules on the resolution path and still detects tampering", () => {
    const directory = mkdtempSync(join(tmpdir(), "evidence-isolated-"));
    try {
      const tampered = { ...validRecord, issuer: "attacker" };
      writeFileSync(join(directory, "evidence.json"), `${JSON.stringify(tampered)}\n`);
      writeFileSync(join(directory, "map.json"), MAP_JSON);
      writeFileSync(join(directory, "evidence-verifier.mjs"), readFileSync(DIST_VERIFIER, "utf-8"));

      let exitCode = 0;
      let stdout = "";
      try {
        stdout = execFileSync("node", ["evidence-verifier.mjs", "evidence.json", "--json"], {
          cwd: directory,
          encoding: "utf-8",
          env: { ...process.env, NODE_PATH: "" },
        });
      } catch (error) {
        exitCode = (error as { status?: number }).status ?? 0;
        stdout = String((error as { stdout?: string }).stdout ?? "");
      }

      expect(exitCode).toBe(2);
      expect(JSON.parse(stdout).diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.CHAIN_BROKEN" }));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("hashes raw bytes, not a decode/re-encode round-trip", async () => {
    // A CRLF + non-ASCII file is the cheapest way to prove the verifier reads bytes.
    const directory = mkdtempSync(join(tmpdir(), "evidence-bytes-"));
    try {
      const bytes = new Uint8Array(Buffer.from(`{"title":"公园"}\r\n`, "utf-8"));
      writeFileSync(join(directory, "label.json"), bytes);
      const record = buildFixture({
        artifacts: [{ path: "label.json", role: "data", bytes: bytes.byteLength, sha256: sha256Of(bytes) }],
      });
      writeFileSync(join(directory, "evidence.json"), JSON.stringify(record));

      const verdict = JSON.parse(
        execFileSync("node", [DIST_VERIFIER, join(directory, "evidence.json"), "--root", `${directory}/`, "--json"], {
          encoding: "utf-8",
        }),
      );

      expect(verdict.assertions.find((entry: { id: string }) => entry.id === "ARTIFACTS_MATCH").status).toBe("passed");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps EvidenceIssueCode and DiagnosticCodes in sync", () => {
    for (const code of Object.values(EvidenceIssueCode)) {
      expect(Object.values(DiagnosticCodes)).toContain(code);
    }
    expect(canonicalHash({ a: 1 })).toBe(canonicalHash({ a: 1 }));
  });

  describe("read-side byte budget", () => {
    /**
     * Constraint 5's reject-not-truncate duty has two ends: the builder refuses to emit an
     * over-budget record, and the audit entry point refuses to parse one. `evidence.json` is untrusted
     * input handed to the auditing party, so an arbitrarily large file must be refused on byte count
     * before `JSON.parse` gets a chance to allocate against it.
     */
    it("refuses an oversized untrusted record before parsing it and reports no assertion verdict", async () => {
      const root = mkdtempSync(join(tmpdir(), "evidence-oversize-"));
      try {
        const oversized = `${JSON.stringify({ ...validRecord, padding: "x".repeat(MAX_EVIDENCE_RECORD_BYTES) })}\n`;
        expect(Buffer.byteLength(oversized, "utf8")).toBeGreaterThan(MAX_EVIDENCE_RECORD_BYTES);
        writeFileSync(join(root, "evidence.json"), oversized);
        writeFileSync(join(root, "map.json"), MAP_JSON);

        const lines: string[] = [];
        const code = await runEvidenceVerifierCli([join(root, "evidence.json"), "--root", root, "--json"], {
          readFile: async (path) => new Uint8Array(readFileSync(path)),
          log: (line) => {
            lines.push(line);
          },
        });

        expect(code).toBe(1);
        const output = lines.join("\n");
        expect(output).toContain(String(Buffer.byteLength(oversized, "utf8")));
        expect(output).toContain(String(MAX_EVIDENCE_RECORD_BYTES));
        // "不产出任何断言结论": exit 1 is a usage/IO refusal, so no verdict object is ever logged.
        expect(lines.some((line) => line.includes('"assertions"'))).toBe(false);
        expect(() => JSON.parse(output)).toThrow();

        // The guard has to survive verbatim embedding into the shipped single file, not only the module
        // form: the auditing party runs `evidence-verifier.mjs`, not the engine package.
        let status = 0;
        let stdout = "";
        try {
          stdout = execFileSync("node", [DIST_VERIFIER, join(root, "evidence.json"), "--root", root, "--json"], {
            encoding: "utf-8",
          });
        } catch (error) {
          status = (error as { status?: number }).status ?? 0;
          stdout = String((error as { stdout?: string }).stdout ?? "");
        }
        expect(status).toBe(1);
        expect(stdout).toContain(String(MAX_EVIDENCE_RECORD_BYTES));
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });

    it("still parses a record that sits exactly on the byte budget", async () => {
      const root = mkdtempSync(join(tmpdir(), "evidence-at-budget-"));
      try {
        // The guard is `>`, not `>=`: a record exactly at MAX_EVIDENCE_RECORD_BYTES must still be read.
        const baseBytes = Buffer.byteLength(JSON.stringify({ ...validRecord, padding: "" }), "utf8");
        const text = `${JSON.stringify({ ...validRecord, padding: "x".repeat(MAX_EVIDENCE_RECORD_BYTES - baseBytes - 1) })}\n`;
        expect(Buffer.byteLength(text, "utf8")).toBe(MAX_EVIDENCE_RECORD_BYTES);
        writeFileSync(join(root, "evidence.json"), text);
        writeFileSync(join(root, "map.json"), MAP_JSON);

        const lines: string[] = [];
        await runEvidenceVerifierCli([join(root, "evidence.json"), "--root", root, "--json"], {
          readFile: async (path) => new Uint8Array(readFileSync(path)),
          log: (line) => {
            lines.push(line);
          },
        });

        // `padding` is not a record field, so the point here is only that a verdict was produced
        // instead of a byte-budget refusal.
        expect(JSON.parse(lines.join("\n")).assertions).toBeDefined();
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  });

  describe("artifact path containment (spec §6 decision 4)", () => {
    /**
     * The record is untrusted input, so an out-of-root `artifacts[].path` must never reach the reader.
     * The spy is the load-bearing half: `ok:false` alone would also be produced by a successful read
     * whose hash mismatched, so only "this path was never opened" proves the guard.
     */
    async function runCli(argv: string[]) {
      const reads: string[] = [];
      const lines: string[] = [];
      const code = await runEvidenceVerifierCli(argv, {
        readFile: async (path) => {
          reads.push(path);
          return new Uint8Array(readFileSync(path));
        },
        log: (line) => {
          lines.push(line);
        },
      });
      return { reads, verdict: JSON.parse(lines.at(-1) ?? "{}"), code };
    }

    const ESCAPES = ["../secret.txt", "/etc/passwd", "C:\\shares\\x"];

    for (const path of ESCAPES) {
      it(`refuses to read the escaping artifact path ${JSON.stringify(path)}`, async () => {
        const outer = mkdtempSync(join(tmpdir(), "evidence-escape-"));
        const root = join(outer, "bundle");
        try {
          mkdirSync(root, { recursive: true });
          // A real file outside the root: without the guard this read would succeed and the CLI would
          // report the hash of a file the record was never entitled to touch.
          writeFileSync(join(outer, "secret.txt"), "do-not-leak");
          const record = buildFixture({
            artifacts: [{ path, role: "data", bytes: MAP_JSON.length, sha256: sha256Of(MAP_JSON) }],
          });
          writeFileSync(join(root, "evidence.json"), `${JSON.stringify(record)}\n`);

          const { reads, verdict, code } = await runCli(["evidence.json", "--root", `${root}/`, "--json"]);

          expect(code).toBe(2);
          expect(verdict.ok).toBe(false);
          // The record itself is the only file the CLI may open, so no artifact byte was read at all.
          expect(reads).toEqual([`${root}/evidence.json`]);
          expect(verdict.assertions).toContainEqual(
            expect.objectContaining({ id: "ARTIFACTS_MATCH", status: "failed" }),
          );
          // CHAIN_CLOSED stays green: the only thing wrong with this record is where it points.
          expect(verdict.assertions).toContainEqual(expect.objectContaining({ id: "CHAIN_CLOSED", status: "passed" }));
          expect(verdict.diagnostics).toContainEqual(
            expect.objectContaining({
              code: "EVIDENCE.ARTIFACT_MISMATCH",
              message: expect.stringContaining("escapes --root"),
            }),
          );
        } finally {
          rmSync(outer, { recursive: true, force: true });
        }
      });
    }

    it("accepts a legal two-level relative artifact path inside the root", async () => {
      const root = mkdtempSync(join(tmpdir(), "evidence-nested-"));
      try {
        mkdirSync(join(root, "data", "nested"), { recursive: true });
        writeFileSync(join(root, "data", "nested", "map.json"), MAP_JSON);
        const record = buildFixture({
          artifacts: [
            { path: "data/nested/map.json", role: "data", bytes: MAP_JSON.length, sha256: sha256Of(MAP_JSON) },
          ],
        });
        writeFileSync(join(root, "evidence.json"), `${JSON.stringify(record)}\n`);

        const { reads, verdict, code } = await runCli(["evidence.json", "--root", root, "--json"]);

        expect(code).toBe(0);
        expect(verdict.ok).toBe(true);
        expect(reads).toEqual([`${root}/evidence.json`, `${root}/data/nested/map.json`]);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });

    it("refuses every artifact when the operator-supplied --root itself contains a .. segment", async () => {
      const outer = mkdtempSync(join(tmpdir(), "evidence-rootescape-"));
      try {
        const root = join(outer, "bundle");
        mkdirSync(root, { recursive: true });
        // `<root>/..` is the danger shape: the fixture's ordinary `map.json` lands on a real file one
        // level up, so an unguarded join reads it, the hash matches, and the CLI reports a green verdict
        // for bytes outside the directory the auditor pointed it at.
        writeFileSync(join(outer, "map.json"), MAP_JSON);
        const record = buildFixture();
        writeFileSync(join(root, "evidence.json"), `${JSON.stringify(record)}\n`);

        const { reads, verdict, code } = await runCli([join(root, "evidence.json"), "--root", `${root}/..`, "--json"]);

        expect(code).toBe(2);
        expect(verdict.ok).toBe(false);
        expect(reads).toEqual([join(root, "evidence.json")]);
        expect(verdict.diagnostics).toContainEqual(
          expect.objectContaining({
            code: "EVIDENCE.ARTIFACT_MISMATCH",
            message: expect.stringContaining("escapes --root"),
          }),
        );
      } finally {
        rmSync(outer, { recursive: true, force: true });
      }
    });
  });
});
