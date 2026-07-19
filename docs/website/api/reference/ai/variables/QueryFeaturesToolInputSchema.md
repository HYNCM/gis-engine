[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: QueryFeaturesToolInputSchema

> `const` **QueryFeaturesToolInputSchema**: `object`

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

> `readonly` **description**: `"Inline GeoJSON FeatureCollection or Feature to query against."` = `"Inline GeoJSON FeatureCollection or Feature to query against."`

#### properties.point

> `readonly` **point**: `object`

#### properties.point.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.point.items

> `readonly` **items**: `object`

#### properties.point.items.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.point.minItems

> `readonly` **minItems**: `2` = `2`

#### properties.point.maxItems

> `readonly` **maxItems**: `2` = `2`

#### properties.point.description

> `readonly` **description**: `"Point query as [longitude, latitude]."` = `"Point query as [longitude, latitude]."`

#### properties.bbox

> `readonly` **bbox**: `object`

#### properties.bbox.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.bbox.items

> `readonly` **items**: `object`

#### properties.bbox.items.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.bbox.minItems

> `readonly` **minItems**: `4` = `4`

#### properties.bbox.maxItems

> `readonly` **maxItems**: `4` = `4`

#### properties.bbox.description

> `readonly` **description**: `"Bounding box query as [west, south, east, north]."` = `"Bounding box query as [west, south, east, north]."`

#### properties.layers

> `readonly` **layers**: `object`

#### properties.layers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.layers.items

> `readonly` **items**: `object`

#### properties.layers.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.layers.description

> `readonly` **description**: `"Optional layer filter (not used for GeoJSON but accepted for API consistency)."` = `"Optional layer filter (not used for GeoJSON but accepted for API consistency)."`

#### properties.maxFeatures

> `readonly` **maxFeatures**: `object`

#### properties.maxFeatures.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.maxFeatures.minimum

> `readonly` **minimum**: `1` = `1`

#### properties.maxFeatures.maximum

> `readonly` **maximum**: `1000` = `1000`

#### properties.maxFeatures.default

> `readonly` **default**: `100` = `100`

#### properties.maxFeatures.description

> `readonly` **description**: `"Maximum number of features to return (default: 100)."` = `"Maximum number of features to return (default: 100)."`

### required

> `readonly` **required**: readonly \[`"geojson"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
