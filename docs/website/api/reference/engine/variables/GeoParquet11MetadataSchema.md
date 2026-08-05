[**@gis-engine/engine v1.5.0**](../index.md)

***

# Variable: GeoParquet11MetadataSchema

> `const` **GeoParquet11MetadataSchema**: `TObject`\<\{ `releaseIdentity`: `TLiteral`\&lt;`"1.1.0"`\&gt;; `geoVersion`: `TLiteral`\&lt;`"1.1.0"`\&gt;; `encoding`: `TUnion`\<\[`TLiteral`\&lt;`"WKB"`\&gt;, `TLiteral`\&lt;`"point"`\&gt;, `TLiteral`\&lt;`"linestring"`\&gt;, `TLiteral`\&lt;`"polygon"`\&gt;, `TLiteral`\&lt;`"multipoint"`\&gt;, `TLiteral`\&lt;`"multilinestring"`\&gt;, `TLiteral`\&lt;`"multipolygon"`\&gt;\]\>; `crs`: `TOptional`\<`TUnion`\<\[`TObject`\<\{ `$schema`: `TOptional`\&lt;`TString`\&gt;; `type`: `TUnion`\<`TLiteral`\<... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ...\>[]\>; `name`: `TString`; \}\>, `TNull`\]\>\>; `bbox`: `TOptional`\<`TUnion`\<\[`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>, `TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\]\>\>; `covering`: `TOptional`\<`TObject`\<\{ `bbox`: `TObject`\<\{ `xmin`: `TTuple`\<\[`TString`, `TLiteral`\&lt;`"xmin"`\&gt;\]\>; `xmax`: `TTuple`\<\[`TString`, `TLiteral`\&lt;`"xmax"`\&gt;\]\>; `ymin`: `TTuple`\<\[`TString`, `TLiteral`\&lt;`"ymin"`\&gt;\]\>; `ymax`: `TTuple`\<\[`TString`, `TLiteral`\&lt;`"ymax"`\&gt;\]\>; \}\>; \}\>\>; \}\>
