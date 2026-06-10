[**@gis-engine/engine v1.0.0**](../index.md)

***

# Variable: SceneSourceSchema

> `const` **SceneSourceSchema**: `TUnion`\<\[`TObject`\<\{ `type`: `TLiteral`\&lt;`"terrain-raster-dem"`\&gt;; `url`: `TString`; `encoding`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;`"mapbox"`\&gt;, `TLiteral`\&lt;`"terrarium"`\&gt;\]\>\>; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"3d-tiles"`\&gt;; `url`: `TString`; `maximumScreenSpaceError`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"gltf"`\&gt;; `url`: `TString`; `transform`: `TOptional`\<`TObject`\<\{ `translate`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`\]\>\>; `rotate`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`\]\>\>; `scale`: `TOptional`\<`TUnion`\<\[`TNumber`, `TTuple`\&lt;...\&gt;\]\>\>; \}\>\>; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>\]\>
