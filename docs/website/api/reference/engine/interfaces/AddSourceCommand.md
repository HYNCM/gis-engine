[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: AddSourceCommand

## Extends

- [`MapCommandBase`](MapCommandBase.md)

## Properties

### id

> **id**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`id`](MapCommandBase.md#id)

***

### version

> **version**: `"0.1"`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`version`](MapCommandBase.md#version)

***

### baseRevision?

> `optional` **baseRevision?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`baseRevision`](MapCommandBase.md#baserevision)

***

### author?

> `optional` **author?**: `object`

#### type

> **type**: `"human"` \| `"agent"` \| `"system"`

#### id?

> `optional` **id?**: `string`

#### name?

> `optional` **name?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`author`](MapCommandBase.md#author)

***

### reason?

> `optional` **reason?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`reason`](MapCommandBase.md#reason)

***

### createdAt?

> `optional` **createdAt?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`createdAt`](MapCommandBase.md#createdat)

***

### sourcePromptHash?

> `optional` **sourcePromptHash?**: `string`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`sourcePromptHash`](MapCommandBase.md#sourceprompthash)

***

### dryRun?

> `optional` **dryRun?**: `boolean`

#### Inherited from

[`MapCommandBase`](MapCommandBase.md).[`dryRun`](MapCommandBase.md#dryrun)

***

### type

> **type**: `"addSource"`

#### Overrides

[`MapCommandBase`](MapCommandBase.md).[`type`](MapCommandBase.md#type)

***

### sourceId

> **sourceId**: `string`

***

### source

> **source**: \{ `type`: `"geoparquet"`; `url`: `string`; `metadata`: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \}; `rowCount?`: `number`; `fileBytes?`: `number`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

#### Union Members

##### Type Literal

\{ `type`: `"geoparquet"`; `url`: `string`; `metadata`: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \}; `rowCount?`: `number`; `fileBytes?`: `number`; \}

##### type

> `readonly` **type**: `"geoparquet"`

##### url

> `readonly` **url**: `string`

URL is policy-validated, but this metadata-only boundary never fetches it.

##### metadata

> `readonly` **metadata**: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \} = `GeoParquetSourceMetadataSchema`

Exact readiness release identity and version-specific metadata evidence.

##### rowCount?

> `readonly` `optional` **rowCount?**: `number`

Row count metadata.

##### fileBytes?

> `readonly` `optional` **fileBytes?**: `number`

File byte size metadata.

***

##### Type Literal

\{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \}

##### type

> `readonly` **type**: `"flatgeobuf"`

##### url

> `readonly` **url**: `string`

##### hasIndex?

> `readonly` `optional` **hasIndex?**: `boolean`

Whether the file has a spatial index

##### featureCount?

> `readonly` `optional` **featureCount?**: `number`

Feature count metadata

##### bbox?

> `readonly` `optional` **bbox?**: \[`number`, `number`, `number`, `number`\]

Bounding box [west, south, east, north]

##### geometryType?

> `readonly` `optional` **geometryType?**: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`

Geometry type

##### fileBytes?

> `readonly` `optional` **fileBytes?**: `number`

File byte size

***

##### Type Literal

\{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \}

##### type

> `readonly` **type**: `"geotiff"`

##### url

> `readonly` **url**: `string`

URL to the GeoTIFF file

##### crs?

> `readonly` `optional` **crs?**: `object`

CRS metadata

###### crs.authority?

> `optional` **authority?**: `string`

CRS authority code, e.g. "EPSG:4326"

###### crs.code?

> `optional` **code?**: `string`

CRS code, e.g. "4326"

###### crs.wkt?

> `optional` **wkt?**: `string`

CRS WKT (for custom projections)

##### bbox?

> `readonly` `optional` **bbox?**: \[`number`, `number`, `number`, `number`\]

Bounding box [west, south, east, north]

##### width?

> `readonly` `optional` **width?**: `number`

Raster width in pixels

##### height?

> `readonly` `optional` **height?**: `number`

Raster height in pixels

##### bandCount?

> `readonly` `optional` **bandCount?**: `number`

Number of raster bands

##### bands?

> `readonly` `optional` **bands?**: `object`[]

Optional band metadata for diagnostics

##### fileBytes?

> `readonly` `optional` **fileBytes?**: `number`

File byte size

***

##### Type Literal

\{ `type`: `"geojson"`; `data`: `unknown`; \}

***

##### Type Literal

\{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

***

##### Type Literal

\{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

***

##### Type Literal

\{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

***

##### Type Literal

\{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}
