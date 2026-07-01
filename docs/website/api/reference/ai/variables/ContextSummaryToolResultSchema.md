[**@gis-engine/ai v1.1.0**](../index.md)

***

# Variable: ContextSummaryToolResultSchema

> `const` **ContextSummaryToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.id

> `readonly` **id**: `object`

#### properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.revision

> `readonly` **revision**: `object`

#### properties.revision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.view

> `readonly` **view**: `TObject`\<\{ `mode`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;`"map2d"`\&gt;, `TLiteral`\&lt;`"map2_5d"`\&gt;, `TLiteral`\&lt;`"scene3d"`\&gt;\]\>\>; `center`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`\]\>\>; `zoom`: `TOptional`\&lt;`TNumber`\&gt;; `bearing`: `TOptional`\&lt;`TNumber`\&gt;; `pitch`: `TOptional`\&lt;`TNumber`\&gt;; `bounds`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\>; \}\> = `MapSpecSchema.properties.view`

#### properties.sources

> `readonly` **sources**: `object`

#### properties.sources.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sources.items

> `readonly` **items**: `object`

#### properties.sources.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sources.items.properties

> `readonly` **properties**: `object`

#### properties.sources.items.properties.id

> `readonly` **id**: `object`

#### properties.sources.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sources.items.properties.type

> `readonly` **type**: `object`

#### properties.sources.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sources.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.sources.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sources.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.sources.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object`

#### properties.sources.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sources.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[`"archive"`, `"schema"`\]

#### properties.sources.items.properties.sourceContract.properties.state

> `readonly` **state**: `object`

#### properties.sources.items.properties.sourceContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sources.items.properties.sourceContract.properties.state.enum

> `readonly` **enum**: readonly \[`"explicit"`, `"not-applicable"`, `"not-checked"`\]

#### properties.sources.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.sources.items.properties.sourceContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sources.items.properties.sourceContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.sources.items.properties.sourceContract.properties.metadataFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sources.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.sources.items.properties.sourceContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sources.items.properties.sourceContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.sources.items.properties.sourceContract.properties.policyFields.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sources.items.properties.sourceContract.required

