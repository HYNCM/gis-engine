import { readFileSync } from "node:fs";
import {
  canonicalHash,
  type EvidenceAssertionId,
  type EvidenceRecord,
  type EvidenceRecordCapabilities,
  type EvidenceRecordCommand,
  type EvidenceVerificationResult,
  normaliseEvidencePayload,
  verifyEvidenceRecord,
} from "@gis-engine/engine/evidence";
import { describe, expect, it } from "vitest";
import { buildFixture, MAP_JSON, sha256Of, validRecord } from "./fixtures/record.js";

/**
 * Artifact bytes are supplied by a per-test reader instead of a module-level mutable map: a failed
 * expectation must never leak a poisoned entry into the tests that run after it.
 */
function artifactReader(files: Record<string, string> = { "map.json": MAP_JSON }) {
  const store = new Map(Object.entries(files).map(([path, text]) => [path, new TextEncoder().encode(text)] as const));
  return async (path: string) => {
    const bytes = store.get(path);
    if (!bytes) throw new Error(`missing artifact ${path}`);
    return bytes;
  };
}

const readArtifact = artifactReader();

/**
 * Re-seals a hand-forged record so `CHAIN_CLOSED` stays green and whatever the chain hash cannot see
 * (a malformed field, an unsupported schema version) has to be caught by the checks themselves.
 */
function reseal(record: EvidenceRecord): EvidenceRecord {
  const payload = normaliseEvidencePayload({ ...record, recordId: undefined });
  return { ...record, recordId: canonicalHash(payload) };
}

const [fixtureCommand] = validRecord.commands;
if (!fixtureCommand) throw new Error("the evidence fixture must carry at least one command");

function command(overrides: Partial<EvidenceRecordCommand> = {}): EvidenceRecordCommand {
  return { ...fixtureCommand, ...overrides };
}

/** Drops the optional revision fields the way a real builder-emitted entry would omit them. */
function withoutRevisions(entry: EvidenceRecordCommand): EvidenceRecordCommand {
  const copy = { ...entry };
  delete copy.baseRevision;
  delete copy.nextRevision;
  return copy;
}

function statusOf(result: EvidenceVerificationResult, id: EvidenceAssertionId) {
  const row = result.assertions.find((entry) => entry.id === id);
  if (!row) throw new Error(`assertion ${id} is missing from the verdict`);
  return row.status;
}

function codes(result: EvidenceVerificationResult): string[] {
  return result.diagnostics.map((entry) => entry.code);
}

/** Capabilities that match the fixture's own matrix, so a drift test isolates exactly one list. */
const matchingCapabilities: EvidenceRecordCapabilities = {
  schemaVersion: validRecord.capabilities.schemaVersion,
  available: [...validRecord.capabilities.available],
  blocked: validRecord.capabilities.blocked.map((entry) => ({ code: entry.code, reason: entry.reason })),
};

