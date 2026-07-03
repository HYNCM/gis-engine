[**@gis-engine/ai v1.4.0**](../index.md)

***

# Interface: ContextSummary

## Properties

### id?

> `optional` **id?**: `string`

***

### revision?

> `optional` **revision?**: `string`

***

### view

> **view**: `ViewSpec`

***

### sources

> **sources**: `object`[]

#### id

> **id**: `string`

#### type

> **type**: `string`

#### sourceContract?

> `optional` **sourceContract?**: `SourceContractSummary`

***

### sourceReadiness

> **sourceReadiness**: `object`[]

#### sourceId

> **sourceId**: `string`

#### type

> **type**: `string`

#### state

> **state**: `SourceReadinessState`

#### queryReady

> **queryReady**: `boolean`

#### resourcePolicy

> **resourcePolicy**: `SourceResourcePolicyState`

#### sourceContract?

> `optional` **sourceContract?**: `SourceContractSummary`

#### archiveContract?

> `optional` **archiveContract?**: `SourceArchiveContractSummary`

#### runtimeLoadPlan?

> `optional` **runtimeLoadPlan?**: `SourceRuntimeLoadPlanSummary`

***

### layers

> **layers**: `object`[]

#### id

> **id**: `string`

#### type

> **type**: `string`

#### source?

> `optional` **source?**: `string`

#### visibility

> **visibility**: `"visible"` \| `"none"`

***

### validation

> **validation**: `object`

#### valid

> **valid**: `boolean`

#### diagnosticCounts

> **diagnosticCounts**: `Record`\<`Diagnostic`\[`"severity"`\], `number`\>

***

### capabilitySummary

> **capabilitySummary**: [`CapabilitySummary`](CapabilitySummary.md)

***

### capabilities?

> `optional` **capabilities?**: `CapabilityReport`

***

### scene3d?

> `optional` **scene3d?**: [`Scene3DContextSummary`](Scene3DContextSummary.md)
