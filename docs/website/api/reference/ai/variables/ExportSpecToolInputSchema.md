[**@gis-engine/ai v1.0.0**](../index.md)

***

# Variable: ExportSpecToolInputSchema

> `const` **ExportSpecToolInputSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.spec

> `readonly` **spec**: `TObject`\<\{ `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `id`: `TOptional`\&lt;`TString`\&gt;; `revision`: `TOptional`\&lt;`TString`\&gt;; `capabilities`: `TOptional`\<`TObject`\<\{ `dimensions`: `TOptional`\<`TArray`\<`TUnion`\<\[..., ..., ...\]\>\>\>; `renderer`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>\>; `experimental`: `TOptional`\<`TArray`\&lt;`TString`\&gt;\>; \}\>\>; `view`: `TObject`\<\{ `mode`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;`"map2d"`\&gt;, `TLiteral`\&lt;`"map2_5d"`\&gt;, `TLiteral`\&lt;`"scene3d"`\&gt;\]\>\>; `center`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`\]\>\>; `zoom`: `TOptional`\&lt;`TNumber`\&gt;; `bearing`: `TOptional`\&lt;`TNumber`\&gt;; `pitch`: `TOptional`\&lt;`TNumber`\&gt;; `bounds`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\>; \}\>; `sources`: `TRecord`\<`TString`, `TUnion`\<\[`TObject`\<\{ `type`: `TLiteral`\&lt;`"geojson"`\&gt;; `data`: `TUnion`\<\[..., ...\]\>; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"raster"`\&gt;; `tiles`: `TArray`\&lt;`TString`\&gt;; `tileSize`: `TOptional`\&lt;`TNumber`\&gt;; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"pmtiles"`\&gt;; `url`: `TString`; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"flatgeobuf"`\&gt;; `url`: `TString`; `hasIndex`: `TOptional`\&lt;`TBoolean`\&gt;; `featureCount`: `TOptional`\&lt;`TInteger`\&gt;; `bbox`: `TOptional`\<`TTuple`\&lt;...\&gt;\>; `geometryType`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `fileBytes`: `TOptional`\&lt;`TInteger`\&gt;; \}\>\]\>\>; `layers`: `TArray`\<`TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[`TLiteral`\&lt;`"background"`\&gt;, `TLiteral`\&lt;`"raster"`\&gt;, `TLiteral`\&lt;`"fill"`\&gt;, `TLiteral`\&lt;`"line"`\&gt;, `TLiteral`\&lt;`"circle"`\&gt;, `TLiteral`\&lt;`"symbol-lite"`\&gt;, `TLiteral`\&lt;`"fill-extrusion-lite"`\&gt;\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;`Expression`\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `paint`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\>\>; `interactions`: `TOptional`\<`TObject`\<\{ `pan`: `TOptional`\&lt;`TBoolean`\&gt;; `zoom`: `TOptional`\&lt;`TBoolean`\&gt;; `hover`: `TOptional`\&lt;`TBoolean`\&gt;; `click`: `TOptional`\&lt;`TBoolean`\&gt;; `select`: `TOptional`\&lt;`TBoolean`\&gt;; `popup`: `TOptional`\&lt;`TBoolean`\&gt;; \}\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `extensions`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\> = `MapSpecSchema`

#### properties.commands

> `readonly` **commands**: `object`

#### properties.commands.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.commands.items

> `readonly` **items**: `TUnion`\<\[`TObject`\<\{ `id`: `TString`; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `source`: `TUnion`\<\[`TObject`\<\{ `type`: ...; `data`: ...; \}\>, `TObject`\<\{ `type`: ...; `tiles`: ...; `tileSize`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `hasIndex`: ...; `featureCount`: ...; `bbox`: ...; `geometryType`: ...; `fileBytes`: ...; \}\>\]\>; `type`: `TLiteral`\&lt;`"addSource"`\&gt;; `sourceId`: `TString`; \}\>, `TObject`\<\{ `id`: `TString`; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"removeSource"`\&gt;; `sourceId`: `TString`; \}\>, `TObject`\<\{ `id`: `TString`; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `author`: `TOptional`\<`TObject`\<\{ `type`: `TUnion`\&lt;...\&gt;; `id`: `TOptional`\&lt;...\&gt;; `name`: `TOptional`\&lt;...\&gt;; \}\>\>; `reason`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"addLayer"`\&gt;; `layer`: `TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[..., ..., ..., ..., ..., ..., ...\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;...\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<..., ...\>\>; `paint`: `TOptional`\<`TRecord`\<..., ...\>\>; `metadata`: `TOptional`\<`TRecord`\<..., ...\>\>; \}\>; `beforeLayerId`: `TOptional`\&lt;`TString`\&gt;; \}\>\]\> = `MapCommandSchema`

#### properties.dryRun

> `readonly` **dryRun**: `object`

#### properties.dryRun.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.transaction

> `readonly` **transaction**: `object`

#### properties.transaction.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.transaction.enum

> `readonly` **enum**: readonly \[`"atomic"`, `"best-effort"`\]

#### properties.traceId

> `readonly` **traceId**: `object`

#### properties.traceId.type

> `readonly` **type**: `"string"` = `"string"`

### required

> `readonly` **required**: readonly \[`"spec"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
