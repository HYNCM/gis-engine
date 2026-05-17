import type { DiagnosticCode } from "./diagnostics/codes.js";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

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

export interface ReorderLayerCommand extends MapCommandBase {
  type: "reorderLayer";
  layerId: string;
  beforeLayerId?: string;
}

export interface SetViewCommand extends MapCommandBase {
  type: "setView";
  view: Partial<ViewSpec>;
}

export interface FitBoundsCommand extends MapCommandBase {
  type: "fitBounds";
  bounds: [number, number, number, number];
  padding?: number;
}

export type MapCommand =
  | AddSourceCommand
  | RemoveSourceCommand
  | AddLayerCommand
  | RemoveLayerCommand
  | SetPaintCommand
  | SetLayoutCommand
  | ReorderLayerCommand
  | SetViewCommand
  | FitBoundsCommand;

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
