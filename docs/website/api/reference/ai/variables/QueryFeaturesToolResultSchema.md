[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: QueryFeaturesToolResultSchema

> `const` **QueryFeaturesToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.queryType

> `readonly` **queryType**: `object`

#### properties.queryType.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.queryType.enum

> `readonly` **enum**: readonly \[`"point"`, `"bbox"`, `"all"`\]

#### properties.featureCount

> `readonly` **featureCount**: `object`

#### properties.featureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.features

> `readonly` **features**: `object`

#### properties.features.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.features.items

> `readonly` **items**: `object`

#### properties.features.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.features.items.properties

> `readonly` **properties**: `object`

#### properties.features.items.properties.type

> `readonly` **type**: `object`

#### properties.features.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.features.items.properties.type.const

> `readonly` **const**: `"Feature"` = `"Feature"`

#### properties.features.items.properties.id

> `readonly` **id**: `object` = `{}`

#### properties.features.items.properties.geometry

> `readonly` **geometry**: `object`

#### properties.features.items.properties.geometry.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.features.items.properties.geometry.properties

> `readonly` **properties**: `object`

#### properties.features.items.properties.geometry.properties.type

> `readonly` **type**: `object`

#### properties.features.items.properties.geometry.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.features.items.properties.geometry.required

> `readonly` **required**: readonly \[`"type"`\]

#### properties.features.items.properties.geometry.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.features.items.properties.properties

> `readonly` **properties**: `object` = `{}`

#### properties.features.items.required

> `readonly` **required**: readonly \[`"type"`, `"properties"`\]

#### properties.features.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.suggestions

> `readonly` **suggestions**: `object`

#### properties.suggestions.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.suggestions.items

> `readonly` **items**: `object`

#### properties.suggestions.items.type

> `readonly` **type**: `"string"` = `"string"`

### required

> `readonly` **required**: readonly \[`"queryType"`, `"featureCount"`, `"features"`, `"suggestions"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
