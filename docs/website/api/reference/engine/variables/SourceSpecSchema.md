[**@gis-engine/engine v1.2.0**](../index.md)

***

# Variable: SourceSpecSchema

> `const` **SourceSpecSchema**: `TUnion`\<\[`TObject`\<\{ `type`: `TLiteral`\&lt;`"geojson"`\&gt;; `data`: `TUnion`\<\[`TUnknown`, `TString`\]\>; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"raster"`\&gt;; `tiles`: `TArray`\&lt;`TString`\&gt;; `tileSize`: `TOptional`\&lt;`TNumber`\&gt;; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"pmtiles"`\&gt;; `url`: `TString`; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"flatgeobuf"`\&gt;; `url`: `TString`; `hasIndex`: `TOptional`\&lt;`TBoolean`\&gt;; `featureCount`: `TOptional`\&lt;`TInteger`\&gt;; `bbox`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\>; `geometryType`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;`"Point"`\&gt;, `TLiteral`\&lt;`"LineString"`\&gt;, `TLiteral`\&lt;`"Polygon"`\&gt;, `TLiteral`\&lt;`"MultiPoint"`\&gt;, `TLiteral`\&lt;`"MultiLineString"`\&gt;, `TLiteral`\&lt;`"MultiPolygon"`\&gt;\]\>\>; `fileBytes`: `TOptional`\&lt;`TInteger`\&gt;; \}\>\]\>
