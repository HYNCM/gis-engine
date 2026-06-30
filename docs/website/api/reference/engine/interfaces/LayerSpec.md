[**@gis-engine/engine v1.2.0**](../index.md)

***

# Interface: LayerSpec

## Properties

### id

> **id**: `string`

***

### type

> **type**: `"raster"` \| `"background"` \| `"fill"` \| `"line"` \| `"circle"` \| `"symbol-lite"` \| `"fill-extrusion-lite"`

***

### source?

> `optional` **source?**: `string`

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

### layout?

> `optional` **layout?**: `Record`\<`string`, `unknown`\>

***

### paint?

> `optional` **paint?**: `Record`\<`string`, `unknown`\>

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>
