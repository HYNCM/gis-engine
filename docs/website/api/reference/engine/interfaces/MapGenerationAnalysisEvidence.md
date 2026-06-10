[**@gis-engine/engine v1.0.0**](../index.md)

***

# Interface: MapGenerationAnalysisEvidence

## Properties

### requested

> **requested**: `boolean`

***

### status

> **status**: `"ready"` \| `"blocked"` \| `"not-requested"`

***

### requestedOperations

> **requestedOperations**: (`"point-query"` \| `"bbox-query"` \| `"buffer"` \| `"intersection"` \| `"overlay"` \| `"routing"` \| `"aggregation"`)[]

***

### acceptedQueryOperations

> **acceptedQueryOperations**: (`"point-query"` \| `"bbox-query"`)[]

***

### blockedOperations

> **blockedOperations**: (`"point-query"` \| `"bbox-query"` \| `"buffer"` \| `"intersection"` \| `"overlay"` \| `"routing"` \| `"aggregation"`)[]

***

### diagnostics

> **diagnostics**: [`Diagnostic`](Diagnostic.md)[]
