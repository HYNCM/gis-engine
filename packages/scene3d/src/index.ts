import {
  DiagnosticCodes,
  type CapabilityReport,
  type Diagnostic,
  type SceneLayer,
  type ScenePosition,
  type SceneResourcePolicy,
  type SceneView3DExtension,
  type SnapshotOptions,
  type SnapshotResult,
  type SuggestedFix
} from "@gis-engine/engine";

export const scene3dPackageBoundary = {
  packageName: "@gis-engine/scene3d",
  status: "scaffold",
  stableViewMode: false,
  forbiddenCoreDependencies: ["cesium", "three", "@loaders.gl/3d-tiles", "@loaders.gl/gltf", "three-stdlib"]
} as const;

export type Scene3DPackageBoundary = typeof scene3dPackageBoundary;

export const defaultSceneResourceLoadPolicy = {
  maxTilesetJsonBytes: 1_048_576,
  maxModelBytes: 52_428_800,
  maxTextureCount: 64,
  maxTextureBytes: 67_108_864,
  maxWorkers: 2,
  timeoutMs: 10_000
} as const satisfies Required<Pick<SceneResourcePolicy, "maxTilesetJsonBytes" | "maxModelBytes" | "maxTextureCount" | "maxTextureBytes" | "maxWorkers" | "timeoutMs">>;

export type SceneResourceLoadKind = "tileset-json" | "model" | "texture" | "worker";

export interface SceneResourceLoadEntry {
  kind: string;
  sourceId?: string;
  url?: string;
  byteLength?: number;
  textureCount?: number;
  textureBytes?: number;
  workerCount?: number;
  elapsedMs?: number;
}

export interface SceneResourceLoadPlan {
  resources?: SceneResourceLoadEntry[];
  workerCount?: number;
}

export interface SceneResourceLoadTotals {
  tilesetJsonBytes: number;
  modelBytes: number;
  textureCount: number;
  textureBytes: number;
  workers: number;
  timedOutResources: number;
}

export interface SceneResourceLoadReport {
  valid: boolean;
  policy: Required<Pick<SceneResourcePolicy, "maxTilesetJsonBytes" | "maxModelBytes" | "maxTextureCount" | "maxTextureBytes" | "maxWorkers" | "timeoutMs">>;
  totals: SceneResourceLoadTotals;
  diagnostics: Diagnostic[];
}

export interface Scene3DMockSnapshotOptions extends SnapshotOptions {
  loadedSourceIds?: string[];
  requireLoadedResources?: boolean;
}

export interface Scene3DMockSnapshotSummary {
  sourceCount: number;
  layerCount: number;
  visibleLayerCount: number;
  pickableLayerCount: number;
  width: number;
  height: number;
  format: "png" | "data-url";
}

export interface Scene3DMockSnapshotResult extends SnapshotResult {
  summary: Scene3DMockSnapshotSummary;
  pendingSourceIds: string[];
}

export interface Scene3DQueryOptions {
  layers?: string[];
  includeHidden?: boolean;
}

export interface ScenePickResult {
  objectId: string;
  layerId: string;
  sourceId: string;
  position: ScenePosition;
  properties: Record<string, unknown>;
}

export interface Scene3DQueryResult {
  picks: ScenePickResult[];
  diagnostics: Diagnostic[];
}

export function getScene3DV1Capabilities(): CapabilityReport {
  return {
    renderer: "scene3d",
    dimensions: ["3d"],
    sources: ["terrain-raster-dem", "3d-tiles", "gltf"],
    layers: ["terrain", "tileset3d", "model"],
    expressions: [],
    queries: ["pick", "bbox3d"],
    snapshot: {
      supported: true,
      formats: ["png", "data-url"]
    },
    experimental: ["sceneview3d-v1"]
  };
}

export interface Scene3DScaffoldReport {
  supported: false;
  extension: SceneView3DExtension;
  diagnostics: Diagnostic[];
}

export function explainScene3DScaffold(extension: SceneView3DExtension): Scene3DScaffoldReport {
  return {
    supported: false,
    extension,
    diagnostics: [
      {
        severity: "info",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: "SceneView3D schema and package boundary exist, but the 3D renderer runtime is not implemented yet.",
        path: "/extensions/scene3d",
        fix: {
          kind: "manual",
          confidence: "medium",
          message: "Keep SceneView3D data under extensions.scene3d until the v1 renderer package passes resource, snapshot, and query gates."
        }
      }
    ]
  };
}

