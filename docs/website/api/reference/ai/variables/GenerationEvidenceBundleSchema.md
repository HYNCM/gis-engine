[**@gis-engine/ai v1.4.0**](../index.md)

***

# Variable: GenerationEvidenceBundleSchema

> `const` **GenerationEvidenceBundleSchema**: `object`

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

#### properties.targetDomains

> `readonly` **targetDomains**: `object`

#### properties.targetDomains.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.targetDomains.items

> `readonly` **items**: `TUnion`\<\[`TLiteral`\&lt;`"feature-display"`\&gt;, `TLiteral`\&lt;`"spatial-analysis"`\&gt;, `TLiteral`\&lt;`"scene-browsing"`\&gt;\]\>

#### properties.toolSequence

> `readonly` **toolSequence**: `object`

#### properties.toolSequence.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.toolSequence.items

> `readonly` **items**: `object` = `GisEngineToolNameSchema`

#### properties.toolSequence.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.toolSequence.items.enum

> `readonly` **enum**: readonly \[`"validate_spec"`, `"apply_commands"`, `"export_spec"`, `"get_context_summary"`, `"snapshot_spec"`, `"explain_spec"`, `"export_example_app"`, `"diff_specs"`, `"generate_spec"`, `"inspect_data"`, `"edit_spec"`\]

#### properties.summary

> `readonly` **summary**: `object` = `ContextSummaryContractSchema`

#### properties.summary.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.id

> `readonly` **id**: `object`

#### properties.summary.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.revision

> `readonly` **revision**: `object`

#### properties.summary.properties.revision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.view

> `readonly` **view**: `TObject`\<\{ `mode`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;`"map2d"`\&gt;, `TLiteral`\&lt;`"map2_5d"`\&gt;, `TLiteral`\&lt;`"scene3d"`\&gt;\]\>\>; `center`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`\]\>\>; `zoom`: `TOptional`\&lt;`TNumber`\&gt;; `bearing`: `TOptional`\&lt;`TNumber`\&gt;; `pitch`: `TOptional`\&lt;`TNumber`\&gt;; `bounds`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\>; \}\> = `MapSpecSchema.properties.view`

#### properties.summary.properties.sources

> `readonly` **sources**: `object`

#### properties.summary.properties.sources.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sources.items

> `readonly` **items**: `object`

#### properties.summary.properties.sources.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.sources.items.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.sources.items.properties.id

> `readonly` **id**: `object`

#### properties.summary.properties.sources.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sources.items.properties.type

> `readonly` **type**: `object`

#### properties.summary.properties.sources.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sources.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.summary.properties.sources.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.sources.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.summary.properties.sources.items.properties.sourceContract.properties.state

> `readonly` **state**: `object`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.summary.properties.sources.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.metadataFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.summary.properties.sources.items.properties.sourceContract.properties.policyFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.sources.items.properties.sourceContract.required

> `readonly` **required**: readonly \[`"kind"`, `"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.summary.properties.sources.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.sources.items.required

> `readonly` **required**: readonly \[`"id"`, `"type"`\]

#### properties.summary.properties.sources.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.sourceReadiness

> `readonly` **sourceReadiness**: `object`

#### properties.summary.properties.sourceReadiness.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sourceReadiness.items

> `readonly` **items**: `object` = `SourceReadinessSchema`

#### properties.summary.properties.sourceReadiness.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.sourceReadiness.items.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceId

> `readonly` **sourceId**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.type

> `readonly` **type**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.state

> `readonly` **state**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.state.enum

> `readonly` **enum**: readonly \[`"supported"`, `"readiness-only"`, `"blocked"`\]

#### properties.summary.properties.sourceReadiness.items.properties.queryReady

> `readonly` **queryReady**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.queryReady.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.summary.properties.sourceReadiness.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.resourcePolicy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.resourcePolicy.enum

> `readonly` **enum**: readonly \[`"passed"`, `"blocked"`, `"not-applicable"`, `"not-checked"`\]

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.state

> `readonly` **state**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.metadataFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.properties.policyFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.required

> `readonly` **required**: readonly \[`"kind"`, `"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.summary.properties.sourceReadiness.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract

> `readonly` **archiveContract**: `object` = `SourceArchiveContractSchema`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.state

> `readonly` **state**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.metadataFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.properties.policyFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.required

> `readonly` **required**: readonly \[`"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.summary.properties.sourceReadiness.items.properties.archiveContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan

> `readonly` **runtimeLoadPlan**: `object` = `SourceRuntimeLoadPlanSchema`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status

> `readonly` **status**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.status.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds

> `readonly` **sourceLayerIds**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.items

> `readonly` **items**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.sourceLayerIds.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.error

> `readonly` **error**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.properties.info

> `readonly` **info**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[..., ..., ...\]

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements

> `readonly` **requirements**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.mapLibreVectorSource

> `readonly` **mapLibreVectorSource**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.sourceLayerMetadata

> `readonly` **sourceLayerMetadata**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.rangeRequests

> `readonly` **rangeRequests**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.worker

> `readonly` **worker**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveMetadata

> `readonly` **archiveMetadata**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.archiveParsing

> `readonly` **archiveParsing**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.properties.featureQuery

> `readonly` **featureQuery**: ...

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ..., ..., ...\]

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.properties.requirements.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.required

> `readonly` **required**: readonly \[`"status"`, `"sourceLayerIds"`, `"diagnosticCounts"`, `"requirements"`\]

#### properties.summary.properties.sourceReadiness.items.properties.runtimeLoadPlan.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.sourceReadiness.items.required

> `readonly` **required**: readonly \[`"sourceId"`, `"type"`, `"state"`, `"queryReady"`, `"resourcePolicy"`\]

#### properties.summary.properties.sourceReadiness.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.layers

> `readonly` **layers**: `object`

#### properties.summary.properties.layers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.layers.items

> `readonly` **items**: `object`

#### properties.summary.properties.layers.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.layers.items.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.layers.items.properties.id

> `readonly` **id**: `object`

#### properties.summary.properties.layers.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.layers.items.properties.type

> `readonly` **type**: `object`

#### properties.summary.properties.layers.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.layers.items.properties.source

> `readonly` **source**: `object`

#### properties.summary.properties.layers.items.properties.source.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.layers.items.properties.visibility

> `readonly` **visibility**: `object`

#### properties.summary.properties.layers.items.properties.visibility.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.layers.items.properties.visibility.enum

> `readonly` **enum**: readonly \[`"visible"`, `"none"`\]

#### properties.summary.properties.layers.items.required