describe("verifyEvidenceRecord", () => {
  it("passes every trust-tier assertion and keeps excluded claims explicitly not-covered", async () => {
    const result = await verifyEvidenceRecord(validRecord, { readArtifact });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
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
    const result = await verifyEvidenceRecord(validRecord, {
      readArtifact: artifactReader({ "map.json": `{"view":{"zoom":99}}\n` }),
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.ARTIFACT_MISMATCH", path: "/artifacts/0" }),
    );
    expect(statusOf(result, "ARTIFACTS_MATCH")).toBe("failed");
  });

  it("reports EVIDENCE.DERIVATION_FAILED on a broken revision lineage", async () => {
    // Rebuilt through the fixture so recordId stays valid and only lineage fails.
    const broken = buildFixture({ commands: [command({ nextRevision: "r9" })] });

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

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.CAPABILITY_DRIFT",
        path: "/capabilities/blocked",
        message: expect.stringContaining("blockers"),
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("reports EVIDENCE.CAPABILITY_DRIFT for `available` drift, naming the list that moved", async () => {
    const result = await verifyEvidenceRecord(validRecord, {
      readArtifact,
      expectedCapabilities: { ...matchingCapabilities, available: ["mapspec.validate", "mapspec.snapshot"] },
    });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.CAPABILITY_DRIFT",
        path: "/capabilities/available",
        message: expect.stringContaining("available"),
      }),
    );
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("passed");
    expect(result.ok).toBe(false);
  });

  it("stays green when the live capability matrix matches both recorded lists", async () => {
    const result = await verifyEvidenceRecord(validRecord, {
      readArtifact,
      expectedCapabilities: matchingCapabilities,
    });

    expect(codes(result)).not.toContain("EVIDENCE.CAPABILITY_DRIFT");
    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

// Spec §7's third `EVIDENCE.DERIVATION_FAILED` trigger: the packaged `mapspec` body must canonicalise
// to `spec.afterHash`. Record-internal checks (lineage, inverse patches) cannot see a coordinated
// forgery — swapped bytes plus a re-hashed, self-consistent record is free for a forger — so without
// this recompute "the record is self-consistent" would masquerade as "the record describes this
// package", which is the one claim the trust tier exists to make.
describe("verifyEvidenceRecord packaged mapspec recompute (spec §7 trigger 3)", () => {
  const PACKAGED_MAP = `{"view":{"zoom":99}}\n`;

  function mapspecArtifact(text: string): EvidenceRecord["artifacts"][number] {
    return {
      path: "map.json",
      role: "mapspec",
      bytes: Buffer.byteLength(text, "utf8"),
      sha256: sha256Of(text),
    };
  }

  it("fails DERIVATION_CLOSED on a forged pair whose artifact bytes match the record but not the attested spec", async () => {
    // The artifact sha256 matches the served bytes and the record is honestly sealed: only the
    // packaged spec's body disagrees with the hash the attested lineage produced.
    const forged = buildFixture({ artifacts: [mapspecArtifact(PACKAGED_MAP)] });

    const result = await verifyEvidenceRecord(forged, {
      readArtifact: artifactReader({ "map.json": PACKAGED_MAP }),
    });

    expect(statusOf(result, "ARTIFACTS_MATCH")).toBe("passed");
    expect(statusOf(result, "CHAIN_CLOSED")).toBe("passed");
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.DERIVATION_FAILED",
        path: "/artifacts/0",
        // The message names both hashes so an auditor can see what was expected and what arrived.
        message: expect.stringContaining(canonicalHash(JSON.parse(PACKAGED_MAP))),
        severity: "error",
      }),
    );
    expect(result.diagnostics.some((entry) => entry.message.includes(forged.spec.afterHash))).toBe(true);
    expect(result.ok).toBe(false);
  });

  it("keeps DERIVATION_CLOSED green when the packaged spec body canonicalises to spec.afterHash", async () => {
    // Guards the recompute against an always-reject: the honest package shape must stay verifiable,
    // mirroring the writer-side equivalence tests/cli/generate.test.ts proves for real CLI output.
    const honest = buildFixture({
      artifacts: [mapspecArtifact(PACKAGED_MAP)],
      spec: {
        beforeHash: canonicalHash({}),
        afterHash: canonicalHash(JSON.parse(PACKAGED_MAP)),
        diffHash: canonicalHash([]),
      },
    });

    const result = await verifyEvidenceRecord(honest, {
      readArtifact: artifactReader({ "map.json": PACKAGED_MAP }),
    });

    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("passed");
    expect(codes(result)).not.toContain("EVIDENCE.DERIVATION_FAILED");
    expect(result.ok).toBe(true);
  });

  it("degrades malformed packaged spec bytes to a structured DERIVATION_FAILED instead of throwing", async () => {
    const junk = "not-json{{\n";
    const forged = buildFixture({ artifacts: [mapspecArtifact(junk)] });

    const result = await verifyEvidenceRecord(forged, { readArtifact: artifactReader({ "map.json": junk }) });

    expect(statusOf(result, "ARTIFACTS_MATCH")).toBe("passed");
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.DERIVATION_FAILED", path: "/artifacts/0", severity: "error" }),
    );
    expect(result.ok).toBe(false);
  });
});