export function validateSceneResourceLoadPlan(extension: SceneView3DExtension, plan: SceneResourceLoadPlan): SceneResourceLoadReport {
  const policy = normalizeSceneResourcePolicy(extension.resourcePolicy);
  const totals: SceneResourceLoadTotals = {
    tilesetJsonBytes: 0,
    modelBytes: 0,
    textureCount: 0,
    textureBytes: 0,
    workers: plan.workerCount ?? 0,
    timedOutResources: 0
  };
  const diagnostics: Diagnostic[] = [];

  for (const [index, resource] of (plan.resources ?? []).entries()) {
    const path = resourcePath(resource, index);

    if (resource.sourceId && !extension.sources?.[resource.sourceId]) {
      diagnostics.push(sourceMissing(resource, path));
      continue;
    }

    if (!isSceneResourceLoadKind(resource.kind)) {
      diagnostics.push(unsupportedAssetType(resource, path));
      continue;
    }

    if (isFinitePositive(resource.elapsedMs) && resource.elapsedMs > policy.timeoutMs) {
      totals.timedOutResources += 1;
      diagnostics.push(resourceTimeout(resource, path, policy.timeoutMs));
    }

    if (resource.kind === "tileset-json") {
      totals.tilesetJsonBytes += resource.byteLength ?? 0;
      if (isFinitePositive(resource.byteLength) && resource.byteLength > policy.maxTilesetJsonBytes) {
        diagnostics.push(resourceTooLarge(resource, path, `3D Tiles tileset JSON is ${resource.byteLength} bytes, exceeding maxTilesetJsonBytes=${policy.maxTilesetJsonBytes}.`));
      }
    }

    if (resource.kind === "model") {
      totals.modelBytes += resource.byteLength ?? 0;
      if (isFinitePositive(resource.byteLength) && resource.byteLength > policy.maxModelBytes) {
        diagnostics.push(resourceTooLarge(resource, path, `3D model resource is ${resource.byteLength} bytes, exceeding maxModelBytes=${policy.maxModelBytes}.`));
      }
    }

    if (resource.kind === "texture") {
      totals.textureCount += resource.textureCount ?? 0;
      totals.textureBytes += resource.textureBytes ?? resource.byteLength ?? 0;
    }

    if (resource.kind === "worker") {
      totals.workers += resource.workerCount ?? 1;
    }
  }

  if (totals.textureCount > policy.maxTextureCount) {
    diagnostics.push(policyTooLarge("/extensions/scene3d/resourcePolicy/maxTextureCount", `Scene texture count is ${totals.textureCount}, exceeding maxTextureCount=${policy.maxTextureCount}.`));
  }

  if (totals.textureBytes > policy.maxTextureBytes) {
    diagnostics.push(policyTooLarge("/extensions/scene3d/resourcePolicy/maxTextureBytes", `Scene texture budget is ${totals.textureBytes} bytes, exceeding maxTextureBytes=${policy.maxTextureBytes}.`));
  }

  if (totals.workers > policy.maxWorkers) {
    diagnostics.push(policyTooLarge("/extensions/scene3d/resourcePolicy/maxWorkers", `Scene worker count is ${totals.workers}, exceeding maxWorkers=${policy.maxWorkers}.`));
  }

  return {
    valid: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
    policy,
    totals,
    diagnostics
  };
}

export function snapshotScene3DMock(extension: SceneView3DExtension, options: Scene3DMockSnapshotOptions = {}): Scene3DMockSnapshotResult {
  const diagnostics: Diagnostic[] = [];
  const layers = extension.layers ?? [];
  const visibleLayers = layers.filter((layer) => layer.visible !== false);
  const pickableLayers = visibleLayers.filter((layer) => isPickableSceneLayer(layer));
  const format = normalizeSnapshotFormat(options.format, diagnostics);
  const summary: Scene3DMockSnapshotSummary = {
    sourceCount: Object.keys(extension.sources ?? {}).length,
    layerCount: layers.length,
    visibleLayerCount: visibleLayers.length,
    pickableLayerCount: pickableLayers.length,
    width: options.width ?? extension.snapshot?.width ?? 800,
    height: options.height ?? extension.snapshot?.height ?? 600,
    format
  };

  if (visibleLayers.length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SnapshotBlankCanvas,
      message: "SceneView3D mock snapshot has no visible scene layers.",
      path: "/extensions/scene3d/layers",
      fix: manualFix("Add a visible scene layer before snapshotting the 3D scene.", "medium")
    });
  }

  diagnostics.push(...missingLayerSourceDiagnostics(extension));

  const requireLoadedResources = options.requireLoadedResources ?? extension.snapshot?.requireLoadedResources ?? false;
  const pendingSourceIds = collectPendingSourceIds(extension, options.loadedSourceIds, requireLoadedResources);
  for (const sourceId of pendingSourceIds) {
    diagnostics.push({
      severity: requireLoadedResources ? "error" : "warning",
      code: DiagnosticCodes.SnapshotResourcePending,
      message: `Scene source "${sourceId}" is required for snapshot but is not marked as loaded.`,
      path: `/extensions/scene3d/sources/${escapePathSegment(sourceId)}`,
      relatedResources: [{ kind: "source", id: sourceId }],
      fix: manualFix("Load the scene source before strict snapshot, or disable requireLoadedResources for non-strict mock checks.", "medium")
    });
  }

  const passed = !diagnostics.some((diagnostic) => diagnostic.severity === "error");
  const result: Scene3DMockSnapshotResult = {
    passed,
    diagnostics,
    summary,
    pendingSourceIds
  };
  if (format === "data-url") {
    result.dataUrl = encodeMockDataUrl({ kind: "SceneView3DMockSnapshot", summary, pendingSourceIds });
  }
  return result;
}