> `readonly` **required**: readonly \[`"id"`, `"type"`, `"visibility"`\]

#### properties.summary.properties.layers.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.validation

> `readonly` **validation**: `object`

#### properties.summary.properties.validation.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.validation.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.validation.properties.valid

> `readonly` **valid**: `object`

#### properties.summary.properties.validation.properties.valid.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.summary.properties.validation.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.summary.properties.validation.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.validation.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.validation.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.summary.properties.validation.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.validation.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.summary.properties.validation.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.validation.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.summary.properties.validation.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.validation.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.summary.properties.validation.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.validation.required

> `readonly` **required**: readonly \[`"valid"`, `"diagnosticCounts"`\]

#### properties.summary.properties.validation.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.capabilitySummary

> `readonly` **capabilitySummary**: `object` = `CapabilitySummarySchema`

#### properties.summary.properties.capabilitySummary.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.capabilitySummary.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains

> `readonly` **domains**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.capabilitySummary.properties.domains.items

> `readonly` **items**: `object` = `CapabilityDomainSummarySchema`

#### properties.summary.properties.capabilitySummary.properties.domains.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.id

> `readonly` **id**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.id.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.status

> `readonly` **status**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.status.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.supported

> `readonly` **supported**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.supported.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.supported.items

> `readonly` **items**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.supported.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.experimental

> `readonly` **experimental**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.experimental.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.experimental.items

> `readonly` **items**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.experimental.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.blocked

> `readonly` **blocked**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.blocked.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.blocked.items

> `readonly` **items**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.blocked.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.tools

> `readonly` **tools**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.tools.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.tools.items

> `readonly` **items**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.tools.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.tools.items.enum

> `readonly` **enum**: ...

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.evidence

> `readonly` **evidence**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.evidence.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.evidence.items

> `readonly` **items**: `object`

#### properties.summary.properties.capabilitySummary.properties.domains.items.properties.evidence.items.type

> `readonly` **type**: ... = `"string"`

#### properties.summary.properties.capabilitySummary.properties.domains.items.required

> `readonly` **required**: readonly \[`"id"`, `"status"`, `"supported"`, `"experimental"`, `"blocked"`, `"tools"`, `"evidence"`\]

#### properties.summary.properties.capabilitySummary.properties.domains.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.capabilitySummary.required

> `readonly` **required**: readonly \[`"domains"`\]

#### properties.summary.properties.capabilitySummary.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.capabilities

