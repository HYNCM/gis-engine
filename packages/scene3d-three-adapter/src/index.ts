import {
  DiagnosticCodes,
  Scene3DStableRuntimeBlockerCodes,
  type CapabilityReport,
  type Diagnostic,
  type ResourceReport,
  type SceneSource,
  type SceneView3DExtension
} from "@gis-engine/engine";
import {
  getScene3DV1Capabilities,
  scene3dPackageBoundary,
  queryScene3DMock,
  snapshotScene3DMock,
  validateSceneResourceLoadPlan,
  type DiagnosticCounts,
  type Scene3DMockSnapshotOptions,
  type Scene3DMockSnapshotResult,
  type Scene3DQueryOptions,
  type Scene3DQueryResult,
  type Scene3DRendererVisualEvidence,
  type SceneResourceLoadEntry,
  type SceneResourceLoadPlan,
  type SceneResourceLoadReport
} from "@gis-engine/scene3d";

const scene3dThreeAdapterForbiddenCoreDependencies = [
  ...scene3dPackageBoundary.forbiddenCoreDependencies,
  "3d-tiles-renderer",
  "@loaders.gl/core"
] as const;

export const scene3dThreeAdapterBoundary = {
  packageName: "@gis-engine/scene3d-three-adapter",
  status: "spike",
  stableViewMode: false,
  targetRenderer: "three",
  targetTilesRenderer: "3d-tiles-renderer",
  forbiddenCoreDependencies: scene3dThreeAdapterForbiddenCoreDependencies,
  requiredRuntimePeerDependencies: ["three", "3d-tiles-renderer"]
} as const;

export type Scene3DThreeAdapterBoundary = typeof scene3dThreeAdapterBoundary;

export type Scene3DThreeAdapterStableRendererContractOperation =
  | "load"
  | "render"
  | "resize"
  | "camera"
  | "snapshot"
  | "query"
  | "destroy"
  | "diagnostics"
  | "resourceCleanup";

export interface Scene3DThreeAdapterStableRendererContractObligation {
  id: Scene3DThreeAdapterStableRendererContractOperation;
  required: true;
  adapterResponsibility: string;
  requiredEvidence: readonly string[];
  diagnosticPaths: readonly string[];
}

export interface Scene3DThreeAdapterStableRendererDependencyBoundary {
  adapterLocalOnly: true;
  allowedRendererPackage: "@gis-engine/scene3d-three-adapter";
  runtimePackages: readonly ["three", "3d-tiles-renderer"];
  corePackagesMustRemainRendererFree: readonly ["@gis-engine/engine", "@gis-engine/scene3d", "@gis-engine/ai"];
  forbiddenCoreDependencies: readonly string[];
  currentPackageManifestStatus: "not-declared-during-spike";
}

export interface Scene3DThreeAdapterStableRendererContractSummary {
  kind: "Scene3DThreeAdapterStableRendererContractSummary";
  version: "0.1";
  adapter: "three";
  packageName: "@gis-engine/scene3d-three-adapter";
  status: "adapter-contract-defined";
  stableViewMode: false;
  runtimeSupported: false;
  stableRuntimeBlocked: true;
  promotionDecisionTask: "TASK-2026W23-SRC-006";
  dependencyBoundary: Scene3DThreeAdapterStableRendererDependencyBoundary;
  obligations: readonly Scene3DThreeAdapterStableRendererContractObligation[];
  guardrails: {
    schemaFirst: true;
    commandOnlyMutation: true;
    structuredDiagnostics: true;
    snapshotVerification: true;
    resourcePolicyRequired: true;
    adapterBoundaryRequired: true;
  };
  diagnostics: Diagnostic[];
}