export function queryScene3DMock(extension: SceneView3DExtension, options: Scene3DQueryOptions = {}): Scene3DQueryResult {
  const diagnostics: Diagnostic[] = [];
  const layers = selectSceneLayers(extension, options, diagnostics);
  const picks: ScenePickResult[] = [];

  for (const layer of layers) {
    if (layer.visible === false && options.includeHidden !== true) continue;
    if (!isPickableSceneLayer(layer)) continue;

    const source = extension.sources?.[layer.source];
    if (!source) {
      diagnostics.push(sourceNotFoundForLayer(layer));
      continue;
    }

    picks.push({
      objectId: `${layer.source}:${layer.id}:mock`,
      layerId: layer.id,
      sourceId: layer.source,
      position: extension.camera.target,
      properties: {
        mock: true,
        layerType: layer.type,
        sourceType: source.type
      }
    });
  }

  return { picks, diagnostics };
}

function normalizeSceneResourcePolicy(policy?: SceneResourcePolicy): SceneResourceLoadReport["policy"] {
  return {
    maxTilesetJsonBytes: policy?.maxTilesetJsonBytes ?? defaultSceneResourceLoadPolicy.maxTilesetJsonBytes,
    maxModelBytes: policy?.maxModelBytes ?? defaultSceneResourceLoadPolicy.maxModelBytes,
    maxTextureCount: policy?.maxTextureCount ?? defaultSceneResourceLoadPolicy.maxTextureCount,
    maxTextureBytes: policy?.maxTextureBytes ?? defaultSceneResourceLoadPolicy.maxTextureBytes,
    maxWorkers: policy?.maxWorkers ?? defaultSceneResourceLoadPolicy.maxWorkers,
    timeoutMs: policy?.timeoutMs ?? defaultSceneResourceLoadPolicy.timeoutMs
  };
}

function normalizeSnapshotFormat(format: SnapshotOptions["format"] | undefined, diagnostics: Diagnostic[]): "png" | "data-url" {
  if (format === undefined || format === "data-url") return "data-url";
  if (format === "png") return "png";

  diagnostics.push({
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: `SceneView3D mock snapshot does not support "${format}" format.`,
    path: "/format",
    fix: manualFix('Use "data-url" or "png" for mock SceneView3D snapshots.', "high")
  });
  return "data-url";
}

function collectPendingSourceIds(extension: SceneView3DExtension, loadedSourceIds: string[] | undefined, requireLoadedResources: boolean): string[] {
  if (!requireLoadedResources) return [];

  const loaded = new Set(loadedSourceIds ?? []);
  return Object.keys(extension.sources ?? {}).filter((sourceId) => !loaded.has(sourceId));
}

function missingLayerSourceDiagnostics(extension: SceneView3DExtension): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const [index, layer] of (extension.layers ?? []).entries()) {
    if (extension.sources?.[layer.source]) continue;
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SourceNotFound,
      message: `Scene layer "${layer.id}" references missing scene source "${layer.source}".`,
      path: `/extensions/scene3d/layers/${index}/source`,
      relatedResources: [
        { kind: "layer", id: layer.id },
        { kind: "source", id: layer.source }
      ],
      fix: manualFix("Add the missing scene source or update the scene layer source id.", "medium")
    });
  }
  return diagnostics;
}

function selectSceneLayers(extension: SceneView3DExtension, options: Scene3DQueryOptions, diagnostics: Diagnostic[]): SceneLayer[] {
  const allLayers = extension.layers ?? [];
  if (!options.layers) return allLayers;

  const selected: SceneLayer[] = [];
  const seenLayerIds = new Set<string>();
  for (const layerId of options.layers) {
    if (seenLayerIds.has(layerId)) continue;
    seenLayerIds.add(layerId);

    const layer = allLayers.find((candidate) => candidate.id === layerId);
    if (!layer) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerNotFound,
        message: `Scene layer "${layerId}" does not exist.`,
        path: "/extensions/scene3d/layers",
        relatedResources: [{ kind: "layer", id: layerId }],
        fix: manualFix("Check the scene layer id or omit layers to query all pickable scene layers.", "high")
      });
      continue;
    }
    selected.push(layer);
  }
  return selected;
}

