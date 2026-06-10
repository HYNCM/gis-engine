[**@gis-engine/cli v1.0.0**](../index.md)

***

# Function: resolveProviderProfile()

> **resolveProviderProfile**(`providerId`, `options?`): [`ProviderProfile`](../interfaces/ProviderProfile.md)

Build a ProviderProfile from CLI config values.
Uses DEFAULT_MODELS / DEFAULT_BASE_URLS when not explicitly provided.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `providerId` | `string` |
| `options?` | \{ `model?`: `string`; `baseUrl?`: `string`; \} |
| `options.model?` | `string` |
| `options.baseUrl?` | `string` |

## Returns

[`ProviderProfile`](../interfaces/ProviderProfile.md)
