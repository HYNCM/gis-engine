[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: QueryFeaturesToolResult

## Properties

### queryType

> **queryType**: `"bbox"` \| `"point"` \| `"all"`

***

### featureCount

> **featureCount**: `number`

***

### features

> **features**: `object`[]

#### type

> **type**: `"Feature"`

#### id?

> `optional` **id?**: `string` \| `number`

#### geometry?

> `optional` **geometry?**: `object`

##### geometry.type

> **type**: `string`

#### properties?

> `optional` **properties?**: `Record`\<`string`, `unknown`\> \| `null`

***

### suggestions

> **suggestions**: `string`[]
