[**@gis-engine/engine v1.1.0**](../index.md)

***

# Interface: SourceCapabilitySummary

Describes runtime characteristics of a source type.
Used by AI tooling and capability reports to determine what
operations are feasible without probing the renderer.

## Properties

### sourceType

> **sourceType**: `string`

The source type identifier (e.g. "geojson", "raster", "pmtiles", "vector").

***

### supportsStreaming

> **supportsStreaming**: `boolean`

Whether the source supports progressive/streaming loading.

***

### supportsRandomAccess

> **supportsRandomAccess**: `boolean`

Whether the source supports random-access queries (e.g. feature lookup by id).

***

### requiresWorker

> **requiresWorker**: `boolean`

Whether loading or decoding may require a Web Worker.

***

### estimatedByteSize?

> `optional` **estimatedByteSize?**: `number`

Estimated on-wire or on-disk byte size, if known.

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Additional source-type-specific metadata.
