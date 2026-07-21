[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: RenderIntent

Structured rendering intent — the bridge between AI provider output
and the GIS Engine command system.

Modeled after the Google Maps Agentic UI Toolkit pattern:
an LLM produces a structured intent, and renderIntent()
deterministically converts it into engine commands and applies them.

## Properties

### action

> **action**: `string`

***

### layerId?

> `optional` **layerId?**: `string` \| `null`

***

### paint?

> `optional` **paint?**: `Record`\<`string`, `unknown`\> \| `null`

***

### layout?

> `optional` **layout?**: `Record`\<`string`, `unknown`\> \| `null`

***

### filter?

> `optional` **filter?**: `unknown`

***

### view?

> `optional` **view?**: \{ `center?`: \[`number`, `number`\]; `zoom?`: `number`; `bearing?`: `number`; `pitch?`: `number`; \} \| `null`

***

### bounds?

> `optional` **bounds?**: \[`number`, `number`, `number`, `number`\]

***

### layer?

> `optional` **layer?**: \{ `id?`: `string`; `type?`: `string`; `source?`: `string`; `paint?`: `Record`\<`string`, `unknown`\>; `layout?`: `Record`\<`string`, `unknown`\>; `filter?`: `unknown`; \} \| `null`

***

### minzoom?

> `optional` **minzoom?**: `number`

***

### maxzoom?

> `optional` **maxzoom?**: `number`

***

### beforeLayerId?

> `optional` **beforeLayerId?**: `string`

***

### sourceId?

> `optional` **sourceId?**: `string`

***

### source?

> `optional` **source?**: `Record`\<`string`, `unknown`\>

***

### interactions?

> `optional` **interactions?**: `Record`\<`string`, `boolean`\>

***

### capabilities?

> `optional` **capabilities?**: `Record`\<`string`, `unknown`\>
