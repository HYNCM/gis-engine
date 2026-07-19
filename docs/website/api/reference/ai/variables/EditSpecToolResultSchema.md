[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: EditSpecToolResultSchema

> `const` **EditSpecToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.spec

> `readonly` **spec**: `TObject`\<\{ `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `id`: `TOptional`\&lt;`TString`\&gt;; `revision`: `TOptional`\&lt;`TString`\&gt;; `capabilities`: `TOptional`\<`TObject`\<\{ `dimensions`: `TOptional`\<`TArray`\<`TUnion`\<\[..., ..., ...\]\>\>\>; `renderer`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>\>; `experimental`: `TOptional`\<`TArray`\&lt;`TString`\&gt;\>; \}\>\>; `view`: `TObject`\<\{ `mode`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;`"map2d"`\&gt;, `TLiteral`\&lt;`"map2_5d"`\&gt;, `TLiteral`\&lt;`"scene3d"`\&gt;\]\>\>; `center`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`\]\>\>; `zoom`: `TOptional`\&lt;`TNumber`\&gt;; `bearing`: `TOptional`\&lt;`TNumber`\&gt;; `pitch`: `TOptional`\&lt;`TNumber`\&gt;; `bounds`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\>; \}\>; `sources`: `TRecord`\<`TString`, `TUnion`\<\[`TObject`\<\{ `type`: `TLiteral`\&lt;`"geojson"`\&gt;; `data`: `TUnion`\<\[..., ...\]\>; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"raster"`\&gt;; `tiles`: `TArray`\&lt;`TString`\&gt;; `tileSize`: `TOptional`\&lt;`TNumber`\&gt;; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"pmtiles"`\&gt;; `url`: `TString`; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"flatgeobuf"`\&gt;; `url`: `TString`; `hasIndex`: `TOptional`\&lt;`TBoolean`\&gt;; `featureCount`: `TOptional`\&lt;`TInteger`\&gt;; `bbox`: `TOptional`\<`TTuple`\&lt;...\&gt;\>; `geometryType`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `fileBytes`: `TOptional`\&lt;`TInteger`\&gt;; \}\>\]\>\>; `layers`: `TArray`\<`TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[`TLiteral`\&lt;`"background"`\&gt;, `TLiteral`\&lt;`"raster"`\&gt;, `TLiteral`\&lt;`"fill"`\&gt;, `TLiteral`\&lt;`"line"`\&gt;, `TLiteral`\&lt;`"circle"`\&gt;, `TLiteral`\&lt;`"symbol"`\&gt;, `TLiteral`\&lt;`"symbol-lite"`\&gt;, `TLiteral`\&lt;`"fill-extrusion-lite"`\&gt;, `TLiteral`\&lt;`"heatmap"`\&gt;\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;`Expression`\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `paint`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\>\>; `interactions`: `TOptional`\<`TObject`\<\{ `pan`: `TOptional`\&lt;`TBoolean`\&gt;; `zoom`: `TOptional`\&lt;`TBoolean`\&gt;; `hover`: `TOptional`\&lt;`TBoolean`\&gt;; `click`: `TOptional`\&lt;`TBoolean`\&gt;; `select`: `TOptional`\&lt;`TBoolean`\&gt;; `popup`: `TOptional`\&lt;`TBoolean`\&gt;; \}\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `extensions`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\> = `MapSpecSchema`

#### properties.commands

> `readonly` **commands**: `object`

#### properties.commands.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.commands.items

> `readonly` **items**: `TUnion`\<\[`TObject`\<\{ `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"addSource"`\&gt;; `source`: `TUnion`\<\[`TObject`\<\{ `type`: ...; `data`: ...; \}\>, `TObject`\<\{ `type`: ...; `tiles`: ...; `tileSize`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `hasIndex`: ...; `featureCount`: ...; `bbox`: ...; `geometryType`: ...; `fileBytes`: ...; \}\>\]\>; `sourceId`: `TString`; \}\>, `TObject`\<\{ `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"removeSource"`\&gt;; `sourceId`: `TString`; \}\>, `TObject`\<\{ `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"addLayer"`\&gt;; `layer`: `TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[..., ..., ..., ..., ..., ..., ..., ..., ...\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;...\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<..., ...\>\>; `paint`: `TOptional`\<`TRecord`\<..., ...\>\>; `metadata`: `TOptional`\<`TRecord`\<..., ...\>\>; \}\>; `beforeLayerId`: `TOptional`\&lt;`TString`\&gt;; \}\>\]\> = `MapCommandSchema`

#### properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<`"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\<`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`\>[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: `TUnion`\<\[..., ..., ..., ..., ..., ...\]\>; `id`: `TOptional`\&lt;`TString`\&gt;; `path`: `TOptional`\&lt;`TString`\&gt;; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `confidence`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `message`: `TString`; `patch`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `command`: `TOptional`\&lt;`TUnknown`\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

#### properties.summary

> `readonly` **summary**: `object`

#### properties.summary.type

> `readonly` **type**: `"string"` = `"string"`

### required

> `readonly` **required**: readonly \[`"spec"`, `"commands"`, `"diagnostics"`, `"summary"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
