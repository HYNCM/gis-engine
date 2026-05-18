import { DiagnosticCodes, type CapabilityReport, type Diagnostic, type SceneResourcePolicy, type SceneView3DExtension } from "@gis-engine/engine";

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
