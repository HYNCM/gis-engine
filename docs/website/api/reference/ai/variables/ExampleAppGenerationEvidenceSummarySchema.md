[**@gis-engine/ai v1.0.0**](../index.md)

***

# Variable: ExampleAppGenerationEvidenceSummarySchema

> `const` **ExampleAppGenerationEvidenceSummarySchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.promptHash

> `readonly` **promptHash**: `object`

#### properties.promptHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.status

> `readonly` **status**: `object`

#### properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`\]

#### properties.delivery

> `readonly` **delivery**: `object` = `ExampleAppDeliverySummarySchema`

#### properties.delivery.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.status

> `readonly` **status**: `object` = `DeliveryStatusSchema`

#### properties.delivery.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.delivery.properties.acceptance

> `readonly` **acceptance**: `object`

#### properties.delivery.properties.acceptance.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.acceptance.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.acceptance.properties.state

> `readonly` **state**: `object` = `DeliveryStatusSchema`

#### properties.delivery.properties.acceptance.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.acceptance.properties.state.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.delivery.properties.acceptance.properties.ready

> `readonly` **ready**: `object`

#### properties.delivery.properties.acceptance.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.acceptance.properties.blocked

> `readonly` **blocked**: `object`

#### properties.delivery.properties.acceptance.properties.blocked.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.acceptance.properties.needsConfirmation

> `readonly` **needsConfirmation**: `object`

#### properties.delivery.properties.acceptance.properties.needsConfirmation.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.acceptance.properties.followUpRequired

> `readonly` **followUpRequired**: `object`

#### properties.delivery.properties.acceptance.properties.followUpRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.acceptance.required

> `readonly` **required**: readonly \[`"state"`, `"ready"`, `"blocked"`, `"needsConfirmation"`, `"followUpRequired"`\]

#### properties.delivery.properties.acceptance.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sections

> `readonly` **sections**: `object`

#### properties.delivery.properties.sections.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sections.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sections.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sections.items.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sections.items.properties.id

> `readonly` **id**: `object` = `DeliverySectionIdSchema`

#### properties.delivery.properties.sections.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sections.items.properties.id.enum

> `readonly` **enum**: readonly \[`"readiness"`, `"files"`, `"map-edits"`, `"data-and-analysis"`, `"scene-browsing"`\]

#### properties.delivery.properties.sections.items.properties.status

> `readonly` **status**: `object` = `DeliveryStatusSchema`

#### properties.delivery.properties.sections.items.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sections.items.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.delivery.properties.sections.items.properties.blockerCount

> `readonly` **blockerCount**: `object`

#### properties.delivery.properties.sections.items.properties.blockerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.sections.items.properties.confirmationRequired

> `readonly` **confirmationRequired**: `object`

#### properties.delivery.properties.sections.items.properties.confirmationRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.sections.items.properties.followUpCount

> `readonly` **followUpCount**: `object`

#### properties.delivery.properties.sections.items.properties.followUpCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.sections.items.required

> `readonly` **required**: readonly \[`"id"`, `"status"`, `"blockerCount"`, `"confirmationRequired"`, `"followUpCount"`\]

#### properties.delivery.properties.sections.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.confirmations

> `readonly` **confirmations**: `object`

#### properties.delivery.properties.confirmations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.confirmations.items

> `readonly` **items**: `object`

#### properties.delivery.properties.confirmations.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.confirmations.items.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.confirmations.items.properties.reason

> `readonly` **reason**: `object` = `DeliveryConfirmationReasonSchema`

#### properties.delivery.properties.confirmations.items.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.confirmations.items.properties.reason.enum

> `readonly` **enum**: readonly \[`"external-resource"`, `"network-fetch"`, `"archive-parsing"`, `"worker-use"`, `"file-write"`, `"stable-scene3d-runtime"`\]

#### properties.delivery.properties.confirmations.items.properties.required

> `readonly` **required**: `object`

#### properties.delivery.properties.confirmations.items.properties.required.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.confirmations.items.properties.target

> `readonly` **target**: `object`

