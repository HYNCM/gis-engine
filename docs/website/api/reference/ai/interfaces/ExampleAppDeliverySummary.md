[**@gis-engine/ai v1.1.0**](../index.md)

***

# Interface: ExampleAppDeliverySummary

## Properties

### status

> **status**: `"blocked"` \| `"ready"` \| `"needs-confirmation"` \| `"follow-up-required"`

***

### acceptance

> **acceptance**: `object`

#### state

> **state**: `"blocked"` \| `"ready"` \| `"needs-confirmation"` \| `"follow-up-required"`

#### ready

> **ready**: `boolean`

#### blocked

> **blocked**: `boolean`

#### needsConfirmation

> **needsConfirmation**: `boolean`

#### followUpRequired

> **followUpRequired**: `boolean`

***

### sections

> **sections**: `object`[]

#### id

> **id**: `"scene-browsing"` \| `"readiness"` \| `"files"` \| `"map-edits"` \| `"data-and-analysis"`

#### status

> **status**: `"blocked"` \| `"ready"` \| `"needs-confirmation"` \| `"follow-up-required"`

#### blockerCount

> **blockerCount**: `number`

#### confirmationRequired

> **confirmationRequired**: `boolean`

#### followUpCount

> **followUpCount**: `number`

***

### confirmations

> **confirmations**: `object`[]

#### reason

> **reason**: `"external-resource"` \| `"network-fetch"` \| `"archive-parsing"` \| `"worker-use"` \| `"file-write"` \| `"stable-scene3d-runtime"`

#### required

> **required**: `boolean`

#### target

> **target**: `string`

#### sourceIds?

> `optional` **sourceIds?**: `string`[]

***

### confirmationRequired

> **confirmationRequired**: `boolean`

***

### followUps

> **followUps**: `object`[]

#### id

> **id**: `string`

#### owner

> **owner**: `string`

#### targetArtifact

> **targetArtifact**: `string`

#### reason

> **reason**: `string`

#### blockerCode?

> `optional` **blockerCode?**: `string`

***

### sourceReadiness

> **sourceReadiness**: `object`[]

#### sourceId

> **sourceId**: `string`

#### type

> **type**: `string`

#### state

> **state**: `"supported"` \| `"readiness-only"` \| `"blocked"`

#### queryReady

> **queryReady**: `boolean`

#### resourcePolicy?

> `optional` **resourcePolicy?**: `"not-applicable"` \| `"not-checked"` \| `"blocked"` \| `"passed"`

#### archiveContract?

> `optional` **archiveContract?**: `object`

##### archiveContract.state

> **state**: `"explicit"` \| `"not-applicable"` \| `"not-checked"`

##### archiveContract.metadataFields

> **metadataFields**: `string`[]

##### archiveContract.policyFields

> **policyFields**: `string`[]

#### sourceContract?

> `optional` **sourceContract?**: `object`

##### sourceContract.kind

> **kind**: `"archive"` \| `"schema"`

##### sourceContract.state

> **state**: `"explicit"` \| `"not-applicable"` \| `"not-checked"`

##### sourceContract.metadataFields

> **metadataFields**: `string`[]

##### sourceContract.policyFields

> **policyFields**: `string`[]

#### runtimeLoadPlan?

> `optional` **runtimeLoadPlan?**: `object`

##### runtimeLoadPlan.status

> **status**: `"blocked"` \| `"ready"` \| `"metadata-required"`

##### runtimeLoadPlan.sourceLayerIds

> **sourceLayerIds**: `string`[]

##### runtimeLoadPlan.diagnosticCounts

> **diagnosticCounts**: `Record`\<`Diagnostic`\[`"severity"`\], `number`\>

##### runtimeLoadPlan.requirements

> **requirements**: `object`

##### runtimeLoadPlan.requirements.mapLibreVectorSource

> **mapLibreVectorSource**: `true`

##### runtimeLoadPlan.requirements.sourceLayerMetadata