> `readonly` **required**: readonly \[`"kind"`, `"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.sources.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sources.items.required

> `readonly` **required**: readonly \[`"id"`, `"type"`\]

#### properties.sources.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.sourceReadiness

> `readonly` **sourceReadiness**: `object`

#### properties.sourceReadiness.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.sourceReadiness.items

> `readonly` **items**: `object` = `SourceReadinessSchema`

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

> `readonly` **state**: `object`

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

#### properties.sourceReadiness.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.sourceReadiness.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object`

#### properties.sourceReadiness.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.sourceReadiness.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[`"archive"`, `"schema"`\]

#### properties.sourceReadiness.items.properties.sourceContract.properties.state

> `readonly` **state**: `object`

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

#### properties.sourceReadiness.items.properties.archiveContract

> `readonly` **archiveContract**: `object` = `SourceArchiveContractSchema`

#### properties.sourceReadiness.items.properties.archiveContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.sourceReadiness.items.properties.archiveContract.properties

> `readonly` **properties**: `object`

#### properties.sourceReadiness.items.properties.archiveContract.properties.state

> `readonly` **state**: `object`

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

#### properties.sourceReadiness.items.required

> `readonly` **required**: readonly \[`"sourceId"`, `"type"`, `"state"`, `"queryReady"`, `"resourcePolicy"`\]

#### properties.sourceReadiness.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.layers

> `readonly` **layers**: `object`

#### properties.layers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.layers.items

> `readonly` **items**: `object`

#### properties.layers.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.layers.items.properties

> `readonly` **properties**: `object`

#### properties.layers.items.properties.id

> `readonly` **id**: `object`

#### properties.layers.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.layers.items.properties.type

> `readonly` **type**: `object`

#### properties.layers.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.layers.items.properties.source

> `readonly` **source**: `object`

#### properties.layers.items.properties.source.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.layers.items.properties.visibility

> `readonly` **visibility**: `object`

#### properties.layers.items.properties.visibility.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.layers.items.properties.visibility.enum

> `readonly` **enum**: readonly \[`"visible"`, `"none"`\]

#### properties.layers.items.required

> `readonly` **required**: readonly \[`"id"`, `"type"`, `"visibility"`\]

#### properties.layers.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.validation

> `readonly` **validation**: `object`

#### properties.validation.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.validation.properties

> `readonly` **properties**: `object`

#### properties.validation.properties.valid

> `readonly` **valid**: `object`

#### properties.validation.properties.valid.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.validation.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.validation.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.validation.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.validation.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.validation.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.validation.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.validation.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.validation.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.validation.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.validation.required

> `readonly` **required**: readonly \[`"valid"`, `"diagnosticCounts"`\]

#### properties.validation.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.capabilitySummary

> `readonly` **capabilitySummary**: `object` = `CapabilitySummarySchema`

#### properties.capabilitySummary.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.capabilitySummary.properties

> `readonly` **properties**: `object`

#### properties.capabilitySummary.properties.domains

> `readonly` **domains**: `object`

#### properties.capabilitySummary.properties.domains.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.capabilitySummary.properties.domains.items

> `readonly` **items**: `object` = `CapabilityDomainSummarySchema`

#### properties.capabilitySummary.properties.domains.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.capabilitySummary.properties.domains.items.properties

> `readonly` **properties**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.id

> `readonly` **id**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.capabilitySummary.properties.domains.items.properties.id.enum

> `readonly` **enum**: readonly \[`"feature-display"`, `"spatial-analysis"`, `"scene-browsing"`\]

#### properties.capabilitySummary.properties.domains.items.properties.status

> `readonly` **status**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.capabilitySummary.properties.domains.items.properties.status.enum

> `readonly` **enum**: readonly \[`"supported"`, `"experimental"`, `"blocked"`\]

#### properties.capabilitySummary.properties.domains.items.properties.supported

> `readonly` **supported**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.supported.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.capabilitySummary.properties.domains.items.properties.supported.items

> `readonly` **items**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.supported.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.capabilitySummary.properties.domains.items.properties.experimental

> `readonly` **experimental**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.experimental.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.capabilitySummary.properties.domains.items.properties.experimental.items

> `readonly` **items**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.experimental.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.capabilitySummary.properties.domains.items.properties.blocked

> `readonly` **blocked**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.blocked.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.capabilitySummary.properties.domains.items.properties.blocked.items

> `readonly` **items**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.blocked.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.capabilitySummary.properties.domains.items.properties.tools

> `readonly` **tools**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.tools.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.capabilitySummary.properties.domains.items.properties.tools.items

> `readonly` **items**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.tools.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.capabilitySummary.properties.domains.items.properties.tools.items.enum

> `readonly` **enum**: readonly \[`"validate_spec"`, `"apply_commands"`, `"export_spec"`, `"get_context_summary"`, `"snapshot_spec"`, `"explain_spec"`, `"export_example_app"`\]

#### properties.capabilitySummary.properties.domains.items.properties.evidence

> `readonly` **evidence**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.evidence.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.capabilitySummary.properties.domains.items.properties.evidence.items

> `readonly` **items**: `object`

#### properties.capabilitySummary.properties.domains.items.properties.evidence.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.capabilitySummary.properties.domains.items.required

> `readonly` **required**: readonly \[`"id"`, `"status"`, `"supported"`, `"experimental"`, `"blocked"`, `"tools"`, `"evidence"`\]

#### properties.capabilitySummary.properties.domains.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.capabilitySummary.required

> `readonly` **required**: readonly \[`"domains"`\]

#### properties.capabilitySummary.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.capabilities

> `readonly` **capabilities**: `TObject`\<\{ `renderer`: `TString`; `dimensions`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"2d"`\&gt;, `TLiteral`\&lt;`"2_5d"`\&gt;, `TLiteral`\&lt;`"3d"`\&gt;\]\>\>; `sources`: `TArray`\&lt;`TString`\&gt;; `layers`: `TArray`\&lt;`TString`\&gt;; `expressions`: `TArray`\&lt;`TString`\&gt;; `queries`: `TArray`\&lt;`TString`\&gt;; `snapshot`: `TObject`\<\{ `supported`: `TBoolean`; `formats`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"png"`\&gt;, `TLiteral`\&lt;`"jpeg"`\&gt;, `TLiteral`\&lt;`"data-url"`\&gt;\]\>\>; \}\>; `experimental`: `TArray`\&lt;`TString`\&gt;; \}\> = `CapabilityReportContractSchema`

#### properties.scene3d

> `readonly` **scene3d**: `object` = `Scene3DContextSummarySchema`

#### properties.scene3d.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.status

> `readonly` **status**: `object`

#### properties.scene3d.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.status.const

> `readonly` **const**: `"extension-only"` = `"extension-only"`

#### properties.scene3d.properties.stableViewMode

> `readonly` **stableViewMode**: `object`

#### properties.scene3d.properties.stableViewMode.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.scene3d.properties.stableViewMode.const

