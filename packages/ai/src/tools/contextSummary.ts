import { validateSpec, type CapabilityReport, type Diagnostic, type MapSpec, type SceneLayer, type SceneResourcePolicy, type SceneView3DExtension } from "@gis-engine/engine";
import { getScene3DV1Capabilities, queryScene3DMock, snapshotScene3DMock } from "@gis-engine/scene3d";

export interface ContextSummaryInput {
  spec: MapSpec;
  capabilities?: CapabilityReport;
}

export interface ContextSummary {
  id?: string;
  revision?: string;
  view: MapSpec["view"];
  sources: Array<{
    id: string;
    type: string;
  }>;
  layers: Array<{
    id: string;
    type: string;
    source?: string;
    visibility: "visible" | "none";
  }>;
  validation: {
    valid: boolean;
    diagnosticCounts: Record<Diagnostic["severity"], number>;
  };
  capabilities?: CapabilityReport;
  scene3d?: Scene3DContextSummary;
}

export interface Scene3DContextSummary {
  status: "extension-only";
  stableViewMode: false;
  runtimeSupported: false;
  sourceCount: number;
  layerCount: number;
  visibleLayerCount: number;
  pickableLayerCount: number;
  sources: Array<{
    id: string;
    type: string;
  }>;
  layers: Array<{
    id: string;
    type: string;
    source: string;
    visibility: "visible" | "none";
    pickable: boolean;
  }>;
  resourcePolicy: {
    present: boolean;
    maxTilesetJsonBytes?: number;
    maxModelBytes?: number;
    maxTextureCount?: number;
    maxTextureBytes?: number;
    maxWorkers?: number;
    timeoutMs?: number;
  };
  snapshot: {
    mockPassed: boolean;
    pendingSourceIds: string[];
    diagnosticCounts: Record<Diagnostic["severity"], number>;
  };
  query: {
    pickCount: number;
    diagnosticCounts: Record<Diagnostic["severity"], number>;
  };
  capabilities: CapabilityReport;
}

export function getContextSummary(input: ContextSummaryInput): ContextSummary {
  const report = validateSpec(input.spec);
  return {
    ...(input.spec.id ? { id: input.spec.id } : {}),
    ...(input.spec.revision ? { revision: input.spec.revision } : {}),
    view: input.spec.view,
    sources: Object.entries(input.spec.sources).map(([id, source]) => ({
      id,
      type: source.type
    })),
    layers: input.spec.layers.map((layer) => ({
      id: layer.id,
      type: layer.type,
      ...(layer.source ? { source: layer.source } : {}),
      visibility: layer.layout?.visibility === "none" ? "none" : "visible"
    })),
    validation: {
      valid: report.valid,
      diagnosticCounts: countDiagnostics(report.diagnostics)
    },
    ...scene3dContext(input.spec),
    ...(input.capabilities ? { capabilities: input.capabilities } : {})
  };
}

function countDiagnostics(diagnostics: Diagnostic[]): Record<Diagnostic["severity"], number> {
  return diagnostics.reduce<Record<Diagnostic["severity"], number>>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 }
  );
}

function scene3dContext(spec: MapSpec): { scene3d?: Scene3DContextSummary } {
  const scene = readScene3DExtension(spec);
  if (!scene) return {};

  const snapshot = snapshotScene3DMock(scene, { format: "data-url", requireLoadedResources: false });
  const query = queryScene3DMock(scene);
  const layers = scene.layers ?? [];
  const visibleLayers = layers.filter((layer) => layer.visible !== false);
  const pickableLayers = visibleLayers.filter((layer) => isPickableSceneLayer(layer));

  return {
    scene3d: {
      status: "extension-only",
      stableViewMode: false,
      runtimeSupported: false,
      sourceCount: Object.keys(scene.sources ?? {}).length,
      layerCount: layers.length,
      visibleLayerCount: visibleLayers.length,
      pickableLayerCount: pickableLayers.length,
      sources: Object.entries(scene.sources ?? {}).map(([id, source]) => ({
        id,
        type: source.type
      })),
      layers: layers.map((layer) => ({
        id: layer.id,
        type: layer.type,
        source: layer.source,
        visibility: layer.visible === false ? "none" : "visible",
        pickable: isPickableSceneLayer(layer)
      })),
      resourcePolicy: summarizeSceneResourcePolicy(scene.resourcePolicy),
      snapshot: {
        mockPassed: snapshot.passed,
        pendingSourceIds: snapshot.pendingSourceIds,
        diagnosticCounts: countDiagnostics(snapshot.diagnostics)
      },
      query: {
        pickCount: query.picks.length,
        diagnosticCounts: countDiagnostics(query.diagnostics)
      },
      capabilities: getScene3DV1Capabilities()
    }
  };
}

function readScene3DExtension(spec: MapSpec): SceneView3DExtension | undefined {
  const scene = spec.extensions?.scene3d;
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) return undefined;
  if (!("camera" in scene)) return undefined;
  return scene as SceneView3DExtension;
}

function summarizeSceneResourcePolicy(policy?: SceneResourcePolicy): Scene3DContextSummary["resourcePolicy"] {
  if (!policy) return { present: false };

  return {
    present: true,
    ...(policy.maxTilesetJsonBytes !== undefined ? { maxTilesetJsonBytes: policy.maxTilesetJsonBytes } : {}),
    ...(policy.maxModelBytes !== undefined ? { maxModelBytes: policy.maxModelBytes } : {}),
    ...(policy.maxTextureCount !== undefined ? { maxTextureCount: policy.maxTextureCount } : {}),
    ...(policy.maxTextureBytes !== undefined ? { maxTextureBytes: policy.maxTextureBytes } : {}),
    ...(policy.maxWorkers !== undefined ? { maxWorkers: policy.maxWorkers } : {}),
    ...(policy.timeoutMs !== undefined ? { timeoutMs: policy.timeoutMs } : {})
  };
}

function isPickableSceneLayer(layer: SceneLayer): boolean {
  if (layer.type === "terrain") return false;
  return layer.pickable !== false;
}
