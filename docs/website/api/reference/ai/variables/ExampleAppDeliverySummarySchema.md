[**@gis-engine/ai v1.5.0**](../index.md)

***

# Variable: ExampleAppDeliverySummarySchema

> `const` **ExampleAppDeliverySummarySchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.status

> `readonly` **status**: `object` = `DeliveryStatusSchema`

#### properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.acceptance

> `readonly` **acceptance**: `object`

#### properties.acceptance.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.acceptance.properties

> `readonly` **properties**: `object`

#### properties.acceptance.properties.state

> `readonly` **state**: `object` = `DeliveryStatusSchema`

#### properties.acceptance.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.acceptance.properties.state.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.acceptance.properties.ready

> `readonly` **ready**: `object`

#### properties.acceptance.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.acceptance.properties.blocked

> `readonly` **blocked**: `object`

#### properties.acceptance.properties.blocked.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.acceptance.properties.needsConfirmation

> `readonly` **needsConfirmation**: `object`

#### properties.acceptance.properties.needsConfirmation.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.acceptance.properties.followUpRequired

> `readonly` **followUpRequired**: `object`

#### properties.acceptance.properties.followUpRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.acceptance.required

> `readonly` **required**: readonly \[`"state"`, `"ready"`, `"blocked"`, `"needsConfirmation"`, `"followUpRequired"`\]

#### properties.acceptance.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sections

> `readonly` **sections**: `object`

#### properties.sections.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sections.items

> `readonly` **items**: `object`

#### properties.sections.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sections.items.properties

> `readonly` **properties**: `object`

#### properties.sections.items.properties.id

> `readonly` **id**: `object` = `DeliverySectionIdSchema`

#### properties.sections.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sections.items.properties.id.enum

> `readonly` **enum**: readonly \[`"readiness"`, `"files"`, `"map-edits"`, `"data-and-analysis"`, `"scene-browsing"`\]

#### properties.sections.items.properties.status

> `readonly` **status**: `object` = `DeliveryStatusSchema`

#### properties.sections.items.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sections.items.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.sections.items.properties.blockerCount

> `readonly` **blockerCount**: `object`

#### properties.sections.items.properties.blockerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sections.items.properties.confirmationRequired

> `readonly` **confirmationRequired**: `object`

#### properties.sections.items.properties.confirmationRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sections.items.properties.followUpCount

> `readonly` **followUpCount**: `object`

#### properties.sections.items.properties.followUpCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sections.items.required

> `readonly` **required**: readonly \[`"id"`, `"status"`, `"blockerCount"`, `"confirmationRequired"`, `"followUpCount"`\]

#### properties.sections.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.confirmations

> `readonly` **confirmations**: `object`

#### properties.confirmations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.confirmations.items

> `readonly` **items**: `object`

#### properties.confirmations.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.confirmations.items.properties

> `readonly` **properties**: `object`

#### properties.confirmations.items.properties.reason

> `readonly` **reason**: `object` = `DeliveryConfirmationReasonSchema`

#### properties.confirmations.items.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.confirmations.items.properties.reason.enum

> `readonly` **enum**: readonly \[`"external-resource"`, `"network-fetch"`, `"archive-parsing"`, `"worker-use"`, `"file-write"`, `"stable-scene3d-runtime"`\]

#### properties.confirmations.items.properties.required

> `readonly` **required**: `object`

#### properties.confirmations.items.properties.required.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.confirmations.items.properties.target

> `readonly` **target**: `object`

#### properties.confirmations.items.properties.target.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.confirmations.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.confirmations.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.confirmations.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.confirmations.items.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.confirmations.items.required

> `readonly` **required**: readonly \[`"reason"`, `"required"`, `"target"`\]

#### properties.confirmations.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.confirmationRequired

> `readonly` **confirmationRequired**: `object`

#### properties.confirmationRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.followUps

> `readonly` **followUps**: `object`

#### properties.followUps.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.followUps.items

> `readonly` **items**: `object`

#### properties.followUps.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.followUps.items.properties

> `readonly` **properties**: `object`

#### properties.followUps.items.properties.id

> `readonly` **id**: `object`

#### properties.followUps.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.followUps.items.properties.owner

> `readonly` **owner**: `object`

#### properties.followUps.items.properties.owner.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.followUps.items.properties.targetArtifact

> `readonly` **targetArtifact**: `object`

#### properties.followUps.items.properties.targetArtifact.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.followUps.items.properties.reason

> `readonly` **reason**: `object`

#### properties.followUps.items.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.followUps.items.properties.blockerCode

> `readonly` **blockerCode**: `object`

