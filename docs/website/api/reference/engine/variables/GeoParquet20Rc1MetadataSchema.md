[**@gis-engine/engine v1.5.0**](../index.md)

***

# Variable: GeoParquet20Rc1MetadataSchema

> `const` **GeoParquet20Rc1MetadataSchema**: `TObject`\<\{ `releaseIdentity`: `TLiteral`\&lt;`"2.0.0-rc.1"`\&gt;; `geoVersion`: `TLiteral`\&lt;`"2.0.0"`\&gt;; `encoding`: `TLiteral`\&lt;`"WKB"`\&gt;; `logicalType`: `TUnion`\<\[`TLiteral`\&lt;`"GEOMETRY"`\&gt;, `TLiteral`\&lt;`"GEOGRAPHY"`\&gt;\]\>; `crs`: `TOptional`\<`TUnion`\<\[`TObject`\<\{ `$schema`: `TOptional`\&lt;`TString`\&gt;; `type`: `TUnion`\<`TLiteral`\<... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ...\>[]\>; `name`: `TString`; \}\>, `TNull`\]\>\>; `bbox`: `TOptional`\<`TUnion`\<\[`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>, `TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>, `TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`, `TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\]\>\>; `rowGroupStatistics`: `TObject`\<\{ `bbox`: `TLiteral`\&lt;`true`\&gt;; `geometryTypes`: `TLiteral`\&lt;`true`\&gt;; \}\>; \}\>