// L-1: DERIVATION_CLOSED must never report a vacuous pass. Only `applied` entries move runtime state,
// so only they form the chain — and every revision the verifier cannot read is a failure it must say
// out loud.
describe("verifyEvidenceRecord revision lineage (L-1)", () => {
  it("fails when an applied entry omits its revision fields", async () => {
    const record = buildFixture({ commands: [withoutRevisions(command())] });

    const result = await verifyEvidenceRecord(record, { readArtifact });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.DERIVATION_FAILED",
        path: "/commands/0",
        message: expect.stringContaining("commands[0]"),
      }),
    );
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(statusOf(result, "CHAIN_CLOSED")).toBe("passed");
    expect(result.ok).toBe(false);
  });

  it("fails when an applied entry carries a non-string revision field", async () => {
    const record = buildFixture({
      commands: [command({ baseRevision: 7 as unknown as string })],
    });

    const result = await verifyEvidenceRecord(record, { readArtifact });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.DERIVATION_FAILED",
        path: "/commands/0",
        message: expect.stringContaining("commands[0]"),
      }),
    );
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(result.ok).toBe(false);
  });

  it("fails on a gap between two applied entries, naming the successor", async () => {
    const record = buildFixture({
      commands: [
        command({ baseRevision: "r0", nextRevision: "r1" }),
        command({ baseRevision: "r7", nextRevision: "r8" }),
      ],
    });

    const result = await verifyEvidenceRecord(record, { readArtifact });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.DERIVATION_FAILED",
        path: "/commands/1",
        message: expect.stringContaining("commands[1]"),
      }),
    );
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(result.ok).toBe(false);
  });

  it("keeps the chain anchored to the applied entries, not their array indexes", async () => {
    // A leading `skipped` entry has no before/after and must not become the expected predecessor.
    const record = buildFixture({
      commands: [
        withoutRevisions(command({ outcome: "skipped" })),
        command({ baseRevision: "r0", nextRevision: "r1" }),
      ],
    });

    const result = await verifyEvidenceRecord(record, { readArtifact });

    expect(result.diagnostics).toEqual([]);
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("passed");
    expect(result.ok).toBe(true);
  });

  it("tolerates a skipped entry that carries no revisions", async () => {
    const record = buildFixture({
      commands: [command({ baseRevision: "r0", nextRevision: "r1" }), withoutRevisions(command({ outcome: "failed" }))],
    });

    const result = await verifyEvidenceRecord(record, { readArtifact });

    expect(codes(result)).not.toContain("EVIDENCE.DERIVATION_FAILED");
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("passed");
    expect(result.ok).toBe(true);
  });

  it("fails when a non-applied entry supplies a non-string revision", async () => {
    const record = buildFixture({
      commands: [
        command({ baseRevision: "r0", nextRevision: "r1" }),
        command({ outcome: "skipped", baseRevision: true as unknown as string }),
      ],
    });

    const result = await verifyEvidenceRecord(record, { readArtifact });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.DERIVATION_FAILED",
        path: "/commands/1",
        message: expect.stringContaining("commands[1]"),
      }),
    );
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(result.ok).toBe(false);
  });

  it("fails when the project revision moved without any applied command", async () => {
    const record = buildFixture({ commands: [withoutRevisions(command({ outcome: "skipped" }))] });

    const result = await verifyEvidenceRecord(record, { readArtifact });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.DERIVATION_FAILED",
        path: "/commands",
        // Single quotes around the revisions are load-bearing, not stylistic: double-quoted words
        // after `from` read as module specifiers to build-evidence-verifier.ts's MODULE_SPECIFIER
        // scanner and fail the standalone-bundle build. Pinned here so the coupling is noticed by a
        // test, not discovered as a build error (review M6 / plan deviation D1).
        message: expect.stringContaining("moved from 'r0' to 'r1' without any applied command"),
      }),
    );
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(result.ok).toBe(false);
  });

  it("closes lineage for zero applied commands only when the project revision did not move", async () => {
    const record = buildFixture({
      project: { id: "proj-a", baseRevision: "r0", revision: "r0" },
      commands: [withoutRevisions(command({ outcome: "skipped" }))],
    });

    const result = await verifyEvidenceRecord(record, { readArtifact });

    expect(result.diagnostics).toEqual([]);
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("passed");
    expect(result.ok).toBe(true);
  });

  it("fails when project.revision is not a string, even on a chain-closed forged record", async () => {
    const forged = reseal({
      ...validRecord,
      project: { ...validRecord.project, revision: 42 as unknown as string },
    });

    const result = await verifyEvidenceRecord(forged, { readArtifact });

    expect(statusOf(result, "CHAIN_CLOSED")).toBe("passed");
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.DERIVATION_FAILED", path: "/project/revision" }),
    );
    expect(result.ok).toBe(false);
  });

  it("fails when project.baseRevision is not a string, even on a chain-closed forged record", async () => {
    const forged = reseal({
      ...validRecord,
      project: { ...validRecord.project, baseRevision: null as unknown as string },
    });

    const result = await verifyEvidenceRecord(forged, { readArtifact });

    expect(statusOf(result, "CHAIN_CLOSED")).toBe("passed");
    expect(statusOf(result, "DERIVATION_CLOSED")).toBe("failed");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.DERIVATION_FAILED", path: "/project/baseRevision" }),
    );
    expect(result.ok).toBe(false);
  });
});