#### properties.followUps.items.properties.blockerCode.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.followUps.items.required

> `readonly` **required**: readonly \[`"id"`, `"owner"`, `"targetArtifact"`, `"reason"`\]

#### properties.followUps.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness

> `readonly` **sourceReadiness**: `object`

#### properties.sourceReadiness.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.sourceId

> `readonly` **sourceId**: `object`

#### properties.sourceReadiness.items.properties.sourceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.type

> `readonly` **type**: `object`

#### properties.sourceReadiness.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.state

> `readonly` **state**: `object` = `SourceReadinessStateSchema`

#### properties.sourceReadiness.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.state.enum

> `readonly` **enum**: readonly \[`"supported"`, `"readiness-only"`, `"blocked"`\]

#### properties.sourceReadiness.items.properties.queryReady

> `readonly` **queryReady**: `object`

#### properties.sourceReadiness.items.properties.queryReady.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.sourceReadiness.items.properties.resourcePolicy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.resourcePolicy.enum

> `readonly` **enum**: readonly \[`"passed"`, `"blocked"`, `"not-applicable"`, `"not-checked"`\]

#### properties.sourceReadiness.items.properties.archiveContract

> `readonly` **archiveContract**: `object` = `SourceArchiveContractSchema`

#### properties.sourceReadiness.items.properties.archiveContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.archiveContract.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.archiveContract.properties.state

> `readonly` **state**: `object` = `SourceArchiveContractStateSchema`

#### properties.sourceReadiness.items.properties.archiveContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.archiveContract.properties.state.enum

> `readonly` **enum**: readonly \[`"explicit"`, `"not-applicable"`, `"not-checked"`\]

#### properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.archiveContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.archiveContract.required

