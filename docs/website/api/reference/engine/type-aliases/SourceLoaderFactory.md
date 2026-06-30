[**@gis-engine/engine v1.2.0**](../index.md)

***

# Type Alias: SourceLoaderFactory

> **SourceLoaderFactory** = (`sourceId`) => [`SourceLoader`](../interfaces/SourceLoader.md)

Creates a SourceLoader for a given source type and id.

Registered by renderer adapters via the renderer registry.
Example:
  registry.registerSourceLoader("geojson", (id) => new GeoJsonSourceLoader(id));

## Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceId` | `string` |

## Returns

[`SourceLoader`](../interfaces/SourceLoader.md)