export const scene3dThreeAdapterStableRendererContractObligations = [
  {
    id: "load",
    required: true,
    adapterResponsibility:
      "Validate the SceneView3D extension and resource load plan before creating adapter-local Three.js or 3DTilesRendererJS resources.",
    requiredEvidence: ["Scene3DThreeAdapterRuntimeLoadReport", "SceneResourceLoadReport"],
    diagnosticPaths: ["/extensions/scene3d", "/extensions/scene3d/sources"]
  },
  {
    id: "render",
    required: true,
    adapterResponsibility:
      "Render terrain, 3D Tiles, and glTF layers through adapter-local renderer state without mutating MapSpec runtime state.",
    requiredEvidence: ["Scene3DRendererVisualEvidence", "nonblank frame metrics"],
    diagnosticPaths: ["/rendererVisualEvidence", "/renderer/render"]
  },
  {
    id: "resize",
    required: true,
    adapterResponsibility:
      "Apply width, height, and pixel ratio changes deterministically and report invalid viewport dimensions as diagnostics.",
    requiredEvidence: ["snapshot.summary.width", "snapshot.summary.height"],
    diagnosticPaths: ["/renderer/resize", "/snapshot/summary"]
  },
  {
    id: "camera",
    required: true,
    adapterResponsibility:
      "Apply SceneView3D camera position, target, up vector, field of view, and clipping values from schema-validated inputs.",
    requiredEvidence: ["SceneView3D camera contract", "snapshot/query camera consistency"],
    diagnosticPaths: ["/extensions/scene3d/camera", "/renderer/camera"]
  },
  {
    id: "snapshot",
    required: true,
    adapterResponsibility:
      "Return deterministic png or data-url snapshots with resource-pending diagnostics when required sources are not loaded.",
    requiredEvidence: ["Scene3DMockSnapshotResult", "visual snapshot report"],
    diagnosticPaths: ["/snapshot", "/snapshot/resources"]
  },
  {
    id: "query",
    required: true,
    adapterResponsibility:
      "Expose deterministic picking and 3D query results with layer, source, object id, position, and properties fields.",
    requiredEvidence: ["Scene3DQueryResult", "pick coverage report"],
    diagnosticPaths: ["/query", "/query/picks"]
  },
  {
    id: "destroy",
    required: true,
    adapterResponsibility:
      "Make destroy idempotent, stop future rendering work, and return stable diagnostics for post-destroy operations.",
    requiredEvidence: ["ResourceReport", "post-destroy snapshot/query diagnostics"],
    diagnosticPaths: ["/runtime/destroy", "/runtime/destroyed"]
  },
  {
    id: "diagnostics",
    required: true,
    adapterResponsibility:
      "Return structured Diagnostic objects for every load, render, snapshot, query, lifecycle, and resource-policy failure path.",
    requiredEvidence: ["diagnostic code inventory", "adapter contract tests"],
    diagnosticPaths: ["/diagnostics"]
  },
  {
    id: "resourceCleanup",
    required: true,
    adapterResponsibility:
      "Dispose renderer, scene graph, geometries, materials, textures, workers, event listeners, and object URLs owned by the adapter.",
    requiredEvidence: ["resource cleanup report", "worker/texture disposal audit"],
    diagnosticPaths: ["/resources/cleanup", "/runtime/destroy"]
  }
] as const satisfies readonly Scene3DThreeAdapterStableRendererContractObligation[];

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

export interface Scene3DThreeAdapterPromotionEvidenceOptions {
  loadReport?: Scene3DThreeAdapterRuntimeLoadReport;
  snapshot?: Scene3DMockSnapshotResult;
  query?: Scene3DQueryResult;
  rendererVisualEvidence?: Scene3DRendererVisualEvidence;
  diagnostics?: Diagnostic[];
}

export interface Scene3DThreeAdapterPromotionEvidenceSummary {
  kind: "Scene3DThreeAdapterPromotionEvidenceSummary";
  version: "0.1";
  adapter: "three";
  stableViewMode: false;
  runtimeSupported: false;
  decisionReady: boolean;
  stablePromotionAllowed: false;
  evidence: {
    resourcePolicy: {
      valid: boolean;
      resourceCount: number;
      workerCount: number;
      diagnostics: DiagnosticCounts;
    };
    load: {
      present: boolean;
      loaded: boolean;
      diagnostics: DiagnosticCounts;
    };
    snapshot: {
      present: boolean;
      passed: boolean;
      pendingSourceCount: number;
      format?: "png" | "data-url";
      diagnostics: DiagnosticCounts;
    };
    query: {
      present: boolean;
      pickCount: number;
      diagnostics: DiagnosticCounts;
    };
    rendererVisual: {
      present: boolean;
      passed: boolean;
      reportPath?: string;
      diagnostics: DiagnosticCounts;
    };
  };
  diagnostics: Diagnostic[];
  diagnosticCounts: DiagnosticCounts;
}

export type Scene3DThreeAdapterDependencyField =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies";

