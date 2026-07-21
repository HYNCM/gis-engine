[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: TransformDataToolInputSchema

> `const` **TransformDataToolInputSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.geojson

> `readonly` **geojson**: `object`

#### properties.geojson.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.geojson.description

> `readonly` **description**: `"Inline GeoJSON FeatureCollection to transform."` = `"Inline GeoJSON FeatureCollection to transform."`

#### properties.operations

> `readonly` **operations**: `object`

#### properties.operations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.operations.description

> `readonly` **description**: `"Ordered list of transform operations to apply."` = `"Ordered list of transform operations to apply."`

#### properties.operations.items

> `readonly` **items**: `object`

#### properties.operations.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.operations.items.properties

> `readonly` **properties**: `object`

#### properties.operations.items.properties.type

> `readonly` **type**: `object`

#### properties.operations.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.operations.items.properties.type.enum

> `readonly` **enum**: readonly \[`"filter"`, `"aggregate"`, `"select"`, `"sort"`, `"rename"`\]

#### properties.operations.items.properties.type.description

> `readonly` **description**: `"Operation type."` = `"Operation type."`

#### properties.operations.items.properties.property

> `readonly` **property**: `object`

#### properties.operations.items.properties.property.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.operations.items.properties.property.description

> `readonly` **description**: `"Target property name (used by filter, aggregate, sort, rename)."` = `"Target property name (used by filter, aggregate, sort, rename)."`

#### properties.operations.items.properties.operator

> `readonly` **operator**: `object`

#### properties.operations.items.properties.operator.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.operations.items.properties.operator.enum

> `readonly` **enum**: readonly \[`"=="`, `"!="`, `">"`, `"<"`, `">="`, `"<="`, `"contains"`, `"exists"`\]

#### properties.operations.items.properties.operator.description

> `readonly` **description**: `"Comparison operator for filter operations."` = `"Comparison operator for filter operations."`

#### properties.operations.items.properties.value

> `readonly` **value**: `object`

#### properties.operations.items.properties.value.description

> `readonly` **description**: `"Comparison value for filter operations."` = `"Comparison value for filter operations."`

#### properties.operations.items.properties.groupBy

> `readonly` **groupBy**: `object`

#### properties.operations.items.properties.groupBy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.operations.items.properties.groupBy.description

> `readonly` **description**: `"Property to group by for aggregate operations."` = `"Property to group by for aggregate operations."`

#### properties.operations.items.properties.aggregation

> `readonly` **aggregation**: `object`

#### properties.operations.items.properties.aggregation.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.operations.items.properties.aggregation.enum

> `readonly` **enum**: readonly \[`"count"`, `"sum"`, `"avg"`, `"min"`, `"max"`\]

#### properties.operations.items.properties.aggregation.description

> `readonly` **description**: `"Aggregation function for aggregate operations."` = `"Aggregation function for aggregate operations."`

#### properties.operations.items.properties.properties

> `readonly` **properties**: `object`

#### properties.operations.items.properties.properties.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.operations.items.properties.properties.items

> `readonly` **items**: `object`

#### properties.operations.items.properties.properties.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.operations.items.properties.properties.description

> `readonly` **description**: `"List of property names for select operations."` = `"List of property names for select operations."`

#### properties.operations.items.properties.direction

> `readonly` **direction**: `object`

#### properties.operations.items.properties.direction.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.operations.items.properties.direction.enum

> `readonly` **enum**: readonly \[`"asc"`, `"desc"`\]

#### properties.operations.items.properties.direction.description

> `readonly` **description**: `"Sort direction."` = `"Sort direction."`

#### properties.operations.items.properties.newName

> `readonly` **newName**: `object`

#### properties.operations.items.properties.newName.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.operations.items.properties.newName.description

> `readonly` **description**: `"New property name for rename operations."` = `"New property name for rename operations."`

#### properties.operations.items.required

> `readonly` **required**: readonly \[`"type"`\]

#### properties.operations.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"geojson"`, `"operations"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
