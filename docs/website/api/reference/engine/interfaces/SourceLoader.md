[**@gis-engine/engine v1.0.0**](../index.md)

***

# Interface: SourceLoader

Engine-level contract for validating and introspecting a single source.

Each source type (geojson, raster, pmtiles, vector) may have its own
loader implementation. Loaders are registered with the renderer adapter
and invoked during `MapRuntime.load()` and `validateSpec()`.

This interface is intentionally minimal in v0.1. It does NOT own data
fetching — that remains the renderer adapter's responsibility. Future
versions may add `fetch()`, `abort()`, and `getFeatures()` methods.

## Properties

### sourceId

> `readonly` **sourceId**: `string`

The source id this loader is bound to (matches MapSpec sources key).

## Methods

### validate()

> **validate**(`spec`, `policy`): [`SourceValidationResult`](SourceValidationResult.md)

Validate a source spec against resource policy and type-specific rules.

Implementations must:
- Check URL schemes against the resource policy
- Validate source-type-specific fields (tileSize ranges, zoom ranges, etc.)
- Return structured diagnostics for any violation
- NOT initiate network requests (validation is synchronous/spec-only)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`SourceSpec`](../type-aliases/SourceSpec.md) |
| `policy` | [`ResourcePolicy`](ResourcePolicy.md) |

#### Returns

[`SourceValidationResult`](SourceValidationResult.md)

***

### getCapabilitySummary()

> **getCapabilitySummary**(): [`SourceCapabilitySummary`](SourceCapabilitySummary.md)

Return a static capability summary for this source type.
Does not depend on a specific spec instance.

#### Returns

[`SourceCapabilitySummary`](SourceCapabilitySummary.md)
