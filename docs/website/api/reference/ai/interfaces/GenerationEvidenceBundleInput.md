[**@gis-engine/ai v1.4.0**](../index.md)

***

# Interface: GenerationEvidenceBundleInput

## Properties

### promptHash

> **promptHash**: `string`

***

### skeleton

> **skeleton**: `MapGenerationCommandSkeleton`

***

### planner?

> `optional` **planner?**: `object`

#### plan

> **plan**: `object`

##### plan.status

> **status**: `"blocked"` \| `"ready"`

##### plan.traceId

> **traceId**: `string`

##### plan.request

> **request**: `object`

##### plan.request.mapId?

> `optional` **mapId?**: `string`

##### plan.request.promptHash?

> `optional` **promptHash?**: `string`

##### plan.request.createdAt?

> `optional` **createdAt?**: `string`

##### plan.request.traceId?

> `optional` **traceId?**: `string`

##### plan.request.targetDomains?

> `optional` **targetDomains?**: (`"feature-display"` \| `"spatial-analysis"` \| `"scene-browsing"`)[]

##### plan.request.baseSpec?

> `optional` **baseSpec?**: `object`

##### plan.request.baseSpec.version

> **version**: `"0.1"`

##### plan.request.baseSpec.id?

> `optional` **id?**: `string`

##### plan.request.baseSpec.revision?

> `optional` **revision?**: `string`

##### plan.request.baseSpec.capabilities?

> `optional` **capabilities?**: `object`

##### plan.request.baseSpec.capabilities.dimensions?

> `optional` **dimensions?**: (... \| ... \| ...)[]

##### plan.request.baseSpec.capabilities.renderer?

> `optional` **renderer?**: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`

##### plan.request.baseSpec.capabilities.experimental?

> `optional` **experimental?**: `string`[]

##### plan.request.baseSpec.view

> **view**: `object`

##### plan.request.baseSpec.view.mode?

> `optional` **mode?**: `"scene3d"` \| `"map2d"` \| `"map2_5d"`

##### plan.request.baseSpec.view.center?

> `optional` **center?**: \[`number`, `number`\]

##### plan.request.baseSpec.view.zoom?

> `optional` **zoom?**: `number`

##### plan.request.baseSpec.view.bearing?

> `optional` **bearing?**: `number`

##### plan.request.baseSpec.view.pitch?

> `optional` **pitch?**: `number`

##### plan.request.baseSpec.view.bounds?

> `optional` **bounds?**: \[`number`, `number`, `number`, `number`\]

##### plan.request.baseSpec.sources

> **sources**: `object`

###### Index Signature

\[`key`: `string`\]: \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[..., ..., ..., ...\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: ...; `code?`: ...; `wkt?`: ...; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[..., ..., ..., ...\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `1` \| `2`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: ...; `code?`: ...; `wkt?`: ...; \}; `bbox?`: \[..., ..., ..., ...\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: ...[]; `fileBytes?`: `number`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

##### plan.request.baseSpec.layers

> **layers**: `object`[]

##### plan.request.baseSpec.interactions?

> `optional` **interactions?**: `object`

##### plan.request.baseSpec.interactions.pan?

> `optional` **pan?**: `boolean`

##### plan.request.baseSpec.interactions.zoom?

> `optional` **zoom?**: `boolean`

##### plan.request.baseSpec.interactions.hover?

> `optional` **hover?**: `boolean`

##### plan.request.baseSpec.interactions.click?

> `optional` **click?**: `boolean`

##### plan.request.baseSpec.interactions.select?

> `optional` **select?**: `boolean`

##### plan.request.baseSpec.interactions.popup?

> `optional` **popup?**: `boolean`

##### plan.request.baseSpec.metadata?

> `optional` **metadata?**: `object`

###### Index Signature

\[`key`: `string`\]: `unknown`

##### plan.request.baseSpec.extensions?

> `optional` **extensions?**: `object`

###### Index Signature

\[`key`: `string`\]: `unknown`

##### plan.request.capabilities?

> `optional` **capabilities?**: `object`

##### plan.request.capabilities.dimensions?

> `optional` **dimensions?**: (`"2d"` \| `"2_5d"` \| `"3d"`)[]

##### plan.request.capabilities.renderer?

> `optional` **renderer?**: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`

##### plan.request.capabilities.experimental?

> `optional` **experimental?**: `string`[]

##### plan.request.view?

> `optional` **view?**: `object`

##### plan.request.view.mode?

> `optional` **mode?**: `"scene3d"` \| `"map2d"` \| `"map2_5d"`

