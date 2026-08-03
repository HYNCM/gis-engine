[**@gis-engine/engine v1.4.0**](../index.md)

***

# Interface: SymbolLayerSpec

Symbol layer type — full-featured text labels and icons.
Provides schema-validated layout and paint properties,
replacing `symbol-lite` (which is retained for backward compatibility).

## Properties

### id

> **id**: `string`

***

### type

> **type**: `"symbol"`

***

### source

> **source**: `string`

***

### layout?

> `optional` **layout?**: `object`

#### Index Signature

\[`key`: `string`\]: `unknown`

#### text-field?

> `optional` **text-field?**: `unknown`

#### icon-image?

> `optional` **icon-image?**: `unknown`

#### symbol-placement?

> `optional` **symbol-placement?**: `"line"` \| `"point"` \| `"line-center"`

#### symbol-spacing?

> `optional` **symbol-spacing?**: `unknown`

#### text-font?

> `optional` **text-font?**: `string`[]

#### text-size?

> `optional` **text-size?**: `unknown`

#### text-anchor?

> `optional` **text-anchor?**: `"center"` \| `"left"` \| `"right"` \| `"top"` \| `"bottom"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

#### text-offset?

> `optional` **text-offset?**: `unknown`[]

#### text-max-width?

> `optional` **text-max-width?**: `unknown`

#### text-line-height?

> `optional` **text-line-height?**: `unknown`

#### text-letter-spacing?

> `optional` **text-letter-spacing?**: `unknown`

#### text-justify?

> `optional` **text-justify?**: `"center"` \| `"left"` \| `"right"` \| `"auto"`

#### text-transform?

> `optional` **text-transform?**: `"none"` \| `"uppercase"` \| `"lowercase"`

#### icon-size?

> `optional` **icon-size?**: `unknown`

#### icon-anchor?

> `optional` **icon-anchor?**: `"center"` \| `"left"` \| `"right"` \| `"top"` \| `"bottom"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

#### icon-rotate?

> `optional` **icon-rotate?**: `unknown`

#### icon-allow-overlap?

> `optional` **icon-allow-overlap?**: `unknown`

#### text-allow-overlap?

> `optional` **text-allow-overlap?**: `unknown`

#### symbol-sort-key?

> `optional` **symbol-sort-key?**: `unknown`

***

### paint?

> `optional` **paint?**: `object`

#### Index Signature

\[`key`: `string`\]: `unknown`

#### text-color?

> `optional` **text-color?**: `unknown`

#### text-halo-color?

> `optional` **text-halo-color?**: `unknown`

#### text-halo-width?

> `optional` **text-halo-width?**: `unknown`

#### text-halo-blur?

> `optional` **text-halo-blur?**: `unknown`

#### text-opacity?

> `optional` **text-opacity?**: `unknown`

#### icon-opacity?

> `optional` **icon-opacity?**: `unknown`

#### icon-color?

> `optional` **icon-color?**: `unknown`

#### icon-halo-color?

> `optional` **icon-halo-color?**: `unknown`

#### icon-halo-width?

> `optional` **icon-halo-width?**: `unknown`

#### icon-halo-blur?

> `optional` **icon-halo-blur?**: `unknown`

***

### filter?

> `optional` **filter?**: [`Expression`](../type-aliases/Expression.md)

***

### minzoom?

> `optional` **minzoom?**: `number`

***

### maxzoom?

> `optional` **maxzoom?**: `number`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>
