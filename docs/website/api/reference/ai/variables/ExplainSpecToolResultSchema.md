[**@gis-engine/ai v1.0.0**](../index.md)

***

# Variable: ExplainSpecToolResultSchema

> `const` **ExplainSpecToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.summary

> `readonly` **summary**: `object` = `ContextSummaryToolResultSchema`

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

> `readonly` **validation**: `object` = `ValidationReportSchema`

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

#### properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<`"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\<`"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`\>[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: `TUnion`\<\[..., ..., ..., ..., ..., ...\]\>; `id`: `TOptional`\&lt;`TString`\&gt;; `path`: `TOptional`\&lt;`TString`\&gt;; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `confidence`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `message`: `TString`; `patch`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `command`: `TOptional`\&lt;`TUnknown`\&gt;; \}\>\>; \}\> = `DiagnosticContractSchema`

### required

> `readonly` **required**: readonly \[`"summary"`, `"validation"`, `"diagnostics"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