> `readonly` **const**: `false` = `false`

#### properties.scene3d.properties.runtimeSupported

> `readonly` **runtimeSupported**: `object`

#### properties.scene3d.properties.runtimeSupported.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.scene3d.properties.runtimeSupported.const

> `readonly` **const**: `false` = `false`

#### properties.scene3d.properties.sourceCount

> `readonly` **sourceCount**: `object`

#### properties.scene3d.properties.sourceCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.layerCount

> `readonly` **layerCount**: `object`

#### properties.scene3d.properties.layerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.visibleLayerCount

> `readonly` **visibleLayerCount**: `object`

#### properties.scene3d.properties.visibleLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.pickableLayerCount

> `readonly` **pickableLayerCount**: `object`

#### properties.scene3d.properties.pickableLayerCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.sources

> `readonly` **sources**: `object`

#### properties.scene3d.properties.sources.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.scene3d.properties.sources.items

> `readonly` **items**: `object`

#### properties.scene3d.properties.sources.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties.sources.items.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.sources.items.properties.id

> `readonly` **id**: `object`

#### properties.scene3d.properties.sources.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.sources.items.properties.type

> `readonly` **type**: `object`

#### properties.scene3d.properties.sources.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.sources.items.properties.sourceContract

> `readonly` **sourceContract**: `object` = `SourceContractSchema`

#### properties.scene3d.properties.sources.items.properties.sourceContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.kind

> `readonly` **kind**: `object`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.kind.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.kind.enum

> `readonly` **enum**: readonly \[..., ...\]

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.state

> `readonly` **state**: `object`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.state.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.state.enum

> `readonly` **enum**: readonly \[..., ..., ...\]

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.metadataFields

> `readonly` **metadataFields**: `object`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.metadataFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.metadataFields.items

> `readonly` **items**: `object`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.metadataFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.policyFields

> `readonly` **policyFields**: `object`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.policyFields.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.policyFields.items

> `readonly` **items**: `object`

#### properties.scene3d.properties.sources.items.properties.sourceContract.properties.policyFields.items.type

> `readonly` **type**: ... = `"string"`

#### properties.scene3d.properties.sources.items.properties.sourceContract.required

> `readonly` **required**: readonly \[`"kind"`, `"state"`, `"metadataFields"`, `"policyFields"`\]

#### properties.scene3d.properties.sources.items.properties.sourceContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.scene3d.properties.sources.items.required

> `readonly` **required**: readonly \[`"id"`, `"type"`\]

#### properties.scene3d.properties.sources.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.scene3d.properties.layers

> `readonly` **layers**: `object`

#### properties.scene3d.properties.layers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.scene3d.properties.layers.items

> `readonly` **items**: `object`

#### properties.scene3d.properties.layers.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties.layers.items.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.layers.items.properties.id

> `readonly` **id**: `object`

#### properties.scene3d.properties.layers.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.layers.items.properties.type

> `readonly` **type**: `object`

#### properties.scene3d.properties.layers.items.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.layers.items.properties.source

> `readonly` **source**: `object`

#### properties.scene3d.properties.layers.items.properties.source.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.layers.items.properties.visibility

> `readonly` **visibility**: `object`

#### properties.scene3d.properties.layers.items.properties.visibility.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.layers.items.properties.visibility.enum

> `readonly` **enum**: readonly \[`"visible"`, `"none"`\]

#### properties.scene3d.properties.layers.items.properties.pickable

> `readonly` **pickable**: `object`

#### properties.scene3d.properties.layers.items.properties.pickable.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.scene3d.properties.layers.items.required

> `readonly` **required**: readonly \[`"id"`, `"type"`, `"source"`, `"visibility"`, `"pickable"`\]

#### properties.scene3d.properties.layers.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.scene3d.properties.resourcePolicy

> `readonly` **resourcePolicy**: `object`

#### properties.scene3d.properties.resourcePolicy.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties.resourcePolicy.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.resourcePolicy.properties.present

> `readonly` **present**: `object`

#### properties.scene3d.properties.resourcePolicy.properties.present.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.scene3d.properties.resourcePolicy.properties.maxTilesetJsonBytes

> `readonly` **maxTilesetJsonBytes**: `object`

#### properties.scene3d.properties.resourcePolicy.properties.maxTilesetJsonBytes.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.resourcePolicy.properties.maxModelBytes

> `readonly` **maxModelBytes**: `object`

#### properties.scene3d.properties.resourcePolicy.properties.maxModelBytes.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.resourcePolicy.properties.maxTextureCount

> `readonly` **maxTextureCount**: `object`

