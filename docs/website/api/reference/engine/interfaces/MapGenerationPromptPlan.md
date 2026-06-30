[**@gis-engine/engine v1.2.0**](../index.md)

***

# Interface: MapGenerationPromptPlan

## Properties

### status

> **status**: `"ready"` \| `"blocked"`

***

### traceId

> **traceId**: `string`

***

### request

> **request**: `object`

#### mapId?

> `optional` **mapId?**: `string`

#### promptHash?

> `optional` **promptHash?**: `string`

#### createdAt?

> `optional` **createdAt?**: `string`

#### traceId?

> `optional` **traceId?**: `string`

#### targetDomains?

> `optional` **targetDomains?**: (`"feature-display"` \| `"spatial-analysis"` \| `"scene-browsing"`)[]

#### baseSpec?

> `optional` **baseSpec?**: `object`

##### baseSpec.version

> **version**: `"0.1"`

##### baseSpec.id?

> `optional` **id?**: `string`

##### baseSpec.revision?

> `optional` **revision?**: `string`

##### baseSpec.capabilities?

> `optional` **capabilities?**: `object`

##### baseSpec.capabilities.dimensions?

> `optional` **dimensions?**: (`"2d"` \| `"2_5d"` \| `"3d"`)[]

##### baseSpec.capabilities.renderer?

> `optional` **renderer?**: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`

##### baseSpec.capabilities.experimental?

> `optional` **experimental?**: `string`[]

##### baseSpec.view

> **view**: `object` = `ViewSpecSchema`

##### baseSpec.view.mode?

> `optional` **mode?**: `"scene3d"` \| `"map2d"` \| `"map2_5d"`

##### baseSpec.view.center?

> `optional` **center?**: \[`number`, `number`\]

##### baseSpec.view.zoom?

> `optional` **zoom?**: `number`

##### baseSpec.view.bearing?

> `optional` **bearing?**: `number`

##### baseSpec.view.pitch?

> `optional` **pitch?**: `number`

##### baseSpec.view.bounds?

> `optional` **bounds?**: \[`number`, `number`, `number`, `number`\]

##### baseSpec.sources

> **sources**: `object`

###### Index Signature

\[`key`: `string`\]: \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `2` \| `1`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

##### baseSpec.layers

> **layers**: `object`[]

##### baseSpec.interactions?

> `optional` **interactions?**: `object`

##### baseSpec.interactions.pan?

> `optional` **pan?**: `boolean`

##### baseSpec.interactions.zoom?

> `optional` **zoom?**: `boolean`

##### baseSpec.interactions.hover?

> `optional` **hover?**: `boolean`

##### baseSpec.interactions.click?

> `optional` **click?**: `boolean`

##### baseSpec.interactions.select?

> `optional` **select?**: `boolean`

##### baseSpec.interactions.popup?

> `optional` **popup?**: `boolean`

##### baseSpec.metadata?

> `optional` **metadata?**: `object`

###### Index Signature

\[`key`: `string`\]: `unknown`

##### baseSpec.extensions?

> `optional` **extensions?**: `object`

###### Index Signature

\[`key`: `string`\]: `unknown`

#### capabilities?

> `optional` **capabilities?**: `object`

##### capabilities.dimensions?

> `optional` **dimensions?**: (`"2d"` \| `"2_5d"` \| `"3d"`)[]

##### capabilities.renderer?

> `optional` **renderer?**: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`

##### capabilities.experimental?

> `optional` **experimental?**: `string`[]

#### view?

> `optional` **view?**: `object`

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

#### sources?

> `optional` **sources?**: `object`

##### Index Signature

\[`key`: `string`\]: \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `2` \| `1`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

#### layers?

> `optional` **layers?**: `object`[]

#### styleEdits?

> `optional` **styleEdits?**: `object`[]

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

#### analysis?

> `optional` **analysis?**: `object`

##### analysis.operations

> **operations**: (`"point-query"` \| `"bbox-query"` \| `"buffer"` \| `"intersection"` \| `"overlay"` \| `"routing"` \| `"aggregation"`)[]

#### scene3d?

> `optional` **scene3d?**: `object`

##### scene3d.camera

> **camera**: `object` = `SceneCameraSchema`

##### scene3d.camera.type?

> `optional` **type?**: `"perspective"`

##### scene3d.camera.position

> **position**: \[`number`, `number`, `number`\] = `ScenePositionSchema`

##### scene3d.camera.target

> **target**: \[`number`, `number`, `number`\] = `ScenePositionSchema`

##### scene3d.camera.up?

> `optional` **up?**: \[`number`, `number`, `number`\]