export interface Scene3DThreeAdapterPackageManifestEvidence {
  packageName: string;
  path: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface Scene3DThreeAdapterSourceImportEvidence {
  packageName: string;
  root: string;
  imports: readonly string[];
}

export interface Scene3DThreeAdapterDependencyBoundaryAuditOptions {
  manifests: readonly Scene3DThreeAdapterPackageManifestEvidence[];
  sourceImports: readonly Scene3DThreeAdapterSourceImportEvidence[];
}

export interface Scene3DThreeAdapterDependencyBoundaryAudit {
  kind: "Scene3DThreeAdapterDependencyBoundaryAudit";
  version: "0.1";
  adapter: "three";
  packageName: "@gis-engine/scene3d-three-adapter";
  stableViewMode: false;
  runtimeSupported: false;
  valid: boolean;
  dependencyBoundary: Scene3DThreeAdapterStableRendererDependencyBoundary;
  audit: {
    adapterOwnedPackages: readonly string[];
    rendererFreePackages: readonly string[];
    rendererPackages: readonly string[];
    dependencyFields: readonly Scene3DThreeAdapterDependencyField[];
    manifestCount: number;
    sourceImportRootCount: number;
  };
  diagnostics: Diagnostic[];
  diagnosticCounts: DiagnosticCounts;
}

export const scene3dThreeAdapterDependencyBoundaryAuditPolicy = {
  adapterOwnedPackages: [scene3dThreeAdapterBoundary.packageName],
  rendererFreePackages: ["@gis-engine/engine", "@gis-engine/scene3d", "@gis-engine/ai"],
  rendererPackages: scene3dThreeAdapterBoundary.forbiddenCoreDependencies,
  dependencyFields: ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]
} as const satisfies {
  adapterOwnedPackages: readonly string[];
  rendererFreePackages: readonly string[];
  rendererPackages: readonly string[];
  dependencyFields: readonly Scene3DThreeAdapterDependencyField[];
};

export interface Scene3DThreeAdapterRuntimeLoadReport {
  kind: "Scene3DThreeAdapterRuntimeLoadReport";
  version: "0.1";
  adapter: "three";
  stableViewMode: false;
  runtimeSupported: false;
  loaded: boolean;
  diagnostics: Diagnostic[];
  resourceReport: SceneResourceLoadReport;
  spikeReport: Scene3DThreeAdapterSpikeReport;
}