#### properties.scene3d.properties.resourcePolicy.properties.maxTextureCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.resourcePolicy.properties.maxTextureBytes

> `readonly` **maxTextureBytes**: `object`

#### properties.scene3d.properties.resourcePolicy.properties.maxTextureBytes.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.resourcePolicy.properties.maxWorkers

> `readonly` **maxWorkers**: `object`

#### properties.scene3d.properties.resourcePolicy.properties.maxWorkers.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.resourcePolicy.properties.timeoutMs

> `readonly` **timeoutMs**: `object`

#### properties.scene3d.properties.resourcePolicy.properties.timeoutMs.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.resourcePolicy.required

> `readonly` **required**: readonly \[`"present"`\]

#### properties.scene3d.properties.resourcePolicy.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.scene3d.properties.snapshot

> `readonly` **snapshot**: `object`

#### properties.scene3d.properties.snapshot.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties.snapshot.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.snapshot.properties.mockPassed

> `readonly` **mockPassed**: `object`

#### properties.scene3d.properties.snapshot.properties.mockPassed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.scene3d.properties.snapshot.properties.pendingSourceIds

> `readonly` **pendingSourceIds**: `object`

#### properties.scene3d.properties.snapshot.properties.pendingSourceIds.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.scene3d.properties.snapshot.properties.pendingSourceIds.items

> `readonly` **items**: `object`

#### properties.scene3d.properties.snapshot.properties.pendingSourceIds.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.scene3d.properties.snapshot.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.scene3d.properties.snapshot.required

> `readonly` **required**: readonly \[`"mockPassed"`, `"pendingSourceIds"`, `"diagnosticCounts"`\]

#### properties.scene3d.properties.snapshot.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.scene3d.properties.query

> `readonly` **query**: `object`

#### properties.scene3d.properties.query.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties.query.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.query.properties.pickCount

> `readonly` **pickCount**: `object`

#### properties.scene3d.properties.query.properties.pickCount.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.query.properties.diagnosticCounts

> `readonly` **diagnosticCounts**: `object` = `DiagnosticCountsSchema`

#### properties.scene3d.properties.query.properties.diagnosticCounts.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.scene3d.properties.query.properties.diagnosticCounts.properties

> `readonly` **properties**: `object`

#### properties.scene3d.properties.query.properties.diagnosticCounts.properties.error

> `readonly` **error**: `object`

#### properties.scene3d.properties.query.properties.diagnosticCounts.properties.error.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.query.properties.diagnosticCounts.properties.warning

> `readonly` **warning**: `object`

#### properties.scene3d.properties.query.properties.diagnosticCounts.properties.warning.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.query.properties.diagnosticCounts.properties.info

> `readonly` **info**: `object`

#### properties.scene3d.properties.query.properties.diagnosticCounts.properties.info.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.scene3d.properties.query.properties.diagnosticCounts.required

> `readonly` **required**: readonly \[`"error"`, `"warning"`, `"info"`\]

#### properties.scene3d.properties.query.properties.diagnosticCounts.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.scene3d.properties.query.required

> `readonly` **required**: readonly \[`"pickCount"`, `"diagnosticCounts"`\]

#### properties.scene3d.properties.query.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.scene3d.properties.capabilities

> `readonly` **capabilities**: `TObject`\<\{ `renderer`: `TString`; `dimensions`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"2d"`\&gt;, `TLiteral`\&lt;`"2_5d"`\&gt;, `TLiteral`\&lt;`"3d"`\&gt;\]\>\>; `sources`: `TArray`\&lt;`TString`\&gt;; `layers`: `TArray`\&lt;`TString`\&gt;; `expressions`: `TArray`\&lt;`TString`\&gt;; `queries`: `TArray`\&lt;`TString`\&gt;; `snapshot`: `TObject`\<\{ `supported`: `TBoolean`; `formats`: `TArray`\<`TUnion`\<\[..., ..., ...\]\>\>; \}\>; `experimental`: `TArray`\&lt;`TString`\&gt;; \}\> = `CapabilityReportSchema`

#### properties.scene3d.required

> `readonly` **required**: readonly \[`"status"`, `"stableViewMode"`, `"runtimeSupported"`, `"sourceCount"`, `"layerCount"`, `"visibleLayerCount"`, `"pickableLayerCount"`, `"sources"`, `"layers"`, `"resourcePolicy"`, `"snapshot"`, `"query"`, `"capabilities"`\]

#### properties.scene3d.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"view"`, `"sources"`, `"sourceReadiness"`, `"layers"`, `"validation"`, `"capabilitySummary"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