// L-2: `ok` is the flag Tasks 7/8 branch on, so it must stay down whenever the verifier itself says
// it cannot read the record — an unsupported schema version or a structurally malformed field — even
// when all six assertion rows happen to be green.
describe("verifyEvidenceRecord ok gate (L-2)", () => {
  it("holds ok down on an unsupported schema version whose assertions are otherwise green", async () => {
    const newer = reseal({ ...validRecord, schemaVersion: "evidence-record.v0.2" });

    const result = await verifyEvidenceRecord(newer, { readArtifact });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "EVIDENCE.SCHEMA_VERSION_UNSUPPORTED",
        path: "/schemaVersion",
        severity: "error",
      }),
    );
    expect(result.assertions.filter((entry) => entry.status === "failed")).toEqual([]);
    expect(result.ok).toBe(false);
  });

  it("rejects a forged, chain-closed record whose spec hash is not a sha256 digest", async () => {
    const forged = reseal({
      ...validRecord,
      spec: { ...validRecord.spec, beforeHash: "not-a-hash" },
    });

    const result = await verifyEvidenceRecord(forged, { readArtifact });

    expect(statusOf(result, "CHAIN_CLOSED")).toBe("passed");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.RECORD_INVALID", path: "/spec/beforeHash", severity: "error" }),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a forged, chain-closed record with a malformed issuedAt", async () => {
    const forged = reseal({ ...validRecord, issuedAt: "yesterday" });

    const result = await verifyEvidenceRecord(forged, { readArtifact });

    expect(statusOf(result, "CHAIN_CLOSED")).toBe("passed");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.RECORD_INVALID", path: "/issuedAt", severity: "error" }),
    );
    expect(result.ok).toBe(false);
  });

  it("treats an error-only diagnostic as blocking and keeps informational ones out of the gate", async () => {
    // The drift row is the only failure here: every assertion is green, the diagnostic is an error.
    const result = await verifyEvidenceRecord(validRecord, {
      readArtifact,
      expectedCapabilities: { ...matchingCapabilities, blocked: [] },
    });

    expect(result.assertions.filter((entry) => entry.status === "failed")).toEqual([]);
    expect(codes(result)).toContain("EVIDENCE.CAPABILITY_DRIFT");
    expect(result.ok).toBe(false);
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

  it("never throws when the options object itself is missing", async () => {
    for (const options of [undefined, null]) {
      const result = await verifyEvidenceRecord(
        validRecord,
        options as unknown as Parameters<typeof verifyEvidenceRecord>[1],
      );

      // Artifact matching cannot run, so the row must say so instead of pretending or crashing.
      expect(statusOf(result, "ARTIFACTS_MATCH")).toBe("failed");
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ code: "EVIDENCE.ARTIFACT_MISMATCH", path: "/artifacts", severity: "error" }),
      );
      // Missing options mean "no expected capabilities supplied", never a crash on the read.
      expect(codes(result)).not.toContain("EVIDENCE.CAPABILITY_DRIFT");
      expect(statusOf(result, "CHAIN_CLOSED")).toBe("passed");
      expect(statusOf(result, "DERIVATION_CLOSED")).toBe("passed");
      expect(result.ok).toBe(false);
    }
  });
});