> `readonly` **capabilities**: `TObject`\<\{ `renderer`: `TString`; `dimensions`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"2d"`\&gt;, `TLiteral`\&lt;`"2_5d"`\&gt;, `TLiteral`\&lt;`"3d"`\&gt;\]\>\>; `sources`: `TArray`\&lt;`TString`\&gt;; `layers`: `TArray`\&lt;`TString`\&gt;; `expressions`: `TArray`\&lt;`TString`\&gt;; `queries`: `TArray`\&lt;`TString`\&gt;; `snapshot`: `TObject`\<\{ `supported`: `TBoolean`; `formats`: `TArray`\<`TUnion`\<\[..., ..., ...\]\>\>; \}\>; `experimental`: `TArray`\&lt;`TString`\&gt;; \}\> = `CapabilityReportContractSchema`

#### properties.summary.properties.scene3d

> `readonly` **scene3d**: `object` = `Scene3DContextSummarySchema`

#### properties.summary.properties.scene3d.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.status

> `readonly` **status**: `object`

#### properties.summary.properties.scene3d.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.scene3d.properties.status.const

> `readonly` **const**: `"extension-only"` = `"extension-only"`

#### properties.summary.properties.scene3d.properties.stableViewMode

> `readonly` **stableViewMode**: `object`

#### properties.summary.properties.scene3d.properties.stableViewMode.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.summary.properties.scene3d.properties.stableViewMode.const

> `readonly` **const**: `false` = `false`

#### properties.summary.properties.scene3d.properties.runtimeSupported

> `readonly` **runtimeSupported**: `object`

#### properties.summary.properties.scene3d.properties.runtimeSupported.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.summary.properties.scene3d.properties.runtimeSupported.const

> `readonly` **const**: `false` = `false`

#### properties.summary.properties.scene3d.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.summary.properties.scene3d.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.summary.properties.scene3d.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.visibleLayerCount

> `readonly` **visibleLayerCount**: `object`

#### properties.summary.properties.scene3d.properties.visibleLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.pickableLayerCount

> `readonly` **pickableLayerCount**: `object`

#### properties.summary.properties.scene3d.properties.pickableLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.sources

> `readonly` **sources**: `object`

#### properties.summary.properties.scene3d.properties.sources.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.scene3d.properties.sources.items

> `readonly` **items**: `object`

#### properties.summary.properties.scene3d.properties.sources.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties.sources.items.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.sources.items.properties.id

> `readonly` **id**: `object`

#### properties.summary.properties.scene3d.properties.sources.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.scene3d.properties.sources.items.properties.type

> `readonly` **type**: `object`

#### properties.summary.properties.scene3d.properties.sources.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract.properties.kind

> `readonly` **kind**: ...

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract.properties.state

> `readonly` **state**: ...

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: ...

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: ...

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract.required

> `readonly` **required**: readonly \[..., ..., ..., ...\]

#### properties.summary.properties.scene3d.properties.sources.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.scene3d.properties.sources.items.required

> `readonly` **required**: readonly \[`"id"`, `"type"`\]

#### properties.summary.properties.scene3d.properties.sources.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.scene3d.properties.layers

> `readonly` **layers**: `object`

#### properties.summary.properties.scene3d.properties.layers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.scene3d.properties.layers.items

> `readonly` **items**: `object`

#### properties.summary.properties.scene3d.properties.layers.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties.layers.items.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.layers.items.properties.id

> `readonly` **id**: `object`

#### properties.summary.properties.scene3d.properties.layers.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.scene3d.properties.layers.items.properties.type

> `readonly` **type**: `object`

#### properties.summary.properties.scene3d.properties.layers.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.scene3d.properties.layers.items.properties.source

> `readonly` **source**: `object`

#### properties.summary.properties.scene3d.properties.layers.items.properties.source.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.scene3d.properties.layers.items.properties.visibility

> `readonly` **visibility**: `object`

#### properties.summary.properties.scene3d.properties.layers.items.properties.visibility.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.scene3d.properties.layers.items.properties.visibility.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.summary.properties.scene3d.properties.layers.items.properties.pickable

> `readonly` **pickable**: `object`

#### properties.summary.properties.scene3d.properties.layers.items.properties.pickable.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.summary.properties.scene3d.properties.layers.items.required

> `readonly` **required**: readonly \[`"id"`, `"type"`, `"source"`, `"visibility"`, `"pickable"`\]

#### properties.summary.properties.scene3d.properties.layers.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.scene3d.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.present

> `readonly` **present**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.present.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxTilesetJsonBytes

> `readonly` **maxTilesetJsonBytes**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxTilesetJsonBytes.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxModelBytes

> `readonly` **maxModelBytes**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxModelBytes.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxTextureCount

> `readonly` **maxTextureCount**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxTextureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxTextureBytes

> `readonly` **maxTextureBytes**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxTextureBytes.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxWorkers

> `readonly` **maxWorkers**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.maxWorkers.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.timeoutMs

> `readonly` **timeoutMs**: `object`

#### properties.summary.properties.scene3d.properties.resourcePolicy.properties.timeoutMs.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.resourcePolicy.required

> `readonly` **required**: readonly \[`"present"`\]

#### properties.summary.properties.scene3d.properties.resourcePolicy.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.scene3d.properties.snapshot

> `readonly` **snapshot**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties.snapshot.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.properties.mockPassed

> `readonly` **mockPassed**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.properties.mockPassed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.summary.properties.scene3d.properties.snapshot.properties.pendingSourceIds

> `readonly` **pendingSourceIds**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.properties.pendingSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.summary.properties.scene3d.properties.snapshot.properties.pendingSourceIds.items

> `readonly` **items**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.properties.pendingSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: ... = `"number"`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: ... = `"number"`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: ... = `"number"`

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.summary.properties.scene3d.properties.snapshot.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.scene3d.properties.snapshot.required

> `readonly` **required**: readonly \[`"mockPassed"`, `"pendingSourceIds"`, `"diagnosticCounts"`\]

#### properties.summary.properties.scene3d.properties.snapshot.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.scene3d.properties.query

> `readonly` **query**: `object`

#### properties.summary.properties.scene3d.properties.query.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties.query.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.query.properties.pickCount

> `readonly` **pickCount**: `object`

#### properties.summary.properties.scene3d.properties.query.properties.pickCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: ... = `"number"`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: ... = `"number"`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: ... = `"number"`

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.summary.properties.scene3d.properties.query.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.scene3d.properties.query.required

> `readonly` **required**: readonly \[`"pickCount"`, `"diagnosticCounts"`\]

#### properties.summary.properties.scene3d.properties.query.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.properties.scene3d.properties.capabilities

> `readonly` **capabilities**: `TObject`\<\{ `renderer`: `TString`; `dimensions`: `TArray`\<`TUnion`\<\[..., ..., ...\]\>\>; `sources`: `TArray`\&lt;`TString`\&gt;; `layers`: `TArray`\&lt;`TString`\&gt;; `expressions`: `TArray`\&lt;`TString`\&gt;; `queries`: `TArray`\&lt;`TString`\&gt;; `snapshot`: `TObject`\<\{ `supported`: `TBoolean`; `formats`: `TArray`\&lt;...\&gt;; \}\>; `experimental`: `TArray`\&lt;`TString`\&gt;; \}\> = `CapabilityReportSchema`

#### properties.summary.properties.scene3d.required

> `readonly` **required**: readonly \[`"status"`, `"stableViewMode"`, `"runtimeSupported"`, `"sourceCount"`, `"layerCount"`, `"visibleLayerCount"`, `"pickableLayerCount"`, `"sources"`, `"layers"`, `"resourcePolicy"`, `"snapshot"`, `"query"`, `"capabilities"`\]

#### properties.summary.properties.scene3d.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.summary.required

> `readonly` **required**: readonly \[`"view"`, `"sources"`, `"sourceReadiness"`, `"layers"`, `"validation"`, `"capabilitySummary"`\]

#### properties.summary.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.validation

> `readonly` **validation**: `object` = `ValidationReportContractSchema`

#### properties.validation.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.validation.properties

> `readonly` **properties**: `object`

#### properties.validation.properties.valid

> `readonly` **valid**: `object`

#### properties.validation.properties.valid.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.validation.properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.validation.properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.validation.properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ...\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\&lt;...\&gt;[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: ...; `id`: ...; `path`: ...; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\&lt;...\&gt;; `confidence`: `TUnion`\&lt;...\&gt;; `message`: `TString`; `patch`: `TOptional`\&lt;...\&gt;; `command`: `TOptional`\&lt;...\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

#### properties.validation.properties.stats

> `readonly` **stats**: `object`

#### properties.validation.properties.stats.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.validation.properties.stats.properties

> `readonly` **properties**: `object`

#### properties.validation.properties.stats.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.validation.properties.stats.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.stats.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.validation.properties.stats.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.stats.properties.visibleLayerCount

> `readonly` **visibleLayerCount**: `object`

#### properties.validation.properties.stats.properties.visibleLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.stats.required

> `readonly` **required**: readonly \[`"sourceCount"`, `"layerCount"`, `"visibleLayerCount"`\]

#### properties.validation.properties.stats.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.validation.required

> `readonly` **required**: readonly \[`"valid"`, `"diagnostics"`, `"stats"`\]

#### properties.validation.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.commandEvidence

> `readonly` **commandEvidence**: `object`

#### properties.commandEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.commandEvidence.properties

> `readonly` **properties**: `object`

#### properties.commandEvidence.properties.usedApplyCommands

> `readonly` **usedApplyCommands**: `object`

#### properties.commandEvidence.properties.usedApplyCommands.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.commandEvidence.properties.traceId

> `readonly` **traceId**: `object`

#### properties.commandEvidence.properties.traceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.commandEvidence.properties.commandCount

> `readonly` **commandCount**: `object`

#### properties.commandEvidence.properties.commandCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.commandEvidence.properties.resultStatuses

> `readonly` **resultStatuses**: `object`

#### properties.commandEvidence.properties.resultStatuses.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.commandEvidence.properties.resultStatuses.items

> `readonly` **items**: `object`

#### properties.commandEvidence.properties.resultStatuses.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.commandEvidence.properties.resultStatuses.items.enum

> `readonly` **enum**: readonly \[`"applied"`, `"skipped"`, `"failed"`\]

#### properties.commandEvidence.properties.committed

> `readonly` **committed**: `object`

#### properties.commandEvidence.properties.committed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.commandEvidence.properties.rolledBack

> `readonly` **rolledBack**: `object`

#### properties.commandEvidence.properties.rolledBack.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.commandEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.commandEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.commandEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.commandEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.commandEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.commandEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.commandEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.commandEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.commandEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.commandEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.commandEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.commandEvidence.properties.changedPaths

> `readonly` **changedPaths**: `object`

#### properties.commandEvidence.properties.changedPaths.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.commandEvidence.properties.changedPaths.items

> `readonly` **items**: `object`

#### properties.commandEvidence.properties.changedPaths.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.commandEvidence.required

> `readonly` **required**: readonly \[`"usedApplyCommands"`, `"traceId"`, `"commandCount"`, `"resultStatuses"`, `"committed"`, `"rolledBack"`, `"diagnosticCounts"`, `"changedPaths"`\]

#### properties.commandEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.plannerEvidence

> `readonly` **plannerEvidence**: `object`

#### properties.plannerEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.plannerEvidence.properties

> `readonly` **properties**: `object`

#### properties.plannerEvidence.properties.provided

> `readonly` **provided**: `object`

#### properties.plannerEvidence.properties.provided.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.plannerEvidence.properties.plannerId

> `readonly` **plannerId**: `object`

#### properties.plannerEvidence.properties.plannerId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.promptHash

> `readonly` **promptHash**: `object`

#### properties.plannerEvidence.properties.promptHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.traceId

> `readonly` **traceId**: `object`

#### properties.plannerEvidence.properties.traceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.commandTraceId

> `readonly` **commandTraceId**: `object`

#### properties.plannerEvidence.properties.commandTraceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.retainedRawPrompt

> `readonly` **retainedRawPrompt**: `object`

#### properties.plannerEvidence.properties.retainedRawPrompt.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.plannerEvidence.properties.retainedRawPrompt.const

> `readonly` **const**: `false` = `false`

#### properties.plannerEvidence.properties.confidence

> `readonly` **confidence**: `object` = `PlannerConfidenceSchema`

#### properties.plannerEvidence.properties.confidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.plannerEvidence.properties.confidence.properties

> `readonly` **properties**: `object`

#### properties.plannerEvidence.properties.confidence.properties.level

> `readonly` **level**: `object`

#### properties.plannerEvidence.properties.confidence.properties.level.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.confidence.properties.level.enum

> `readonly` **enum**: readonly \[`"high"`, `"medium"`, `"low"`, `"unknown"`\]

#### properties.plannerEvidence.properties.confidence.properties.score

> `readonly` **score**: `object`

#### properties.plannerEvidence.properties.confidence.properties.score.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.plannerEvidence.properties.confidence.properties.score.minimum

> `readonly` **minimum**: `0` = `0`

#### properties.plannerEvidence.properties.confidence.properties.score.maximum

> `readonly` **maximum**: `1` = `1`

#### properties.plannerEvidence.properties.confidence.properties.reasons

> `readonly` **reasons**: `object`

#### properties.plannerEvidence.properties.confidence.properties.reasons.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.plannerEvidence.properties.confidence.properties.reasons.items

> `readonly` **items**: `object`

#### properties.plannerEvidence.properties.confidence.properties.reasons.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.confidence.required

> `readonly` **required**: readonly \[`"level"`, `"score"`, `"reasons"`\]

#### properties.plannerEvidence.properties.confidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.plannerEvidence.properties.acceptedIntentFields

> `readonly` **acceptedIntentFields**: `object`

#### properties.plannerEvidence.properties.acceptedIntentFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.plannerEvidence.properties.acceptedIntentFields.items

> `readonly` **items**: `object`

#### properties.plannerEvidence.properties.acceptedIntentFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.unsupportedIntentFields

> `readonly` **unsupportedIntentFields**: `object`

#### properties.plannerEvidence.properties.unsupportedIntentFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.plannerEvidence.properties.unsupportedIntentFields.items

> `readonly` **items**: `object`

#### properties.plannerEvidence.properties.unsupportedIntentFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.sourcePromptHashes

> `readonly` **sourcePromptHashes**: `object`

#### properties.plannerEvidence.properties.sourcePromptHashes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.plannerEvidence.properties.sourcePromptHashes.items

> `readonly` **items**: `object`

#### properties.plannerEvidence.properties.sourcePromptHashes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.plannerEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.plannerEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.plannerEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.plannerEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.plannerEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.plannerEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.plannerEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.plannerEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.plannerEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.plannerEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.plannerEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.plannerEvidence.required

> `readonly` **required**: readonly \[`"provided"`, `"plannerId"`, `"promptHash"`, `"traceId"`, `"commandTraceId"`, `"retainedRawPrompt"`, `"confidence"`, `"acceptedIntentFields"`, `"unsupportedIntentFields"`, `"sourcePromptHashes"`, `"diagnosticCounts"`\]

#### properties.plannerEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryEvidence

> `readonly` **spatialQueryEvidence**: `object`

#### properties.spatialQueryEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryEvidence.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryEvidence.properties.requested

> `readonly` **requested**: `object`

#### properties.spatialQueryEvidence.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQueryEvidence.properties.ready

> `readonly` **ready**: `object`

#### properties.spatialQueryEvidence.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQueryEvidence.properties.renderer

> `readonly` **renderer**: `object`

#### properties.spatialQueryEvidence.properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.spatialQueryEvidence.properties.status

> `readonly` **status**: `object`

#### properties.spatialQueryEvidence.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"not-requested"`\]

