[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: DiffSpecsToolInput

## Properties

### before

> **before**: `object`

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

\[`key`: `string`\]: \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `2` \| `1`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

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

### after

> **after**: `object`

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

\[`key`: `string`\]: \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `2` \| `1`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

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

### options?

> `optional` **options?**: `object`

#### ignoreMetadata?

> `optional` **ignoreMetadata?**: `boolean`

#### ignoreRevision?

> `optional` **ignoreRevision?**: `boolean`