export interface Scene3DThreeAdapterRuntime {
  readonly stableViewMode: false;
  readonly runtimeSupported: false;
  readonly spikeReport: Scene3DThreeAdapterSpikeReport;
  readonly loadPlan: SceneResourceLoadPlan;
  load(): Promise<Scene3DThreeAdapterRuntimeLoadReport>;
  snapshot(options?: Scene3DMockSnapshotOptions): Promise<Scene3DMockSnapshotResult>;
  query(options?: Scene3DQueryOptions): Promise<Scene3DQueryResult>;
  destroy(): Promise<ResourceReport>;
  rendererEvidence(options?: Scene3DThreeAdapterRendererEvidenceOptions): Scene3DRendererVisualEvidence;
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

export function getScene3DThreeAdapterStableRendererContract(): Scene3DThreeAdapterStableRendererContractSummary {
  return {
    kind: "Scene3DThreeAdapterStableRendererContractSummary",
    version: "0.1",
    adapter: "three",
    packageName: scene3dThreeAdapterBoundary.packageName,
    status: "adapter-contract-defined",
    stableViewMode: false,
    runtimeSupported: false,
    stableRuntimeBlocked: true,
    promotionDecisionTask: "TASK-2026W23-SRC-006",
    dependencyBoundary: {
      adapterLocalOnly: true,
      allowedRendererPackage: scene3dThreeAdapterBoundary.packageName,
      runtimePackages: scene3dThreeAdapterBoundary.requiredRuntimePeerDependencies,
      corePackagesMustRemainRendererFree: scene3dThreeAdapterDependencyBoundaryAuditPolicy.rendererFreePackages,
      forbiddenCoreDependencies: scene3dThreeAdapterBoundary.forbiddenCoreDependencies,
      currentPackageManifestStatus: "not-declared-during-spike"
    },
    obligations: scene3dThreeAdapterStableRendererContractObligations,
    guardrails: {
      schemaFirst: true,
      commandOnlyMutation: true,
      structuredDiagnostics: true,
      snapshotVerification: true,
      resourcePolicyRequired: true,
      adapterBoundaryRequired: true
    },
    diagnostics: stableRuntimeBlockedDiagnostics()
  };
}

export function auditScene3DThreeAdapterDependencyBoundary(
  options: Scene3DThreeAdapterDependencyBoundaryAuditOptions
): Scene3DThreeAdapterDependencyBoundaryAudit {
  const contract = getScene3DThreeAdapterStableRendererContract();
  const diagnostics: Diagnostic[] = [];
  const manifestsByPackage = new Map(options.manifests.map((manifest) => [manifest.packageName, manifest]));
  const importsByPackage = new Map(options.sourceImports.map((sourceImport) => [sourceImport.packageName, sourceImport]));

  for (const packageName of scene3dThreeAdapterDependencyBoundaryAuditPolicy.rendererFreePackages) {
    const manifest = manifestsByPackage.get(packageName);
    if (!manifest) {
      diagnostics.push(missingDependencyBoundaryEvidenceDiagnostic("manifest", packageName));
    } else {
      diagnostics.push(...manifestRendererDependencyDiagnostics(manifest, false));
    }

    const sourceImport = importsByPackage.get(packageName);
    if (!sourceImport) {
      diagnostics.push(missingDependencyBoundaryEvidenceDiagnostic("imports", packageName));
    } else {
      diagnostics.push(...sourceImportRendererDependencyDiagnostics(sourceImport));
    }
  }

  const adapterManifest = manifestsByPackage.get(scene3dThreeAdapterBoundary.packageName);
  if (!adapterManifest) {
    diagnostics.push(missingDependencyBoundaryEvidenceDiagnostic("manifest", scene3dThreeAdapterBoundary.packageName));
  } else {
    diagnostics.push(...manifestRendererDependencyDiagnostics(adapterManifest, true));
  }

  return {
    kind: "Scene3DThreeAdapterDependencyBoundaryAudit",
    version: "0.1",
    adapter: "three",
    packageName: scene3dThreeAdapterBoundary.packageName,
    stableViewMode: false,
    runtimeSupported: false,
    valid: !hasErrorDiagnostics(diagnostics),
    dependencyBoundary: contract.dependencyBoundary,
    audit: {
      adapterOwnedPackages: scene3dThreeAdapterDependencyBoundaryAuditPolicy.adapterOwnedPackages,
      rendererFreePackages: scene3dThreeAdapterDependencyBoundaryAuditPolicy.rendererFreePackages,
      rendererPackages: scene3dThreeAdapterDependencyBoundaryAuditPolicy.rendererPackages,
      dependencyFields: scene3dThreeAdapterDependencyBoundaryAuditPolicy.dependencyFields,
      manifestCount: options.manifests.length,
      sourceImportRootCount: options.sourceImports.length
    },
    diagnostics,
    diagnosticCounts: countDiagnostics(diagnostics)
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

export function createScene3DThreeAdapterPromotionEvidenceSummary(
  spikeReport: Scene3DThreeAdapterSpikeReport,
  options: Scene3DThreeAdapterPromotionEvidenceOptions = {}
): Scene3DThreeAdapterPromotionEvidenceSummary {
  const loadDiagnostics = options.loadReport
    ? [...options.loadReport.diagnostics]
    : [missingPromotionEvidenceDiagnostic("load")];
  if (options.loadReport && !options.loadReport.loaded) {
    loadDiagnostics.push(incompletePromotionEvidenceDiagnostic("load", "Runtime load evidence is not loaded."));
  }

  const snapshotDiagnostics = options.snapshot
    ? [...options.snapshot.diagnostics]
    : [missingPromotionEvidenceDiagnostic("snapshot")];
  if (options.snapshot && !options.snapshot.passed) {
    snapshotDiagnostics.push(incompletePromotionEvidenceDiagnostic("snapshot", "Snapshot evidence did not pass."));
  }

  const queryDiagnostics = options.query ? [...options.query.diagnostics] : [missingPromotionEvidenceDiagnostic("query")];
  const rendererVisualDiagnostics = options.rendererVisualEvidence
    ? [...(options.rendererVisualEvidence.diagnostics ?? [])]
    : [missingPromotionEvidenceDiagnostic("rendererVisual")];
  if (options.rendererVisualEvidence && !options.rendererVisualEvidence.passed) {
    rendererVisualDiagnostics.push(
      incompletePromotionEvidenceDiagnostic("rendererVisual", "Renderer visual evidence did not pass.")
    );
  }

  const diagnostics = [
    ...spikeReport.diagnostics,
    ...loadDiagnostics,
    ...snapshotDiagnostics,
    ...queryDiagnostics,
    ...rendererVisualDiagnostics,
    ...(options.diagnostics ?? [])
  ];
  const decisionReady =
    spikeReport.resourceReport.valid &&
    options.loadReport?.loaded === true &&
    options.snapshot?.passed === true &&
    options.query !== undefined &&
    !hasErrorDiagnostics(queryDiagnostics) &&
    options.rendererVisualEvidence?.passed === true &&
    !hasErrorDiagnostics(diagnostics);

  const rendererVisual = {
    present: options.rendererVisualEvidence !== undefined,
    passed: options.rendererVisualEvidence?.passed ?? false,
    ...(options.rendererVisualEvidence?.reportPath ? { reportPath: options.rendererVisualEvidence.reportPath } : {}),
    diagnostics: countDiagnostics(rendererVisualDiagnostics)
  };

  return {
    kind: "Scene3DThreeAdapterPromotionEvidenceSummary",
    version: "0.1",
    adapter: "three",
    stableViewMode: false,
    runtimeSupported: false,
    decisionReady,
    stablePromotionAllowed: false,
    evidence: {
      resourcePolicy: {
        valid: spikeReport.resourceReport.valid,
        resourceCount: spikeReport.loadPlan.resources?.length ?? 0,
        workerCount: spikeReport.loadPlan.workerCount ?? 0,
        diagnostics: countDiagnostics(spikeReport.resourceReport.diagnostics)
      },
      load: {
        present: options.loadReport !== undefined,
        loaded: options.loadReport?.loaded ?? false,
        diagnostics: countDiagnostics(loadDiagnostics)
      },
      snapshot: {
        present: options.snapshot !== undefined,
        passed: options.snapshot?.passed ?? false,
        pendingSourceCount: options.snapshot?.pendingSourceIds.length ?? 0,
        ...(options.snapshot ? { format: options.snapshot.summary.format } : {}),
        diagnostics: countDiagnostics(snapshotDiagnostics)
      },
      query: {
        present: options.query !== undefined,
        pickCount: options.query?.picks.length ?? 0,
        diagnostics: countDiagnostics(queryDiagnostics)
      },
      rendererVisual
    },
    diagnostics,
    diagnosticCounts: countDiagnostics(diagnostics)
  };
}

export function createScene3DThreeAdapterRuntime(
  extension: SceneView3DExtension,
  options: Scene3DThreeAdapterSpikeOptions = {}
): Scene3DThreeAdapterRuntime {
  return new Scene3DThreeAdapterRuntimeImpl(extension, options);
}

class Scene3DThreeAdapterRuntimeImpl implements Scene3DThreeAdapterRuntime {
  readonly stableViewMode = false;
  readonly runtimeSupported = false;
  readonly loadPlan: SceneResourceLoadPlan;
  readonly spikeReport: Scene3DThreeAdapterSpikeReport;
  #extension: SceneView3DExtension;
  #loaded = false;
  #destroyed = false;

  constructor(extension: SceneView3DExtension, options: Scene3DThreeAdapterSpikeOptions = {}) {
    this.#extension = structuredClone(extension);
    this.loadPlan = buildScene3DThreeAdapterLoadPlan(this.#extension, options);
    this.spikeReport = evaluateScene3DThreeAdapterSpike(this.#extension, options);
  }

  async load(): Promise<Scene3DThreeAdapterRuntimeLoadReport> {
    if (this.#destroyed) {
      return {
        kind: "Scene3DThreeAdapterRuntimeLoadReport",
        version: "0.1",
        adapter: "three",
        stableViewMode: false,
        runtimeSupported: false,
        loaded: false,
        diagnostics: [destroyedDiagnostic("load")],
        resourceReport: this.spikeReport.resourceReport,
        spikeReport: this.spikeReport
      };
    }

    this.#loaded = true;
    return {
      kind: "Scene3DThreeAdapterRuntimeLoadReport",
      version: "0.1",
      adapter: "three",
      stableViewMode: false,
      runtimeSupported: false,
      loaded: true,
      diagnostics: [...this.spikeReport.diagnostics],
      resourceReport: this.spikeReport.resourceReport,
      spikeReport: this.spikeReport
    };
  }

  async snapshot(options: Scene3DMockSnapshotOptions = {}): Promise<Scene3DMockSnapshotResult> {
    if (this.#destroyed) return destroyedSnapshotResult(this.#extension, options);
    if (!this.#loaded) return notLoadedSnapshotResult(this.#extension, options);

    const snapshot = snapshotScene3DMock(this.#extension, {
      ...options,
      loadedSourceIds: options.loadedSourceIds ?? Object.keys(this.#extension.sources ?? {}),
      requireLoadedResources: options.requireLoadedResources ?? true
    });
    const diagnostics = [...this.spikeReport.resourceReport.diagnostics, ...snapshot.diagnostics];
    return {
      ...snapshot,
      passed: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
      diagnostics
    };
  }

  async query(options: Scene3DQueryOptions = {}): Promise<Scene3DQueryResult> {
    if (this.#destroyed) {
      return { picks: [], diagnostics: [destroyedDiagnostic("query")] };
    }
    if (!this.#loaded) {
      return { picks: [], diagnostics: [notLoadedDiagnostic("query")] };
    }

    const query = queryScene3DMock(this.#extension, options);
    return {
      picks: query.picks,
      diagnostics: [...this.spikeReport.resourceReport.diagnostics, ...query.diagnostics]
    };
  }

  async destroy(): Promise<ResourceReport> {
    if (this.#destroyed) {
      return {
        destroyed: true,
        diagnostics: [destroyedDiagnostic("destroy")]
      };
    }

    this.#destroyed = true;
    this.#loaded = false;
    return { destroyed: true, diagnostics: [] };
  }

  rendererEvidence(options: Scene3DThreeAdapterRendererEvidenceOptions = {}): Scene3DRendererVisualEvidence {
    return createScene3DThreeAdapterRendererEvidence(this.spikeReport, options);
  }
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

function stableRuntimeBlockedDiagnostics(): Diagnostic[] {
  return [
    stableRuntimeBlockedDiagnostic(
      "/view/mode",
      Scene3DStableRuntimeBlockerCodes.ViewMode,
      'Stable view.mode: "scene3d" remains blocked until the SceneView3D stable renderer contract is accepted.'
    ),
    stableRuntimeBlockedDiagnostic(
      "/capabilities/renderer",
      Scene3DStableRuntimeBlockerCodes.Renderer,
      "The Three.js adapter contract is adapter-local evidence only and does not promote the core scene3d renderer."
    ),
    stableRuntimeBlockedDiagnostic(
      "/capabilities/dimensions",
      Scene3DStableRuntimeBlockerCodes.Dimensions,
      "SceneView3D 3D capability remains blocked in the stable runtime until quality-guardian and coordinator accept promotion."
    )
  ];
}

function stableRuntimeBlockedDiagnostic(
  path: string,
  blockerCode: NonNullable<Diagnostic["blockerCode"]>,
  message: string
): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    blockerCode,
    message,
    path,
    relatedResources: [{ kind: "adapter", id: scene3dThreeAdapterBoundary.packageName }],
    fix: {
      kind: "manual",
      confidence: "high",
      message: "Keep SceneView3D stable runtime blocked until the stable renderer contract and promotion gate are accepted."
    }
  };
}

function missingDependencyBoundaryEvidenceDiagnostic(kind: "manifest" | "imports", packageName: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: `Scene3DThreeAdapter dependency boundary audit is missing ${kind} evidence for ${packageName}.`,
    path: `/dependencyBoundary/${kind}/${jsonPointerSegment(packageName)}`,
    relatedResources: [{ kind: "adapter", id: scene3dThreeAdapterBoundary.packageName }],
    fix: {
      kind: "manual",
      confidence: "high",
      message: "Provide package manifest and source import evidence before accepting the adapter dependency boundary."
    }
  };
}

function manifestRendererDependencyDiagnostics(
  manifest: Scene3DThreeAdapterPackageManifestEvidence,
  adapterSpikeManifest: boolean
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const rendererPackages: readonly string[] = scene3dThreeAdapterDependencyBoundaryAuditPolicy.rendererPackages;

  for (const field of scene3dThreeAdapterDependencyBoundaryAuditPolicy.dependencyFields) {
    for (const dependency of Object.keys(manifest[field] ?? {})) {
      if (!rendererPackages.includes(dependency)) continue;
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: adapterSpikeManifest
          ? `The spike adapter manifest must not declare ${dependency} until the real renderer package is promoted.`
          : `${manifest.packageName} must remain free of SceneView3D renderer dependency ${dependency}.`,
        path: `/dependencyBoundary/manifests/${jsonPointerSegment(manifest.packageName)}/${field}/${jsonPointerSegment(dependency)}`,
        relatedResources: [
          { kind: "adapter", id: scene3dThreeAdapterBoundary.packageName },
          { kind: "adapter", id: manifest.packageName, path: manifest.path }
        ],
        fix: {
          kind: "manual",
          confidence: "high",
          message: adapterSpikeManifest
            ? "Keep Three.js and 3DTilesRendererJS undeclared during the spike evidence phase."
            : "Move renderer dependencies into an approved adapter package and keep core packages renderer-free."
        }
      });
    }
  }

  return diagnostics;
}

function sourceImportRendererDependencyDiagnostics(sourceImport: Scene3DThreeAdapterSourceImportEvidence): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const importSpecifier of sourceImport.imports) {
    const rendererPackage = scene3dThreeAdapterDependencyBoundaryAuditPolicy.rendererPackages.find((dependency) =>
      isPackageOrSubpath(importSpecifier, dependency)
    );
    if (!rendererPackage) continue;

    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `${sourceImport.packageName} must not import SceneView3D renderer package ${rendererPackage}.`,
      path: `/dependencyBoundary/imports/${jsonPointerSegment(sourceImport.packageName)}/${jsonPointerSegment(importSpecifier)}`,
      relatedResources: [
        { kind: "adapter", id: scene3dThreeAdapterBoundary.packageName },
        { kind: "adapter", id: sourceImport.packageName, path: sourceImport.root }
      ],
      fix: {
        kind: "manual",
        confidence: "high",
        message: "Keep renderer implementation imports inside the SceneView3D Three.js adapter package."
      }
    });
  }