#### properties.spatialQueryEvidence.properties.requestedOperations

> `readonly` **requestedOperations**: `object`

#### properties.spatialQueryEvidence.properties.requestedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.requestedOperations.items

> `readonly` **items**: `TUnion`\<\[`TLiteral`\&lt;`"point-query"`\&gt;, `TLiteral`\&lt;`"bbox-query"`\&gt;, `TLiteral`\&lt;`"buffer"`\&gt;, `TLiteral`\&lt;`"intersection"`\&gt;, `TLiteral`\&lt;`"overlay"`\&gt;, `TLiteral`\&lt;`"routing"`\&gt;, `TLiteral`\&lt;`"aggregation"`\&gt;\]\>

#### properties.spatialQueryEvidence.properties.acceptedQueryOperations

> `readonly` **acceptedQueryOperations**: `object`

#### properties.spatialQueryEvidence.properties.acceptedQueryOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.acceptedQueryOperations.items

> `readonly` **items**: `TUnion`\<\[`TLiteral`\&lt;`"point-query"`\&gt;, `TLiteral`\&lt;`"bbox-query"`\&gt;\]\>

#### properties.spatialQueryEvidence.properties.blockedOperations

> `readonly` **blockedOperations**: `object`

#### properties.spatialQueryEvidence.properties.blockedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.blockedOperations.items

