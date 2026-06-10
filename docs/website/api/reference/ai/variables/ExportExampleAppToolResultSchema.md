[**@gis-engine/ai v1.0.0**](../index.md)

***

# Variable: ExportExampleAppToolResultSchema

> `const` **ExportExampleAppToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.exampleId

> `readonly` **exampleId**: `object`

#### properties.exampleId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.title

> `readonly` **title**: `object`

#### properties.title.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.description

> `readonly` **description**: `object`

#### properties.description.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.writesFiles

> `readonly` **writesFiles**: `object`

#### properties.writesFiles.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.writesFiles.const

> `readonly` **const**: `false` = `false`

#### properties.files

> `readonly` **files**: `object`

#### properties.files.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.files.items

> `readonly` **items**: `object`

#### properties.files.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.files.items.properties

> `readonly` **properties**: `object`

#### properties.files.items.properties.path

> `readonly` **path**: `object`

#### properties.files.items.properties.path.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.files.items.properties.role

> `readonly` **role**: `object`

#### properties.files.items.properties.role.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.files.items.properties.role.enum

> `readonly` **enum**: readonly \[`"spec"`, `"data"`, `"commands"`, `"script"`\]

#### properties.files.items.properties.mediaType

> `readonly` **mediaType**: `object`

#### properties.files.items.properties.mediaType.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.files.items.properties.required

> `readonly` **required**: `object`

#### properties.files.items.properties.required.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.files.items.properties.description

> `readonly` **description**: `object`

#### properties.files.items.properties.description.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.files.items.required

> `readonly` **required**: readonly \[`"path"`, `"role"`, `"mediaType"`, `"required"`, `"description"`\]

#### properties.files.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.notes

> `readonly` **notes**: `object`

#### properties.notes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.notes.items

> `readonly` **items**: `object`

#### properties.notes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence

> `readonly` **generationEvidence**: `object` = `ExampleAppGenerationEvidenceSummarySchema`

#### properties.generationEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.promptHash

> `readonly` **promptHash**: `object`

#### properties.generationEvidence.properties.promptHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.status

> `readonly` **status**: `object`

#### properties.generationEvidence.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`\]

#### properties.generationEvidence.properties.delivery

> `readonly` **delivery**: `object` = `ExampleAppDeliverySummarySchema`

#### properties.generationEvidence.properties.delivery.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.status

> `readonly` **status**: `object` = `DeliveryStatusSchema`

#### properties.generationEvidence.properties.delivery.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.generationEvidence.properties.delivery.properties.acceptance

> `readonly` **acceptance**: `object`

#### properties.generationEvidence.properties.delivery.properties.acceptance.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.state

> `readonly` **state**: `object` = `DeliveryStatusSchema`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.state.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.ready

> `readonly` **ready**: `object`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.blocked

> `readonly` **blocked**: `object`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.blocked.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.needsConfirmation

> `readonly` **needsConfirmation**: `object`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.needsConfirmation.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.followUpRequired

> `readonly` **followUpRequired**: `object`

#### properties.generationEvidence.properties.delivery.properties.acceptance.properties.followUpRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.acceptance.required

> `readonly` **required**: readonly \[`"state"`, `"ready"`, `"blocked"`, `"needsConfirmation"`, `"followUpRequired"`\]

#### properties.generationEvidence.properties.delivery.properties.acceptance.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sections

> `readonly` **sections**: `object`

#### properties.generationEvidence.properties.delivery.properties.sections.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.sections.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.sections.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.id

> `readonly` **id**: `object` = `DeliverySectionIdSchema`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.id.enum