#### properties.delivery.properties.confirmations.items.properties.target.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.confirmations.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.delivery.properties.confirmations.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.confirmations.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.confirmations.items.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.confirmations.items.required

> `readonly` **required**: readonly \[`"reason"`, `"required"`, `"target"`\]

#### properties.delivery.properties.confirmations.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.confirmationRequired

> `readonly` **confirmationRequired**: `object`

#### properties.delivery.properties.confirmationRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.followUps

> `readonly` **followUps**: `object`

#### properties.delivery.properties.followUps.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.followUps.items

> `readonly` **items**: `object`

#### properties.delivery.properties.followUps.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.followUps.items.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.followUps.items.properties.id

> `readonly` **id**: `object`

#### properties.delivery.properties.followUps.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.followUps.items.properties.owner

> `readonly` **owner**: `object`

#### properties.delivery.properties.followUps.items.properties.owner.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.followUps.items.properties.targetArtifact

> `readonly` **targetArtifact**: `object`

#### properties.delivery.properties.followUps.items.properties.targetArtifact.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.followUps.items.properties.reason

> `readonly` **reason**: `object`

#### properties.delivery.properties.followUps.items.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.followUps.items.properties.blockerCode

> `readonly` **blockerCode**: `object`

#### properties.delivery.properties.followUps.items.properties.blockerCode.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.followUps.items.required

> `readonly` **required**: readonly \[`"id"`, `"owner"`, `"targetArtifact"`, `"reason"`\]

#### properties.delivery.properties.followUps.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness

> `readonly` **sourceReadiness**: `object`

#### properties.delivery.properties.sourceReadiness.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceId

> `readonly` **sourceId**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.type

> `readonly` **type**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.state

> `readonly` **state**: `object` = `SourceReadinessStateSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.state.enum

> `readonly` **enum**: readonly \[`"supported"`, `"readiness-only"`, `"blocked"`\]

#### properties.delivery.properties.sourceReadiness.items.properties.queryReady

> `readonly` **queryReady**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryReady.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.sourceReadiness.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.resourcePolicy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.resourcePolicy.enum

> `readonly` **enum**: readonly \[`"passed"`, `"blocked"`, `"not-applicable"`, `"not-checked"`\]

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract

> `readonly` **archiveContract**: `object` = `SourceArchiveContractSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.state

> `readonly` **state**: `object` = `SourceArchiveContractStateSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.required

> `readonly` **required**: readonly \[`"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.delivery.properties.sourceReadiness.items.properties.archiveContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object` = `SourceContractKindSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.state

> `readonly` **state**: `object` = `SourceArchiveContractStateSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.required

> `readonly` **required**: readonly \[`"kind"`, `"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.delivery.properties.sourceReadiness.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan

> `readonly` **runtimeLoadPlan**: `object` = `SourceRuntimeLoadPlanSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status

> `readonly` **status**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds

> `readonly` **sourceLayerIds**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.error

> `readonly` **error**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.info

> `readonly` **info**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements

> `readonly` **requirements**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.mapLibreVectorSource

> `readonly` **mapLibreVectorSource**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.sourceLayerMetadata

> `readonly` **sourceLayerMetadata**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.rangeRequests

> `readonly` **rangeRequests**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.worker

> `readonly` **worker**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveMetadata

> `readonly` **archiveMetadata**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveParsing

> `readonly` **archiveParsing**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.featureQuery

> `readonly` **featureQuery**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.required

> `readonly` **required**: readonly \[`"status"`, `"sourceLayerIds"`, `"diagnosticCounts"`, `"requirements"`\]

#### properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence

> `readonly` **queryEvidence**: `object` = `SourcePMTilesQueryEvidenceSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.status

> `readonly` **status**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.status.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds

> `readonly` **sourceLayerIds**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds

> `readonly` **layerIds**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements

> `readonly` **requirements**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.callerSuppliedDecodedFeatures

> `readonly` **callerSuppliedDecodedFeatures**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.archiveParsing

> `readonly` **archiveParsing**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.hiddenFetch

> `readonly` **hiddenFetch**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.rangeRequests

> `readonly` **rangeRequests**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.worker