function isPickableSceneLayer(layer: SceneLayer): boolean {
  if (layer.type === "terrain") return false;
  return layer.pickable !== false;
}

function sourceNotFoundForLayer(layer: SceneLayer): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.SourceNotFound,
    message: `Scene layer "${layer.id}" references missing scene source "${layer.source}".`,
    path: "/extensions/scene3d/layers",
    relatedResources: [
      { kind: "layer", id: layer.id },
      { kind: "source", id: layer.source }
    ],
    fix: manualFix("Add the missing scene source or update the scene layer source id.", "medium")
  };
}

function encodeMockDataUrl(payload: unknown): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `data:image/png;base64,${btoa(binary)}`;
}

function manualFix(message: string, confidence: SuggestedFix["confidence"]): SuggestedFix {
  return {
    kind: "manual",
    confidence,
    message
  };
}

function isSceneResourceLoadKind(kind: string): kind is SceneResourceLoadKind {
  return kind === "tileset-json" || kind === "model" || kind === "texture" || kind === "worker";
}

function isFinitePositive(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function resourcePath(resource: SceneResourceLoadEntry, index: number): string {
  if (resource.sourceId) return `/extensions/scene3d/sources/${escapePathSegment(resource.sourceId)}/url`;
  return `/extensions/scene3d/resourceLoadPlan/resources/${index}`;
}

function sourceMissing(resource: SceneResourceLoadEntry, path: string): Diagnostic {
  const sourceId = resource.sourceId ?? "unknown";
  return {
    severity: "error",
    code: DiagnosticCodes.SourceNotFound,
    message: `Scene resource load plan references missing scene source "${sourceId}".`,
    path,
    relatedResources: [{ kind: "source", id: sourceId }],
    fix: {
      kind: "manual",
      confidence: "medium",
      message: "Add the scene source before loading it, or remove the resource load entry."
    }
  };
}

function unsupportedAssetType(resource: SceneResourceLoadEntry, path: string): Diagnostic {
  const diagnostic: Diagnostic = {
    severity: "error",
    code: DiagnosticCodes.SecurityUnsupportedAssetType,
    message: `Scene resource load kind "${resource.kind}" is not supported by the v1 resource policy gate.`,
    path,
    fix: {
      kind: "manual",
      confidence: "medium",
      message: "Use one of: tileset-json, model, texture, worker."
    }
  };
  const relatedResources = relatedResource(resource);
  if (relatedResources) diagnostic.relatedResources = relatedResources;
  return diagnostic;
}

function resourceTimeout(resource: SceneResourceLoadEntry, path: string, timeoutMs: number): Diagnostic {
  const diagnostic: Diagnostic = {
    severity: "error",
    code: DiagnosticCodes.SecurityResourceTimeout,
    message: `Scene resource load took ${resource.elapsedMs}ms, exceeding timeoutMs=${timeoutMs}.`,
    path,
    fix: {
      kind: "manual",
      confidence: "medium",
      message: "Reduce resource size, tune the loader, or increase SceneResourcePolicy.timeoutMs deliberately."
    }
  };
  const relatedResources = relatedResource(resource);
  if (relatedResources) diagnostic.relatedResources = relatedResources;
  return diagnostic;
}

function resourceTooLarge(resource: SceneResourceLoadEntry, path: string, message: string): Diagnostic {
  const diagnostic: Diagnostic = {
    severity: "error",
    code: DiagnosticCodes.SecurityResourceTooLarge,
    message,
    path,
    fix: {
      kind: "manual",
      confidence: "medium",
      message: "Reduce the asset size or raise the matching SceneResourcePolicy budget deliberately."
    }
  };
  const relatedResources = relatedResource(resource);
  if (relatedResources) diagnostic.relatedResources = relatedResources;
  return diagnostic;
}

function policyTooLarge(path: string, message: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.SecurityResourceTooLarge,
    message,
    path,
    fix: {
      kind: "manual",
      confidence: "medium",
      message: "Reduce the planned 3D resource load or raise the matching SceneResourcePolicy budget deliberately."
    }
  };
}

function relatedResource(resource: SceneResourceLoadEntry): Diagnostic["relatedResources"] {
  const related: NonNullable<Diagnostic["relatedResources"]> = [];
  if (resource.sourceId) related.push({ kind: "source", id: resource.sourceId });
  if (resource.url) related.push({ kind: "url", id: resource.url });
  return related.length > 0 ? related : undefined;
}

function escapePathSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}