> `readonly` **enum**: readonly \[..., ..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.status

> `readonly` **status**: `object` = `DeliveryStatusSchema`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.status.enum

> `readonly` **enum**: readonly \[..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.blockerCount

> `readonly` **blockerCount**: `object`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.blockerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.confirmationRequired

> `readonly` **confirmationRequired**: `object`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.confirmationRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.followUpCount

> `readonly` **followUpCount**: `object`

#### properties.generationEvidence.properties.delivery.properties.sections.items.properties.followUpCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.delivery.properties.sections.items.required

> `readonly` **required**: readonly \[`"id"`, `"status"`, `"blockerCount"`, `"confirmationRequired"`, `"followUpCount"`\]

#### properties.generationEvidence.properties.delivery.properties.sections.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.confirmations

> `readonly` **confirmations**: `object`

#### properties.generationEvidence.properties.delivery.properties.confirmations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.reason

> `readonly` **reason**: `object` = `DeliveryConfirmationReasonSchema`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.reason.enum

> `readonly` **enum**: readonly \[..., ..., ..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.required

> `readonly` **required**: `object`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.required.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.target

> `readonly` **target**: `object`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.target.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.sourceIds.items.type

> `readonly` **type**: ... = `"string"`

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.required

> `readonly` **required**: readonly \[`"reason"`, `"required"`, `"target"`\]

#### properties.generationEvidence.properties.delivery.properties.confirmations.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.confirmationRequired

> `readonly` **confirmationRequired**: `object`

#### properties.generationEvidence.properties.delivery.properties.confirmationRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.followUps

> `readonly` **followUps**: `object`

#### properties.generationEvidence.properties.delivery.properties.followUps.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.followUps.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.id

> `readonly` **id**: `object`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.owner

> `readonly` **owner**: `object`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.owner.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.targetArtifact

> `readonly` **targetArtifact**: `object`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.targetArtifact.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.reason

> `readonly` **reason**: `object`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.blockerCode

> `readonly` **blockerCode**: `object`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.properties.blockerCode.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.followUps.items.required

> `readonly` **required**: readonly \[`"id"`, `"owner"`, `"targetArtifact"`, `"reason"`\]

#### properties.generationEvidence.properties.delivery.properties.followUps.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness

> `readonly` **sourceReadiness**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceId

> `readonly` **sourceId**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.type

> `readonly` **type**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.state

> `readonly` **state**: `object` = `SourceReadinessStateSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryReady

> `readonly` **queryReady**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryReady.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.resourcePolicy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.resourcePolicy.enum

> `readonly` **enum**: readonly \[..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract

> `readonly` **archiveContract**: `object` = `SourceArchiveContractSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.state

> `readonly` **state**: ... = `SourceArchiveContractStateSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields

> `readonly` **metadataFields**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields

> `readonly` **policyFields**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract.required

> `readonly` **required**: readonly \[..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.kind

> `readonly` **kind**: ... = `SourceContractKindSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.state

> `readonly` **state**: ... = `SourceArchiveContractStateSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract.required

> `readonly` **required**: readonly \[..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan

> `readonly` **runtimeLoadPlan**: `object` = `SourceRuntimeLoadPlanSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status

> `readonly` **status**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds

> `readonly` **sourceLayerIds**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: ... = `DiagnosticCountsSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements

> `readonly` **requirements**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.required

> `readonly` **required**: readonly \[..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence

> `readonly` **queryEvidence**: `object` = `SourcePMTilesQueryEvidenceSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.status

> `readonly` **status**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.sourceLayerIds

> `readonly` **sourceLayerIds**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.layerIds

> `readonly` **layerIds**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: ... = `DiagnosticCountsSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.requirements

> `readonly` **requirements**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.summary

> `readonly` **summary**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons

> `readonly` **confirmationReasons**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons.items

> `readonly` **items**: `object` = `DeliveryConfirmationReasonSchema`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons.items.type

> `readonly` **type**: ... = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons.items.enum

> `readonly` **enum**: ...

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.notes

> `readonly` **notes**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.notes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.notes.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.notes.items.type

> `readonly` **type**: ... = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.required

> `readonly` **required**: readonly \[`"sourceId"`, `"type"`, `"state"`, `"queryReady"`, `"confirmationReasons"`, `"notes"`\]

#### properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates

> `readonly` **sourcePromotionCandidates**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.candidateId

> `readonly` **candidateId**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.candidateId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.format

> `readonly` **format**: `object` = `SourcePromotionCandidateFormatSchema`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.format.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.format.enum

> `readonly` **enum**: readonly \[..., ..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.state

> `readonly` **state**: `object` = `SourceReadinessStateSchema`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.resourcePolicy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.resourcePolicy.enum

> `readonly` **enum**: readonly \[..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract

> `readonly` **archiveContract**: `object` = `SourceArchiveContractSchema`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.state

> `readonly` **state**: ... = `SourceArchiveContractStateSchema`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.metadataFields

> `readonly` **metadataFields**: ...

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.properties.policyFields

> `readonly` **policyFields**: ...

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.required

> `readonly` **required**: readonly \[..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.kind

> `readonly` **kind**: ... = `SourceContractKindSchema`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.state

> `readonly` **state**: ... = `SourceArchiveContractStateSchema`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: ...

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: ...

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.required

> `readonly` **required**: readonly \[..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.target

> `readonly` **target**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.target.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.exitCondition

> `readonly` **exitCondition**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.exitCondition.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds.items.type

> `readonly` **type**: ... = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.notes

> `readonly` **notes**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.notes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.notes.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.notes.items.type

> `readonly` **type**: ... = `"string"`

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.required

> `readonly` **required**: readonly \[`"candidateId"`, `"format"`, `"state"`, `"target"`, `"exitCondition"`, `"sourceIds"`, `"notes"`\]

#### properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness

> `readonly` **spatialQueryReadiness**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requested

> `readonly` **requested**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.state

> `readonly` **state**: `object` = `SpatialQueryReadinessStateSchema`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.state.enum

> `readonly` **enum**: readonly \[`"not-requested"`, `"ready"`, `"blocked"`, `"follow-up-required"`\]

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.status

> `readonly` **status**: `object` = `SpatialQueryEvidenceStatusSchema`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"not-requested"`\]

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus

> `readonly` **capabilityGateStatus**: `object` = `SpatialQueryCapabilityGateStatusSchema`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus.enum

> `readonly` **enum**: readonly \[`"passed"`, `"waived"`, `"blocked"`\]

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries

> `readonly` **requiredQueries**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.items.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.providedQueries

> `readonly` **providedQueries**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.providedQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.providedQueries.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.providedQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.caseCount

> `readonly` **caseCount**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.caseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.passedCaseCount

> `readonly` **passedCaseCount**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.passedCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.failedCaseCount

> `readonly` **failedCaseCount**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.failedCaseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.resultLimit.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.resultTruncated

> `readonly` **resultTruncated**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.resultTruncated.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockerCount

> `readonly` **blockerCount**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpCount

> `readonly` **followUpCount**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds

> `readonly` **followUpTaskIds**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds

> `readonly` **queryableLayerIds**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds

> `readonly` **queryableSourceIds**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds

> `readonly` **unsupportedSourceIds**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds

> `readonly` **missingSourceIds**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds

> `readonly` **hiddenLayerIds**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations

> `readonly` **blockedOperations**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases

> `readonly` **cases**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.id

> `readonly` **id**: ...

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.state

> `readonly` **state**: ... = `SpatialQueryCaseReadinessStateSchema`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.operation

> `readonly` **operation**: ... = `SpatialQueryOperationSchema`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.layerIds

> `readonly` **layerIds**: ...

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.sourceIds

> `readonly` **sourceIds**: ...

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.featureCount

> `readonly` **featureCount**: ...

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.resultLimit

> `readonly` **resultLimit**: ...

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.resultTruncated

> `readonly` **resultTruncated**: ...

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.fixtureHash

> `readonly` **fixtureHash**: ...

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: ... = `DiagnosticCountsSchema`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ..., ..., ..., ..., ..., ...\]

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.required

> `readonly` **required**: readonly \[`"requested"`, `"state"`, `"status"`, `"capabilityGateStatus"`, `"requiredQueries"`, `"providedQueries"`, `"caseCount"`, `"passedCaseCount"`, `"failedCaseCount"`, `"resultLimit"`, `"resultTruncated"`, `"blockerCount"`, `"followUpCount"`, `"followUpTaskIds"`, `"queryableLayerIds"`, `"queryableSourceIds"`, `"unsupportedSourceIds"`, `"missingSourceIds"`, `"hiddenLayerIds"`, `"blockedOperations"`, `"cases"`\]

#### properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.delivery.required

> `readonly` **required**: readonly \[`"status"`, `"acceptance"`, `"sections"`, `"confirmations"`, `"confirmationRequired"`, `"followUps"`, `"sourceReadiness"`, `"spatialQueryReadiness"`\]

#### properties.generationEvidence.properties.delivery.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.targetDomains

> `readonly` **targetDomains**: `object`

#### properties.generationEvidence.properties.targetDomains.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.targetDomains.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.targetDomains.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.targetDomains.items.enum

> `readonly` **enum**: readonly \[`"feature-display"`, `"spatial-analysis"`, `"scene-browsing"`\]

#### properties.generationEvidence.properties.toolSequence

> `readonly` **toolSequence**: `object`

#### properties.generationEvidence.properties.toolSequence.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.toolSequence.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.toolSequence.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.toolSequence.items.enum

> `readonly` **enum**: readonly \[`"validate_spec"`, `"apply_commands"`, `"export_spec"`, `"get_context_summary"`, `"snapshot_spec"`, `"explain_spec"`, `"export_example_app"`\]

#### properties.generationEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.generationEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.generationEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.generationEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.generationEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.generationEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.command

> `readonly` **command**: `object`

#### properties.generationEvidence.properties.command.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.command.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.command.properties.usedApplyCommands

> `readonly` **usedApplyCommands**: `object`

#### properties.generationEvidence.properties.command.properties.usedApplyCommands.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.command.properties.commandCount

> `readonly` **commandCount**: `object`

#### properties.generationEvidence.properties.command.properties.commandCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.command.properties.committed

> `readonly` **committed**: `object`

#### properties.generationEvidence.properties.command.properties.committed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.command.properties.rolledBack

> `readonly` **rolledBack**: `object`

#### properties.generationEvidence.properties.command.properties.rolledBack.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.command.required

> `readonly` **required**: readonly \[`"usedApplyCommands"`, `"commandCount"`, `"committed"`, `"rolledBack"`\]

#### properties.generationEvidence.properties.command.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.planner

> `readonly` **planner**: `object`

#### properties.generationEvidence.properties.planner.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.planner.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.planner.properties.provided

> `readonly` **provided**: `object`

#### properties.generationEvidence.properties.planner.properties.provided.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.planner.properties.confidenceLevel

> `readonly` **confidenceLevel**: `object`

#### properties.generationEvidence.properties.planner.properties.confidenceLevel.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.planner.properties.confidenceLevel.enum

> `readonly` **enum**: readonly \[`"high"`, `"medium"`, `"low"`, `"unknown"`\]

#### properties.generationEvidence.properties.planner.properties.unsupportedIntentCount

> `readonly` **unsupportedIntentCount**: `object`

#### properties.generationEvidence.properties.planner.properties.unsupportedIntentCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.planner.required

> `readonly` **required**: readonly \[`"provided"`, `"confidenceLevel"`, `"unsupportedIntentCount"`\]

#### properties.generationEvidence.properties.planner.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.spatialQuery

> `readonly` **spatialQuery**: `object`

#### properties.generationEvidence.properties.spatialQuery.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.spatialQuery.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.spatialQuery.properties.requested

> `readonly` **requested**: `object`

#### properties.generationEvidence.properties.spatialQuery.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.spatialQuery.properties.ready

> `readonly` **ready**: `object`

#### properties.generationEvidence.properties.spatialQuery.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.spatialQuery.properties.status

> `readonly` **status**: `object`

#### properties.generationEvidence.properties.spatialQuery.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.spatialQuery.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"not-requested"`\]

#### properties.generationEvidence.properties.spatialQuery.properties.caseCount

> `readonly` **caseCount**: `object`

#### properties.generationEvidence.properties.spatialQuery.properties.caseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.spatialQuery.properties.blockedOperations

> `readonly` **blockedOperations**: `object`

#### properties.generationEvidence.properties.spatialQuery.properties.blockedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.spatialQuery.properties.blockedOperations.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.spatialQuery.properties.blockedOperations.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.spatialQuery.required

> `readonly` **required**: readonly \[`"requested"`, `"ready"`, `"status"`, `"caseCount"`, `"blockedOperations"`\]

#### properties.generationEvidence.properties.spatialQuery.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.sceneBrowsing

> `readonly` **sceneBrowsing**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.sceneBrowsing.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.requested

> `readonly` **requested**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.status

> `readonly` **status**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.status.enum

> `readonly` **enum**: readonly \[`"experimental"`, `"blocked"`, `"not-requested"`\]

#### properties.generationEvidence.properties.sceneBrowsing.properties.extensionPresent

> `readonly` **extensionPresent**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.extensionPresent.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableViewMode

> `readonly` **stableViewMode**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableViewMode.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableViewMode.const

> `readonly` **const**: `false` = `false`

#### properties.generationEvidence.properties.sceneBrowsing.properties.runtimeSupported

> `readonly` **runtimeSupported**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.runtimeSupported.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.runtimeSupported.const

> `readonly` **const**: `false` = `false`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlocked

> `readonly` **stableRuntimeBlocked**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlocked.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlocked.const

> `readonly` **const**: `true` = `true`

#### properties.generationEvidence.properties.sceneBrowsing.properties.state

> `readonly` **state**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.state.enum

> `readonly` **enum**: readonly \[`"extension-only"`, `"blocked"`, `"not-requested"`\]

#### properties.generationEvidence.properties.sceneBrowsing.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.layerIds

> `readonly` **layerIds**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.layerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.layerIds.items

> `readonly` **items**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.layerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.pickableLayerCount

> `readonly` **pickableLayerCount**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.pickableLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.mockSnapshotPassed

> `readonly` **mockSnapshotPassed**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.mockSnapshotPassed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.mockQueryPickCount

> `readonly` **mockQueryPickCount**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.mockQueryPickCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes

> `readonly` **stableRuntimeBlockerCodes**: `object`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items

> `readonly` **items**: `object` = `Scene3DStableRuntimeBlockerCodeSchema`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items.enum

> `readonly` **enum**: (`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`)[]

#### properties.generationEvidence.properties.sceneBrowsing.required

> `readonly` **required**: readonly \[`"requested"`, `"status"`, `"extensionPresent"`, `"stableViewMode"`, `"runtimeSupported"`, `"stableRuntimeBlocked"`, `"state"`, `"sourceCount"`, `"layerCount"`, `"sourceIds"`, `"layerIds"`, `"pickableLayerCount"`, `"mockSnapshotPassed"`, `"mockQueryPickCount"`, `"stableRuntimeBlockerCodes"`\]

#### properties.generationEvidence.properties.sceneBrowsing.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.snapshot

> `readonly` **snapshot**: `object`

#### properties.generationEvidence.properties.snapshot.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.snapshot.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.snapshot.properties.requested

> `readonly` **requested**: `object`

#### properties.generationEvidence.properties.snapshot.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.snapshot.properties.renderer

> `readonly` **renderer**: `object`

#### properties.generationEvidence.properties.snapshot.properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.generationEvidence.properties.snapshot.properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.generationEvidence.properties.snapshot.properties.passed

> `readonly` **passed**: `object`

#### properties.generationEvidence.properties.snapshot.properties.passed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.snapshot.required

> `readonly` **required**: readonly \[`"requested"`, `"renderer"`, `"passed"`\]

#### properties.generationEvidence.properties.snapshot.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.properties.export

> `readonly` **export**: `object`

#### properties.generationEvidence.properties.export.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.generationEvidence.properties.export.properties

> `readonly` **properties**: `object`

#### properties.generationEvidence.properties.export.properties.ready

> `readonly` **ready**: `object`

#### properties.generationEvidence.properties.export.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.generationEvidence.properties.export.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.generationEvidence.properties.export.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.export.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.generationEvidence.properties.export.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.generationEvidence.properties.export.required

> `readonly` **required**: readonly \[`"ready"`, `"sourceCount"`, `"layerCount"`\]

#### properties.generationEvidence.properties.export.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.generationEvidence.required

> `readonly` **required**: readonly \[`"status"`, `"delivery"`, `"targetDomains"`, `"toolSequence"`, `"diagnosticCounts"`, `"command"`, `"planner"`, `"spatialQuery"`, `"sceneBrowsing"`, `"snapshot"`, `"export"`\]

#### properties.generationEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"exampleId"`, `"title"`, `"description"`, `"writesFiles"`, `"files"`, `"notes"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
