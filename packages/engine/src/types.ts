import type { DiagnosticCode, Scene3DStableRuntimeBlockerCode } from "./diagnostics/codes.js";

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface JsonPatchOperation {
  op: "add" | "remove" | "replace";
  path: string;
  value?: unknown;
}

export interface SuggestedFix {
  kind: "json-patch" | "command" | "manual";
  confidence: "high" | "medium" | "low";
  message: string;
  patch?: JsonPatchOperation[];
  command?: MapCommand;
}

export interface RelatedResource {
  kind: "source" | "layer" | "command" | "url" | "schema" | "adapter";
  id?: string;
  path?: string;
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  code: DiagnosticCode;
  blockerCode?: Scene3DStableRuntimeBlockerCode;
  message: string;
  path?: string;
  relatedResources?: RelatedResource[];
  fix?: SuggestedFix;
}

export interface CapabilityRequest {
  dimensions?: Array<"2d" | "2_5d" | "3d">;
  renderer?: "maplibre" | "webgl2-lite" | "scene3d";
  experimental?: string[];
}

export interface ViewSpec {
  mode?: "map2d" | "map2_5d" | "scene3d";
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  bounds?: [number, number, number, number];
}

export type Expression = JsonValue[];

export interface GeoJsonSourceSpec {
  type: "geojson";
  data: unknown;
}

