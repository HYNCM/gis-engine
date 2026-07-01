[**@gis-engine/ai v1.1.0**](../index.md)

***

# Interface: GenerationEvidenceBundle

## Properties

### promptHash

> **promptHash**: `string`

***

### status

> **status**: `"blocked"` \| `"ready"`

***

### targetDomains

> **targetDomains**: (`"feature-display"` \| `"spatial-analysis"` \| `"scene-browsing"`)[]

***

### toolSequence

> **toolSequence**: [`GisEngineToolName`](../type-aliases/GisEngineToolName.md)[]

***

### summary

> **summary**: [`ContextSummary`](ContextSummary.md)

***

### validation

> **validation**: `ValidationReport`

***

### commandEvidence

> **commandEvidence**: `GenerationCommandEvidence`

***

### plannerEvidence

> **plannerEvidence**: [`GenerationPlannerEvidence`](GenerationPlannerEvidence.md)

***

### spatialQueryEvidence

> **spatialQueryEvidence**: [`GenerationSpatialQueryEvidence`](GenerationSpatialQueryEvidence.md)

***

### snapshotEvidence

> **snapshotEvidence**: `GenerationSnapshotEvidence`

***

### exportEvidence

> **exportEvidence**: `GenerationExportEvidence`

***

### delivery

> **delivery**: [`ExampleAppDeliverySummary`](ExampleAppDeliverySummary.md)

***

### exampleEvidence

> **exampleEvidence**: `GenerationExampleEvidence`

***

### diagnostics

> **diagnostics**: `Diagnostic`[]
