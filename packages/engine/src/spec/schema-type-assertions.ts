/**
 * Compile-time type assertions ensuring types.ts exports remain consistent
 * with TypeBox schema definitions.
 *
 * For schema-derived types (e.g. MapSpec = Static<typeof MapSpecSchema>),
 * the assertions verify identity with the `*FromSchema` aliases exported
 * by the schema modules.
 *
 * For hand-written types (e.g. AddSourceCommand, GeoJsonSourceSpec), the
 * assertions verify structural compatibility with the corresponding
 * schema-derived union types so that consumers can use either interchangeably.
 */
import type {
  AddLayerCommand,
  AddSourceCommand,
  GeoJsonSourceSpec,
  MapCommand,
  MapSpec,
  PmtilesSourceSpec,
  RasterSourceSpec,
  RemoveLayerCommand,
  RemoveSourceCommand,
  SceneView3DExtension,
  SourceSpec,
  VectorTileSourceSpec,
  VectorUrlSourceSpec,
} from "../types.js";
import type { MapCommandFromSchema } from "./schemas/command.schema.js";
import type { CapabilityReportFromSchema, MapSpecFromSchema } from "./schemas/map-spec.schema.js";
import type { SceneView3DExtensionFromSchema } from "./schemas/sceneview3d.schema.js";

type Assert<T extends true> = T;
type IsAssignable<From, To> = [From] extends [To] ? true : false;

// --- Schema-derived type identity assertions ---
// These are trivially true now that types.ts uses Static<typeof>,
// but they guard against future regressions (e.g. someone replacing
// a Static<typeof> with a hand-written copy).

type _MapSpecSchemaIsPublicType = Assert<IsAssignable<MapSpecFromSchema, MapSpec>>;
type _MapSpecPublicTypeIsSchema = Assert<IsAssignable<MapSpec, MapSpecFromSchema>>;
type _MapCommandSchemaIsPublicType = Assert<IsAssignable<MapCommandFromSchema, MapCommand>>;
type _MapCommandPublicTypeIsSchema = Assert<IsAssignable<MapCommand, MapCommandFromSchema>>;
type _CapabilityReportSchemaIsPublicType = Assert<IsAssignable<CapabilityReportFromSchema, CapabilityReport>>;
type _CapabilityReportPublicTypeIsSchema = Assert<IsAssignable<CapabilityReport, CapabilityReportFromSchema>>;
type _SceneView3DSchemaIsPublicType = Assert<IsAssignable<SceneView3DExtensionFromSchema, SceneView3DExtension>>;
type _SceneView3DPublicTypeIsSchema = Assert<IsAssignable<SceneView3DExtension, SceneView3DExtensionFromSchema>>;

// --- Hand-written command type compatibility assertions ---
// Verify that individual hand-written command interfaces remain assignable
// to the schema-derived MapCommand union.

type _AddSourceCommandIsMapCommand = Assert<IsAssignable<AddSourceCommand, MapCommand>>;
type _RemoveSourceCommandIsMapCommand = Assert<IsAssignable<RemoveSourceCommand, MapCommand>>;
type _AddLayerCommandIsMapCommand = Assert<IsAssignable<AddLayerCommand, MapCommand>>;
type _RemoveLayerCommandIsMapCommand = Assert<IsAssignable<RemoveLayerCommand, MapCommand>>;

// --- Hand-written source spec compatibility assertions ---
// Verify that individual hand-written source types remain assignable
// to the schema-derived SourceSpec union.

type _GeoJsonSourceIsSourceSpec = Assert<IsAssignable<GeoJsonSourceSpec, SourceSpec>>;
type _RasterSourceIsSourceSpec = Assert<IsAssignable<RasterSourceSpec, SourceSpec>>;
type _PmtilesSourceIsSourceSpec = Assert<IsAssignable<PmtilesSourceSpec, SourceSpec>>;
type _VectorTileSourceIsSourceSpec = Assert<IsAssignable<VectorTileSourceSpec, SourceSpec>>;
type _VectorUrlSourceIsSourceSpec = Assert<IsAssignable<VectorUrlSourceSpec, SourceSpec>>;

export type SchemaTypeAssertions = {
  // Schema-derived identity
  mapSpecSchemaIsPublicType: _MapSpecSchemaIsPublicType;
  mapSpecPublicTypeIsSchema: _MapSpecPublicTypeIsSchema;
  mapCommandSchemaIsPublicType: _MapCommandSchemaIsPublicType;
  mapCommandPublicTypeIsSchema: _MapCommandPublicTypeIsSchema;
  capabilityReportSchemaIsPublicType: _CapabilityReportSchemaIsPublicType;
  capabilityReportPublicTypeIsSchema: _CapabilityReportPublicTypeIsSchema;
  sceneView3dSchemaIsPublicType: _SceneView3DSchemaIsPublicType;
  sceneView3dPublicTypeIsSchema: _SceneView3DPublicTypeIsSchema;
  // Hand-written command compatibility
  addSourceCommandIsMapCommand: _AddSourceCommandIsMapCommand;
  removeSourceCommandIsMapCommand: _RemoveSourceCommandIsMapCommand;
  addLayerCommandIsMapCommand: _AddLayerCommandIsMapCommand;
  removeLayerCommandIsMapCommand: _RemoveLayerCommandIsMapCommand;
  // Hand-written source spec compatibility
  geoJsonSourceIsSourceSpec: _GeoJsonSourceIsSourceSpec;
  rasterSourceIsSourceSpec: _RasterSourceIsSourceSpec;
  pmtilesSourceIsSourceSpec: _PmtilesSourceIsSourceSpec;
  vectorTileSourceIsSourceSpec: _VectorTileSourceIsSourceSpec;
  vectorUrlSourceIsSourceSpec: _VectorUrlSourceIsSourceSpec;
};
