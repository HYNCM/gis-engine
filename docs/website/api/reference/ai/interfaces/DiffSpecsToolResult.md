[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: DiffSpecsToolResult

## Properties

### commands

> **commands**: (\{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"addSource"`; `source`: \{ `type`: `"geojson"`; `data`: `unknown`; \} \| \{ `type`: `"raster"`; `tiles`: `string`[]; `tileSize?`: `number`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"pmtiles"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} \| \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `2` \| `1`; \} \| \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} \| \{ `type`: `"vector"`; `tiles`: `string`[]; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"vector"`; `url`: `string`; `minzoom?`: `number`; `maxzoom?`: `number`; `attribution?`: `string`; \}; `sourceId`: `string`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"removeSource"`; `sourceId`: `string`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"addLayer"`; `layer`: \{ `id`: `string`; `type`: `"symbol"` \| `"raster"` \| `"background"` \| `"fill"` \| `"line"` \| `"circle"` \| `"symbol-lite"` \| `"fill-extrusion-lite"` \| `"heatmap"`; `source?`: `string`; `filter?`: `Expression`; `minzoom?`: `number`; `maxzoom?`: `number`; `layout?`: \{\[`key`: `string`\]: `unknown`; \}; `paint?`: \{\[`key`: `string`\]: `unknown`; \}; `metadata?`: \{\[`key`: `string`\]: `unknown`; \}; \}; `beforeLayerId?`: `string`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"removeLayer"`; `layerId`: `string`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setPaint"`; `layerId`: `string`; `paint`: \{\[`key`: `string`\]: `unknown`; \}; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setLayout"`; `layerId`: `string`; `layout`: \{\[`key`: `string`\]: `unknown`; \}; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setFilter"`; `layerId`: `string`; `filter`: `Expression` \| `null`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setLayerZoomRange"`; `layerId`: `string`; `minzoom`: `number`; `maxzoom`: `number`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"reorderLayer"`; `beforeLayerId?`: `string`; `layerId`: `string`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setView"`; `view`: \{ `mode?`: `"scene3d"` \| `"map2d"` \| `"map2_5d"`; `center?`: \[`number`, `number`\]; `zoom?`: `number`; `bearing?`: `number`; `pitch?`: `number`; `bounds?`: \[`number`, `number`, `number`, `number`\]; \}; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setCapabilities"`; `capabilities`: \{ `dimensions?`: (`"2d"` \| `"2_5d"` \| `"3d"`)[]; `renderer?`: `"maplibre"` \| `"webgl2-lite"` \| `"scene3d"`; `experimental?`: `string`[]; \}; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setInteractions"`; `interactions`: \{ `pan?`: `boolean`; `zoom?`: `boolean`; `hover?`: `boolean`; `click?`: `boolean`; `select?`: `boolean`; `popup?`: `boolean`; \}; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"fitBounds"`; `bounds`: \[`number`, `number`, `number`, `number`\]; `padding?`: `number`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setSceneCamera"`; `camera`: \{ `type?`: `"perspective"`; `position`: \[`number`, `number`, `number`\]; `target`: \[`number`, `number`, `number`\]; `up?`: \[`number`, `number`, `number`\]; `fov?`: `number`; `near?`: `number`; `far?`: `number`; \}; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"addSceneSource"`; `source`: \{ `type`: `"terrain-raster-dem"`; `url`: `string`; `encoding?`: `"mapbox"` \| `"terrarium"`; `attribution?`: `string`; \} \| \{ `type`: `"3d-tiles"`; `url`: `string`; `maximumScreenSpaceError?`: `number`; `attribution?`: `string`; \} \| \{ `type`: `"gltf"`; `url`: `string`; `transform?`: \{ `translate?`: \[`number`, `number`, `number`\]; `rotate?`: \[`number`, `number`, `number`\]; `scale?`: `number` \| \[`number`, `number`, `number`\]; \}; `attribution?`: `string`; \}; `sourceId`: `string`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"removeSceneSource"`; `sourceId`: `string`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"addSceneLayer"`; `layer`: \{ `id`: `string`; `type`: `"terrain"`; `source`: `string`; `visible?`: `boolean`; \} \| \{ `id`: `string`; `type`: `"tileset3d"`; `source`: `string`; `visible?`: `boolean`; `pickable?`: `boolean`; \} \| \{ `id`: `string`; `type`: `"model"`; `source`: `string`; `visible?`: `boolean`; `pickable?`: `boolean`; \}; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"removeSceneLayer"`; `layerId`: `string`; \} \| \{ `id`: `string`; `version`: `"0.1"`; `baseRevision?`: `string`; `author?`: \{ `type`: `"human"` \| `"agent"` \| `"system"`; `id?`: `string`; `name?`: `string`; \}; `reason?`: `string`; `createdAt?`: `string`; `sourcePromptHash?`: `string`; `dryRun?`: `boolean`; `type`: `"setSceneLayerVisibility"`; `layerId`: `string`; `visible`: `boolean`; \})[]

***

### summary

> **summary**: [`DiffSpecsSummary`](DiffSpecsSummary.md)

***

### diagnostics

> **diagnostics**: `object`[]

#### severity

> **severity**: `"error"` \| `"warning"` \| `"info"`

#### code

> **code**: `"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`

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