export interface RasterSourceSpec {
  type: "raster";
  tiles: string[];
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

export interface PmtilesSourceSpec {
  type: "pmtiles";
  url: string;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

export interface VectorTileSourceSpec {
  type: "vector";
  tiles: string[];
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

export interface VectorUrlSourceSpec {
  type: "vector";
  url: string;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

export type VectorSourceSpec = VectorTileSourceSpec | VectorUrlSourceSpec;

export type SourceSpec = GeoJsonSourceSpec | RasterSourceSpec | PmtilesSourceSpec | VectorSourceSpec;

export interface LayerSpec {
  id: string;
  type: "background" | "raster" | "fill" | "line" | "circle" | "symbol-lite" | "fill-extrusion-lite";
  source?: string;
  filter?: Expression;
  minzoom?: number;
  maxzoom?: number;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface InteractionSpec {
  pan?: boolean;
  zoom?: boolean;
  hover?: boolean;
  click?: boolean;
  select?: boolean;
  popup?: boolean;
}

export interface MapSpec {
  version: "0.1";
  id?: string;
  revision?: string;
  capabilities?: CapabilityRequest;
  view: ViewSpec;
  sources: Record<string, SourceSpec>;
  layers: LayerSpec[];
  interactions?: InteractionSpec;
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export type SceneVector3 = [number, number, number];
export type ScenePosition = SceneVector3;

export interface SceneCamera {
  type?: "perspective";
  position: ScenePosition;
  target: ScenePosition;
  up?: SceneVector3;
  fov?: number;
  near?: number;
  far?: number;
}

export type SceneLight =
  | {
      type: "ambient";
      intensity?: number;
    }
  | {
      type: "directional";
      direction: SceneVector3;
      intensity?: number;
    };

export interface SceneDepthOptions {
  enabled?: boolean;
  mode?: "standard" | "logarithmic";
  clearColor?: string;
}

export interface SceneTransform {
  translate?: SceneVector3;
  rotate?: SceneVector3;
  scale?: number | SceneVector3;
}

export interface SceneTerrain {
  source: string;
  exaggeration?: number;
}

export type SceneSource =
  | {
      type: "terrain-raster-dem";
      url: string;
      encoding?: "mapbox" | "terrarium";
      attribution?: string;
    }
  | {
      type: "3d-tiles";
      url: string;
      maximumScreenSpaceError?: number;
      attribution?: string;
    }
  | {
      type: "gltf";
      url: string;
      transform?: SceneTransform;
      attribution?: string;
    };

export type SceneLayer =
  | {
      id: string;
      type: "terrain";
      source: string;
      visible?: boolean;
    }
  | {
      id: string;
      type: "tileset3d" | "model";
      source: string;
      visible?: boolean;
      pickable?: boolean;
    };

export interface SceneSnapshotOptions {
  width?: number;
  height?: number;
  pixelRatio?: number;
  format?: "png" | "data-url";
  requireLoadedResources?: boolean;
}

export interface SceneResourcePolicy {
  allowRelativeUrls?: boolean;
  allowedSchemes?: Array<"http:" | "https:">;
  allowedHosts?: string[];
  allowedPathPrefixes?: string[];
  maxTilesetJsonBytes?: number;
  maxModelBytes?: number;
  maxTextureCount?: number;
  maxTextureBytes?: number;
  maxWorkers?: number;
  timeoutMs?: number;
  retryCount?: number;
}

export interface SceneView3DExtension {
  camera: SceneCamera;
  lights?: SceneLight[];
  depth?: SceneDepthOptions;
  terrain?: SceneTerrain;
  sources?: Record<string, SceneSource>;
  layers?: SceneLayer[];
  snapshot?: SceneSnapshotOptions;
  resourcePolicy?: SceneResourcePolicy;
}

export interface MapCommandBase {
  id: string;
  version: "0.1";
  type: string;
  baseRevision?: string;
  author?: {
    type: "human" | "agent" | "system";
    id?: string;
    name?: string;
  };
  reason?: string;
  createdAt?: string;
  sourcePromptHash?: string;
  dryRun?: boolean;
}

export interface AddSourceCommand extends MapCommandBase {
  type: "addSource";
  sourceId: string;
  source: SourceSpec;
}

export interface RemoveSourceCommand extends MapCommandBase {
  type: "removeSource";
  sourceId: string;
}

export interface AddLayerCommand extends MapCommandBase {
  type: "addLayer";
  layer: LayerSpec;
  beforeLayerId?: string;
}

export interface RemoveLayerCommand extends MapCommandBase {
  type: "removeLayer";
  layerId: string;
}

export interface SetPaintCommand extends MapCommandBase {
  type: "setPaint";
  layerId: string;
  paint: Record<string, unknown>;
}

export interface SetLayoutCommand extends MapCommandBase {
  type: "setLayout";
  layerId: string;
  layout: Record<string, unknown>;
}

export interface SetFilterCommand extends MapCommandBase {
  type: "setFilter";
  layerId: string;
  filter: Expression | null;
}

export interface SetLayerZoomRangeCommand extends MapCommandBase {
  type: "setLayerZoomRange";
  layerId: string;
  minzoom: number;
  maxzoom: number;
}

export interface ReorderLayerCommand extends MapCommandBase {
  type: "reorderLayer";
  layerId: string;
  beforeLayerId?: string;
}

export interface SetViewCommand extends MapCommandBase {
  type: "setView";
  view: Partial<ViewSpec>;
}

export interface SetCapabilitiesCommand extends MapCommandBase {
  type: "setCapabilities";
  capabilities: CapabilityRequest;
}

export interface SetInteractionsCommand extends MapCommandBase {
  type: "setInteractions";
  interactions: InteractionSpec;
}

export interface FitBoundsCommand extends MapCommandBase {
  type: "fitBounds";
  bounds: [number, number, number, number];
  padding?: number;
}

export interface SetSceneCameraCommand extends MapCommandBase {
  type: "setSceneCamera";
  camera: SceneCamera;
}

export interface AddSceneSourceCommand extends MapCommandBase {
  type: "addSceneSource";
  sourceId: string;
  source: SceneSource;
}

export interface RemoveSceneSourceCommand extends MapCommandBase {
  type: "removeSceneSource";
  sourceId: string;
}

export interface AddSceneLayerCommand extends MapCommandBase {
  type: "addSceneLayer";
  layer: SceneLayer;
}

export interface RemoveSceneLayerCommand extends MapCommandBase {
  type: "removeSceneLayer";
  layerId: string;
}

export interface SetSceneLayerVisibilityCommand extends MapCommandBase {
  type: "setSceneLayerVisibility";
  layerId: string;
  visible: boolean;
}

export type MapCommand =
  | AddSourceCommand
  | RemoveSourceCommand
  | AddLayerCommand
  | RemoveLayerCommand
  | SetPaintCommand
  | SetLayoutCommand
  | SetFilterCommand
  | SetLayerZoomRangeCommand
  | ReorderLayerCommand
  | SetViewCommand
  | SetCapabilitiesCommand
  | SetInteractionsCommand
  | FitBoundsCommand
  | SetSceneCameraCommand
  | AddSceneSourceCommand
  | RemoveSceneSourceCommand
  | AddSceneLayerCommand
  | RemoveSceneLayerCommand
  | SetSceneLayerVisibilityCommand;

export interface ApplyOptions {
  dryRun?: boolean;
  transaction?: "atomic" | "best-effort";
  collectTrace?: boolean;
  traceId?: string;
}

export interface CommandResult {
  commandId: string;
  sequenceId: number;
  status: "applied" | "skipped" | "failed";
  baseRevision?: string;
  nextRevision?: string;
  changedPaths: string[];
  patch?: JsonPatchOperation[];
  inversePatch?: JsonPatchOperation[];
  diagnostics: Diagnostic[];
  traceId?: string;
}

export interface CommandTrace {
  traceId: string;
  commandId: string;
  sequenceId: number;
  status: CommandResult["status"];
  startedAt: string;
  endedAt: string;
  baseRevision?: string;
  nextRevision?: string;
  author?: MapCommandBase["author"];
  reason?: string;
  sourcePromptHash?: string;
  diagnostics: Diagnostic[];
  changedPaths: string[];
}

export interface ValidationReport {
  valid: boolean;
  diagnostics: Diagnostic[];
  stats: {
    sourceCount: number;
    layerCount: number;
    visibleLayerCount: number;
  };
}

export interface CapabilityReport {
  renderer: string;
  dimensions: Array<"2d" | "2_5d" | "3d">;
  sources: string[];
  layers: string[];
  expressions: string[];
  queries: string[];
  snapshot: {
    supported: boolean;
    formats: Array<"png" | "jpeg" | "data-url">;
  };
  experimental: string[];
}

export interface SnapshotOptions {
  width?: number;
  height?: number;
  pixelRatio?: number;
  format?: "png" | "jpeg" | "data-url";
  targetLayers?: string[];
}

export interface SnapshotResult {
  passed: boolean;
  diagnostics: Diagnostic[];
  dataUrl?: string;
}

export interface QueryFeaturesOptions {
  point?: [number, number];
  bbox?: [number, number, number, number];
  layers?: string[];
}

export interface FeatureQueryResult {
  features: JsonValue[];
  diagnostics: Diagnostic[];
}

export interface ResourceReport {
  destroyed: boolean;
  diagnostics: Diagnostic[];
  resources?: Record<string, number | boolean | string>;
}
