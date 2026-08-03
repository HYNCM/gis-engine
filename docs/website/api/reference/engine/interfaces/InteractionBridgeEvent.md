[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: InteractionBridgeEvent

Enriched interaction event payload emitted by the adapter.
Contains the original MapLibre event data plus resolved feature information.

## Properties

### type

> **type**: `"data"` \| `"click"` \| `"mousemove"` \| `"moveend"` \| `"zoomend"`

***

### point?

> `optional` **point?**: `object`

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### lngLat?

> `optional` **lngLat?**: `object`

#### lng

> **lng**: `number`

#### lat

> **lat**: `number`

***

### features?

> `optional` **features?**: [`JsonValue`](../type-aliases/JsonValue.md)[]

***

### center?

> `optional` **center?**: \[`number`, `number`\]

***

### zoom?

> `optional` **zoom?**: `number`

***

### bounds?

> `optional` **bounds?**: `object`

#### sw

> **sw**: \[`number`, `number`\]

#### ne

> **ne**: \[`number`, `number`\]

***

### dataType?

> `optional` **dataType?**: `string`

***

### sourceId?

> `optional` **sourceId?**: `string`

***

### originalEvent?

> `optional` **originalEvent?**: `unknown`
