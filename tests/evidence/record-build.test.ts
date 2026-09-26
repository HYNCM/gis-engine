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
    expect(record.recordId).toBe(canonicalHash({ ...record, recordId: undefined }));
    expect(validate(record)).toBe(true);
  });

  it("is stable under key reordering of the same input", () => {
    const first = buildEvidenceRecord(JSON.parse(JSON.stringify(baseInput)));
    const second = buildEvidenceRecord({ ...baseInput, origin: reverseKeys(baseInput.origin) });

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
