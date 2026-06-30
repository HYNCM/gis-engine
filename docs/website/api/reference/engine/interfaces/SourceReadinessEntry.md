[**@gis-engine/engine v1.2.0**](../index.md)

***

# Interface: SourceReadinessEntry

## Properties

### sourceId

> **sourceId**: `string`

***

### type

> **type**: `string`

***

### state

> **state**: [`SourceReadinessState`](../type-aliases/SourceReadinessState.md)

***

### displayReady

> **displayReady**: `boolean`

***

### queryReady

> **queryReady**: `boolean`

***

### resourcePolicy

> **resourcePolicy**: [`SourceResourcePolicyStatus`](../type-aliases/SourceResourcePolicyStatus.md)

***

### diagnostics

> **diagnostics**: [`Diagnostic`](Diagnostic.md)[]

***

### limitations

> **limitations**: `string`[]

***

### nextAction

> **nextAction**: `string`

***

### runtimeLoadPlan?

> `optional` **runtimeLoadPlan?**: [`SourceRuntimeReadinessSummary`](SourceRuntimeReadinessSummary.md)

***

### queryEvidence?

> `optional` **queryEvidence?**: [`SourcePMTilesQueryReadinessSummary`](SourcePMTilesQueryReadinessSummary.md)
