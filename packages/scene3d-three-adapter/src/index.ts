import {
  DiagnosticCodes,
  type CapabilityReport,
  type Diagnostic,
  type SceneSource,
  type SceneView3DExtension
} from "@gis-engine/engine";
import {
  getScene3DV1Capabilities,
  scene3dPackageBoundary,
  validateSceneResourceLoadPlan,
  type DiagnosticCounts,
  type Scene3DRendererVisualEvidence,
  type SceneResourceLoadEntry,
  type SceneResourceLoadPlan,
  type SceneResourceLoadReport
} from "@gis-engine/scene3d";

export const scene3dThreeAdapterBoundary = {
  packageName: "@gis-engine/scene3d-three-adapter",
  status: "spike",
  stableViewMode: false,
  targetRenderer: "three",
  targetTilesRenderer: "3d-tiles-renderer",
  forbiddenCoreDependencies: scene3dPackageBoundary.forbiddenCoreDependencies,
  requiredRuntimePeerDependencies: ["three", "3d-tiles-renderer"]
} as const;

export type Scene3DThreeAdapterBoundary = typeof scene3dThreeAdapterBoundary;

export interface Scene3DThreeAdapterLoadEstimates {
  tilesetJsonBytes?: Record<string, number>;
  modelBytes?: Record<string, number>;
  textureCount?: Record<string, number>;
  textureBytes?: Record<string, number>;
  elapsedMs?: Record<string, number>;
  workerCount?: number;
}

export interface Scene3DThreeAdapterSpikeOptions {
  estimates?: Scene3DThreeAdapterLoadEstimates;
}

export interface Scene3DThreeAdapterSpikeReport {
  kind: "Scene3DThreeAdapterSpikeReport";
  version: "0.1";
  adapter: "three";
  stableViewMode: false;
  runtimeSupported: false;
  capabilities: CapabilityReport;
  loadPlan: SceneResourceLoadPlan;
  resourceReport: SceneResourceLoadReport;
  diagnostics: Diagnostic[];
  diagnosticCounts: DiagnosticCounts;
}

export interface Scene3DThreeAdapterVisualCapture {
  reportPath: string;
  width: number;
  height: number;
  nonTransparentPixels: number;
  changedPixelsFromBackground: number;
  targetLayerPixels?: Record<string, number>;
  consoleErrors?: string[];
}

export interface Scene3DThreeAdapterRendererEvidenceOptions {
  capture?: Scene3DThreeAdapterVisualCapture;
  diagnostics?: Diagnostic[];
}

interface RawSceneResourceLoadEntry {
  kind: string;
  sourceId?: string | undefined;
  url?: string | undefined;
  byteLength?: number | undefined;
  textureCount?: number | undefined;
  textureBytes?: number | undefined;
  workerCount?: number | undefined;
  elapsedMs?: number | undefined;
}

export function getScene3DThreeAdapterCapabilities(): CapabilityReport {
  const capabilities = getScene3DV1Capabilities();
  return {
    ...capabilities,
    renderer: "scene3d-three-adapter",
    experimental: [...(capabilities.experimental ?? []), "sceneview3d-three-adapter-spike"]
  };
}

export function buildScene3DThreeAdapterLoadPlan(
  extension: SceneView3DExtension,
  options: Scene3DThreeAdapterSpikeOptions = {}
): SceneResourceLoadPlan {
  const resources: SceneResourceLoadEntry[] = [];
  const estimates = options.estimates;

  for (const [sourceId, source] of Object.entries(extension.sources ?? {})) {
    resources.push(...sourceLoadEntries(sourceId, source, estimates));
  }

  return {
    workerCount: estimates?.workerCount ?? defaultWorkerCount(extension),
    resources
  };
}

export function evaluateScene3DThreeAdapterSpike(
  extension: SceneView3DExtension,
  options: Scene3DThreeAdapterSpikeOptions = {}
): Scene3DThreeAdapterSpikeReport {
  const loadPlan = buildScene3DThreeAdapterLoadPlan(extension, options);
  const resourceReport = validateSceneResourceLoadPlan(extension, loadPlan);
  const diagnostics = [...resourceReport.diagnostics, unsupportedRuntimeDiagnostic()];

  return {
    kind: "Scene3DThreeAdapterSpikeReport",
    version: "0.1",
    adapter: "three",
    stableViewMode: false,
    runtimeSupported: false,
    capabilities: getScene3DThreeAdapterCapabilities(),
    loadPlan,
    resourceReport,
    diagnostics,
    diagnosticCounts: countDiagnostics(diagnostics)
  };
}

export function createScene3DThreeAdapterRendererEvidence(
  spikeReport: Scene3DThreeAdapterSpikeReport,
  options: Scene3DThreeAdapterRendererEvidenceOptions = {}
): Scene3DRendererVisualEvidence {
  const diagnostics = [...spikeReport.resourceReport.diagnostics, ...(options.diagnostics ?? [])];
  const capture = options.capture;

  if (!capture) {
    diagnostics.push(missingRendererCaptureDiagnostic());
  } else {
    diagnostics.push(...validateRendererCapture(capture));
  }

  return {
    passed: spikeReport.resourceReport.valid && diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
    renderer: "scene3d-three-adapter",
    ...(capture ? { reportPath: capture.reportPath } : {}),
    diagnostics
  };
}

