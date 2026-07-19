[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: StyleRecommendToolResultSchema

> `const` **StyleRecommendToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.featureCount

> `readonly` **featureCount**: `object`

#### properties.featureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.geometryTypes

> `readonly` **geometryTypes**: `object`

#### properties.geometryTypes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.geometryTypes.items

> `readonly` **items**: `object`

#### properties.geometryTypes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.primaryGeometry

> `readonly` **primaryGeometry**: `object`

#### properties.primaryGeometry.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.numericProperties

> `readonly` **numericProperties**: `object`

#### properties.numericProperties.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.numericProperties.items

> `readonly` **items**: `object`

#### properties.numericProperties.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.categoricalProperties

> `readonly` **categoricalProperties**: `object`

#### properties.categoricalProperties.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.categoricalProperties.items

> `readonly` **items**: `object`

#### properties.categoricalProperties.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.recommendations

> `readonly` **recommendations**: `object`

#### properties.recommendations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.recommendations.items

> `readonly` **items**: `object`

#### properties.recommendations.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.recommendations.items.properties

> `readonly` **properties**: `object`

#### properties.recommendations.items.properties.layerType

> `readonly` **layerType**: `object`

#### properties.recommendations.items.properties.layerType.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.recommendations.items.properties.rationale

> `readonly` **rationale**: `object`

#### properties.recommendations.items.properties.rationale.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.recommendations.items.properties.paint

> `readonly` **paint**: `object`

#### properties.recommendations.items.properties.paint.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.recommendations.items.properties.layout

> `readonly` **layout**: `object`

#### properties.recommendations.items.properties.layout.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.recommendations.items.properties.priority

> `readonly` **priority**: `object`

#### properties.recommendations.items.properties.priority.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.recommendations.items.required

> `readonly` **required**: readonly \[`"layerType"`, `"rationale"`, `"paint"`, `"layout"`, `"priority"`\]

#### properties.recommendations.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<`"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\<`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`\>[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: `TUnion`\<\[..., ..., ..., ..., ..., ...\]\>; `id`: `TOptional`\&lt;`TString`\&gt;; `path`: `TOptional`\&lt;`TString`\&gt;; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `confidence`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `message`: `TString`; `patch`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `command`: `TOptional`\&lt;`TUnknown`\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

### required

> `readonly` **required**: readonly \[`"featureCount"`, `"geometryTypes"`, `"primaryGeometry"`, `"numericProperties"`, `"categoricalProperties"`, `"recommendations"`, `"diagnostics"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
