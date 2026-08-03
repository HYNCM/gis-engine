[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: MapGenerationCommandSkeleton

## Properties

### status

> **status**: `"blocked"` \| `"ready"`

***

### targetDomains

> **targetDomains**: (`"feature-display"` \| `"spatial-analysis"` \| `"scene-browsing"`)[]

***

### analysisEvidence

> **analysisEvidence**: [`MapGenerationAnalysisEvidence`](MapGenerationAnalysisEvidence.md)

***

### baseSpec

> **baseSpec**: `object`

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

> **view**: `object` = `ViewSpecSchema`

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

\[`key`: `string`\]: \{ `type`: `"geoparquet"`; `url`: `string`; `metadata`: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \}; `rowCount?`: `number`; `fileBytes?`: `number`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

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

> **view**: `object` = `ViewSpecSchema`

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

\[`key`: `string`\]: \{ `type`: `"geoparquet"`; `url`: `string`; `metadata`: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \}; `rowCount?`: `number`; `fileBytes?`: `number`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}

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

### commands

> **commands**: (\{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"addSource"`; `id`: `string`; `source`: \{ `type`: `"geoparquet"`; `url`: `string`; `metadata`: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[..., ...\]; `xmax`: \[..., ...\]; `ymin`: \[..., ...\]; `ymax`: \[..., ...\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \}; `rowCount?`: `number`; `fileBytes?`: `number`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}; `version`: `"0.1"`; `sourceId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"removeSource"`; `id`: `string`; `version`: `"0.1"`; `sourceId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `beforeLayerId?`: `string`; `type`: `"addLayer"`; `id`: `string`; `version`: `"0.1"`; `layer`: \{ `id`: `string`; `type`: `"symbol"` \| `"fill"` \| `"raster"` \| `"background"` \| `"line"` \| `"circle"` \| `"symbol-lite"` \| `"fill-extrusion-lite"` \| `"heatmap"`; `source?`: `string`; `filter?`: [`Expression`](../type-aliases/Expression.md); `minzoom?`: `number`; `maxzoom?`: `number`; `layout?`: \{\[`key`: `string`\]: `unknown`; \}; `paint?`: \{\[`key`: `string`\]: `unknown`; \}; `metadata?`: \{\[`key`: `string`\]: `unknown`; \}; \}; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"removeLayer"`; `id`: `string`; `version`: `"0.1"`; `layerId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setPaint"`; `id`: `string`; `paint`: \{\[`key`: `string`\]: `unknown`; \}; `version`: `"0.1"`; `layerId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setLayout"`; `id`: `string`; `layout`: \{\[`key`: `string`\]: `unknown`; \}; `version`: `"0.1"`; `layerId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `filter`: [`Expression`](../type-aliases/Expression.md) \| `null`; `type`: `"setFilter"`; `id`: `string`; `version`: `"0.1"`; `layerId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setLayerZoomRange"`; `minzoom`: `number`; `maxzoom`: `number`; `id`: `string`; `version`: `"0.1"`; `layerId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `beforeLayerId?`: `string`; `type`: `"reorderLayer"`; `id`: `string`; `version`: `"0.1"`; `layerId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setView"`; `id`: `string`; `version`: `"0.1"`; `view`: \{ `mode?`: `"scene3d"` \| `"map2d"` \| `"map2_5d"`; `center?`: \[`number`, `number`\]; `zoom?`: `number`; `bearing?`: `number`; `pitch?`: `number`; `bounds?`: \[`number`, `number`, `number`, `number`\]; \}; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setCapabilities"`; `id`: `string`; `version`: `"0.1"`; `capabilities`: \{ `dimensions?`: (`"2d"` \| `"2_5d"` \| `"3d"`)[]; `renderer?`: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`; `experimental?`: `string`[]; \}; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setInteractions"`; `id`: `string`; `version`: `"0.1"`; `interactions`: \{ `pan?`: `boolean`; `zoom?`: `boolean`; `hover?`: `boolean`; `click?`: `boolean`; `select?`: `boolean`; `popup?`: `boolean`; \}; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `padding?`: `number`; `type`: `"fitBounds"`; `bounds`: \[`number`, `number`, `number`, `number`\]; `id`: `string`; `version`: `"0.1"`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setSceneCamera"`; `id`: `string`; `version`: `"0.1"`; `camera`: \{ `type?`: `"perspective"`; `position`: \[`number`, `number`, `number`\]; `target`: \[`number`, `number`, `number`\]; `up?`: \[`number`, `number`, `number`\]; `fov?`: `number`; `near?`: `number`; `far?`: `number`; \}; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"addSceneSource"`; `id`: `string`; `source`: \{ `type`: `"terrain-raster-dem"`; `url`: `string`; `encoding?`: `"mapbox"` \| `"terrarium"`; `attribution?`: `string`; \} \| \{ `type`: `"3d-tiles"`; `url`: `string`; `maximumScreenSpaceError?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"gltf"`; `url`: `string`; `transform?`: \{ `translate?`: \[`number`, `number`, `number`\]; `rotate?`: \[`number`, `number`, `number`\]; `scale?`: `number` \| \[`number`, `number`, `number`\]; \}; `attribution?`: `string`; \}; `version`: `"0.1"`; `sourceId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"removeSceneSource"`; `id`: `string`; `version`: `"0.1"`; `sourceId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"addSceneLayer"`; `id`: `string`; `version`: `"0.1"`; `layer`: \{ `id`: `string`; `type`: `"terrain"`; `source`: `string`; `visible?`: `boolean`; \} \| \{ `id`: `string`; `type`: `"tileset3d"`; `source`: `string`; `visible?`: `boolean`; `pickable?`: `boolean`; \} \| \{ `id`: `string`; `type`: `"model"`; `source`: `string`; `visible?`: `boolean`; `pickable?`: `boolean`; \}; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"removeSceneLayer"`; `id`: `string`; `version`: `"0.1"`; `layerId`: `string`; \} \| \{ `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setSceneLayerVisibility"`; `id`: `string`; `version`: `"0.1"`; `visible`: `boolean`; `layerId`: `string`; \})[]

***

### diagnostics

> **diagnostics**: `object`[]

#### severity

> **severity**: `"error"` \| `"warning"` \| `"info"`

#### code

> **code**: `"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED"` \| `"PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED"` \| `"GEOPARQUET.VERSION_REQUIRED"` \| `"GEOPARQUET.VERSION_UNSUPPORTED"` \| `"GEOPARQUET.METADATA_AMBIGUOUS"` \| `"GEOPARQUET.METADATA_INCOMPATIBLE"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"` = `DiagnosticCodeSchema`

#### blockerCode?

> `optional` **blockerCode?**: `"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`

#### message

> **message**: `string`

#### path?

> `optional` **path?**: `string`

#### relatedResources?

> `optional` **relatedResources?**: `object`[]

#### fix?

> `optional` **fix?**: `object`

##### fix.kind

> **kind**: `"command"` \| `"json-patch"` \| `"manual"`

##### fix.confidence

> **confidence**: `"high"` \| `"medium"` \| `"low"`

##### fix.message

> **message**: `string`

##### fix.patch?

> `optional` **patch?**: `object`[]

##### fix.command?

> `optional` **command?**: `unknown`

***

### traceId

> **traceId**: `string`
