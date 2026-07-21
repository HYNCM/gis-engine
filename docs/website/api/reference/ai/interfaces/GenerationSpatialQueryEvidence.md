[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: GenerationSpatialQueryEvidence

## Properties

### requested

> **requested**: `boolean`

***

### ready

> **ready**: `boolean`

***

### renderer

> **renderer**: `"maplibre"` \| `"mock"`

***

### status

> **status**: `"blocked"` \| `"ready"` \| `"not-requested"`

***

### requestedOperations

> **requestedOperations**: (`"point-query"` \| `"bbox-query"` \| `"aggregation"` \| `"intersection"` \| `"buffer"` \| `"overlay"` \| `"routing"`)[]

***

### acceptedQueryOperations

> **acceptedQueryOperations**: (`"point-query"` \| `"bbox-query"`)[]

***

### blockedOperations

> **blockedOperations**: (`"point-query"` \| `"bbox-query"` \| `"aggregation"` \| `"intersection"` \| `"buffer"` \| `"overlay"` \| `"routing"`)[]

***

### unsupportedOperations

> **unsupportedOperations**: (`"point-query"` \| `"bbox-query"` \| `"aggregation"` \| `"intersection"` \| `"buffer"` \| `"overlay"` \| `"routing"`)[]

***

### capabilityQueries

> **capabilityQueries**: `string`[]

***

### capabilityGate

> **capabilityGate**: `SpatialQueryCapabilityGate`

***

### queryableSourceIds

> **queryableSourceIds**: `string`[]

***

### queryableLayerIds

> **queryableLayerIds**: `string`[]

***

### hiddenLayerIds

> **hiddenLayerIds**: `string`[]

***

### unsupportedSourceIds

> **unsupportedSourceIds**: `string`[]

***

### missingSourceIds

> **missingSourceIds**: `string`[]

***

### cases

> **cases**: [`GenerationSpatialQueryCaseEvidence`](GenerationSpatialQueryCaseEvidence.md)[]

***

### diagnosticCounts

> **diagnosticCounts**: `Record`\<`Diagnostic`\[`"severity"`\], `number`\>