##### plan.request.view.center?

> `optional` **center?**: \[`number`, `number`\]

##### plan.request.view.zoom?

> `optional` **zoom?**: `number`

##### plan.request.view.bearing?

> `optional` **bearing?**: `number`

##### plan.request.view.pitch?

> `optional` **pitch?**: `number`

##### plan.request.view.bounds?

> `optional` **bounds?**: \[`number`, `number`, `number`, `number`\]

##### plan.request.sources?

> `optional` **sources?**: `object`

###### Index Signature

\[`key`: `string`\]: \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: ... \| ...; `code?`: ... \| ...; `wkt?`: ... \| ...; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `1` \| `2`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: ... \| ...; `code?`: ... \| ...; `wkt?`: ... \| ...; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

##### plan.request.layers?

> `optional` **layers?**: `object`[]

##### plan.request.styleEdits?

> `optional` **styleEdits?**: `object`[]

##### plan.request.interactions?

> `optional` **interactions?**: `object`

##### plan.request.interactions.pan?

> `optional` **pan?**: `boolean`

##### plan.request.interactions.zoom?

> `optional` **zoom?**: `boolean`

##### plan.request.interactions.hover?

> `optional` **hover?**: `boolean`

##### plan.request.interactions.click?

> `optional` **click?**: `boolean`

##### plan.request.interactions.select?

> `optional` **select?**: `boolean`

##### plan.request.interactions.popup?

> `optional` **popup?**: `boolean`

##### plan.request.analysis?

> `optional` **analysis?**: `object`

##### plan.request.analysis.operations

> **operations**: (`"point-query"` \| `"bbox-query"` \| `"intersection"` \| `"buffer"` \| `"overlay"` \| `"routing"` \| `"aggregation"`)[]

##### plan.request.scene3d?

> `optional` **scene3d?**: `object`

##### plan.request.scene3d.camera

> **camera**: `object`

##### plan.request.scene3d.camera.type?

> `optional` **type?**: `"perspective"`

##### plan.request.scene3d.camera.position

> **position**: \[`number`, `number`, `number`\]

##### plan.request.scene3d.camera.target

> **target**: \[`number`, `number`, `number`\]

##### plan.request.scene3d.camera.up?

> `optional` **up?**: \[`number`, `number`, `number`\]

##### plan.request.scene3d.camera.fov?

> `optional` **fov?**: `number`

##### plan.request.scene3d.camera.near?

> `optional` **near?**: `number`

##### plan.request.scene3d.camera.far?

> `optional` **far?**: `number`

##### plan.request.scene3d.lights?

> `optional` **lights?**: (\{ `type`: `"ambient"`; `intensity?`: ... \| ...; \} \| \{ `type`: `"directional"`; `direction`: \[..., ..., ...\]; `intensity?`: ... \| ...; \})[]

##### plan.request.scene3d.depth?

> `optional` **depth?**: `object`

##### plan.request.scene3d.depth.enabled?

> `optional` **enabled?**: `boolean`

##### plan.request.scene3d.depth.mode?

> `optional` **mode?**: `"standard"` \| `"logarithmic"`

##### plan.request.scene3d.depth.clearColor?

> `optional` **clearColor?**: `string`

##### plan.request.scene3d.terrain?

> `optional` **terrain?**: `object`

##### plan.request.scene3d.terrain.source

> **source**: `string`

##### plan.request.scene3d.terrain.exaggeration?

> `optional` **exaggeration?**: `number`

##### plan.request.scene3d.sources?

> `optional` **sources?**: `object`

###### Index Signature

\[`key`: `string`\]: \{ `type`: `"terrain-raster-dem"`; `url`: `string`; `encoding?`: ... \| ... \| ...; `attribution?`: ... \| ...; \} \| \{ `type`: `"3d-tiles"`; `url`: `string`; `maximumScreenSpaceError?`: ... \| ...; `attribution?`: ... \| ...; \} \| \{ `type`: `"gltf"`; `url`: `string`; `transform?`: ... \| ...; `attribution?`: ... \| ...; \}

##### plan.request.scene3d.layers?

> `optional` **layers?**: (\{ `id`: `string`; `type`: `"terrain"`; `source`: `string`; `visible?`: ... \| ... \| ...; \} \| \{ `id`: `string`; `type`: `"tileset3d"`; `source`: `string`; `visible?`: ... \| ... \| ...; `pickable?`: ... \| ... \| ...; \} \| \{ `id`: `string`; `type`: `"model"`; `source`: `string`; `visible?`: ... \| ... \| ...; `pickable?`: ... \| ... \| ...; \})[]

