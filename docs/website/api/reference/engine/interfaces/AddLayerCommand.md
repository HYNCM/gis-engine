[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: AddLayerCommand

## Extends

- [`MapCommandBase`](MapCommandBase.md)

## Properties

### id

> **id**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`id`](MapCommandBase.md#id)

***

### version

> **version**: `"0.1"`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`version`](MapCommandBase.md#version)

***

### baseRevision?

> `optional` **baseRevision?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`baseRevision`](MapCommandBase.md#baserevision)

***

### author?

> `optional` **author?**: `object`

#### type

> **type**: `"human"` \| `"agent"` \| `"system"`

#### id?

> `optional` **id?**: `string`

#### name?

> `optional` **name?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`author`](MapCommandBase.md#author)

***

### reason?

> `optional` **reason?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`reason`](MapCommandBase.md#reason)

***

### createdAt?

> `optional` **createdAt?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`createdAt`](MapCommandBase.md#createdat)

***

### sourcePromptHash?

> `optional` **sourcePromptHash?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`sourcePromptHash`](MapCommandBase.md#sourceprompthash)

***

### dryRun?

> `optional` **dryRun?**: `boolean`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`dryRun`](MapCommandBase.md#dryrun)

***

### type

> **type**: `"addLayer"`

#### Overrides

[`MapCommandBase`](MapCommandBase.md).[`type`](MapCommandBase.md#type)

***

### layer

> **layer**: `object`

#### id

> **id**: `string`

#### type

> **type**: `"symbol"` \| `"fill"` \| `"raster"` \| `"background"` \| `"line"` \| `"circle"` \| `"symbol-lite"` \| `"fill-extrusion-lite"` \| `"heatmap"`

#### source?

> `optional` **source?**: `string`

#### filter?

> `optional` **filter?**: [`Expression`](../type-aliases/Expression.md)

#### minzoom?

> `optional` **minzoom?**: `number`

#### maxzoom?

> `optional` **maxzoom?**: `number`

#### layout?

> `optional` **layout?**: `object`

##### Index Signature

\[`key`: `string`\]: `unknown`

#### paint?

> `optional` **paint?**: `object`

##### Index Signature

\[`key`: `string`\]: `unknown`

#### metadata?

> `optional` **metadata?**: `object`

##### Index Signature

\[`key`: `string`\]: `unknown`

***

### beforeLayerId?

> `optional` **beforeLayerId?**: `string`