function sourceLoadEntries(
  sourceId: string,
  source: SceneSource,
  estimates: Scene3DThreeAdapterLoadEstimates | undefined
): SceneResourceLoadEntry[] {
  if (source.type === "3d-tiles") {
    return [
      compactEntry({
        kind: "tileset-json",
        sourceId,
        url: source.url,
        byteLength: estimates?.tilesetJsonBytes?.[sourceId],
        elapsedMs: estimates?.elapsedMs?.[sourceId]
      })
    ];
  }

  if (source.type === "gltf") {
    const entries: SceneResourceLoadEntry[] = [
      compactEntry({
        kind: "model",
        sourceId,
        url: source.url,
        byteLength: estimates?.modelBytes?.[sourceId],
        elapsedMs: estimates?.elapsedMs?.[sourceId]
      })
    ];
    const textureCount = estimates?.textureCount?.[sourceId];
    const textureBytes = estimates?.textureBytes?.[sourceId];
    if (textureCount !== undefined || textureBytes !== undefined) {
      entries.push(
        compactEntry({
          kind: "texture",
          sourceId,
          url: source.url,
          textureCount,
          textureBytes
        })
      );
    }
    return entries;
  }

  if (source.type === "terrain-raster-dem") {
    return [
      compactEntry({
        kind: "texture",
        sourceId,
        url: source.url,
        textureCount: estimates?.textureCount?.[sourceId] ?? 1,
        textureBytes: estimates?.textureBytes?.[sourceId],
        elapsedMs: estimates?.elapsedMs?.[sourceId]
      })
    ];
  }

  return [];
}

function defaultWorkerCount(extension: SceneView3DExtension): number {
  return Object.values(extension.sources ?? {}).some((source) => source.type === "3d-tiles") ? 1 : 0;
}

function unsupportedRuntimeDiagnostic(): Diagnostic {
  return {
    severity: "info",
    code: DiagnosticCodes.CapabilityUnsupported,
    message:
      "The Three.js SceneView3D adapter is a spike boundary only; it does not enable stable scene3d runtime rendering yet.",
    path: "/extensions/scene3d",
    fix: {
      kind: "manual",
      confidence: "medium",
      message: "Keep SceneView3D rendering behind the adapter spike until real snapshot/query/visual evidence passes."
    }
  };
}

function missingRendererCaptureDiagnostic(): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message:
      "The Three.js SceneView3D adapter does not have renderer visual capture evidence yet.",
    path: "/rendererVisualEvidence",
    fix: {
      kind: "manual",
      confidence: "high",
      message:
        "Run a release-capable Three.js adapter visual runner and provide frame metrics before treating renderer evidence as passing."
    }
  };
}

function validateRendererCapture(capture: Scene3DThreeAdapterVisualCapture): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (capture.width <= 0 || capture.height <= 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.RenderAdapterError,
      message: "The Three.js SceneView3D adapter visual capture has invalid frame dimensions.",
      path: "/rendererVisualEvidence/frame",
      fix: {
        kind: "manual",
        confidence: "high",
        message: "Capture a browser/WebGL frame with positive width and height."
      }
    });
  }

  if (capture.nonTransparentPixels <= 0 || capture.changedPixelsFromBackground <= 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SnapshotBlankCanvas,
      message: "The Three.js SceneView3D adapter visual capture did not prove a nonblank frame.",
      path: "/rendererVisualEvidence/pixels",
      fix: {
        kind: "manual",
        confidence: "high",
        message: "Render a frame with nontransparent pixels and pixels changed from the background."
      }
    });
  }

  if ((capture.consoleErrors ?? []).length > 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.RenderAdapterError,
      message: "The Three.js SceneView3D adapter visual runner reported browser console errors.",
      path: "/rendererVisualEvidence/consoleErrors",
      fix: {
        kind: "manual",
        confidence: "high",
        message: "Fix browser console errors before accepting renderer visual evidence."
      }
    });
  }

  return diagnostics;
}

function countDiagnostics(diagnostics: Diagnostic[]): DiagnosticCounts {
  const counts: DiagnosticCounts = { error: 0, warning: 0, info: 0 };
  for (const diagnostic of diagnostics) {
    counts[diagnostic.severity] += 1;
  }
  return counts;
}

function compactEntry(entry: RawSceneResourceLoadEntry): SceneResourceLoadEntry {
  const compacted: SceneResourceLoadEntry = { kind: entry.kind };
  if (entry.sourceId !== undefined) compacted.sourceId = entry.sourceId;
  if (entry.url !== undefined) compacted.url = entry.url;
  if (entry.byteLength !== undefined) compacted.byteLength = entry.byteLength;
  if (entry.textureCount !== undefined) compacted.textureCount = entry.textureCount;
  if (entry.textureBytes !== undefined) compacted.textureBytes = entry.textureBytes;
  if (entry.workerCount !== undefined) compacted.workerCount = entry.workerCount;
  if (entry.elapsedMs !== undefined) compacted.elapsedMs = entry.elapsedMs;
  return compacted;
}