> `readonly` **worker**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.featurePayloadReturned

> `readonly` **featurePayloadReturned**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary

> `readonly` **summary**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.caseCount

> `readonly` **caseCount**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.readyCaseCount

> `readonly` **readyCaseCount**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.emptyCaseCount

> `readonly` **emptyCaseCount**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.blockedCaseCount

> `readonly` **blockedCaseCount**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.matchedFeatureCount

> `readonly` **matchedFeatureCount**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.returnedFeatureCount

> `readonly` **returnedFeatureCount**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.resultTruncated

> `readonly` **resultTruncated**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.required

> `readonly` **required**: readonly \[`"status"`, `"sourceLayerIds"`, `"layerIds"`, `"diagnosticCounts"`, `"requirements"`, `"summary"`\]

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons

> `readonly` **confirmationReasons**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons.items

> `readonly` **items**: `object` = `DeliveryConfirmationReasonSchema`

#### properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons.items.enum

> `readonly` **enum**: readonly \[`"external-resource"`, `"network-fetch"`, `"archive-parsing"`, `"worker-use"`, `"file-write"`, `"stable-scene3d-runtime"`\]

#### properties.delivery.properties.sourceReadiness.items.properties.notes

> `readonly` **notes**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.notes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourceReadiness.items.properties.notes.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.notes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourceReadiness.items.required

> `readonly` **required**: readonly \[`"sourceId"`, `"type"`, `"state"`, `"queryReady"`, `"confirmationReasons"`, `"notes"`\]

#### properties.delivery.properties.sourceReadiness.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourcePromotionCandidates

> `readonly` **sourcePromotionCandidates**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourcePromotionCandidates.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.candidateId

> `readonly` **candidateId**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.candidateId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.format

> `readonly` **format**: `object` = `SourcePromotionCandidateFormatSchema`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.format.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.format.enum

> `readonly` **enum**: readonly \[`"pmtiles"`, `"geoparquet"`, `"flatgeobuf"`, `"geotiff"`, `"geozarr"`\]

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.state

> `readonly` **state**: `object` = `SourceReadinessStateSchema`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.state.enum

> `readonly` **enum**: readonly \[`"supported"`, `"readiness-only"`, `"blocked"`\]

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.resourcePolicy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.resourcePolicy.enum

> `readonly` **enum**: readonly \[`"passed"`, `"blocked"`, `"not-applicable"`, `"not-checked"`\]

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract

> `readonly` **archiveContract**: `object` = `SourceArchiveContractSchema`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.state

> `readonly` **state**: `object` = `SourceArchiveContractStateSchema`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.required