> `readonly` **required**: readonly \[`"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.sourceReadiness.items.properties.archiveContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.sourceReadiness.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object` = `SourceContractKindSchema`

#### properties.sourceReadiness.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[`"archive"`, `"schema"`\]

#### properties.sourceReadiness.items.properties.sourceContract.properties.state

> `readonly` **state**: `object` = `SourceArchiveContractStateSchema`

#### properties.sourceReadiness.items.properties.sourceContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.sourceContract.properties.state.enum

> `readonly` **enum**: readonly \[`"explicit"`, `"not-applicable"`, `"not-checked"`\]

#### properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.sourceContract.required

> `readonly` **required**: readonly \[`"kind"`, `"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.sourceReadiness.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan

> `readonly` **runtimeLoadPlan**: `object` = `SourceRuntimeLoadPlanSchema`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status

> `readonly` **status**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"metadata-required"`, `"blocked"`\]

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds

> `readonly` **sourceLayerIds**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements

> `readonly` **requirements**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.mapLibreVectorSource

> `readonly` **mapLibreVectorSource**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.mapLibreVectorSource.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.mapLibreVectorSource.const

> `readonly` **const**: `true` = `true`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.sourceLayerMetadata

> `readonly` **sourceLayerMetadata**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.sourceLayerMetadata.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.sourceLayerMetadata.const

> `readonly` **const**: `true` = `true`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.rangeRequests

> `readonly` **rangeRequests**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.rangeRequests.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.rangeRequests.const

> `readonly` **const**: `true` = `true`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.worker

> `readonly` **worker**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.worker.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.worker.const

> `readonly` **const**: `true` = `true`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveMetadata

> `readonly` **archiveMetadata**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveMetadata.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveParsing

> `readonly` **archiveParsing**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveParsing.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveParsing.const

> `readonly` **const**: `false` = `false`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.featureQuery

> `readonly` **featureQuery**: `object`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.featureQuery.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.featureQuery.const

> `readonly` **const**: `false` = `false`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.required

> `readonly` **required**: readonly \[`"mapLibreVectorSource"`, `"sourceLayerMetadata"`, `"rangeRequests"`, `"worker"`, `"archiveMetadata"`, `"archiveParsing"`, `"featureQuery"`\]

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.required

> `readonly` **required**: readonly \[`"status"`, `"sourceLayerIds"`, `"diagnosticCounts"`, `"requirements"`\]

#### properties.sourceReadiness.items.properties.runtimeLoadPlan.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence

> `readonly` **queryEvidence**: `object` = `SourcePMTilesQueryEvidenceSchema`

#### properties.sourceReadiness.items.properties.queryEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.status

> `readonly` **status**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"empty"`, `"blocked"`\]

#### properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds

> `readonly` **sourceLayerIds**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds

> `readonly` **layerIds**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract

> `readonly` **loaderContract**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.resourceAccess

> `readonly` **resourceAccess**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.resourceAccess.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.resourceAccess.const

> `readonly` **const**: `"caller-owned"` = `"caller-owned"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.cancellation

> `readonly` **cancellation**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.cancellation.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.cancellation.const

> `readonly` **const**: `"caller-owned"` = `"caller-owned"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.timeoutMs

> `readonly` **timeoutMs**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.timeoutMs.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.byteBudgetBytes

> `readonly` **byteBudgetBytes**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.byteBudgetBytes.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.required

> `readonly` **required**: readonly \[`"resourceAccess"`, `"cancellation"`, `"timeoutMs"`, `"byteBudgetBytes"`\]

#### properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements

> `readonly` **requirements**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.callerSuppliedDecodedFeatures

> `readonly` **callerSuppliedDecodedFeatures**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.callerSuppliedDecodedFeatures.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.callerSuppliedDecodedFeatures.const

> `readonly` **const**: `true` = `true`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.archiveParsing

> `readonly` **archiveParsing**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.archiveParsing.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.archiveParsing.const

> `readonly` **const**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.hiddenFetch

> `readonly` **hiddenFetch**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.hiddenFetch.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.hiddenFetch.const

> `readonly` **const**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.rangeRequests

> `readonly` **rangeRequests**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.rangeRequests.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.rangeRequests.const

> `readonly` **const**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.worker

> `readonly` **worker**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.worker.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.worker.const

> `readonly` **const**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.featurePayloadReturned

> `readonly` **featurePayloadReturned**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.featurePayloadReturned.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.properties.featurePayloadReturned.const

> `readonly` **const**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.required

> `readonly` **required**: readonly \[`"callerSuppliedDecodedFeatures"`, `"archiveParsing"`, `"hiddenFetch"`, `"rangeRequests"`, `"worker"`, `"featurePayloadReturned"`\]

#### properties.sourceReadiness.items.properties.queryEvidence.properties.requirements.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary

> `readonly` **summary**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.caseCount

> `readonly` **caseCount**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.caseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.readyCaseCount

> `readonly` **readyCaseCount**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.readyCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.emptyCaseCount

> `readonly` **emptyCaseCount**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.emptyCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.blockedCaseCount

> `readonly` **blockedCaseCount**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.blockedCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.matchedFeatureCount

> `readonly` **matchedFeatureCount**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.matchedFeatureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.returnedFeatureCount

> `readonly` **returnedFeatureCount**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.returnedFeatureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.resultTruncated

> `readonly` **resultTruncated**: `object`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.properties.resultTruncated.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.required

> `readonly` **required**: readonly \[`"caseCount"`, `"readyCaseCount"`, `"emptyCaseCount"`, `"blockedCaseCount"`, `"matchedFeatureCount"`, `"returnedFeatureCount"`, `"resultTruncated"`\]

#### properties.sourceReadiness.items.properties.queryEvidence.properties.summary.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.queryEvidence.required

> `readonly` **required**: readonly \[`"status"`, `"sourceLayerIds"`, `"layerIds"`, `"loaderContract"`, `"diagnosticCounts"`, `"requirements"`, `"summary"`\]

#### properties.sourceReadiness.items.properties.queryEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness.items.properties.confirmationReasons

> `readonly` **confirmationReasons**: `object`

#### properties.sourceReadiness.items.properties.confirmationReasons.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.confirmationReasons.items

> `readonly` **items**: `object` = `DeliveryConfirmationReasonSchema`

#### properties.sourceReadiness.items.properties.confirmationReasons.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.confirmationReasons.items.enum

> `readonly` **enum**: readonly \[`"external-resource"`, `"network-fetch"`, `"archive-parsing"`, `"worker-use"`, `"file-write"`, `"stable-scene3d-runtime"`\]

#### properties.sourceReadiness.items.properties.notes

> `readonly` **notes**: `object`

#### properties.sourceReadiness.items.properties.notes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items.properties.notes.items

> `readonly` **items**: `object`

#### properties.sourceReadiness.items.properties.notes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.required

> `readonly` **required**: readonly \[`"sourceId"`, `"type"`, `"state"`, `"queryReady"`, `"confirmationReasons"`, `"notes"`\]

#### properties.sourceReadiness.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourcePromotionCandidates

> `readonly` **sourcePromotionCandidates**: `object`

#### properties.sourcePromotionCandidates.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourcePromotionCandidates.items

> `readonly` **items**: `object`

#### properties.sourcePromotionCandidates.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourcePromotionCandidates.items.properties

> `readonly` **properties**: `object`

#### properties.sourcePromotionCandidates.items.properties.candidateId

> `readonly` **candidateId**: `object`

#### properties.sourcePromotionCandidates.items.properties.candidateId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.format

> `readonly` **format**: `object` = `SourcePromotionCandidateFormatSchema`

#### properties.sourcePromotionCandidates.items.properties.format.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.format.enum

> `readonly` **enum**: readonly \[`"pmtiles"`, `"geoparquet"`, `"flatgeobuf"`, `"geotiff"`, `"geozarr"`\]

#### properties.sourcePromotionCandidates.items.properties.state

> `readonly` **state**: `object` = `SourceReadinessStateSchema`

#### properties.sourcePromotionCandidates.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.state.enum

> `readonly` **enum**: readonly \[`"supported"`, `"readiness-only"`, `"blocked"`\]

#### properties.sourcePromotionCandidates.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.sourcePromotionCandidates.items.properties.resourcePolicy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.resourcePolicy.enum

> `readonly` **enum**: readonly \[`"passed"`, `"blocked"`, `"not-applicable"`, `"not-checked"`\]

#### properties.sourcePromotionCandidates.items.properties.archiveContract

> `readonly` **archiveContract**: `object` = `SourceArchiveContractSchema`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties

> `readonly` **properties**: `object`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.state

> `readonly` **state**: `object` = `SourceArchiveContractStateSchema`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.state.enum

> `readonly` **enum**: readonly \[`"explicit"`, `"not-applicable"`, `"not-checked"`\]

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.archiveContract.required

> `readonly` **required**: readonly \[`"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.sourcePromotionCandidates.items.properties.archiveContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourcePromotionCandidates.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object` = `SourceContractKindSchema`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[`"archive"`, `"schema"`\]

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.state

> `readonly` **state**: `object` = `SourceArchiveContractStateSchema`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.state.enum

> `readonly` **enum**: readonly \[`"explicit"`, `"not-applicable"`, `"not-checked"`\]

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.sourceContract.required

> `readonly` **required**: readonly \[`"kind"`, `"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.sourcePromotionCandidates.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourcePromotionCandidates.items.properties.target

> `readonly` **target**: `object`

#### properties.sourcePromotionCandidates.items.properties.target.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.exitCondition

> `readonly` **exitCondition**: `object`

#### properties.sourcePromotionCandidates.items.properties.exitCondition.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.sourcePromotionCandidates.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourcePromotionCandidates.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.sourcePromotionCandidates.items.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.properties.notes

> `readonly` **notes**: `object`

#### properties.sourcePromotionCandidates.items.properties.notes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourcePromotionCandidates.items.properties.notes.items

> `readonly` **items**: `object`

#### properties.sourcePromotionCandidates.items.properties.notes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourcePromotionCandidates.items.required

> `readonly` **required**: readonly \[`"candidateId"`, `"format"`, `"state"`, `"target"`, `"exitCondition"`, `"sourceIds"`, `"notes"`\]

#### properties.sourcePromotionCandidates.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryReadiness

> `readonly` **spatialQueryReadiness**: `object`

#### properties.spatialQueryReadiness.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryReadiness.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryReadiness.properties.requested

> `readonly` **requested**: `object`

#### properties.spatialQueryReadiness.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQueryReadiness.properties.state

> `readonly` **state**: `object` = `SpatialQueryReadinessStateSchema`

#### properties.spatialQueryReadiness.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.state.enum

> `readonly` **enum**: readonly \[`"not-requested"`, `"ready"`, `"blocked"`, `"follow-up-required"`\]

#### properties.spatialQueryReadiness.properties.status

> `readonly` **status**: `object` = `SpatialQueryEvidenceStatusSchema`

#### properties.spatialQueryReadiness.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"not-requested"`\]

#### properties.spatialQueryReadiness.properties.capabilityGateStatus

> `readonly` **capabilityGateStatus**: `object` = `SpatialQueryCapabilityGateStatusSchema`

#### properties.spatialQueryReadiness.properties.capabilityGateStatus.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.capabilityGateStatus.enum

> `readonly` **enum**: readonly \[`"passed"`, `"waived"`, `"blocked"`\]

#### properties.spatialQueryReadiness.properties.requiredQueries

> `readonly` **requiredQueries**: `object`

#### properties.spatialQueryReadiness.properties.requiredQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.requiredQueries.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.requiredQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.requiredQueries.items.enum

> `readonly` **enum**: readonly \[`"point"`, `"bbox"`\]

#### properties.spatialQueryReadiness.properties.providedQueries

> `readonly` **providedQueries**: `object`

#### properties.spatialQueryReadiness.properties.providedQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.providedQueries.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.providedQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.caseCount

> `readonly` **caseCount**: `object`

#### properties.spatialQueryReadiness.properties.caseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.passedCaseCount

> `readonly` **passedCaseCount**: `object`

#### properties.spatialQueryReadiness.properties.passedCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.failedCaseCount

> `readonly` **failedCaseCount**: `object`

#### properties.spatialQueryReadiness.properties.failedCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.spatialQueryReadiness.properties.resultLimit.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.resultTruncated

> `readonly` **resultTruncated**: `object`

#### properties.spatialQueryReadiness.properties.resultTruncated.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQueryReadiness.properties.blockerCount

> `readonly` **blockerCount**: `object`

#### properties.spatialQueryReadiness.properties.blockerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.followUpCount

> `readonly` **followUpCount**: `object`

#### properties.spatialQueryReadiness.properties.followUpCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.followUpTaskIds

> `readonly` **followUpTaskIds**: `object`

#### properties.spatialQueryReadiness.properties.followUpTaskIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.followUpTaskIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.followUpTaskIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.queryableLayerIds

> `readonly` **queryableLayerIds**: `object`

#### properties.spatialQueryReadiness.properties.queryableLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.queryableLayerIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.queryableLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.queryableSourceIds

> `readonly` **queryableSourceIds**: `object`

#### properties.spatialQueryReadiness.properties.queryableSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.queryableSourceIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.queryableSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.unsupportedSourceIds

> `readonly` **unsupportedSourceIds**: `object`

#### properties.spatialQueryReadiness.properties.unsupportedSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.unsupportedSourceIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.unsupportedSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.missingSourceIds

> `readonly` **missingSourceIds**: `object`

#### properties.spatialQueryReadiness.properties.missingSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.missingSourceIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.missingSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.hiddenLayerIds

> `readonly` **hiddenLayerIds**: `object`

#### properties.spatialQueryReadiness.properties.hiddenLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.hiddenLayerIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.hiddenLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.blockedOperations

> `readonly` **blockedOperations**: `object`

#### properties.spatialQueryReadiness.properties.blockedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.blockedOperations.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.blockedOperations.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.cases

> `readonly` **cases**: `object`

#### properties.spatialQueryReadiness.properties.cases.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.cases.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryReadiness.properties.cases.items.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.id

> `readonly` **id**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.state

> `readonly` **state**: `object` = `SpatialQueryCaseReadinessStateSchema`

#### properties.spatialQueryReadiness.properties.cases.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.state.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`\]

#### properties.spatialQueryReadiness.properties.cases.items.properties.operation

> `readonly` **operation**: `object` = `SpatialQueryOperationSchema`

#### properties.spatialQueryReadiness.properties.cases.items.properties.operation.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.operation.enum

> `readonly` **enum**: readonly \[`"point-query"`, `"bbox-query"`\]

#### properties.spatialQueryReadiness.properties.cases.items.properties.layerIds

> `readonly` **layerIds**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.layerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.layerIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.layerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.featureCount

> `readonly` **featureCount**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.featureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.resultLimit.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.resultTruncated

> `readonly` **resultTruncated**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.resultTruncated.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.fixtureHash

> `readonly` **fixtureHash**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.fixtureHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryReadiness.properties.cases.items.required

> `readonly` **required**: readonly \[`"id"`, `"state"`, `"operation"`, `"layerIds"`, `"sourceIds"`, `"featureCount"`, `"resultLimit"`, `"resultTruncated"`, `"fixtureHash"`, `"diagnosticCounts"`\]

#### properties.spatialQueryReadiness.properties.cases.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryReadiness.required

> `readonly` **required**: readonly \[`"requested"`, `"state"`, `"status"`, `"capabilityGateStatus"`, `"requiredQueries"`, `"providedQueries"`, `"caseCount"`, `"passedCaseCount"`, `"failedCaseCount"`, `"resultLimit"`, `"resultTruncated"`, `"blockerCount"`, `"followUpCount"`, `"followUpTaskIds"`, `"queryableLayerIds"`, `"queryableSourceIds"`, `"unsupportedSourceIds"`, `"missingSourceIds"`, `"hiddenLayerIds"`, `"blockedOperations"`, `"cases"`\]

#### properties.spatialQueryReadiness.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"status"`, `"acceptance"`, `"sections"`, `"confirmations"`, `"confirmationRequired"`, `"followUps"`, `"sourceReadiness"`, `"spatialQueryReadiness"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
