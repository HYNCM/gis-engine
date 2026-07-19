[**@gis-engine/ai v1.5.0**](../index.md)

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

> **toolSequence**: (`"apply_commands"` \| `"validate_spec"` \| `"export_spec"` \| `"get_context_summary"` \| `"snapshot_spec"` \| `"explain_spec"` \| `"export_example_app"` \| `"diff_specs"` \| `"generate_spec"` \| `"inspect_data"` \| `"edit_spec"` \| `"query_features"` \| `"style_recommend"` \| `"transform_data"`)[]

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

> **diagnostics**: `object`[]

#### severity

> **severity**: `"error"` \| `"warning"` \| `"info"`

#### code

> **code**: `"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"`

#### blockerCode?

> `optional` **blockerCode?**: `"SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED"` \| `"SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED"`

#### message

> **message**: `string`

#### path?

> `optional` **path?**: `string`

#### relatedResources?

> `optional` **relatedResources?**: `object`[]

#### fix?

> `optional` **fix?**: `object`

##### fix.kind

> **kind**: `"command"` \| `"json-patch"` \| `"manual"`

##### fix.confidence

> **confidence**: `"high"` \| `"medium"` \| `"low"`

##### fix.message

> **message**: `string`

##### fix.patch?

> `optional` **patch?**: `object`[]

##### fix.command?

> `optional` **command?**: `unknown`