> `readonly` **required**: readonly \[`"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object` = `SourceContractKindSchema`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.state

> `readonly` **state**: `object` = `SourceArchiveContractStateSchema`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.required

> `readonly` **required**: readonly \[`"kind"`, `"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.target

> `readonly` **target**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.target.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.exitCondition

> `readonly` **exitCondition**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.exitCondition.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.notes

> `readonly` **notes**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.notes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.notes.items

> `readonly` **items**: `object`

#### properties.delivery.properties.sourcePromotionCandidates.items.properties.notes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.sourcePromotionCandidates.items.required

> `readonly` **required**: readonly \[`"candidateId"`, `"format"`, `"state"`, `"target"`, `"exitCondition"`, `"sourceIds"`, `"notes"`\]

#### properties.delivery.properties.sourcePromotionCandidates.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.spatialQueryReadiness

> `readonly` **spatialQueryReadiness**: `object`

#### properties.delivery.properties.spatialQueryReadiness.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.spatialQueryReadiness.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.requested

> `readonly` **requested**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.spatialQueryReadiness.properties.state

> `readonly` **state**: `object` = `SpatialQueryReadinessStateSchema`

#### properties.delivery.properties.spatialQueryReadiness.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.state.enum

> `readonly` **enum**: readonly \[`"not-requested"`, `"ready"`, `"blocked"`, `"follow-up-required"`\]

#### properties.delivery.properties.spatialQueryReadiness.properties.status

> `readonly` **status**: `object` = `SpatialQueryEvidenceStatusSchema`

#### properties.delivery.properties.spatialQueryReadiness.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"not-requested"`\]

#### properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus

> `readonly` **capabilityGateStatus**: `object` = `SpatialQueryCapabilityGateStatusSchema`

#### properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus.enum

> `readonly` **enum**: readonly \[`"passed"`, `"waived"`, `"blocked"`\]

#### properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries

> `readonly` **requiredQueries**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.items.enum

> `readonly` **enum**: readonly \[`"point"`, `"bbox"`\]

#### properties.delivery.properties.spatialQueryReadiness.properties.providedQueries

> `readonly` **providedQueries**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.providedQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.providedQueries.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.providedQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.caseCount

> `readonly` **caseCount**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.caseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.spatialQueryReadiness.properties.passedCaseCount

> `readonly` **passedCaseCount**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.passedCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.spatialQueryReadiness.properties.failedCaseCount

> `readonly` **failedCaseCount**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.failedCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.spatialQueryReadiness.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.resultLimit.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.spatialQueryReadiness.properties.resultTruncated

> `readonly` **resultTruncated**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.resultTruncated.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.spatialQueryReadiness.properties.blockerCount

> `readonly` **blockerCount**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.blockerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.spatialQueryReadiness.properties.followUpCount

> `readonly` **followUpCount**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.followUpCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds

> `readonly` **followUpTaskIds**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds

> `readonly` **queryableLayerIds**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds

> `readonly` **queryableSourceIds**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds

> `readonly` **unsupportedSourceIds**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds

> `readonly` **missingSourceIds**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds

> `readonly` **hiddenLayerIds**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations

> `readonly` **blockedOperations**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases

> `readonly` **cases**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.id

> `readonly` **id**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.state

> `readonly` **state**: `object` = `SpatialQueryCaseReadinessStateSchema`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.state.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.operation

> `readonly` **operation**: `object` = `SpatialQueryOperationSchema`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.operation.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.operation.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.layerIds

> `readonly` **layerIds**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.layerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.layerIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.layerIds.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds.items.type

> `readonly` **type**: ... = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.featureCount

> `readonly` **featureCount**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.featureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.resultLimit.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.resultTruncated

> `readonly` **resultTruncated**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.resultTruncated.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.fixtureHash

> `readonly` **fixtureHash**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.fixtureHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.error

> `readonly` **error**: ...

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: ...

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.info

> `readonly` **info**: ...

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[..., ..., ...\]

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.required

> `readonly` **required**: readonly \[`"id"`, `"state"`, `"operation"`, `"layerIds"`, `"sourceIds"`, `"featureCount"`, `"resultLimit"`, `"resultTruncated"`, `"fixtureHash"`, `"diagnosticCounts"`\]

#### properties.delivery.properties.spatialQueryReadiness.properties.cases.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.properties.spatialQueryReadiness.required

> `readonly` **required**: readonly \[`"requested"`, `"state"`, `"status"`, `"capabilityGateStatus"`, `"requiredQueries"`, `"providedQueries"`, `"caseCount"`, `"passedCaseCount"`, `"failedCaseCount"`, `"resultLimit"`, `"resultTruncated"`, `"blockerCount"`, `"followUpCount"`, `"followUpTaskIds"`, `"queryableLayerIds"`, `"queryableSourceIds"`, `"unsupportedSourceIds"`, `"missingSourceIds"`, `"hiddenLayerIds"`, `"blockedOperations"`, `"cases"`\]

#### properties.delivery.properties.spatialQueryReadiness.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.delivery.required

> `readonly` **required**: readonly \[`"status"`, `"acceptance"`, `"sections"`, `"confirmations"`, `"confirmationRequired"`, `"followUps"`, `"sourceReadiness"`, `"spatialQueryReadiness"`\]

#### properties.delivery.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.targetDomains

> `readonly` **targetDomains**: `object`

#### properties.targetDomains.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.targetDomains.items

> `readonly` **items**: `object`

#### properties.targetDomains.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.targetDomains.items.enum

> `readonly` **enum**: readonly \[`"feature-display"`, `"spatial-analysis"`, `"scene-browsing"`\]

#### properties.toolSequence

> `readonly` **toolSequence**: `object`

#### properties.toolSequence.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.toolSequence.items

> `readonly` **items**: `object`

#### properties.toolSequence.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.toolSequence.items.enum

> `readonly` **enum**: readonly \[`"validate_spec"`, `"apply_commands"`, `"export_spec"`, `"get_context_summary"`, `"snapshot_spec"`, `"explain_spec"`, `"export_example_app"`\]

#### properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.command

> `readonly` **command**: `object`

#### properties.command.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.command.properties

> `readonly` **properties**: `object`

#### properties.command.properties.usedApplyCommands

> `readonly` **usedApplyCommands**: `object`

#### properties.command.properties.usedApplyCommands.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.command.properties.commandCount

> `readonly` **commandCount**: `object`

#### properties.command.properties.commandCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.command.properties.committed

> `readonly` **committed**: `object`

#### properties.command.properties.committed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.command.properties.rolledBack

> `readonly` **rolledBack**: `object`

#### properties.command.properties.rolledBack.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.command.required

> `readonly` **required**: readonly \[`"usedApplyCommands"`, `"commandCount"`, `"committed"`, `"rolledBack"`\]

#### properties.command.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.planner

> `readonly` **planner**: `object`

#### properties.planner.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.planner.properties

> `readonly` **properties**: `object`

#### properties.planner.properties.provided

> `readonly` **provided**: `object`

#### properties.planner.properties.provided.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.planner.properties.confidenceLevel

> `readonly` **confidenceLevel**: `object`

#### properties.planner.properties.confidenceLevel.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.planner.properties.confidenceLevel.enum

> `readonly` **enum**: readonly \[`"high"`, `"medium"`, `"low"`, `"unknown"`\]

#### properties.planner.properties.unsupportedIntentCount

> `readonly` **unsupportedIntentCount**: `object`

#### properties.planner.properties.unsupportedIntentCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.planner.required

> `readonly` **required**: readonly \[`"provided"`, `"confidenceLevel"`, `"unsupportedIntentCount"`\]

#### properties.planner.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQuery

> `readonly` **spatialQuery**: `object`

#### properties.spatialQuery.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQuery.properties

> `readonly` **properties**: `object`

#### properties.spatialQuery.properties.requested

> `readonly` **requested**: `object`

#### properties.spatialQuery.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQuery.properties.ready

> `readonly` **ready**: `object`

#### properties.spatialQuery.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQuery.properties.status

> `readonly` **status**: `object`

#### properties.spatialQuery.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQuery.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"not-requested"`\]

#### properties.spatialQuery.properties.caseCount

> `readonly` **caseCount**: `object`

#### properties.spatialQuery.properties.caseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQuery.properties.blockedOperations

> `readonly` **blockedOperations**: `object`

#### properties.spatialQuery.properties.blockedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQuery.properties.blockedOperations.items

> `readonly` **items**: `object`

#### properties.spatialQuery.properties.blockedOperations.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQuery.required

> `readonly` **required**: readonly \[`"requested"`, `"ready"`, `"status"`, `"caseCount"`, `"blockedOperations"`\]

#### properties.spatialQuery.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sceneBrowsing

> `readonly` **sceneBrowsing**: `object`

#### properties.sceneBrowsing.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sceneBrowsing.properties

> `readonly` **properties**: `object`

#### properties.sceneBrowsing.properties.requested

> `readonly` **requested**: `object`

#### properties.sceneBrowsing.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sceneBrowsing.properties.status

> `readonly` **status**: `object`

#### properties.sceneBrowsing.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sceneBrowsing.properties.status.enum

> `readonly` **enum**: readonly \[`"experimental"`, `"blocked"`, `"not-requested"`\]

#### properties.sceneBrowsing.properties.extensionPresent

> `readonly` **extensionPresent**: `object`

#### properties.sceneBrowsing.properties.extensionPresent.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sceneBrowsing.properties.stableViewMode

> `readonly` **stableViewMode**: `object`

#### properties.sceneBrowsing.properties.stableViewMode.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sceneBrowsing.properties.stableViewMode.const

> `readonly` **const**: `false` = `false`

#### properties.sceneBrowsing.properties.runtimeSupported

> `readonly` **runtimeSupported**: `object`

#### properties.sceneBrowsing.properties.runtimeSupported.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sceneBrowsing.properties.runtimeSupported.const

> `readonly` **const**: `false` = `false`

#### properties.sceneBrowsing.properties.stableRuntimeBlocked

> `readonly` **stableRuntimeBlocked**: `object`

#### properties.sceneBrowsing.properties.stableRuntimeBlocked.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sceneBrowsing.properties.stableRuntimeBlocked.const

> `readonly` **const**: `true` = `true`

#### properties.sceneBrowsing.properties.state

> `readonly` **state**: `object`

#### properties.sceneBrowsing.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sceneBrowsing.properties.state.enum

> `readonly` **enum**: readonly \[`"extension-only"`, `"blocked"`, `"not-requested"`\]

#### properties.sceneBrowsing.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.sceneBrowsing.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sceneBrowsing.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.sceneBrowsing.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sceneBrowsing.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.sceneBrowsing.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sceneBrowsing.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.sceneBrowsing.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sceneBrowsing.properties.layerIds

> `readonly` **layerIds**: `object`

#### properties.sceneBrowsing.properties.layerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sceneBrowsing.properties.layerIds.items

> `readonly` **items**: `object`

#### properties.sceneBrowsing.properties.layerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sceneBrowsing.properties.pickableLayerCount

> `readonly` **pickableLayerCount**: `object`

#### properties.sceneBrowsing.properties.pickableLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sceneBrowsing.properties.mockSnapshotPassed

> `readonly` **mockSnapshotPassed**: `object`

#### properties.sceneBrowsing.properties.mockSnapshotPassed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sceneBrowsing.properties.mockQueryPickCount

> `readonly` **mockQueryPickCount**: `object`

#### properties.sceneBrowsing.properties.mockQueryPickCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sceneBrowsing.properties.stableRuntimeBlockerCodes

> `readonly` **stableRuntimeBlockerCodes**: `object`

#### properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items

> `readonly` **items**: `object` = `Scene3DStableRuntimeBlockerCodeSchema`

#### properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items.enum

> `readonly` **enum**: (`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`)[]

#### properties.sceneBrowsing.required

> `readonly` **required**: readonly \[`"requested"`, `"status"`, `"extensionPresent"`, `"stableViewMode"`, `"runtimeSupported"`, `"stableRuntimeBlocked"`, `"state"`, `"sourceCount"`, `"layerCount"`, `"sourceIds"`, `"layerIds"`, `"pickableLayerCount"`, `"mockSnapshotPassed"`, `"mockQueryPickCount"`, `"stableRuntimeBlockerCodes"`\]

#### properties.sceneBrowsing.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.snapshot

> `readonly` **snapshot**: `object`

#### properties.snapshot.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.snapshot.properties

> `readonly` **properties**: `object`

#### properties.snapshot.properties.requested

> `readonly` **requested**: `object`

#### properties.snapshot.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.snapshot.properties.renderer

> `readonly` **renderer**: `object`

#### properties.snapshot.properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.snapshot.properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.snapshot.properties.passed

> `readonly` **passed**: `object`

#### properties.snapshot.properties.passed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.snapshot.required

> `readonly` **required**: readonly \[`"requested"`, `"renderer"`, `"passed"`\]

#### properties.snapshot.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.export

> `readonly` **export**: `object`

#### properties.export.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.export.properties

> `readonly` **properties**: `object`

#### properties.export.properties.ready

> `readonly` **ready**: `object`

#### properties.export.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.export.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.export.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.export.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.export.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.export.required

> `readonly` **required**: readonly \[`"ready"`, `"sourceCount"`, `"layerCount"`\]

#### properties.export.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"status"`, `"delivery"`, `"targetDomains"`, `"toolSequence"`, `"diagnosticCounts"`, `"command"`, `"planner"`, `"spatialQuery"`, `"sceneBrowsing"`, `"snapshot"`, `"export"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
