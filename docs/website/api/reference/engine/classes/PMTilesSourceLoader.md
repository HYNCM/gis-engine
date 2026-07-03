[**@gis-engine/engine v1.4.0**](../index.md)

***

# Class: PMTilesSourceLoader

Engine-level contract for validating and introspecting a single source.

Each source type (geojson, raster, pmtiles, vector) may have its own
loader implementation. Loaders are registered with the renderer adapter
and invoked during `MapRuntime.load()` and `validateSpec()`.

This interface is intentionally minimal in v0.1. It does NOT own data
fetching — that remains the renderer adapter's responsibility. Future
versions may add `fetch()`, `abort()`, and `getFeatures()` methods.

## Implements

- [`SourceLoader`](../interfaces/SourceLoader.md)

## Constructors

### Constructor

> **new PMTilesSourceLoader**(`sourceId`): `PMTilesSourceLoader`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceId` | `string` |

#### Returns

`PMTilesSourceLoader`

## Properties

### sourceId

> `readonly` **sourceId**: `string`

The source id this loader is bound to (matches MapSpec sources key).

#### Implementation of

[`SourceLoader`](../interfaces/SourceLoader.md).[`sourceId`](../interfaces/SourceLoader.md#sourceid)

## Methods

### validate()

> **validate**(`spec`, `policy?`): [`SourceValidationResult`](../interfaces/SourceValidationResult.md)

Validate a source spec against resource policy and type-specific rules.

Implementations must:
- Check URL schemes against the resource policy
- Validate source-type-specific fields (tileSize ranges, zoom ranges, etc.)
- Return structured diagnostics for any violation
- NOT initiate network requests (validation is synchronous/spec-only)

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `spec` | [`SourceSpec`](../type-aliases/SourceSpec.md) | `undefined` |
| `policy` | [`ResourcePolicy`](../interfaces/ResourcePolicy.md) | `defaultResourcePolicy` |

#### Returns

[`SourceValidationResult`](../interfaces/SourceValidationResult.md)

#### Implementation of

[`SourceLoader`](../interfaces/SourceLoader.md).[`validate`](../interfaces/SourceLoader.md#validate)

***

### getCapabilitySummary()

> **getCapabilitySummary**(): [`SourceCapabilitySummary`](../interfaces/SourceCapabilitySummary.md)

Return a static capability summary for this source type.
Does not depend on a specific spec instance.

#### Returns

[`SourceCapabilitySummary`](../interfaces/SourceCapabilitySummary.md)

#### Implementation of

[`SourceLoader`](../interfaces/SourceLoader.md).[`getCapabilitySummary`](../interfaces/SourceLoader.md#getcapabilitysummary)