> `readonly` **items**: `TUnion`\<\[`TLiteral`\&lt;`"point-query"`\&gt;, `TLiteral`\&lt;`"bbox-query"`\&gt;, `TLiteral`\&lt;`"buffer"`\&gt;, `TLiteral`\&lt;`"intersection"`\&gt;, `TLiteral`\&lt;`"overlay"`\&gt;, `TLiteral`\&lt;`"routing"`\&gt;, `TLiteral`\&lt;`"aggregation"`\&gt;\]\>

#### properties.spatialQueryEvidence.properties.unsupportedOperations

> `readonly` **unsupportedOperations**: `object`

#### properties.spatialQueryEvidence.properties.unsupportedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.unsupportedOperations.items

> `readonly` **items**: `TUnion`\<\[`TLiteral`\&lt;`"point-query"`\&gt;, `TLiteral`\&lt;`"bbox-query"`\&gt;, `TLiteral`\&lt;`"buffer"`\&gt;, `TLiteral`\&lt;`"intersection"`\&gt;, `TLiteral`\&lt;`"overlay"`\&gt;, `TLiteral`\&lt;`"routing"`\&gt;, `TLiteral`\&lt;`"aggregation"`\&gt;\]\>

#### properties.spatialQueryEvidence.properties.capabilityQueries

> `readonly` **capabilityQueries**: `object`

#### properties.spatialQueryEvidence.properties.capabilityQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.capabilityQueries.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.capabilityQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.capabilityGate

> `readonly` **capabilityGate**: `object` = `SpatialQueryCapabilityGateSchema`

#### properties.spatialQueryEvidence.properties.capabilityGate.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.status

> `readonly` **status**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.status.enum

> `readonly` **enum**: readonly \[`"passed"`, `"waived"`, `"blocked"`\]

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.requiredQueries

> `readonly` **requiredQueries**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.requiredQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.requiredQueries.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.requiredQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.requiredQueries.items.enum

> `readonly` **enum**: readonly \[`"point"`, `"bbox"`\]

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.providedQueries

> `readonly` **providedQueries**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.providedQueries.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.providedQueries.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.providedQueries.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver

> `readonly` **waiver**: `object` = `SpatialQueryCapabilityWaiverSchema`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.reason

> `readonly` **reason**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.reason.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.approvedBy

> `readonly` **approvedBy**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.approvedBy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.approvedBy.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.followUpTaskId

> `readonly` **followUpTaskId**: `object`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.followUpTaskId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.properties.followUpTaskId.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.required

> `readonly` **required**: readonly \[`"reason"`, `"approvedBy"`, `"followUpTaskId"`\]

#### properties.spatialQueryEvidence.properties.capabilityGate.properties.waiver.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryEvidence.properties.capabilityGate.required

> `readonly` **required**: readonly \[`"status"`, `"requiredQueries"`, `"providedQueries"`\]

#### properties.spatialQueryEvidence.properties.capabilityGate.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryEvidence.properties.queryableSourceIds

> `readonly` **queryableSourceIds**: `object`

#### properties.spatialQueryEvidence.properties.queryableSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.queryableSourceIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.queryableSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.queryableLayerIds

> `readonly` **queryableLayerIds**: `object`

#### properties.spatialQueryEvidence.properties.queryableLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.queryableLayerIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.queryableLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.hiddenLayerIds

> `readonly` **hiddenLayerIds**: `object`

#### properties.spatialQueryEvidence.properties.hiddenLayerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.hiddenLayerIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.hiddenLayerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.unsupportedSourceIds

> `readonly` **unsupportedSourceIds**: `object`

#### properties.spatialQueryEvidence.properties.unsupportedSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.unsupportedSourceIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.unsupportedSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.missingSourceIds

> `readonly` **missingSourceIds**: `object`

#### properties.spatialQueryEvidence.properties.missingSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.missingSourceIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.missingSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.cases

> `readonly` **cases**: `object`

#### properties.spatialQueryEvidence.properties.cases.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.cases.items

> `readonly` **items**: `object` = `SpatialQueryCaseEvidenceSchema`

#### properties.spatialQueryEvidence.properties.cases.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryEvidence.properties.cases.items.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.id

> `readonly` **id**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.operation

> `readonly` **operation**: `TUnion`\<\[`TLiteral`\&lt;`"point-query"`\&gt;, `TLiteral`\&lt;`"bbox-query"`\&gt;\]\>

#### properties.spatialQueryEvidence.properties.cases.items.properties.layerIds

> `readonly` **layerIds**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.layerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.layerIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.layerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.featureCount

> `readonly` **featureCount**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.featureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.resultLimit.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.resultTruncated

> `readonly` **resultTruncated**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.resultTruncated.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.fixtureHash

> `readonly` **fixtureHash**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.fixtureHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.fixtureHash.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.spatialQueryEvidence.properties.cases.items.properties.passed

> `readonly` **passed**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.passed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.spatialQueryEvidence.properties.cases.items.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryEvidence.properties.cases.items.required

> `readonly` **required**: readonly \[`"id"`, `"operation"`, `"layerIds"`, `"sourceIds"`, `"featureCount"`, `"resultLimit"`, `"resultTruncated"`, `"fixtureHash"`, `"passed"`, `"diagnosticCounts"`\]

#### properties.spatialQueryEvidence.properties.cases.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.spatialQueryEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.spatialQueryEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueryEvidence.required

> `readonly` **required**: readonly \[`"requested"`, `"ready"`, `"renderer"`, `"status"`, `"requestedOperations"`, `"acceptedQueryOperations"`, `"blockedOperations"`, `"unsupportedOperations"`, `"capabilityQueries"`, `"capabilityGate"`, `"queryableSourceIds"`, `"queryableLayerIds"`, `"hiddenLayerIds"`, `"unsupportedSourceIds"`, `"missingSourceIds"`, `"cases"`, `"diagnosticCounts"`\]

#### properties.spatialQueryEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.snapshotEvidence

> `readonly` **snapshotEvidence**: `object`

#### properties.snapshotEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.snapshotEvidence.properties

> `readonly` **properties**: `object`

#### properties.snapshotEvidence.properties.requested

> `readonly` **requested**: `object`

#### properties.snapshotEvidence.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.snapshotEvidence.properties.renderer

> `readonly` **renderer**: `object`

#### properties.snapshotEvidence.properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.snapshotEvidence.properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.snapshotEvidence.properties.passed

