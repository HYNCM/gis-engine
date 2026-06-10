[**@gis-engine/engine v1.0.0**](../index.md)

***

# Interface: PMTilesRuntimeSourcePlan

## Properties

### sourceId

> **sourceId**: `string`

***

### sourceType

> **sourceType**: `"pmtiles"`

***

### status

> **status**: [`PMTilesRuntimeSourceStatus`](../type-aliases/PMTilesRuntimeSourceStatus.md)

***

### url

> **url**: `string`

***

### layerIds

> **layerIds**: `string`[]

***

### sourceLayerIds

> **sourceLayerIds**: `string`[]

***

### diagnostics

> **diagnostics**: [`Diagnostic`](Diagnostic.md)[]

***

### capabilities

> **capabilities**: [`SourceCapabilitySummary`](SourceCapabilitySummary.md)

***

### metadata?

> `optional` **metadata?**: `object`

#### specVersion

> **specVersion**: `3` \| `"3"`

PMTiles spec version (must be 3)

#### archiveBytes

> **archiveBytes**: `number`

Total archive byte size

#### rootDirectoryOffset

> **rootDirectoryOffset**: `number`

Root directory byte offset

#### rootDirectoryLength

> **rootDirectoryLength**: `number`

Root directory byte length

#### hasVectorTiles

> **hasVectorTiles**: `boolean`

Whether archive contains vector tiles

#### hasRasterTiles

> **hasRasterTiles**: `boolean`

Whether archive contains raster tiles

#### tileType?

> `optional` **tileType?**: `"raster"` \| `"vector"`

Tile type: "vector" or "raster"

#### minZoom?

> `optional` **minZoom?**: `number`

Minimum zoom level

#### maxZoom?

> `optional` **maxZoom?**: `number`

Maximum zoom level

#### bounds?

> `optional` **bounds?**: \[`number`, `number`, `number`, `number`\]

Bounds [west, south, east, north]

***

### requirements

> **requirements**: `object`

#### mapLibreVectorSource

> **mapLibreVectorSource**: `true`

#### sourceLayerMetadata

> **sourceLayerMetadata**: `true`

#### rangeRequests

> **rangeRequests**: `true`

#### worker

> **worker**: `true`

#### archiveMetadata

> **archiveMetadata**: `boolean`

#### archiveParsing

> **archiveParsing**: `false`

#### featureQuery

> **featureQuery**: `false`
