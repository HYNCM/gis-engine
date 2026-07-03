[**@gis-engine/engine v1.4.0**](../index.md)

***

# Function: validatePMTilesArchivePolicy()

> **validatePMTilesArchivePolicy**(`metadata`, `policy?`): [`Diagnostic`](../interfaces/Diagnostic.md)[]

Validate PMTiles archive metadata against policy.
Returns diagnostics without performing any IO.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `metadata` | \{ `specVersion`: `3` \| `"3"`; `archiveBytes`: `number`; `rootDirectoryOffset`: `number`; `rootDirectoryLength`: `number`; `hasVectorTiles`: `boolean`; `hasRasterTiles`: `boolean`; `tileType?`: `"raster"` \| `"vector"`; `minZoom?`: `number`; `maxZoom?`: `number`; `bounds?`: \[`number`, `number`, `number`, `number`\]; \} | `undefined` | - |
| `metadata.specVersion` | `3` \| `"3"` | `...` | PMTiles spec version (must be 3) |
| `metadata.archiveBytes` | `number` | `...` | Total archive byte size |
| `metadata.rootDirectoryOffset` | `number` | `...` | Root directory byte offset |
| `metadata.rootDirectoryLength` | `number` | `...` | Root directory byte length |
| `metadata.hasVectorTiles` | `boolean` | `...` | Whether archive contains vector tiles |
| `metadata.hasRasterTiles` | `boolean` | `...` | Whether archive contains raster tiles |
| `metadata.tileType?` | `"raster"` \| `"vector"` | `...` | Tile type: "vector" or "raster" |
| `metadata.minZoom?` | `number` | `...` | Minimum zoom level |
| `metadata.maxZoom?` | `number` | `...` | Maximum zoom level |
| `metadata.bounds?` | \[`number`, `number`, `number`, `number`\] | `...` | Bounds [west, south, east, north] |
| `policy` | \{ `maxArchiveBytes?`: `number`; `maxRootDirectoryBytes?`: `number`; `allowRangeRequests?`: `boolean`; `maxRangeSegments?`: `number`; `timeoutMs?`: `number`; \} | `defaultPMTilesArchivePolicy` | - |
| `policy.maxArchiveBytes?` | `number` | `...` | Maximum archive byte size (default: 500MB) |
| `policy.maxRootDirectoryBytes?` | `number` | `...` | Maximum root directory byte length (default: 16MB) |
| `policy.allowRangeRequests?` | `boolean` | `...` | Whether range requests are allowed |
| `policy.maxRangeSegments?` | `number` | `...` | Maximum number of range request segments |
| `policy.timeoutMs?` | `number` | `...` | Archive open timeout in ms |

## Returns

[`Diagnostic`](../interfaces/Diagnostic.md)[]
