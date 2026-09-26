import { readFileSync } from "node:fs";
import { type EvidenceRecord, verifyEvidenceRecord } from "@gis-engine/engine/evidence";
import { describe, expect, it } from "vitest";
import { buildFixture, MAP_JSON, validRecord } from "./fixtures/record.js";

const artifacts = new Map<string, Uint8Array>([["map.json", new TextEncoder().encode(`${MAP_JSON}`)]]);
const readArtifact = async (path: string) => {
  const bytes = artifacts.get(path);
  if (!bytes) throw new Error(`missing artifact ${path}`);
  return bytes;
};

describe("verifyEvidenceRecord", () => {
  it("passes every trust-tier assertion and keeps excluded claims explicitly not-covered", async () => {
    const result = await verifyEvidenceRecord(validRecord, { readArtifact });

    expect(result.ok).toBe(true);
    expect(result.assertions).toEqual([
      { id: "ARTIFACTS_MATCH", status: "passed", detail: "1 of 1 artifacts matched" },
      { id: "CHAIN_CLOSED", status: "passed", detail: "recordId matches the canonical body" },
      { id: "DERIVATION_CLOSED", status: "passed", detail: "revision lineage closed" },
      {
        id: "OFFLINE_REPLAY",
        status: "not-covered",
        detail: "excluded: requires referenced replay outside the trust tier",
      },
      { id: "TOOLCHAIN_RECORDED", status: "passed", detail: "engine 1.5.0 / node 22 / pnpm 11.9.0" },
      { id: "VISUAL_CONSISTENCY", status: "not-covered", detail: "excluded: visual consistency is deferred" },
    ]);
  });

  it("reports EVIDENCE.CHAIN_BROKEN when a data-bearing byte of the record changes", async () => {
    const tampered: EvidenceRecord = { ...validRecord, issuer: "someone-else" };

    const result = await verifyEvidenceRecord(tampered, { readArtifact });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.CHAIN_BROKEN" }));
  });

  it("reports EVIDENCE.ARTIFACT_MISMATCH naming the replaced file", async () => {
    artifacts.set("map.json", new TextEncoder().encode(`{"view":{"zoom":99}}\n`));

    const result = await verifyEvidenceRecord(validRecord, { readArtifact });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.ARTIFACT_MISMATCH", path: "/artifacts/0" }),
    );
    artifacts.set("map.json", new TextEncoder().encode(`${MAP_JSON}`));
  });

  it("reports EVIDENCE.DERIVATION_FAILED on a broken revision lineage", async () => {
    // Rebuilt through the fixture so recordId stays valid and only lineage fails.
    const broken = buildFixture({
      commands: [{ ...validRecord.commands[0]!, nextRevision: "r9" }],
    });

    const result = await verifyEvidenceRecord(broken, { readArtifact });

    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.DERIVATION_FAILED" }));
    expect(result.diagnostics.some((entry) => entry.code === "EVIDENCE.CHAIN_BROKEN")).toBe(false);
  });

  it("never executes commands: the verifier module stays replay-free", () => {
    // Path style follows tests/ai/mcp-contract-convergence.test.ts:94; import.meta.url is the test
    // file itself, so ../../ resolves to the repo root where packages/ lives.
    const text = readFileSync(new URL("../../packages/engine/src/evidence/record.ts", import.meta.url), "utf8");

    expect(text).not.toMatch(/applyCommands/);
    // record.ts's only sanctioned runtime imports are `node:` builtins and the canonical-stringify
    // sibling that forms its zero-dep hash closure (Task 6 inlines exactly that closure). Everything
    // else — the engine type graph, TypeBox, Ajv — must remain `import type`, so this guard rejects
    // any other runtime import.
    expect(text).not.toMatch(/^import\s+(?!type)[^\n]*from\s+"(?!node:)(?!\.\/canonical-stringify\.js)/m);
  });

  it("reports EVIDENCE.CAPABILITY_DRIFT when the live gate has moved past the record", async () => {
    const result = await verifyEvidenceRecord(validRecord, {
      readArtifact,
      expectedCapabilities: { schemaVersion: "engine-capabilities.v0.1", available: ["mapspec.validate"], blocked: [] },
    });

    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.CAPABILITY_DRIFT" }));
  });
});

// Constraint 7: the verifier consumes third-party bytes, so malformed, hostile, cyclic or
// `undefined`-laden input must come back as structured diagnostics / failed assertions — never a
// thrown TypeError. The builder is not guaranteed to have run first.
describe("verifyEvidenceRecord hostile input", () => {
  it("returns a structured verdict instead of throwing for nullish records", async () => {
    for (const record of [null, undefined]) {
      const result = await verifyEvidenceRecord(record as unknown as EvidenceRecord, { readArtifact });

      expect(result.ok).toBe(false);
      expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.RECORD_INVALID" }));
      expect(result.assertions.every((entry) => entry.status === "failed")).toBe(true);
    }
  });

  it("reports CHAIN_BROKEN instead of throwing when the payload cannot be serialised", async () => {
    const cyclic: Record<string, unknown> = {
      ...validRecord,
      spec: { ...validRecord.spec, extra: "x" },
    };
    cyclic.self = cyclic;

    const result = await verifyEvidenceRecord(cyclic as unknown as EvidenceRecord, { readArtifact });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.CHAIN_BROKEN" }));
  });

  it("survives a record whose collection fields are missing or non-array", async () => {
    const stripped = {
      ...validRecord,
      artifacts: undefined,
      commands: "not-an-array",
      capabilities: undefined,
      exclusions: undefined,
      toolchain: undefined,
    } as unknown as EvidenceRecord;

    const result = await verifyEvidenceRecord(stripped, {
      readArtifact,
      expectedCapabilities: { schemaVersion: "engine-capabilities.v0.1", available: [], blocked: [] },
    });

    expect(result.ok).toBe(false);
    expect(result.assertions.map((entry) => entry.status).sort()).toEqual([
      "failed",
      "failed",
      "failed",
      "failed",
      "failed",
      "failed",
    ]);
  });
});
