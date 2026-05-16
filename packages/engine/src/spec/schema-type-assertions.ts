import type { MapCommand, MapSpec } from "../types.js";
import type { MapCommandFromSchema } from "./schemas/command.schema.js";
import type { MapSpecFromSchema } from "./schemas/map-spec.schema.js";

type Assert<T extends true> = T;
type IsAssignable<From, To> = [From] extends [To] ? true : false;

type _MapSpecSchemaIsPublicType = Assert<IsAssignable<MapSpecFromSchema, MapSpec>>;
type _MapSpecPublicTypeIsSchema = Assert<IsAssignable<MapSpec, MapSpecFromSchema>>;
type _MapCommandSchemaIsPublicType = Assert<IsAssignable<MapCommandFromSchema, MapCommand>>;
type _MapCommandPublicTypeIsSchema = Assert<IsAssignable<MapCommand, MapCommandFromSchema>>;

export type SchemaTypeAssertions = {
  mapSpecSchemaIsPublicType: _MapSpecSchemaIsPublicType;
  mapSpecPublicTypeIsSchema: _MapSpecPublicTypeIsSchema;
  mapCommandSchemaIsPublicType: _MapCommandSchemaIsPublicType;
  mapCommandPublicTypeIsSchema: _MapCommandPublicTypeIsSchema;
};
