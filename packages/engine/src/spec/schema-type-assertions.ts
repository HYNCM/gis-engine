import type { CapabilityReport, MapCommand, MapSpec, SceneView3DExtension } from "../types.js";
import type { MapCommandFromSchema } from "./schemas/command.schema.js";
import type { CapabilityReportFromSchema, MapSpecFromSchema } from "./schemas/map-spec.schema.js";
import type { SceneView3DExtensionFromSchema } from "./schemas/sceneview3d.schema.js";

type Assert<T extends true> = T;
type IsAssignable<From, To> = [From] extends [To] ? true : false;

type _MapSpecSchemaIsPublicType = Assert<IsAssignable<MapSpecFromSchema, MapSpec>>;
type _MapSpecPublicTypeIsSchema = Assert<IsAssignable<MapSpec, MapSpecFromSchema>>;
type _MapCommandSchemaIsPublicType = Assert<IsAssignable<MapCommandFromSchema, MapCommand>>;
type _MapCommandPublicTypeIsSchema = Assert<IsAssignable<MapCommand, MapCommandFromSchema>>;
type _CapabilityReportSchemaIsPublicType = Assert<IsAssignable<CapabilityReportFromSchema, CapabilityReport>>;
type _CapabilityReportPublicTypeIsSchema = Assert<IsAssignable<CapabilityReport, CapabilityReportFromSchema>>;
type _SceneView3DSchemaIsPublicType = Assert<IsAssignable<SceneView3DExtensionFromSchema, SceneView3DExtension>>;
type _SceneView3DPublicTypeIsSchema = Assert<IsAssignable<SceneView3DExtension, SceneView3DExtensionFromSchema>>;

export type SchemaTypeAssertions = {
  mapSpecSchemaIsPublicType: _MapSpecSchemaIsPublicType;
  mapSpecPublicTypeIsSchema: _MapSpecPublicTypeIsSchema;
  mapCommandSchemaIsPublicType: _MapCommandSchemaIsPublicType;
  mapCommandPublicTypeIsSchema: _MapCommandPublicTypeIsSchema;
  capabilityReportSchemaIsPublicType: _CapabilityReportSchemaIsPublicType;
  capabilityReportPublicTypeIsSchema: _CapabilityReportPublicTypeIsSchema;
  sceneView3dSchemaIsPublicType: _SceneView3DSchemaIsPublicType;
  sceneView3dPublicTypeIsSchema: _SceneView3DPublicTypeIsSchema;
};
