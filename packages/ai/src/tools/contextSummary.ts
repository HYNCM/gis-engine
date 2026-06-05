import { validateSpec, type CapabilityReport, type Diagnostic, type MapSpec, type SceneLayer, type SceneResourcePolicy, type SceneView3DExtension } from "@gis-engine/engine";
import { getScene3DV1Capabilities, queryScene3DMock, snapshotScene3DMock } from "@gis-engine/scene3d";
import { countDiagnostics } from "./shared.js";

type SourceContractSummary = {
  kind: "archive" | "schema";
  state: "explicit" | "not-applicable" | "not-checked";
  metadataFields: string[];
  policyFields: string[];
};

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
    sourceContract?: SourceContractSummary;
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
  capabilitySummary: CapabilitySummary;
  capabilities?: CapabilityReport;
  scene3d?: Scene3DContextSummary;
}

export interface CapabilitySummary {
  domains: CapabilityDomainSummary[];
}

export type GisEngineToolName =
  | "validate_spec"
  | "apply_commands"
  | "export_spec"
  | "get_context_summary"
  | "snapshot_spec"
  | "explain_spec"
  | "export_example_app";

export interface CapabilityDomainSummary {
  id: "feature-display" | "spatial-analysis" | "scene-browsing";
  status: "supported" | "experimental" | "blocked";
  supported: string[];
  experimental: string[];
  blocked: string[];
  tools: GisEngineToolName[];
  evidence: string[];
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
  const scene3d = scene3dContext(input.spec);
  return {
    ...(input.spec.id ? { id: input.spec.id } : {}),
    ...(input.spec.revision ? { revision: input.spec.revision } : {}),
    view: input.spec.view,
    sources: Object.entries(input.spec.sources).map(([id, source]) => {
      const sourceContract = summarizeSourceContract(source);
      return {
        id,
        type: source.type,
        ...(sourceContract ? { sourceContract } : {})
      };
    }),
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
    capabilitySummary: buildCapabilitySummary(input.spec, report.diagnostics, input.capabilities, scene3d.scene3d),
    ...scene3d,
    ...(input.capabilities ? { capabilities: input.capabilities } : {})
  };
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

function buildCapabilitySummary(
  spec: MapSpec,
  diagnostics: Diagnostic[],
  capabilities?: CapabilityReport,
  scene3d?: Scene3DContextSummary
): CapabilitySummary {
  const hasValidationError = diagnostics.some((diagnostic) => diagnostic.severity === "error");
  const sourceTypes = unique(Object.values(spec.sources).map((source) => source.type));
  const layerTypes = unique(spec.layers.map((layer) => layer.type));
  const stableLayerTypes = layerTypes.filter((layerType) => layerType !== "fill-extrusion-lite");
  const featureExperimental = unique([
    ...(layerTypes.includes("fill-extrusion-lite") || spec.capabilities?.experimental?.includes("fill-extrusion-lite")
      ? ["fill-extrusion-lite 2.5D display requires capabilities.experimental and map2_5d gating"]
      : []),
    ...(capabilities?.experimental ?? []).filter((entry) => entry !== "sceneview3d-v1")
  ]);
  const declaredQueries = unique(capabilities?.queries ?? []);
  const sceneSourceTypes = unique(scene3d?.sources.map((source) => source.type) ?? []);
  const stableScene3DRequested =
    spec.view.mode === "scene3d" || spec.capabilities?.renderer === "scene3d" || spec.capabilities?.dimensions?.includes("3d") === true;

  return {
    domains: [
      {
        id: "feature-display",
        status: hasValidationError ? "blocked" : featureExperimental.length > 0 ? "experimental" : "supported",
        supported: [
          `MapSpec view mode: ${spec.view.mode ?? "map2d"}`,
          sourceTypes.length > 0 ? `source types in this spec: ${sourceTypes.join(", ")}` : "source declarations through MapSpec.sources",
          stableLayerTypes.length > 0 ? `stable layer types in this spec: ${stableLayerTypes.join(", ")}` : "stable layer declarations through MapSpec.layers",
          "command-only edits through apply_commands"
        ],
        experimental: featureExperimental,
        blocked: hasValidationError ? ["validation errors must be resolved before export_spec or snapshot_spec can be treated as ready evidence"] : [],
        tools: ["validate_spec", "apply_commands", "export_spec", "snapshot_spec", "export_example_app"],
        evidence: [
          "validation.valid and validation.diagnosticCounts",
          "source contract and layer summaries in get_context_summary",
          "snapshot_spec.passed for render smoke evidence"
        ]
      },
      {
        id: "spatial-analysis",
        status: hasValidationError ? "blocked" : "experimental",
        supported: [
          declaredQueries.length > 0
            ? `declared query capabilities: ${declaredQueries.join(", ")}`
            : "runtime feature query contracts support point/bbox when adapter capabilities declare them",
          "read-only analysis should use capability metadata before planning generated interactions"
        ],
        experimental: ["MCP exposes spatial-analysis readiness as capability metadata; no dedicated query or geoprocessing MCP tool is public yet"],
        blocked: [
          ...(hasValidationError ? ["validation errors must be resolved before query planning can be treated as ready evidence"] : []),
          "buffer, intersection, overlay, routing, and aggregation geoprocessing are not exposed as public MCP tools"
        ],
        tools: ["get_context_summary", "explain_spec", "validate_spec"],
        evidence: ["capabilities.queries when supplied", "RendererAdapter.queryFeatures point/bbox contract", "validation diagnostics for missing sources or layers"]
      },
      {
        id: "scene-browsing",
        status: hasValidationError || stableScene3DRequested ? "blocked" : "experimental",
        supported: scene3d
          ? [
              "extensions.scene3d can be validated as a v1 extension payload",
              "mock SceneView3D snapshot/query summaries are available for planning evidence"
            ]
          : ["SceneView3D context appears when extensions.scene3d is present"],
        experimental: [
          "SceneView3D remains extension-only; use scene3d.status, mock snapshot, and mock query fields as evidence",
          ...(sceneSourceTypes.length > 0 ? [`scene source types in this spec: ${sceneSourceTypes.join(", ")}`] : [])
        ],
        blocked: [
          ...(hasValidationError ? ["validation errors must be resolved before SceneView3D planning can be treated as ready evidence"] : []),
          'stable view.mode: "scene3d" runtime rendering is blocked',
          ...(stableScene3DRequested ? ["this spec requests stable SceneView3D runtime fields; keep 3D data under extensions.scene3d"] : [])
        ],
        tools: ["apply_commands", "get_context_summary", "explain_spec"],
        evidence: scene3d
          ? [
              "scene3d.status=extension-only",
              "scene3d.stableViewMode=false",
              "scene3d.runtimeSupported=false",
              "scene3d.snapshot.mockPassed",
              "scene3d.query.pickCount"
            ]
          : ["absence of scene3d block means no SceneView3D extension was found in this spec"]
      }
    ]
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
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

function summarizeSourceContract(source: MapSpec["sources"][string]): SourceContractSummary | undefined {
  if (source.type !== "pmtiles") return undefined;

  return {
    kind: "archive",
    state: "explicit",
    metadataFields: [
      "specVersion",
      "archiveBytes",
      "rootDirectoryOffset",
      "rootDirectoryLength",
      "hasVectorTiles",
      "hasRasterTiles",
      "tileType",
      "minZoom",
      "maxZoom",
      "bounds"
    ],
    policyFields: ["maxArchiveBytes", "maxRootDirectoryBytes", "allowRangeRequests", "maxRangeSegments", "timeoutMs"]
  };
}
