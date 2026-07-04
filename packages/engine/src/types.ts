/**
 * Public type definitions for @gis-engine/engine.
 *
 * Where possible, types are derived from TypeBox schemas via `Static<typeof>`
 * to ensure a single source of truth between runtime validation and static types.
 * Hand-written types are retained only where no corresponding schema exists
 * (e.g., internal helpers, callback signatures, individual command interfaces).
 */
import type { Static } from "@sinclair/typebox";
import type { MapCommandSchema } from "./spec/schemas/command.schema.js";
import type { DiagnosticSchema } from "./spec/schemas/diagnostics.schema.js";
import type {
  CapabilityReportSchema,
  CapabilityRequestSchema,
  InteractionSpecSchema,
  LayerSpecSchema,
  MapSpecSchema,
  SourceSpecSchema,
  ViewSpecSchema,
} from "./spec/schemas/map-spec.schema.js";
import type {
  SceneCameraSchema,
  SceneDepthOptionsSchema,
  SceneLayerSchema,
  SceneLightSchema,
  SceneResourcePolicySchema,
  SceneSnapshotOptionsSchema,
  SceneSourceSchema,
  SceneTerrainSchema,
  SceneTransformSchema,
  SceneView3DExtensionSchema,
} from "./spec/schemas/sceneview3d.schema.js";

// ---------------------------------------------------------------------------
// Primitive / helper types (no corresponding schema — kept hand-written)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Schema-derived types (single source of truth: TypeBox schemas)
// ---------------------------------------------------------------------------

export type Diagnostic = Static<typeof DiagnosticSchema>;
export type CapabilityRequest = Static<typeof CapabilityRequestSchema>;
export type ViewSpec = Static<typeof ViewSpecSchema>;

// ---------------------------------------------------------------------------
// Expression — hand-written; used by map-spec.schema.ts LayerFilterSchema
// ---------------------------------------------------------------------------

export type Expression = JsonValue[];

// ---------------------------------------------------------------------------
// Individual source specs (hand-written for backward compatibility;
// the union SourceSpec below is schema-derived)
// ---------------------------------------------------------------------------

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

export interface FlatGeobufSourceSpec {
  type: "flatgeobuf";
  url: string;
  hasIndex?: boolean;
  featureCount?: number;
  bbox?: [number, number, number, number];
  geometryType?: "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon";
  fileBytes?: number;
}

export interface GeoParquetSourceSpec {
  type: "geoparquet";
  url: string;
  crs?: {
    authority?: string;
    code?: string;
    wkt?: string;
  };
  encoding?:
    | "WKB"
    | "WKT"
    | "geoarrow-point"
    | "geoarrow-linestring"
    | "geoarrow-polygon"
    | "geoarrow-multipoint"
    | "geoarrow-multilinestring"
    | "geoarrow-multipolygon";
  bbox?: [number, number, number, number];
  rowCount?: number;
  fileBytes?: number;
  parquetVersion?: 1 | 2;
}

export interface GeoTiffSourceSpec {
  type: "geotiff";
  url: string;
  crs?: {
    authority?: string;
    code?: string;
    wkt?: string;
  };
  bbox?: [number, number, number, number];
  width?: number;
  height?: number;
  bandCount?: number;
  bands?: Array<{
    index: number;
    name?: string;
    dataType?: "uint8" | "uint16" | "uint32" | "int8" | "int16" | "int32" | "float32" | "float64";
    noData?: number;
  }>;
  fileBytes?: number;
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

export type SourceSpec = Static<typeof SourceSpecSchema>;

export type LayerSpec = Static<typeof LayerSpecSchema>;

/**
 * Symbol layer type — full-featured text labels and icons.
 * Hand-written: the schema LayerSpecSchema uses generic Record<string, unknown>
 * for layout/paint, while this interface provides specific property types.
 * Retained for backward compatibility and richer type information.
 */
export interface SymbolLayerSpec {
  id: string;
  type: "symbol";
  source: string;
  layout?: {
    "text-field"?: unknown;
    "icon-image"?: unknown;
    "symbol-placement"?: "point" | "line" | "line-center";
    "symbol-spacing"?: unknown;
    "text-font"?: string[];
    "text-size"?: unknown;
    "text-anchor"?:
      | "center"
      | "left"
      | "right"
      | "top"
      | "bottom"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right";
    "text-offset"?: unknown[];
    "text-max-width"?: unknown;
    "text-line-height"?: unknown;
    "text-letter-spacing"?: unknown;
    "text-justify"?: "auto" | "left" | "center" | "right";
    "text-transform"?: "none" | "uppercase" | "lowercase";
    "icon-size"?: unknown;
    "icon-anchor"?:
      | "center"
      | "left"
      | "right"
      | "top"
      | "bottom"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right";
    "icon-rotate"?: unknown;
    "icon-allow-overlap"?: unknown;
    "text-allow-overlap"?: unknown;
    "symbol-sort-key"?: unknown;
    [key: string]: unknown;
  };
  paint?: {
    "text-color"?: unknown;
    "text-halo-color"?: unknown;
    "text-halo-width"?: unknown;
    "text-halo-blur"?: unknown;
    "text-opacity"?: unknown;
    "icon-opacity"?: unknown;
    "icon-color"?: unknown;
    "icon-halo-color"?: unknown;
    "icon-halo-width"?: unknown;
    "icon-halo-blur"?: unknown;
    [key: string]: unknown;
  };
  filter?: Expression;
  minzoom?: number;
  maxzoom?: number;
  metadata?: Record<string, unknown>;
}

export type InteractionSpec = Static<typeof InteractionSpecSchema>;
export type MapSpec = Static<typeof MapSpecSchema>;

// ---------------------------------------------------------------------------
// SceneView3D types (schema-derived)
// ---------------------------------------------------------------------------

export type SceneVector3 = [number, number, number];
export type ScenePosition = SceneVector3;

export type SceneCamera = Static<typeof SceneCameraSchema>;
export type SceneLight = Static<typeof SceneLightSchema>;
export type SceneDepthOptions = Static<typeof SceneDepthOptionsSchema>;
export type SceneTransform = Static<typeof SceneTransformSchema>;
export type SceneTerrain = Static<typeof SceneTerrainSchema>;
export type SceneSource = Static<typeof SceneSourceSchema>;
export type SceneLayer = Static<typeof SceneLayerSchema>;
export type SceneSnapshotOptions = Static<typeof SceneSnapshotOptionsSchema>;
export type SceneResourcePolicy = Static<typeof SceneResourcePolicySchema>;
export type SceneView3DExtension = Static<typeof SceneView3DExtensionSchema>;

// ---------------------------------------------------------------------------
// Command types
// MapCommand union is schema-derived; individual command interfaces are
// hand-written for backward compatibility (schemas are not separately exported).
// ---------------------------------------------------------------------------

export type MapCommand = Static<typeof MapCommandSchema>;

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

// ---------------------------------------------------------------------------
// Runtime types (no corresponding schema — kept hand-written)
// ---------------------------------------------------------------------------

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

export type CapabilityReport = Static<typeof CapabilityReportSchema>;

/**
 * Hand-written: differs from SceneSnapshotOptions (which lacks targetLayers and "jpeg" format).
 * This is the 2D snapshot API type; SceneSnapshotOptions is the 3D extension type.
 */
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
