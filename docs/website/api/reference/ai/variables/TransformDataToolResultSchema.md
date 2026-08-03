[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: TransformDataToolResultSchema

> `const` **TransformDataToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.operationCount

> `readonly` **operationCount**: `object`

#### properties.operationCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.inputFeatureCount

> `readonly` **inputFeatureCount**: `object`

#### properties.inputFeatureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.outputFeatureCount

> `readonly` **outputFeatureCount**: `object`

#### properties.outputFeatureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.output

> `readonly` **output**: `object`

#### properties.output.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.output.properties

> `readonly` **properties**: `object`

#### properties.output.properties.type

> `readonly` **type**: `object`

#### properties.output.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.output.properties.features

> `readonly` **features**: `object`

#### properties.output.properties.features.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.output.required

> `readonly` **required**: readonly \[`"type"`, `"features"`\]

#### properties.output.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.aggregations

> `readonly` **aggregations**: `object`

#### properties.aggregations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.aggregations.items

> `readonly` **items**: `object`

#### properties.aggregations.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.aggregations.items.properties

> `readonly` **properties**: `object`

#### properties.aggregations.items.properties.groupBy

> `readonly` **groupBy**: `object`

#### properties.aggregations.items.properties.groupBy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.aggregations.items.properties.aggregation

> `readonly` **aggregation**: `object`

#### properties.aggregations.items.properties.aggregation.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.aggregations.items.properties.property

> `readonly` **property**: `object`

#### properties.aggregations.items.properties.property.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.aggregations.items.properties.groups

> `readonly` **groups**: `object`

#### properties.aggregations.items.properties.groups.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.aggregations.items.properties.groups.items

> `readonly` **items**: `object`

#### properties.aggregations.items.properties.groups.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.aggregations.items.properties.groups.items.properties

> `readonly` **properties**: `object`

#### properties.aggregations.items.properties.groups.items.properties.key

> `readonly` **key**: `object`

#### properties.aggregations.items.properties.groups.items.properties.key.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.aggregations.items.properties.groups.items.properties.value

> `readonly` **value**: `object`

#### properties.aggregations.items.properties.groups.items.properties.value.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.aggregations.items.properties.groups.items.properties.count

> `readonly` **count**: `object`

#### properties.aggregations.items.properties.groups.items.properties.count.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.aggregations.items.properties.groups.items.required

> `readonly` **required**: readonly \[`"key"`, `"value"`, `"count"`\]

#### properties.aggregations.items.properties.groups.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.aggregations.items.required

> `readonly` **required**: readonly \[`"groupBy"`, `"aggregation"`, `"groups"`\]

#### properties.aggregations.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<`"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\<`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`\>[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: `TUnion`\<\[..., ..., ..., ..., ..., ...\]\>; `id`: `TOptional`\&lt;`TString`\&gt;; `path`: `TOptional`\&lt;`TString`\&gt;; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `confidence`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `message`: `TString`; `patch`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `command`: `TOptional`\&lt;`TUnknown`\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

### required

> `readonly` **required**: readonly \[`"operationCount"`, `"inputFeatureCount"`, `"outputFeatureCount"`, `"output"`, `"diagnostics"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
