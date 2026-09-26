import {
  buildEngineCapabilityMatrix,
  buildEvidenceRecord,
  canonicalHash,
  EVIDENCE_RECORD_SCHEMA_VERSION,
  type EvidenceRecordInput,
  EvidenceRecordSchema,
  MAX_EVIDENCE_RECORD_BYTES,
} from "@gis-engine/engine/evidence";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";

const ajv = new Ajv({ strict: false });
const validate = ajv.compile(EvidenceRecordSchema);

const baseInput: EvidenceRecordInput = {
  project: { id: "proj-a", baseRevision: "r0", revision: "r1" },
  origin: { actor: "agent:codex", providerKind: "mcp", promptHash: "sha256:" + "a".repeat(64) },
  commands: [
    {
      command: { id: "cmd-1", version: "0.1", type: "removeLayer", layerId: "layer-a" },
      outcome: "applied",
      diagnostics: [],
      inversePatchHash: canonicalHash([]),
      baseRevision: "r0",
      nextRevision: "r1",
    },
  ],
  spec: {
    beforeHash: canonicalHash({ view: {} }),
    afterHash: canonicalHash({ view: { zoom: 3 } }),
    diffHash: canonicalHash(["/view/zoom"]),
  },
  artifacts: [{ path: "map.json", role: "mapspec", bytes: 128, sha256: canonicalHash("map") }],
  capabilities: { schemaVersion: "engine-capabilities.v0.1", available: ["mapspec.validate"], blocked: [] },
  toolchain: { engineVersion: "1.5.0", nodeMajor: "22", pnpmVersion: "11.9.0" },
  issuer: "gis-engine-cli",
};

