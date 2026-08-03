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

#### fixtureEvidenceReady?

> `optional` **fixtureEvidenceReady?**: `boolean`

#### fixtureEvidenceStatus?

> `optional` **fixtureEvidenceStatus?**: `PMTilesFixtureEvidenceStatus`

#### resourcePolicy

> **resourcePolicy**: `SourceResourcePolicyState`

#### sourceContract?

> `optional` **sourceContract?**: `SourceContractSummary`

#### archiveContract?

> `optional` **archiveContract?**: `SourceArchiveContractSummary`

#### capabilityDecision?

> `optional` **capabilityDecision?**: `object`

##### capabilityDecision.display

> `readonly` **display**: `object`

##### capabilityDecision.display.status

> `readonly` **status**: `"go"`

##### capabilityDecision.display.scope

> `readonly` **scope**: `"url-compatible-maplibre-vector-display"`

##### capabilityDecision.load

> `readonly` **load**: `object`

##### capabilityDecision.load.status

> `readonly` **status**: `"no-go"`

##### capabilityDecision.load.scope

> `readonly` **scope**: `"runtime-archive-load"`

##### capabilityDecision.load.blockerCode

> `readonly` **blockerCode**: `"PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED"`

##### capabilityDecision.featureQuery

> `readonly` **featureQuery**: `object`

##### capabilityDecision.featureQuery.status

> `readonly` **status**: `"no-go"`

##### capabilityDecision.featureQuery.scope

> `readonly` **scope**: `"runtime-archive-feature-query"`

##### capabilityDecision.featureQuery.blockerCode

> `readonly` **blockerCode**: `"PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED"`

##### capabilityDecision.loadPlan

> `readonly` **loadPlan**: `object`

##### capabilityDecision.loadPlan.status

> `readonly` **status**: `"go"`

##### capabilityDecision.loadPlan.scope

> `readonly` **scope**: `"io-free-caller-metadata-preflight"`

##### capabilityDecision.loadGates

> `readonly` **loadGates**: readonly \[`"archive-metadata"`, `"columnar-directory-lookup"`, `"offset-continuation"`, `"internal-compression"`, `"leaf-directory-traversal"`, `"cancellation"`, `"byte-budget"`, `"range-budget"`, `"cache-behavior"`, `"resource-policy-before-io"`\]

##### capabilityDecision.featureQueryGates

> `readonly` **featureQueryGates**: readonly \[`"query-semantics"`, `"query-diagnostics"`, `"adapter-boundary"`, `"payload-free-evidence"`, `"query-tests"`, `"docs"`\]

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
