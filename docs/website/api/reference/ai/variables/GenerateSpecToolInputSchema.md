[**@gis-engine/ai v1.2.0**](../index.md)

***

# Variable: GenerateSpecToolInputSchema

> `const` **GenerateSpecToolInputSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.intent

> `readonly` **intent**: `object`

#### properties.intent.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.intent.properties

> `readonly` **properties**: `object`

#### properties.intent.properties.description

> `readonly` **description**: `object`

#### properties.intent.properties.description.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.intent.properties.description.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.intent.properties.dataType

> `readonly` **dataType**: `object`

#### properties.intent.properties.dataType.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.intent.properties.dataType.enum

> `readonly` **enum**: readonly \[`"geojson"`, `"vector-tiles"`, `"raster"`\]

#### properties.intent.properties.center

> `readonly` **center**: `object`

#### properties.intent.properties.center.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.intent.properties.center.items

> `readonly` **items**: `object`

#### properties.intent.properties.center.items.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.intent.properties.center.minItems

> `readonly` **minItems**: `2` = `2`

#### properties.intent.properties.center.maxItems

> `readonly` **maxItems**: `2` = `2`

#### properties.intent.properties.zoom

> `readonly` **zoom**: `object`

#### properties.intent.properties.zoom.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.intent.properties.theme

> `readonly` **theme**: `object`

#### properties.intent.properties.theme.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.intent.properties.theme.enum

> `readonly` **enum**: readonly \[`"dark"`, `"light"`, `"satellite"`\]

#### properties.intent.required

> `readonly` **required**: readonly \[`"description"`\]

#### properties.intent.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.options

> `readonly` **options**: `object`

#### properties.options.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.options.properties

> `readonly` **properties**: `object`

#### properties.options.properties.includeMetadata

> `readonly` **includeMetadata**: `object`

#### properties.options.properties.includeMetadata.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.options.properties.includeInteractions

> `readonly` **includeInteractions**: `object`

#### properties.options.properties.includeInteractions.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.options.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"intent"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