> `readonly` **passed**: `object`

#### properties.snapshotEvidence.properties.passed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.snapshotEvidence.properties.dataUrlPresent

> `readonly` **dataUrlPresent**: `object`

#### properties.snapshotEvidence.properties.dataUrlPresent.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.snapshotEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.snapshotEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.snapshotEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.snapshotEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.snapshotEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.snapshotEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.snapshotEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.snapshotEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.snapshotEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.snapshotEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.snapshotEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.snapshotEvidence.properties.result

> `readonly` **result**: `object` = `SnapshotSpecContractSchema`

#### properties.snapshotEvidence.properties.result.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.snapshotEvidence.properties.result.properties

> `readonly` **properties**: `object`

#### properties.snapshotEvidence.properties.result.properties.passed

> `readonly` **passed**: `object`

#### properties.snapshotEvidence.properties.result.properties.passed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.snapshotEvidence.properties.result.properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.snapshotEvidence.properties.result.properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.snapshotEvidence.properties.result.properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[..., ..., ...\]\>; `code`: `TUnion`\&lt;...[]\&gt;; `blockerCode`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\&lt;...\&gt;\>; `fix`: `TOptional`\<`TObject`\&lt;...\&gt;\>; \}\> = `DiagnosticContractSchema`

#### properties.snapshotEvidence.properties.result.properties.dataUrl

> `readonly` **dataUrl**: `object`

#### properties.snapshotEvidence.properties.result.properties.dataUrl.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.snapshotEvidence.properties.result.properties.renderer

> `readonly` **renderer**: `object`

#### properties.snapshotEvidence.properties.result.properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.snapshotEvidence.properties.result.properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.snapshotEvidence.properties.result.properties.validation

> `readonly` **validation**: `object` = `ValidationReportSchema`

#### properties.snapshotEvidence.properties.result.properties.validation.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.snapshotEvidence.properties.result.properties.validation.properties

> `readonly` **properties**: `object`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.valid

> `readonly` **valid**: `object`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.valid.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: ...; `code`: ...; `blockerCode`: ...; `message`: ...; `path`: ...; `relatedResources`: ...; `fix`: ...; \}\> = `DiagnosticContractSchema`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats

> `readonly` **stats**: `object`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.properties

> `readonly` **properties**: `object`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.properties.sourceCount.type

> `readonly` **type**: ... = `"number"`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.properties.layerCount.type

> `readonly` **type**: ... = `"number"`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.properties.visibleLayerCount

> `readonly` **visibleLayerCount**: `object`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.properties.visibleLayerCount.type

> `readonly` **type**: ... = `"number"`

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.required

> `readonly` **required**: readonly \[`"sourceCount"`, `"layerCount"`, `"visibleLayerCount"`\]

#### properties.snapshotEvidence.properties.result.properties.validation.properties.stats.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.snapshotEvidence.properties.result.properties.validation.required

> `readonly` **required**: readonly \[`"valid"`, `"diagnostics"`, `"stats"`\]

#### properties.snapshotEvidence.properties.result.properties.validation.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.snapshotEvidence.properties.result.required

> `readonly` **required**: readonly \[`"passed"`, `"diagnostics"`, `"renderer"`, `"validation"`\]

#### properties.snapshotEvidence.properties.result.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.snapshotEvidence.required

> `readonly` **required**: readonly \[`"requested"`, `"renderer"`, `"passed"`, `"dataUrlPresent"`, `"diagnosticCounts"`\]

#### properties.snapshotEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exportEvidence

> `readonly` **exportEvidence**: `object`

#### properties.exportEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exportEvidence.properties

> `readonly` **properties**: `object`

#### properties.exportEvidence.properties.ready

> `readonly` **ready**: `object`

#### properties.exportEvidence.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exportEvidence.properties.revision

> `readonly` **revision**: `object`

#### properties.exportEvidence.properties.revision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exportEvidence.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.exportEvidence.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exportEvidence.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.exportEvidence.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exportEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.exportEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exportEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.exportEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.exportEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exportEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.exportEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exportEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.exportEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exportEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.exportEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exportEvidence.required

> `readonly` **required**: readonly \[`"ready"`, `"sourceCount"`, `"layerCount"`, `"diagnosticCounts"`\]

#### properties.exportEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

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

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract

> `readonly` **loaderContract**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties

> `readonly` **properties**: `object`

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.resourceAccess

> `readonly` **resourceAccess**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.cancellation

> `readonly` **cancellation**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.timeoutMs

> `readonly` **timeoutMs**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.properties.byteBudgetBytes

> `readonly` **byteBudgetBytes**: ...

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.required

> `readonly` **required**: readonly \[..., ..., ..., ...\]

#### properties.delivery.properties.sourceReadiness.items.properties.queryEvidence.properties.loaderContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

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

> `readonly` **required**: readonly \[`"status"`, `"sourceLayerIds"`, `"layerIds"`, `"loaderContract"`, `"diagnosticCounts"`, `"requirements"`, `"summary"`\]

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

#### properties.exampleEvidence

> `readonly` **exampleEvidence**: `object`

#### properties.exampleEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.exampleId

> `readonly` **exampleId**: `object` = `ExportExampleAppToolInputSchema.properties.exampleId`

#### properties.exampleEvidence.properties.exampleId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.exampleId.enum

> `readonly` **enum**: readonly \[`"basic-geojson"`, `"ai-map-edit"`, `"raster-basemap"`, `"pmtiles-local"`, `"vector-tile-url"`, `"fill-extrusion-lite"`\] = `exampleIds`

#### properties.exampleEvidence.properties.writesFiles

> `readonly` **writesFiles**: `object`

#### properties.exampleEvidence.properties.writesFiles.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.writesFiles.const

> `readonly` **const**: `false` = `false`

#### properties.exampleEvidence.properties.fileCount

> `readonly` **fileCount**: `object`

#### properties.exampleEvidence.properties.fileCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.exampleEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.exampleEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.exampleEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.exampleEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.exampleEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence

> `readonly` **generationEvidence**: `object` = `ExampleAppGenerationEvidenceSummarySchema`

#### properties.exampleEvidence.properties.generationEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.promptHash

> `readonly` **promptHash**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.promptHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.status

> `readonly` **status**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery

> `readonly` **delivery**: `object` = `ExampleAppDeliverySummarySchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.status

> `readonly` **status**: `object` = `DeliveryStatusSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"needs-confirmation"`, `"follow-up-required"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance

> `readonly` **acceptance**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.state