> **sourceLayerMetadata**: `true`

##### runtimeLoadPlan.requirements.rangeRequests

> **rangeRequests**: `true`

##### runtimeLoadPlan.requirements.worker

> **worker**: `true`

##### runtimeLoadPlan.requirements.archiveMetadata

> **archiveMetadata**: `boolean`

##### runtimeLoadPlan.requirements.archiveParsing

> **archiveParsing**: `false`

##### runtimeLoadPlan.requirements.featureQuery

> **featureQuery**: `false`

#### queryEvidence?

> `optional` **queryEvidence?**: `SourcePMTilesQueryReadinessSummary`

#### confirmationReasons

> **confirmationReasons**: (`"external-resource"` \| `"network-fetch"` \| `"archive-parsing"` \| `"worker-use"` \| `"file-write"` \| `"stable-scene3d-runtime"`)[]

#### notes

> **notes**: `string`[]

***

### sourcePromotionCandidates?

> `optional` **sourcePromotionCandidates?**: `object`[]

#### candidateId

> **candidateId**: `string`

#### format

> **format**: `"pmtiles"` \| `"flatgeobuf"` \| `"geoparquet"` \| `"geotiff"` \| `"geozarr"`

#### state

> **state**: `"supported"` \| `"readiness-only"` \| `"blocked"`

#### resourcePolicy?

> `optional` **resourcePolicy?**: `"not-applicable"` \| `"not-checked"` \| `"blocked"` \| `"passed"`

#### archiveContract?

> `optional` **archiveContract?**: `object`

##### archiveContract.state

> **state**: `"explicit"` \| `"not-applicable"` \| `"not-checked"`

##### archiveContract.metadataFields

> **metadataFields**: `string`[]

##### archiveContract.policyFields

> **policyFields**: `string`[]

#### sourceContract?

> `optional` **sourceContract?**: `object`

##### sourceContract.kind

> **kind**: `"archive"` \| `"schema"`

##### sourceContract.state

> **state**: `"explicit"` \| `"not-applicable"` \| `"not-checked"`

##### sourceContract.metadataFields

> **metadataFields**: `string`[]

##### sourceContract.policyFields

> **policyFields**: `string`[]

#### target

> **target**: `string`

#### exitCondition

> **exitCondition**: `string`

#### sourceIds

> **sourceIds**: `string`[]

#### notes

> **notes**: `string`[]

***

### spatialQueryReadiness

> **spatialQueryReadiness**: `object`

#### requested

> **requested**: `boolean`

#### state

> **state**: `"blocked"` \| `"ready"` \| `"follow-up-required"` \| `"not-requested"`

#### status

> **status**: `"blocked"` \| `"ready"` \| `"not-requested"`

#### capabilityGateStatus

> **capabilityGateStatus**: `"blocked"` \| `"passed"` \| `"waived"`

#### requiredQueries

> **requiredQueries**: (`"bbox"` \| `"point"`)[]

#### providedQueries

> **providedQueries**: `string`[]

#### caseCount

> **caseCount**: `number`

#### passedCaseCount

> **passedCaseCount**: `number`

#### failedCaseCount

> **failedCaseCount**: `number`

#### resultLimit

> **resultLimit**: `number`

#### resultTruncated

> **resultTruncated**: `boolean`

#### blockerCount

> **blockerCount**: `number`

#### followUpCount

> **followUpCount**: `number`

#### followUpTaskIds

> **followUpTaskIds**: `string`[]

#### queryableLayerIds

> **queryableLayerIds**: `string`[]

#### queryableSourceIds

> **queryableSourceIds**: `string`[]

#### unsupportedSourceIds

> **unsupportedSourceIds**: `string`[]

#### missingSourceIds

> **missingSourceIds**: `string`[]

#### hiddenLayerIds

> **hiddenLayerIds**: `string`[]

#### blockedOperations

> **blockedOperations**: `string`[]

#### cases

> **cases**: `object`[]
