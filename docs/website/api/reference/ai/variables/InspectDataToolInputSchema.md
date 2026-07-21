[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: InspectDataToolInputSchema

> `const` **InspectDataToolInputSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.url

> `readonly` **url**: `object`

#### properties.url.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.url.description

> `readonly` **description**: `"URL to fetch GeoJSON data from"` = `"URL to fetch GeoJSON data from"`

#### properties.geojson

> `readonly` **geojson**: `object`

#### properties.geojson.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.geojson.description

> `readonly` **description**: `"Inline GeoJSON FeatureCollection or GeoJSON object"` = `"Inline GeoJSON FeatureCollection or GeoJSON object"`

#### properties.sampleSize

> `readonly` **sampleSize**: `object`

#### properties.sampleSize.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sampleSize.minimum

> `readonly` **minimum**: `1` = `1`

#### properties.sampleSize.maximum

> `readonly` **maximum**: `100` = `100`

#### properties.sampleSize.default

> `readonly` **default**: `5` = `5`

#### properties.sampleSize.description

> `readonly` **description**: `"Number of sample features to return"` = `"Number of sample features to return"`

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
