[**@gis-engine/engine v1.1.0**](../index.md)

***

# Interface: MapSpec

## Properties

### version

> **version**: `"0.1"`

***

### id?

> `optional` **id?**: `string`

***

### revision?

> `optional` **revision?**: `string`

***

### capabilities?

> `optional` **capabilities?**: [`CapabilityRequest`](CapabilityRequest.md)

***

### view

> **view**: [`ViewSpec`](ViewSpec.md)

***

### sources

> **sources**: `Record`\<`string`, [`SourceSpec`](../type-aliases/SourceSpec.md)\>

***

### layers

> **layers**: [`LayerSpec`](LayerSpec.md)[]

***

### interactions?

> `optional` **interactions?**: [`InteractionSpec`](InteractionSpec.md)

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

***

### extensions?

> `optional` **extensions?**: `Record`\<`string`, `unknown`\>
