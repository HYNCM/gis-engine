[**@gis-engine/engine v1.4.0**](../index.md)

***

# Interface: CreatePMTilesRuntimeLoadPlanOptions

## Properties

### resourcePolicy?

> `optional` **resourcePolicy?**: [`ResourcePolicy`](ResourcePolicy.md)

***

### archivePolicy?

> `optional` **archivePolicy?**: `object`

#### maxArchiveBytes?

> `optional` **maxArchiveBytes?**: `number`

Maximum archive byte size (default: 500MB)

#### maxRootDirectoryBytes?

> `optional` **maxRootDirectoryBytes?**: `number`

Maximum root directory byte length (default: 16MB)

#### allowRangeRequests?

> `optional` **allowRangeRequests?**: `boolean`

Whether range requests are allowed

#### maxRangeSegments?

> `optional` **maxRangeSegments?**: `number`

Maximum number of range request segments

#### timeoutMs?

> `optional` **timeoutMs?**: `number`

Archive open timeout in ms

***

### archiveMetadata?

> `optional` **archiveMetadata?**: `Record`\<`string`, \{ `specVersion`: `3` \| `"3"`; `archiveBytes`: `number`; `rootDirectoryOffset`: `number`; `rootDirectoryLength`: `number`; `hasVectorTiles`: `boolean`; `hasRasterTiles`: `boolean`; `tileType?`: `"raster"` \| `"vector"`; `minZoom?`: `number`; `maxZoom?`: `number`; `bounds?`: \[`number`, `number`, `number`, `number`\]; \} \| `undefined`\>

***

### requireArchiveMetadata?

> `optional` **requireArchiveMetadata?**: `boolean`