  return diagnostics;
}

function isPackageOrSubpath(importSpecifier: string, packageName: string): boolean {
  return importSpecifier === packageName || importSpecifier.startsWith(`${packageName}/`);
}

function jsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
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

function missingPromotionEvidenceDiagnostic(component: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: `Scene3DThreeAdapter promotion evidence is missing ${component} evidence.`,
    path: `/promotionEvidence/${component}`,
    fix: {
      kind: "manual",
      confidence: "high",
      message: "Collect load, snapshot, query, and renderer visual evidence before requesting a promotion decision."
    }
  };
}

function incompletePromotionEvidenceDiagnostic(component: string, message: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.RenderAdapterError,
    message,
    path: `/promotionEvidence/${component}`,
    fix: {
      kind: "manual",
      confidence: "high",
      message: "Fix the failing evidence component before requesting a promotion decision."
    }
  };
}

function hasErrorDiagnostics(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function countDiagnostics(diagnostics: Diagnostic[]): DiagnosticCounts {
  const counts: DiagnosticCounts = { error: 0, warning: 0, info: 0 };
  for (const diagnostic of diagnostics) {
    counts[diagnostic.severity] += 1;
  }
  return counts;
}

function destroyedDiagnostic(operation: string): Diagnostic {
  return {
    severity: "info",
    code: DiagnosticCodes.RenderDestroyed,
    message: `Scene3DThreeAdapter runtime has already been destroyed before ${operation}.`
  };
}

function notLoadedDiagnostic(operation: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.RenderAdapterError,
    message: `Scene3DThreeAdapter runtime must load before ${operation}.`
  };
}

function destroyedSnapshotResult(
  extension: SceneView3DExtension,
  options: Scene3DMockSnapshotOptions
): Scene3DMockSnapshotResult {
  const snapshot = snapshotScene3DMock(extension, {
    ...options,
    loadedSourceIds: [],
    requireLoadedResources: true
  });
  const { dataUrl, ...rest } = snapshot;
  void dataUrl;
  return {
    ...rest,
    passed: false,
    diagnostics: [destroyedDiagnostic("snapshot")]
  };
}

function notLoadedSnapshotResult(
  extension: SceneView3DExtension,
  options: Scene3DMockSnapshotOptions
): Scene3DMockSnapshotResult {
  const snapshot = snapshotScene3DMock(extension, {
    ...options,
    loadedSourceIds: [],
    requireLoadedResources: true
  });
  const { dataUrl, ...rest } = snapshot;
  void dataUrl;
  return {
    ...rest,
    passed: false,
    diagnostics: [notLoadedDiagnostic("snapshot")]
  };
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
