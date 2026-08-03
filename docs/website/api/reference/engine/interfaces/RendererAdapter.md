[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: RendererAdapter

## Properties

### id

> `readonly` **id**: `string`

***

### version

> `readonly` **version**: `string`

## Methods

### getCapabilities()

> **getCapabilities**(): `Promise`\<\{ `renderer`: `string`; `dimensions`: (`"2d"` \| `"2_5d"` \| `"3d"`)[]; `sources`: `string`[]; `layers`: `string`[]; `expressions`: `string`[]; `queries`: `string`[]; `snapshot`: \{ `supported`: `boolean`; `formats`: (`"png"` \| `"jpeg"` \| `"data-url"`)[]; \}; `experimental`: `string`[]; \}\>

#### Returns

`Promise`\<\{ `renderer`: `string`; `dimensions`: (`"2d"` \| `"2_5d"` \| `"3d"`)[]; `sources`: `string`[]; `layers`: `string`[]; `expressions`: `string`[]; `queries`: `string`[]; `snapshot`: \{ `supported`: `boolean`; `formats`: (`"png"` \| `"jpeg"` \| `"data-url"`)[]; \}; `experimental`: `string`[]; \}\>

***

### load()

> **load**(`spec`, `context`): `Promise`\&lt;`void`\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | \{ `version`: `"0.1"`; `id?`: `string`; `revision?`: `string`; `capabilities?`: \{ `dimensions?`: (`"2d"` \| `"2_5d"` \| `"3d"`)[]; `renderer?`: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`; `experimental?`: `string`[]; \}; `view`: \{ `mode?`: `"scene3d"` \| `"map2d"` \| `"map2_5d"`; `center?`: \[`number`, `number`\]; `zoom?`: `number`; `bearing?`: `number`; `pitch?`: `number`; `bounds?`: \[`number`, `number`, `number`, `number`\]; \}; `sources`: \{\[`key`: `string`\]: \{ `type`: `"geoparquet"`; `url`: `string`; `metadata`: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \}; `rowCount?`: `number`; `fileBytes?`: `number`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}; \}; `layers`: `object`[]; `interactions?`: \{ `pan?`: `boolean`; `zoom?`: `boolean`; `hover?`: `boolean`; `click?`: `boolean`; `select?`: `boolean`; `popup?`: `boolean`; \}; `metadata?`: \{\[`key`: `string`\]: `unknown`; \}; `extensions?`: \{\[`key`: `string`\]: `unknown`; \}; \} |
| `spec.version` | `"0.1"` |
| `spec.id?` | `string` |
| `spec.revision?` | `string` |
| `spec.capabilities?` | \{ `dimensions?`: (`"2d"` \| `"2_5d"` \| `"3d"`)[]; `renderer?`: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`; `experimental?`: `string`[]; \} |
| `spec.capabilities.dimensions?` | (`"2d"` \| `"2_5d"` \| `"3d"`)[] |
| `spec.capabilities.renderer?` | `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"` |
| `spec.capabilities.experimental?` | `string`[] |
| `spec.view` | \{ `mode?`: `"scene3d"` \| `"map2d"` \| `"map2_5d"`; `center?`: \[`number`, `number`\]; `zoom?`: `number`; `bearing?`: `number`; `pitch?`: `number`; `bounds?`: \[`number`, `number`, `number`, `number`\]; \} |
| `spec.view.mode?` | `"scene3d"` \| `"map2d"` \| `"map2_5d"` |
| `spec.view.center?` | \[`number`, `number`\] |
| `spec.view.zoom?` | `number` |
| `spec.view.bearing?` | `number` |
| `spec.view.pitch?` | `number` |
| `spec.view.bounds?` | \[`number`, `number`, `number`, `number`\] |
| `spec.sources` | \{\[`key`: `string`\]: \{ `type`: `"geoparquet"`; `url`: `string`; `metadata`: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \}; `rowCount?`: `number`; `fileBytes?`: `number`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}; \} |
| `spec.layers` | `object`[] |
| `spec.interactions?` | \{ `pan?`: `boolean`; `zoom?`: `boolean`; `hover?`: `boolean`; `click?`: `boolean`; `select?`: `boolean`; `popup?`: `boolean`; \} |
| `spec.interactions.pan?` | `boolean` |
| `spec.interactions.zoom?` | `boolean` |
| `spec.interactions.hover?` | `boolean` |
| `spec.interactions.click?` | `boolean` |
| `spec.interactions.select?` | `boolean` |
| `spec.interactions.popup?` | `boolean` |
| `spec.metadata?` | \{\[`key`: `string`\]: `unknown`; \} |
| `spec.extensions?` | \{\[`key`: `string`\]: `unknown`; \} |
| `context` | [`RenderContext`](RenderContext.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### applyPatch()

> **applyPatch**(`patch`, `context`): `Promise`\&lt;[`AdapterApplyResult`](AdapterApplyResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patch` | [`JsonPatchOperation`](JsonPatchOperation.md)[] |
| `context` | [`RenderContext`](RenderContext.md) |

#### Returns

`Promise`\&lt;[`AdapterApplyResult`](AdapterApplyResult.md)\&gt;

***

### queryFeatures()

> **queryFeatures**(`options`): `Promise`\&lt;[`FeatureQueryResult`](FeatureQueryResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`QueryFeaturesOptions`](QueryFeaturesOptions.md) |

#### Returns

`Promise`\&lt;[`FeatureQueryResult`](FeatureQueryResult.md)\&gt;

***

### snapshot()

> **snapshot**(`options`): `Promise`\&lt;[`SnapshotResult`](SnapshotResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SnapshotOptions`](SnapshotOptions.md) |

#### Returns

`Promise`\&lt;[`SnapshotResult`](SnapshotResult.md)\&gt;

***

### resize()

> **resize**(`size`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `size` | \{ `width`: `number`; `height`: `number`; \} |
| `size.width` | `number` |
| `size.height` | `number` |

#### Returns

`void`

***

### destroy()

> **destroy**(): `Promise`\&lt;[`ResourceReport`](ResourceReport.md)\&gt;

#### Returns

`Promise`\&lt;[`ResourceReport`](ResourceReport.md)\&gt;

***

### on()

> **on**(`event`, `listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`AdapterEvent`](../type-aliases/AdapterEvent.md) |
| `listener` | [`AdapterEventListener`](../type-aliases/AdapterEventListener.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### getMapInstance()?

> `optional` **getMapInstance**(): `unknown`

Escape-hatch accessor for the underlying renderer instance
(e.g. `maplibregl.Map`). Returns `null` when the adapter has no live
renderer (headless mode, mock adapter, or before `load()` is called).

#### Returns

`unknown`
