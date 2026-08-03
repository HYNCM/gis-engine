[**@gis-engine/ai v1.5.0**](../index.md)

***

# Function: renderIntent()

> **renderIntent**(`spec`, `intent`, `options?`): [`RenderIntentResult`](../interfaces/RenderIntentResult.md)

Convert a structured AI rendering intent into MapCommands,
apply them to the given MapSpec, and return the result.

This is the core Agentic Bridge function: it enables an LLM
to directly manipulate the map state through a deterministic,
auditable command pipeline.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | \{ `version`: `"0.1"`; `id?`: `string`; `revision?`: `string`; `capabilities?`: \{ `dimensions?`: (`"2d"` \| `"2_5d"` \| `"3d"`)[]; `renderer?`: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`; `experimental?`: `string`[]; \}; `view`: \{ `mode?`: `"scene3d"` \| `"map2d"` \| `"map2_5d"`; `center?`: \[`number`, `number`\]; `zoom?`: `number`; `bearing?`: `number`; `pitch?`: `number`; `bounds?`: \[`number`, `number`, `number`, `number`\]; \}; `sources`: \{\[`key`: `string`\]: \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `2` \| `1`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}; \}; `layers`: `object`[]; `interactions?`: \{ `pan?`: `boolean`; `zoom?`: `boolean`; `hover?`: `boolean`; `click?`: `boolean`; `select?`: `boolean`; `popup?`: `boolean`; \}; `metadata?`: \{\[`key`: `string`\]: `unknown`; \}; `extensions?`: \{\[`key`: `string`\]: `unknown`; \}; \} |
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
| `spec.sources` | \{\[`key`: `string`\]: \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `2` \| `1`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}; \} |
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
| `intent` | [`RenderIntent`](../interfaces/RenderIntent.md) |
| `options` | [`RenderIntentOptions`](../interfaces/RenderIntentOptions.md) |

## Returns

[`RenderIntentResult`](../interfaces/RenderIntentResult.md)