##### plan.request.scene3d.snapshot?

> `optional` **snapshot?**: `object`

##### plan.request.scene3d.snapshot.width?

> `optional` **width?**: `number`

##### plan.request.scene3d.snapshot.height?

> `optional` **height?**: `number`

##### plan.request.scene3d.snapshot.pixelRatio?

> `optional` **pixelRatio?**: `number`

##### plan.request.scene3d.snapshot.format?

> `optional` **format?**: `"png"` \| `"data-url"`

##### plan.request.scene3d.snapshot.requireLoadedResources?

> `optional` **requireLoadedResources?**: `boolean`

##### plan.request.scene3d.resourcePolicy?

> `optional` **resourcePolicy?**: `object`

##### plan.request.scene3d.resourcePolicy.allowRelativeUrls?

> `optional` **allowRelativeUrls?**: `boolean`

##### plan.request.scene3d.resourcePolicy.allowedSchemes?

> `optional` **allowedSchemes?**: (... \| ...)[]

##### plan.request.scene3d.resourcePolicy.allowedHosts?

> `optional` **allowedHosts?**: `string`[]

##### plan.request.scene3d.resourcePolicy.allowedPathPrefixes?

> `optional` **allowedPathPrefixes?**: `string`[]

##### plan.request.scene3d.resourcePolicy.maxTilesetJsonBytes?

> `optional` **maxTilesetJsonBytes?**: `number`

##### plan.request.scene3d.resourcePolicy.maxModelBytes?

> `optional` **maxModelBytes?**: `number`

##### plan.request.scene3d.resourcePolicy.maxTextureCount?

> `optional` **maxTextureCount?**: `number`

##### plan.request.scene3d.resourcePolicy.maxTextureBytes?

> `optional` **maxTextureBytes?**: `number`

##### plan.request.scene3d.resourcePolicy.maxWorkers?

> `optional` **maxWorkers?**: `number`

##### plan.request.scene3d.resourcePolicy.timeoutMs?

> `optional` **timeoutMs?**: `number`

##### plan.request.scene3d.resourcePolicy.retryCount?

> `optional` **retryCount?**: `number`

##### plan.diagnostics

> **diagnostics**: `object`[]

##### plan.provenance

> **provenance**: `object`

##### plan.provenance.plannerId

> **plannerId**: `string`

##### plan.provenance.promptHash

> **promptHash**: `string`

##### plan.provenance.retainedRawPrompt

> **retainedRawPrompt**: `false`

##### plan.provenance.acceptedIntentFields

> **acceptedIntentFields**: `string`[]

##### plan.provenance.unsupportedIntentFields

> **unsupportedIntentFields**: `string`[]

#### confidence?

> `optional` **confidence?**: [`PlannerConfidence`](PlannerConfidence.md)

***

### capabilities?

> `optional` **capabilities?**: `CapabilityReport`

***

### snapshot?

> `optional` **snapshot?**: `object`

#### renderer?

> `optional` **renderer?**: `"maplibre"` \| `"mock"`

#### options?

> `optional` **options?**: `object`

##### options.width?

> `optional` **width?**: `number`

##### options.height?

> `optional` **height?**: `number`

##### options.pixelRatio?

> `optional` **pixelRatio?**: `number`

##### options.format?

> `optional` **format?**: `"png"` \| `"jpeg"` \| `"data-url"`

##### options.targetLayers?

> `optional` **targetLayers?**: `string`[]

***

### spatialQueries?

> `optional` **spatialQueries?**: `object`

#### renderer?

> `optional` **renderer?**: `"maplibre"` \| `"mock"`

#### cases

> **cases**: `SpatialQueryCaseInput`[]

#### capabilityWaiver?

> `optional` **capabilityWaiver?**: `SpatialQueryCapabilityWaiver`

***

### pmtilesQueryEvidence?

> `optional` **pmtilesQueryEvidence?**: `Record`\<`string`, \{ `features`: `PMTilesQueryFixtureFeature`[]; `cases`: `PMTilesQueryEvidenceCaseInput`[]; `resultLimit?`: `number`; `loaderContract?`: \{ `timeoutMs?`: `number`; `byteBudgetBytes?`: `number`; \}; \}\>

***

### exampleId?

> `optional` **exampleId?**: `"fill-extrusion-lite"` \| `"basic-geojson"` \| `"ai-map-edit"` \| `"raster-basemap"` \| `"pmtiles-local"` \| `"vector-tile-url"`
