[**@gis-engine/engine v1.5.0**](../index.md)

***

# Variable: GeoParquetSourceSchema

> `const` **GeoParquetSourceSchema**: `TObject`\<\{ `type`: `TLiteral`\&lt;`"geoparquet"`\&gt;; `url`: `TString`; `metadata`: `TUnion`\<\[`TObject`\<\{ `releaseIdentity`: `TLiteral`\&lt;`"1.1.0"`\&gt;; `geoVersion`: `TLiteral`\&lt;`"1.1.0"`\&gt;; `encoding`: `TUnion`\<\[`TLiteral`\&lt;`"WKB"`\&gt;, `TLiteral`\&lt;`"point"`\&gt;, `TLiteral`\&lt;`"linestring"`\&gt;, `TLiteral`\&lt;`"polygon"`\&gt;, `TLiteral`\&lt;`"multipoint"`\&gt;, `TLiteral`\&lt;`"multilinestring"`\&gt;, `TLiteral`\&lt;`"multipolygon"`\&gt;\]\>; `crs`: `TOptional`\<`TUnion`\<\[`TObject`\<\{ `$schema`: ...; `type`: ...; `name`: ...; \}\>, `TNull`\]\>\>; `bbox`: `TOptional`\<`TUnion`\<\[`TTuple`\<\[..., ..., ..., ...\]\>, `TTuple`\<\[..., ..., ..., ..., ..., ...\]\>\]\>\>; `covering`: `TOptional`\<`TObject`\<\{ `bbox`: `TObject`\<\{ `xmin`: ...; `xmax`: ...; `ymin`: ...; `ymax`: ...; \}\>; \}\>\>; \}\>, `TObject`\<\{ `releaseIdentity`: `TLiteral`\&lt;`"2.0.0-rc.1"`\&gt;; `geoVersion`: `TLiteral`\&lt;`"2.0.0"`\&gt;; `encoding`: `TLiteral`\&lt;`"WKB"`\&gt;; `logicalType`: `TUnion`\<\[`TLiteral`\&lt;`"GEOMETRY"`\&gt;, `TLiteral`\&lt;`"GEOGRAPHY"`\&gt;\]\>; `crs`: `TOptional`\<`TUnion`\<\[`TObject`\<\{ `$schema`: ...; `type`: ...; `name`: ...; \}\>, `TNull`\]\>\>; `bbox`: `TOptional`\<`TUnion`\<\[`TTuple`\<\[..., ..., ..., ...\]\>, `TTuple`\<\[..., ..., ..., ..., ..., ...\]\>, `TTuple`\<\[..., ..., ..., ..., ..., ..., ..., ...\]\>\]\>\>; `rowGroupStatistics`: `TObject`\<\{ `bbox`: `TLiteral`\&lt;`true`\&gt;; `geometryTypes`: `TLiteral`\&lt;`true`\&gt;; \}\>; \}\>\]\>; `rowCount`: `TOptional`\&lt;`TInteger`\&gt;; `fileBytes`: `TOptional`\&lt;`TInteger`\&gt;; \}\>

Version-aware GeoParquet metadata-readiness contract.
Runtime loading/query remains blocked; this schema never implies parser support.
