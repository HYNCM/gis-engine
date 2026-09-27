import { createHash } from "node:crypto";
import {
  buildEvidenceRecord,
  canonicalHash,
  type EvidenceRecord,
  type EvidenceRecordInput,
} from "@gis-engine/engine/evidence";

// `createHash` is a runtime value: it must stay a plain (non-`import type`) import, and Biome's
// grouping only reorders the `@gis-engine/...` module, never the `node:` builtin.
export function sha256Of(value: string | Uint8Array): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export const MAP_JSON = `{"view":{}}\n`;

const SCENE3D_BLOCKERS = [
  { code: "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED", reason: "gate is blocked", path: "/view/mode" },
  { code: "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED", reason: "gate is blocked", path: "/capabilities/renderer" },
  { code: "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED", reason: "gate is blocked", path: "/capabilities/dimensions" },
];

/** One builder for every evidence test, so a fixture can never drift from the contract. */
export function buildFixture(overrides: Partial<EvidenceRecordInput> = {}): EvidenceRecord {
  const built = buildEvidenceRecord({
    project: { id: "proj-a", baseRevision: "r0", revision: "r1" },
    origin: { actor: "agent:codex", providerKind: "mcp", promptHash: canonicalHash("prompt") },
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
    // spec §7 trigger 3 makes the verifier recompute `canonicalHash(JSON.parse(map.json bytes))`, so
    // the fixture's `afterHash` must be the honest value for MAP_JSON, not a stand-in `{}` hash.
    spec: {
      beforeHash: canonicalHash({}),
      afterHash: canonicalHash(JSON.parse(MAP_JSON)),
      diffHash: canonicalHash([]),
    },
    artifacts: [{ path: "map.json", role: "mapspec", bytes: MAP_JSON.length, sha256: sha256Of(MAP_JSON) }],
    capabilities: {
      schemaVersion: "engine-capabilities.v0.1",
      available: ["mapspec.validate"],
      blocked: SCENE3D_BLOCKERS,
    },
    toolchain: { engineVersion: "1.5.0", nodeMajor: "22", pnpmVersion: "11.9.0" },
    issuer: "gis-engine-cli",
    issuedAt: "2026-09-26T00:00:00.000Z",
    ...overrides,
  });

  if (!built.ok) throw new Error(`evidence fixture is invalid: ${JSON.stringify(built.diagnostics)}`);
  return built.record;
}

export const validRecord: EvidenceRecord = buildFixture();