##### scene3d.camera.fov?

> `optional` **fov?**: `number`

##### scene3d.camera.near?

> `optional` **near?**: `number`

##### scene3d.camera.far?

> `optional` **far?**: `number`

##### scene3d.lights?

> `optional` **lights?**: (\{ `type`: `"ambient"`; `intensity?`: `number`; \} \| \{ `type`: `"directional"`; `direction`: \[`number`, `number`, `number`\]; `intensity?`: `number`; \})[]

##### scene3d.depth?

> `optional` **depth?**: `object`

##### scene3d.depth.enabled?

> `optional` **enabled?**: `boolean`

##### scene3d.depth.mode?

> `optional` **mode?**: `"standard"` \| `"logarithmic"`

##### scene3d.depth.clearColor?

> `optional` **clearColor?**: `string`

##### scene3d.terrain?

> `optional` **terrain?**: `object`

##### scene3d.terrain.source

> **source**: `string`

##### scene3d.terrain.exaggeration?

> `optional` **exaggeration?**: `number`

##### scene3d.sources?

> `optional` **sources?**: `object`

###### Index Signature

\[`key`: `string`\]: \{ `type`: `"terrain-raster-dem"`; `url`: `string`; `encoding?`: `"mapbox"` \| `"terrarium"`; `attribution?`: `string`; \} \| \{ `type`: `"3d-tiles"`; `url`: `string`; `maximumScreenSpaceError?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"gltf"`; `url`: `string`; `transform?`: \{ `translate?`: \[..., ..., ...\]; `rotate?`: \[..., ..., ...\]; `scale?`: `number` \| \[..., ..., ...\]; \}; `attribution?`: `string`; \}

##### scene3d.layers?

> `optional` **layers?**: (\{ `id`: `string`; `type`: `"terrain"`; `source`: `string`; `visible?`: `boolean`; \} \| \{ `id`: `string`; `type`: `"tileset3d"`; `source`: `string`; `visible?`: `boolean`; `pickable?`: `boolean`; \} \| \{ `id`: `string`; `type`: `"model"`; `source`: `string`; `visible?`: `boolean`; `pickable?`: `boolean`; \})[]

##### scene3d.snapshot?

> `optional` **snapshot?**: `object`

##### scene3d.snapshot.width?

> `optional` **width?**: `number`

##### scene3d.snapshot.height?

> `optional` **height?**: `number`

##### scene3d.snapshot.pixelRatio?

> `optional` **pixelRatio?**: `number`

##### scene3d.snapshot.format?

> `optional` **format?**: `"png"` \| `"data-url"`

##### scene3d.snapshot.requireLoadedResources?

> `optional` **requireLoadedResources?**: `boolean`

##### scene3d.resourcePolicy?

> `optional` **resourcePolicy?**: `object`

##### scene3d.resourcePolicy.allowRelativeUrls?

> `optional` **allowRelativeUrls?**: `boolean`

##### scene3d.resourcePolicy.allowedSchemes?

> `optional` **allowedSchemes?**: (`"http:"` \| `"https:"`)[]

##### scene3d.resourcePolicy.allowedHosts?

> `optional` **allowedHosts?**: `string`[]

##### scene3d.resourcePolicy.allowedPathPrefixes?

> `optional` **allowedPathPrefixes?**: `string`[]

##### scene3d.resourcePolicy.maxTilesetJsonBytes?

> `optional` **maxTilesetJsonBytes?**: `number`

##### scene3d.resourcePolicy.maxModelBytes?

> `optional` **maxModelBytes?**: `number`

##### scene3d.resourcePolicy.maxTextureCount?

> `optional` **maxTextureCount?**: `number`

##### scene3d.resourcePolicy.maxTextureBytes?

> `optional` **maxTextureBytes?**: `number`

##### scene3d.resourcePolicy.maxWorkers?

> `optional` **maxWorkers?**: `number`

##### scene3d.resourcePolicy.timeoutMs?

> `optional` **timeoutMs?**: `number`

##### scene3d.resourcePolicy.retryCount?

> `optional` **retryCount?**: `number`

***

### diagnostics

> **diagnostics**: [`Diagnostic`](Diagnostic.md)[]

***

### provenance

> **provenance**: `object`

#### plannerId

> **plannerId**: `string`

#### promptHash

> **promptHash**: `string`

#### retainedRawPrompt

> **retainedRawPrompt**: `false`

#### acceptedIntentFields

> **acceptedIntentFields**: `string`[]

#### unsupportedIntentFields

> **unsupportedIntentFields**: `string`[]
