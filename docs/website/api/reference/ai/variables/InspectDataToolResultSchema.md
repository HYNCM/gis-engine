[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: InspectDataToolResultSchema

> `const` **InspectDataToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.featureCount

> `readonly` **featureCount**: `object`

#### properties.featureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.propertySchema

> `readonly` **propertySchema**: `object`

#### properties.propertySchema.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.propertySchema.items

> `readonly` **items**: `object`

#### properties.propertySchema.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.propertySchema.items.properties

> `readonly` **properties**: `object`

#### properties.propertySchema.items.properties.name

> `readonly` **name**: `object`

#### properties.propertySchema.items.properties.name.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.propertySchema.items.properties.types

> `readonly` **types**: `object`

#### properties.propertySchema.items.properties.types.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.propertySchema.items.properties.types.items

> `readonly` **items**: `object`

#### properties.propertySchema.items.properties.types.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.propertySchema.items.properties.sampleValues

> `readonly` **sampleValues**: `object`

#### properties.propertySchema.items.properties.sampleValues.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.propertySchema.items.required

> `readonly` **required**: readonly \[`"name"`, `"types"`, `"sampleValues"`\]

#### properties.propertySchema.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.geometryTypes

> `readonly` **geometryTypes**: `object`

#### properties.geometryTypes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.geometryTypes.items

> `readonly` **items**: `object`

#### properties.geometryTypes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sample

> `readonly` **sample**: `object`

#### properties.sample.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.bounds

> `readonly` **bounds**: `object`

#### properties.bounds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.bounds.items

> `readonly` **items**: `object`

#### properties.bounds.items.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.bounds.minItems

> `readonly` **minItems**: `4` = `4`

#### properties.bounds.maxItems

> `readonly` **maxItems**: `4` = `4`

#### properties.suggestions

> `readonly` **suggestions**: `object`

#### properties.suggestions.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.suggestions.items

> `readonly` **items**: `object`

#### properties.suggestions.items.type

> `readonly` **type**: `"string"` = `"string"`

### required

> `readonly` **required**: readonly \[`"featureCount"`, `"propertySchema"`, `"geometryTypes"`, `"sample"`, `"bounds"`, `"suggestions"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
