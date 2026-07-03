[**@gis-engine/ai v1.4.0**](../index.md)

***

# Variable: SnapshotSpecToolResultSchema

> `const` **SnapshotSpecToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.passed

> `readonly` **passed**: `object`

#### properties.passed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<`"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\<`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`\>[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: `TUnion`\<\[..., ..., ..., ..., ..., ...\]\>; `id`: `TOptional`\&lt;`TString`\&gt;; `path`: `TOptional`\&lt;`TString`\&gt;; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `confidence`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `message`: `TString`; `patch`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `command`: `TOptional`\&lt;`TUnknown`\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

#### properties.dataUrl

> `readonly` **dataUrl**: `object`

#### properties.dataUrl.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.renderer

> `readonly` **renderer**: `object`

#### properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.validation

> `readonly` **validation**: `object` = `ValidationReportSchema`

#### properties.validation.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.validation.properties

> `readonly` **properties**: `object`

#### properties.validation.properties.valid

> `readonly` **valid**: `object`

#### properties.validation.properties.valid.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.validation.properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.validation.properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.validation.properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ...\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\&lt;...\&gt;[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: ...; `id`: ...; `path`: ...; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\&lt;...\&gt;; `confidence`: `TUnion`\&lt;...\&gt;; `message`: `TString`; `patch`: `TOptional`\&lt;...\&gt;; `command`: `TOptional`\&lt;...\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

#### properties.validation.properties.stats

> `readonly` **stats**: `object`

#### properties.validation.properties.stats.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.validation.properties.stats.properties

> `readonly` **properties**: `object`

#### properties.validation.properties.stats.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.validation.properties.stats.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.stats.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.validation.properties.stats.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.stats.properties.visibleLayerCount

> `readonly` **visibleLayerCount**: `object`

#### properties.validation.properties.stats.properties.visibleLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.stats.required

> `readonly` **required**: readonly \[`"sourceCount"`, `"layerCount"`, `"visibleLayerCount"`\]

#### properties.validation.properties.stats.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.validation.required

> `readonly` **required**: readonly \[`"valid"`, `"diagnostics"`, `"stats"`\]

#### properties.validation.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"passed"`, `"diagnostics"`, `"renderer"`, `"validation"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