> `readonly` **state**: `object` = `DeliveryStatusSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.state.type

> `readonly` **type**: ... = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.state.enum

> `readonly` **enum**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.ready

> `readonly` **ready**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.ready.type

> `readonly` **type**: ... = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.blocked

> `readonly` **blocked**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.blocked.type

> `readonly` **type**: ... = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.needsConfirmation

> `readonly` **needsConfirmation**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.needsConfirmation.type

> `readonly` **type**: ... = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.followUpRequired

> `readonly` **followUpRequired**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.properties.followUpRequired.type

> `readonly` **type**: ... = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.required

> `readonly` **required**: readonly \[`"state"`, `"ready"`, `"blocked"`, `"needsConfirmation"`, `"followUpRequired"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.acceptance.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections

> `readonly` **sections**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.properties.id

> `readonly` **id**: ... = `DeliverySectionIdSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.properties.status

> `readonly` **status**: ... = `DeliveryStatusSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.properties.blockerCount

> `readonly` **blockerCount**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.properties.confirmationRequired

> `readonly` **confirmationRequired**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.properties.followUpCount

> `readonly` **followUpCount**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ...\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sections.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations

> `readonly` **confirmations**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.reason

> `readonly` **reason**: ... = `DeliveryConfirmationReasonSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.required

> `readonly` **required**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.target

> `readonly` **target**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items.properties.sourceIds

> `readonly` **sourceIds**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items.required

> `readonly` **required**: readonly \[..., ..., ...\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmations.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmationRequired

> `readonly` **confirmationRequired**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.confirmationRequired.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps

> `readonly` **followUps**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.properties.id

> `readonly` **id**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.properties.owner

> `readonly` **owner**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.properties.targetArtifact

> `readonly` **targetArtifact**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.properties.reason

> `readonly` **reason**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.properties.blockerCode

> `readonly` **blockerCode**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.required

> `readonly` **required**: readonly \[..., ..., ..., ...\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.followUps.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness

> `readonly` **sourceReadiness**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceId

> `readonly` **sourceId**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.type

> `readonly` **type**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.state

> `readonly` **state**: ... = `SourceReadinessStateSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryReady

> `readonly` **queryReady**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.archiveContract

> `readonly` **archiveContract**: ... = `SourceArchiveContractSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.sourceContract

> `readonly` **sourceContract**: ... = `SourceContractSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.runtimeLoadPlan

> `readonly` **runtimeLoadPlan**: ... = `SourceRuntimeLoadPlanSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.queryEvidence

> `readonly` **queryEvidence**: ... = `SourcePMTilesQueryEvidenceSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.confirmationReasons

> `readonly` **confirmationReasons**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.properties.notes

> `readonly` **notes**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ..., ...\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourceReadiness.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates

> `readonly` **sourcePromotionCandidates**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.candidateId

> `readonly` **candidateId**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.format

> `readonly` **format**: ... = `SourcePromotionCandidateFormatSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.state

> `readonly` **state**: ... = `SourceReadinessStateSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.resourcePolicy

> `readonly` **resourcePolicy**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.archiveContract

> `readonly` **archiveContract**: ... = `SourceArchiveContractSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceContract

> `readonly` **sourceContract**: ... = `SourceContractSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.target

> `readonly` **target**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.exitCondition

> `readonly` **exitCondition**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.sourceIds

> `readonly` **sourceIds**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.properties.notes

> `readonly` **notes**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.required

