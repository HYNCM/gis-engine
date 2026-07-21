[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: StyleRecommendToolInputSchema

> `const` **StyleRecommendToolInputSchema**: `object`

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

> `readonly` **description**: `"Inline GeoJSON FeatureCollection or GeoJSON object to analyze for style recommendations."` = `"Inline GeoJSON FeatureCollection or GeoJSON object to analyze for style recommendations."`

#### properties.hints

> `readonly` **hints**: `object`

#### properties.hints.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.hints.description

> `readonly` **description**: `"Optional context hints to influence recommendations."` = `"Optional context hints to influence recommendations."`

#### properties.hints.properties

> `readonly` **properties**: `object`

#### properties.hints.properties.theme

> `readonly` **theme**: `object`

#### properties.hints.properties.theme.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.hints.properties.theme.enum

> `readonly` **enum**: readonly \[`"light"`, `"dark"`, `"satellite"`, `"minimal"`\]

#### properties.hints.properties.theme.description

> `readonly` **description**: `"Preferred visual theme."` = `"Preferred visual theme."`

#### properties.hints.properties.density

> `readonly` **density**: `object`

#### properties.hints.properties.density.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.hints.properties.density.enum

> `readonly` **enum**: readonly \[`"low"`, `"medium"`, `"high"`\]

#### properties.hints.properties.density.description

> `readonly` **description**: `"Expected feature density on the map."` = `"Expected feature density on the map."`

#### properties.hints.properties.purpose

> `readonly` **purpose**: `object`

#### properties.hints.properties.purpose.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.hints.properties.purpose.enum

> `readonly` **enum**: readonly \[`"exploration"`, `"presentation"`, `"analysis"`, `"navigation"`\]

#### properties.hints.properties.purpose.description

> `readonly` **description**: `"Map purpose to influence style choices."` = `"Map purpose to influence style choices."`

#### properties.hints.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"geojson"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
