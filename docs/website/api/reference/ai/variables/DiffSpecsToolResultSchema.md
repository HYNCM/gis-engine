[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: DiffSpecsToolResultSchema

> `const` **DiffSpecsToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.commands

> `readonly` **commands**: `object`

#### properties.commands.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.commands.items

> `readonly` **items**: `TUnion`\<\[`TObject`\<\{ `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"addSource"`\&gt;; `source`: `TUnion`\<\[`TObject`\<\{ `type`: ...; `data`: ...; \}\>, `TObject`\<\{ `type`: ...; `tiles`: ...; `tileSize`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `hasIndex`: ...; `featureCount`: ...; `bbox`: ...; `geometryType`: ...; `fileBytes`: ...; \}\>\]\>; `sourceId`: `TString`; \}\>, `TObject`\<\{ `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"removeSource"`\&gt;; `sourceId`: `TString`; \}\>, `TObject`\<\{ `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"addLayer"`\&gt;; `layer`: `TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[..., ..., ..., ..., ..., ..., ..., ..., ...\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;...\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<..., ...\>\>; `paint`: `TOptional`\<`TRecord`\<..., ...\>\>; `metadata`: `TOptional`\<`TRecord`\<..., ...\>\>; \}\>; `beforeLayerId`: `TOptional`\&lt;`TString`\&gt;; \}\>\]\> = `MapCommandSchema`

#### properties.summary

> `readonly` **summary**: `object`

#### properties.summary.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.added

> `readonly` **added**: `object`

#### properties.summary.properties.added.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.added.items

> `readonly` **items**: `object`

#### properties.summary.properties.added.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.removed

> `readonly` **removed**: `object`

#### properties.summary.properties.removed.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.removed.items

> `readonly` **items**: `object`

#### properties.summary.properties.removed.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.modified

> `readonly` **modified**: `object`

#### properties.summary.properties.modified.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.modified.items

> `readonly` **items**: `object`

#### properties.summary.properties.modified.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.unchanged

> `readonly` **unchanged**: `object`

#### properties.summary.properties.unchanged.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.unchanged.items

> `readonly` **items**: `object`

#### properties.summary.properties.unchanged.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.required

> `readonly` **required**: readonly \[`"added"`, `"removed"`, `"modified"`, `"unchanged"`\]

#### properties.summary.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<`"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\<`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`\>[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: `TUnion`\<\[..., ..., ..., ..., ..., ...\]\>; `id`: `TOptional`\&lt;`TString`\&gt;; `path`: `TOptional`\&lt;`TString`\&gt;; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `confidence`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `message`: `TString`; `patch`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `command`: `TOptional`\&lt;`TUnknown`\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

### required

> `readonly` **required**: readonly \[`"commands"`, `"summary"`, `"diagnostics"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
