import { DiagnosticCodes, Scene3DStableRuntimeBlockerCodes } from "../diagnostics/codes.js";
import type { SourceReadinessEntry } from "../sources/readiness.js";
import { DEFAULT_SCENE3D_PROMOTION_GATE, type Scene3DPromotionGate } from "../spec/scene3d-promotion-gate.js";

export const ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION = "engine-capabilities.v0.1";

export interface EngineCapabilityBlocker {
  code: string;
  reason: string;
  path?: string;
}

export interface EngineCapabilityMatrix {
  schemaVersion: typeof ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION;
  available: string[];
  blocked: EngineCapabilityBlocker[];
}

export interface BuildEngineCapabilityMatrixInput {
  scene3dPromotionGate?: Scene3DPromotionGate;
  readiness?: readonly SourceReadinessEntry[];
}

const BASE_AVAILABLE = ["mapspec.validate", "commands.apply", "export.spec", "snapshot.smoke-mock"] as const;

const SCENE3D_BLOCKERS: ReadonlyArray<{ code: string; path: string; reason: string }> = [
  {
    code: Scene3DStableRuntimeBlockerCodes.ViewMode,
    path: "/view/mode",
    reason: "scene3d view mode requires the promotion gate to reach stable.",
  },
  {
    code: Scene3DStableRuntimeBlockerCodes.Renderer,
    path: "/capabilities/renderer",
    reason: "scene3d renderer requires the promotion gate to reach stable.",
  },
  {
    code: Scene3DStableRuntimeBlockerCodes.Dimensions,
    path: "/capabilities/dimensions",
    reason: "3D dimensions require the promotion gate to reach stable.",
  },
];

export function buildEngineCapabilityMatrix(input: BuildEngineCapabilityMatrixInput = {}): EngineCapabilityMatrix {
  const gate = input.scene3dPromotionGate ?? DEFAULT_SCENE3D_PROMOTION_GATE;
  const available = new Set<string>([...BASE_AVAILABLE, "evidence.build"]);
  const blocked: EngineCapabilityBlocker[] = [];

  if (gate === "blocked") {
    blocked.push(...SCENE3D_BLOCKERS);
  } else if (gate === "experimental") {
    available.add("scene3d.experimental-gate");
  }

  for (const entry of input.readiness ?? []) {
    if (entry.state === "supported") {
      available.add(`source.${entry.type}`);
      continue;
    }
    if (entry.state === "blocked") {
      blocked.push({
        code: DiagnosticCodes.CapabilityUnsupported,
        reason: `source "${entry.sourceId}" of type "${entry.type}" is ${entry.state} at runtime.`,
        path: `/sources/${entry.sourceId}`,
      });
    }
  }

  return {
    schemaVersion: ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION,
    // Sorted: the matrix is hashed into EvidenceRecord.recordId, so membership must not
    // depend on Set insertion order (which tracks the input spec's source key order).
    available: [...available].sort(),
    blocked,
  };
}
