[**@gis-engine/ai v1.5.0**](../index.md)

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

> **view**: `object`

#### mode?

> `optional` **mode?**: `"scene3d"` \| `"map2d"` \| `"map2_5d"`

#### center?

> `optional` **center?**: \[`number`, `number`\]

#### zoom?

> `optional` **zoom?**: `number`

#### bearing?

> `optional` **bearing?**: `number`

#### pitch?

> `optional` **pitch?**: `number`

#### bounds?

> `optional` **bounds?**: \[`number`, `number`, `number`, `number`\]

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

> `optional` **capabilities?**: `object`

#### renderer

> **renderer**: `string`

#### dimensions

> **dimensions**: (`"2d"` \| `"2_5d"` \| `"3d"`)[]

#### sources

> **sources**: `string`[]

#### layers

> **layers**: `string`[]

#### expressions

> **expressions**: `string`[]

#### queries

> **queries**: `string`[]

#### snapshot

> **snapshot**: `object`

##### snapshot.supported

> **supported**: `boolean`

##### snapshot.formats

> **formats**: (`"png"` \| `"jpeg"` \| `"data-url"`)[]

#### experimental

> **experimental**: `string`[]

***

### scene3d?

> `optional` **scene3d?**: [`Scene3DContextSummary`](Scene3DContextSummary.md)
