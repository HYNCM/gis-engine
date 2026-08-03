[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: ExplainSpecToolInput

## Properties

### spec

> **spec**: `object`

#### version

> **version**: `"0.1"`

#### id?

> `optional` **id?**: `string`

#### revision?

> `optional` **revision?**: `string`

#### capabilities?

> `optional` **capabilities?**: `object`

##### capabilities.dimensions?

> `optional` **dimensions?**: (`"2d"` \| `"2_5d"` \| `"3d"`)[]

##### capabilities.renderer?

> `optional` **renderer?**: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`

##### capabilities.experimental?

> `optional` **experimental?**: `string`[]

#### view

> **view**: `object`

##### view.mode?

> `optional` **mode?**: `"scene3d"` \| `"map2d"` \| `"map2_5d"`

##### view.center?

> `optional` **center?**: \[`number`, `number`\]

##### view.zoom?

> `optional` **zoom?**: `number`

##### view.bearing?

> `optional` **bearing?**: `number`

##### view.pitch?

> `optional` **pitch?**: `number`

##### view.bounds?

> `optional` **bounds?**: \[`number`, `number`, `number`, `number`\]

#### sources

> **sources**: `object`

##### Index Signature

\[`key`: `string`\]: \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `metadata`: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \}; `rowCount?`: `number`; `fileBytes?`: `number`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

#### layers

> **layers**: `object`[]

#### interactions?

> `optional` **interactions?**: `object`

##### interactions.pan?

> `optional` **pan?**: `boolean`

##### interactions.zoom?

> `optional` **zoom?**: `boolean`

##### interactions.hover?

> `optional` **hover?**: `boolean`

##### interactions.click?

> `optional` **click?**: `boolean`

##### interactions.select?

> `optional` **select?**: `boolean`

##### interactions.popup?

> `optional` **popup?**: `boolean`

#### metadata?

> `optional` **metadata?**: `object`

##### Index Signature

\[`key`: `string`\]: `unknown`

#### extensions?

> `optional` **extensions?**: `object`

##### Index Signature

\[`key`: `string`\]: `unknown`

***

### capabilities?

> `optional` **capabilities?**: `object`

#### renderer

> **renderer**: `string`

#### dimensions

> **dimensions**: (`"2d"` \| `"2_5d"` \| `"3d"`)[]

#### sources

> **sources**: `string`[]

#### layers

> **layers**: `string`[]

#### expressions

> **expressions**: `string`[]

#### queries

> **queries**: `string`[]

#### snapshot

> **snapshot**: `object`

##### snapshot.supported

> **supported**: `boolean`

##### snapshot.formats

> **formats**: (`"png"` \| `"jpeg"` \| `"data-url"`)[]

#### experimental

> **experimental**: `string`[]
