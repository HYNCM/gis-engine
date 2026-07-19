[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: EditSpecToolInputSchema

> `const` **EditSpecToolInputSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.spec

> `readonly` **spec**: `TObject`\<\{ `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `id`: `TOptional`\&lt;`TString`\&gt;; `revision`: `TOptional`\&lt;`TString`\&gt;; `capabilities`: `TOptional`\<`TObject`\<\{ `dimensions`: `TOptional`\<`TArray`\<`TUnion`\<\[..., ..., ...\]\>\>\>; `renderer`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>\>; `experimental`: `TOptional`\<`TArray`\&lt;`TString`\&gt;\>; \}\>\>; `view`: `TObject`\<\{ `mode`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;`"map2d"`\&gt;, `TLiteral`\&lt;`"map2_5d"`\&gt;, `TLiteral`\&lt;`"scene3d"`\&gt;\]\>\>; `center`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`\]\>\>; `zoom`: `TOptional`\&lt;`TNumber`\&gt;; `bearing`: `TOptional`\&lt;`TNumber`\&gt;; `pitch`: `TOptional`\&lt;`TNumber`\&gt;; `bounds`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\>; \}\>; `sources`: `TRecord`\<`TString`, `TUnion`\<\[`TObject`\<\{ `type`: `TLiteral`\&lt;`"geojson"`\&gt;; `data`: `TUnion`\<\[..., ...\]\>; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"raster"`\&gt;; `tiles`: `TArray`\&lt;`TString`\&gt;; `tileSize`: `TOptional`\&lt;`TNumber`\&gt;; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"pmtiles"`\&gt;; `url`: `TString`; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"flatgeobuf"`\&gt;; `url`: `TString`; `hasIndex`: `TOptional`\&lt;`TBoolean`\&gt;; `featureCount`: `TOptional`\&lt;`TInteger`\&gt;; `bbox`: `TOptional`\<`TTuple`\&lt;...\&gt;\>; `geometryType`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `fileBytes`: `TOptional`\&lt;`TInteger`\&gt;; \}\>\]\>\>; `layers`: `TArray`\<`TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[`TLiteral`\&lt;`"background"`\&gt;, `TLiteral`\&lt;`"raster"`\&gt;, `TLiteral`\&lt;`"fill"`\&gt;, `TLiteral`\&lt;`"line"`\&gt;, `TLiteral`\&lt;`"circle"`\&gt;, `TLiteral`\&lt;`"symbol"`\&gt;, `TLiteral`\&lt;`"symbol-lite"`\&gt;, `TLiteral`\&lt;`"fill-extrusion-lite"`\&gt;, `TLiteral`\&lt;`"heatmap"`\&gt;\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;`Expression`\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `paint`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\>\>; `interactions`: `TOptional`\<`TObject`\<\{ `pan`: `TOptional`\&lt;`TBoolean`\&gt;; `zoom`: `TOptional`\&lt;`TBoolean`\&gt;; `hover`: `TOptional`\&lt;`TBoolean`\&gt;; `click`: `TOptional`\&lt;`TBoolean`\&gt;; `select`: `TOptional`\&lt;`TBoolean`\&gt;; `popup`: `TOptional`\&lt;`TBoolean`\&gt;; \}\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `extensions`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\> = `MapSpecSchema`

#### properties.instruction

> `readonly` **instruction**: `object`

#### properties.instruction.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.instruction.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.instruction.description

> `readonly` **description**: `"Natural language edit instruction"` = `"Natural language edit instruction"`

### required

> `readonly` **required**: readonly \[`"spec"`, `"instruction"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