describe("buildEvidenceRecord", () => {
  it("derives recordId from the canonical body and validates against the public schema", () => {
    const result = buildEvidenceRecord(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { record } = result;
    expect(record.schemaVersion).toBe(EVIDENCE_RECORD_SCHEMA_VERSION);
    expect(record.recordId).toBe(canonicalHash(JSON.parse(JSON.stringify({ ...record, recordId: undefined }))));
    // The record must survive the transport it is actually delivered over, byte for byte.
    expect(
      canonicalHash(JSON.parse(JSON.stringify({ ...JSON.parse(JSON.stringify(record)), recordId: undefined }))),
    ).toBe(record.recordId);
    expect(validate(record)).toBe(true);
  });

  // Review I-4: `recordId` must hash the normalised (JSON-transported) form, not the in-memory
  // object. `canonicalStringify` renders an `undefined`-valued key as `null` while `JSON.stringify`
  // drops it — hashing the un-normalised object makes an honest record CHAIN_BROKEN after a round trip.
  it("keeps the recordId verifiable after a JSON round trip when a key holds undefined", () => {
    const withUndefinedKey = {
      ...baseInput,
      origin: { ...baseInput.origin, planHash: undefined },
    } as unknown as EvidenceRecordInput;

    const result = buildEvidenceRecord(withUndefinedKey);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { record } = result;
    // The in-memory record carries the undefined-valued key; the delivered bytes drop it.
    expect("planHash" in record.origin).toBe(true);
    const revived = JSON.parse(JSON.stringify(record)) as { origin: Record<string, unknown> };
    expect("planHash" in revived.origin).toBe(false);
    // Task 5's recomputation expression must reproduce the builder's recordId from the wire form.
    expect(canonicalHash(JSON.parse(JSON.stringify({ ...revived, recordId: undefined })))).toBe(record.recordId);
  });

  it("is stable under key reordering of the same input", () => {
    // Explicit issuedAt: `baseInput` omits it, so each build would otherwise stamp its own
    // `new Date()`, and this comparison would go red whenever the two calls straddle a millisecond.
    const issuedAt = "2026-09-26T12:00:00.000Z";
    const first = buildEvidenceRecord(JSON.parse(JSON.stringify({ ...baseInput, issuedAt })));
    const second = buildEvidenceRecord({ ...baseInput, issuedAt, origin: reverseKeys(baseInput.origin) });

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.record.recordId).toBe(second.record.recordId);
  });

  it("records exclusions by default and never leaves them absent", () => {
    const result = buildEvidenceRecord(baseInput);

    expect(result.ok && result.record.exclusions).toEqual(["OFFLINE_REPLAY", "VISUAL_CONSISTENCY"]);
  });

  it("rejects instead of truncating when the record exceeds the size budget", () => {
    const huge: EvidenceRecordInput = {
      ...baseInput,
      artifacts: [{ path: "x".repeat(MAX_EVIDENCE_RECORD_BYTES), role: "data", bytes: 1, sha256: canonicalHash("x") }],
    };

    const result = buildEvidenceRecord(huge);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.RECORD_INVALID" }));
    // Review Minor: the diagnostic must point at what actually crossed the budget, not a fixed path.
    expect(result.diagnostics[0]?.path).toBe("/artifacts");
  });

  it("points the oversize diagnostic at the record root when no single field crossed the budget", () => {
    // Distributed bloat: each top-level section stays under MAX_EVIDENCE_RECORD_BYTES, only the
    // record as a whole exceeds it.
    const bloated: EvidenceRecordInput = {
      ...baseInput,
      commands: Array.from({ length: 4 }, (_, index) => ({
        command: { id: `cmd-${index}`, version: "0.1", type: "removeLayer", layerId: "y".repeat(150_000) },
        outcome: "applied" as const,
        diagnostics: [],
        inversePatchHash: canonicalHash([]),
        baseRevision: "r0",
        nextRevision: "r1",
      })),
      artifacts: Array.from({ length: 3 }, (_, index) => ({
        path: `blob-${index}-${"x".repeat(250_000)}`,
        role: "data",
        bytes: 1,
        sha256: canonicalHash(`blob-${index}`),
      })),
    };

    const result = buildEvidenceRecord(bloated);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]).toEqual(expect.objectContaining({ code: "EVIDENCE.RECORD_INVALID", path: "/" }));
  });

  // Review I-2: constraint 7 forbids natural-language throws; nullish input must come back as a
  // structured diagnostic.
  for (const nullish of [null, undefined]) {
    it(`returns a structured diagnostic instead of throwing for ${String(nullish)} input`, () => {
      const result = buildEvidenceRecord(nullish as unknown as EvidenceRecordInput);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ code: "EVIDENCE.RECORD_INVALID", path: "/", message: "/ must be an object." }),
      );
    });
  }

  // Review Minor: canonical hashing preserves array order, so the same exclusion set passed in a
  // different order (or with duplicates) must not produce a different recordId — same ruling as
  // Task 1's sort of `available`/`blocked`.
  it("produces one recordId per exclusion set regardless of input order or duplicates", () => {
    const issuedAt = "2026-09-26T12:00:00.000Z";
    const forward = buildEvidenceRecord({
      ...baseInput,
      issuedAt,
      exclusions: ["OFFLINE_REPLAY", "VISUAL_CONSISTENCY"],
    });
    const reversed = buildEvidenceRecord({
      ...baseInput,
      issuedAt,
      exclusions: ["VISUAL_CONSISTENCY", "OFFLINE_REPLAY"],
    });
    const duplicated = buildEvidenceRecord({
      ...baseInput,
      issuedAt,
      exclusions: ["OFFLINE_REPLAY", "VISUAL_CONSISTENCY", "OFFLINE_REPLAY"],
    });

    expect(forward.ok && reversed.ok && duplicated.ok).toBe(true);
    if (!forward.ok || !reversed.ok || !duplicated.ok) return;
    expect(reversed.record.recordId).toBe(forward.record.recordId);
    expect(duplicated.record.recordId).toBe(forward.record.recordId);
    expect(forward.record.exclusions).toEqual(["OFFLINE_REPLAY", "VISUAL_CONSISTENCY"]);
  });

  for (const field of ["project", "commands", "spec", "artifacts", "capabilities", "toolchain"] as const) {
    it(`refuses to build a record missing the ${field} skeleton field`, () => {
      const stripped = { ...baseInput } as Record<string, unknown>;
      delete stripped[field];

      const result = buildEvidenceRecord(stripped as EvidenceRecordInput);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.diagnostics.some((d) => d.code === "EVIDENCE.RECORD_INVALID")).toBe(true);
    });
  }

  it("accepts the capability matrix the engine derives, unchanged", () => {
    // Task 1's producer must be assignable to Task 4's published contract.
    const matrix = buildEngineCapabilityMatrix();
    const result = buildEvidenceRecord({ ...baseInput, capabilities: matrix });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(validate(result.record)).toBe(true);
    expect(result.record.capabilities).toEqual(matrix);
  });
});

function reverseKeys<T extends object>(value: T): T {
  const entries = Object.entries(value).reverse();
  return Object.fromEntries(entries.map(([key, entry]) => [key, reorder(entry)])) as T;
}

function reorder(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reorder);
  if (value && typeof value === "object") return reverseKeys(value as Record<string, unknown>);
  return value;
}