> `readonly` **required**: readonly \[..., ..., ..., ..., ..., ..., ...\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.sourcePromotionCandidates.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness

> `readonly` **spatialQueryReadiness**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requested

> `readonly` **requested**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requested.type

> `readonly` **type**: ... = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.state

> `readonly` **state**: `object` = `SpatialQueryReadinessStateSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.state.type

> `readonly` **type**: ... = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.state.enum

> `readonly` **enum**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.status

> `readonly` **status**: `object` = `SpatialQueryEvidenceStatusSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.status.type

> `readonly` **type**: ... = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.status.enum

> `readonly` **enum**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus

> `readonly` **capabilityGateStatus**: `object` = `SpatialQueryCapabilityGateStatusSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus.type

> `readonly` **type**: ... = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.capabilityGateStatus.enum

> `readonly` **enum**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries

> `readonly` **requiredQueries**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.requiredQueries.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.providedQueries

> `readonly` **providedQueries**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.providedQueries.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.providedQueries.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.caseCount

> `readonly` **caseCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.caseCount.type

> `readonly` **type**: ... = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.passedCaseCount

> `readonly` **passedCaseCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.passedCaseCount.type

> `readonly` **type**: ... = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.failedCaseCount

> `readonly` **failedCaseCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.failedCaseCount.type

> `readonly` **type**: ... = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.resultLimit.type

> `readonly` **type**: ... = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.resultTruncated

> `readonly` **resultTruncated**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.resultTruncated.type

> `readonly` **type**: ... = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockerCount

> `readonly` **blockerCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockerCount.type

> `readonly` **type**: ... = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpCount

> `readonly` **followUpCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpCount.type

> `readonly` **type**: ... = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds

> `readonly` **followUpTaskIds**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.followUpTaskIds.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds

> `readonly` **queryableLayerIds**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableLayerIds.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds

> `readonly` **queryableSourceIds**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.queryableSourceIds.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds

> `readonly` **unsupportedSourceIds**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.unsupportedSourceIds.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds

> `readonly` **missingSourceIds**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.missingSourceIds.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds

> `readonly` **hiddenLayerIds**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.hiddenLayerIds.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations

> `readonly` **blockedOperations**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.blockedOperations.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases

> `readonly` **cases**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.type

> `readonly` **type**: ... = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.properties.cases.items

> `readonly` **items**: ...

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.required

> `readonly` **required**: readonly \[`"requested"`, `"state"`, `"status"`, `"capabilityGateStatus"`, `"requiredQueries"`, `"providedQueries"`, `"caseCount"`, `"passedCaseCount"`, `"failedCaseCount"`, `"resultLimit"`, `"resultTruncated"`, `"blockerCount"`, `"followUpCount"`, `"followUpTaskIds"`, `"queryableLayerIds"`, `"queryableSourceIds"`, `"unsupportedSourceIds"`, `"missingSourceIds"`, `"hiddenLayerIds"`, `"blockedOperations"`, `"cases"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.properties.spatialQueryReadiness.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.required

> `readonly` **required**: readonly \[`"status"`, `"acceptance"`, `"sections"`, `"confirmations"`, `"confirmationRequired"`, `"followUps"`, `"sourceReadiness"`, `"spatialQueryReadiness"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.delivery.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.targetDomains

> `readonly` **targetDomains**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.targetDomains.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.targetDomains.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.targetDomains.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.targetDomains.items.enum

> `readonly` **enum**: readonly \[`"feature-display"`, `"spatial-analysis"`, `"scene-browsing"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.toolSequence

> `readonly` **toolSequence**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.toolSequence.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.toolSequence.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.toolSequence.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.toolSequence.items.enum

> `readonly` **enum**: readonly \[`"validate_spec"`, `"apply_commands"`, `"export_spec"`, `"get_context_summary"`, `"snapshot_spec"`, `"explain_spec"`, `"export_example_app"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.command

> `readonly` **command**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties.usedApplyCommands

> `readonly` **usedApplyCommands**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties.usedApplyCommands.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties.commandCount

> `readonly` **commandCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties.commandCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties.committed

> `readonly` **committed**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties.committed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties.rolledBack

> `readonly` **rolledBack**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.properties.rolledBack.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.command.required

> `readonly` **required**: readonly \[`"usedApplyCommands"`, `"commandCount"`, `"committed"`, `"rolledBack"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.command.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner

> `readonly` **planner**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.properties.provided

> `readonly` **provided**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.properties.provided.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.properties.confidenceLevel

> `readonly` **confidenceLevel**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.properties.confidenceLevel.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.properties.confidenceLevel.enum

> `readonly` **enum**: readonly \[`"high"`, `"medium"`, `"low"`, `"unknown"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.properties.unsupportedIntentCount

> `readonly` **unsupportedIntentCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.properties.unsupportedIntentCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.required

> `readonly` **required**: readonly \[`"provided"`, `"confidenceLevel"`, `"unsupportedIntentCount"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.planner.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery

> `readonly` **spatialQuery**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.requested

> `readonly` **requested**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.ready

> `readonly` **ready**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.status

> `readonly` **status**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.status.enum

> `readonly` **enum**: readonly \[`"ready"`, `"blocked"`, `"not-requested"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.caseCount

> `readonly` **caseCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.caseCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.blockedOperations

> `readonly` **blockedOperations**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.blockedOperations.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.blockedOperations.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.properties.blockedOperations.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.required

> `readonly` **required**: readonly \[`"requested"`, `"ready"`, `"status"`, `"caseCount"`, `"blockedOperations"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.spatialQuery.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing

> `readonly` **sceneBrowsing**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.requested

> `readonly` **requested**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.status

> `readonly` **status**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.status.enum

> `readonly` **enum**: readonly \[`"experimental"`, `"blocked"`, `"not-requested"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.extensionPresent

> `readonly` **extensionPresent**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.extensionPresent.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableViewMode

> `readonly` **stableViewMode**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableViewMode.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableViewMode.const

> `readonly` **const**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.runtimeSupported

> `readonly` **runtimeSupported**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.runtimeSupported.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.runtimeSupported.const

> `readonly` **const**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlocked

> `readonly` **stableRuntimeBlocked**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlocked.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlocked.const

> `readonly` **const**: `true` = `true`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.state

> `readonly` **state**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.state.enum

> `readonly` **enum**: readonly \[`"extension-only"`, `"blocked"`, `"not-requested"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.sourceIds

> `readonly` **sourceIds**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.sourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.sourceIds.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.sourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.layerIds

> `readonly` **layerIds**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.layerIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.layerIds.items

> `readonly` **items**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.layerIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.pickableLayerCount

> `readonly` **pickableLayerCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.pickableLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.mockSnapshotPassed

> `readonly` **mockSnapshotPassed**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.mockSnapshotPassed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.mockQueryPickCount

> `readonly` **mockQueryPickCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.mockQueryPickCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes

> `readonly` **stableRuntimeBlockerCodes**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items

> `readonly` **items**: `object` = `Scene3DStableRuntimeBlockerCodeSchema`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.properties.stableRuntimeBlockerCodes.items.enum

> `readonly` **enum**: ...[]

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.required

> `readonly` **required**: readonly \[`"requested"`, `"status"`, `"extensionPresent"`, `"stableViewMode"`, `"runtimeSupported"`, `"stableRuntimeBlocked"`, `"state"`, `"sourceCount"`, `"layerCount"`, `"sourceIds"`, `"layerIds"`, `"pickableLayerCount"`, `"mockSnapshotPassed"`, `"mockQueryPickCount"`, `"stableRuntimeBlockerCodes"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.sceneBrowsing.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot

> `readonly` **snapshot**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.properties.requested

> `readonly` **requested**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.properties.requested.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.properties.renderer

> `readonly` **renderer**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.properties.passed

> `readonly` **passed**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.properties.passed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.required

> `readonly` **required**: readonly \[`"requested"`, `"renderer"`, `"passed"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.snapshot.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.properties.export

> `readonly` **export**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.properties

> `readonly` **properties**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.properties.ready

> `readonly` **ready**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.properties.ready.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.exampleEvidence.properties.generationEvidence.properties.export.required

> `readonly` **required**: readonly \[`"ready"`, `"sourceCount"`, `"layerCount"`\]

#### properties.exampleEvidence.properties.generationEvidence.properties.export.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.properties.generationEvidence.required

> `readonly` **required**: readonly \[`"status"`, `"delivery"`, `"targetDomains"`, `"toolSequence"`, `"diagnosticCounts"`, `"command"`, `"planner"`, `"spatialQuery"`, `"sceneBrowsing"`, `"snapshot"`, `"export"`\]

#### properties.exampleEvidence.properties.generationEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleEvidence.required

> `readonly` **required**: readonly \[`"exampleId"`, `"writesFiles"`, `"fileCount"`, `"diagnosticCounts"`\]

#### properties.exampleEvidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<`"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\<`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`\>[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: `TUnion`\<\[..., ..., ..., ..., ..., ...\]\>; `id`: `TOptional`\&lt;`TString`\&gt;; `path`: `TOptional`\&lt;`TString`\&gt;; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `confidence`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `message`: `TString`; `patch`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `command`: `TOptional`\&lt;`TUnknown`\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

### required

> `readonly` **required**: readonly \[`"promptHash"`, `"status"`, `"targetDomains"`, `"toolSequence"`, `"summary"`, `"validation"`, `"commandEvidence"`, `"plannerEvidence"`, `"spatialQueryEvidence"`, `"snapshotEvidence"`, `"exportEvidence"`, `"delivery"`, `"exampleEvidence"`, `"diagnostics"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
