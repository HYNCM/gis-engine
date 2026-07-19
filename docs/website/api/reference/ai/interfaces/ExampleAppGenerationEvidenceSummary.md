[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: ExampleAppGenerationEvidenceSummary

## Properties

### promptHash?

> `optional` **promptHash?**: `string`

***

### status

> **status**: `"blocked"` \| `"ready"`

***

### delivery

> **delivery**: [`ExampleAppDeliverySummary`](ExampleAppDeliverySummary.md)

***

### targetDomains

> **targetDomains**: (`"feature-display"` \| `"spatial-analysis"` \| `"scene-browsing"`)[]

***

### toolSequence

> **toolSequence**: (`"apply_commands"` \| `"validate_spec"` \| `"export_spec"` \| `"get_context_summary"` \| `"snapshot_spec"` \| `"explain_spec"` \| `"export_example_app"` \| `"diff_specs"` \| `"generate_spec"` \| `"inspect_data"` \| `"edit_spec"` \| `"query_features"` \| `"style_recommend"` \| `"transform_data"`)[]

***

### diagnosticCounts

> **diagnosticCounts**: `Record`\<`Diagnostic`\[`"severity"`\], `number`\>

***

### command

> **command**: `object`

#### usedApplyCommands

> **usedApplyCommands**: `boolean`

#### commandCount

> **commandCount**: `number`

#### committed

> **committed**: `boolean`

#### rolledBack

> **rolledBack**: `boolean`

***

### planner

> **planner**: `object`

#### provided

> **provided**: `boolean`

#### confidenceLevel

> **confidenceLevel**: `"high"` \| `"medium"` \| `"low"` \| `"unknown"`

#### unsupportedIntentCount

> **unsupportedIntentCount**: `number`

***

### spatialQuery

> **spatialQuery**: `object`

#### requested

> **requested**: `boolean`

#### ready

> **ready**: `boolean`

#### status

> **status**: `"blocked"` \| `"ready"` \| `"not-requested"`

#### caseCount

> **caseCount**: `number`

#### blockedOperations

> **blockedOperations**: `string`[]

***

### sceneBrowsing

> **sceneBrowsing**: `object`

#### requested

> **requested**: `boolean`

#### status

> **status**: `"experimental"` \| `"blocked"` \| `"not-requested"`

#### extensionPresent

> **extensionPresent**: `boolean`

#### stableViewMode

> **stableViewMode**: `false`

#### runtimeSupported

> **runtimeSupported**: `false`

#### stableRuntimeBlocked

> **stableRuntimeBlocked**: `true`

#### state

> **state**: `"blocked"` \| `"extension-only"` \| `"not-requested"`

#### sourceCount

> **sourceCount**: `number`

#### layerCount

> **layerCount**: `number`

#### sourceIds

> **sourceIds**: `string`[]

#### layerIds

> **layerIds**: `string`[]

#### pickableLayerCount

> **pickableLayerCount**: `number`

#### mockSnapshotPassed

> **mockSnapshotPassed**: `boolean`

#### mockQueryPickCount

> **mockQueryPickCount**: `number`

#### stableRuntimeBlockerCodes

> **stableRuntimeBlockerCodes**: `Scene3DStableRuntimeBlockerCode`[]

***

### snapshot

> **snapshot**: `object`

#### requested

> **requested**: `boolean`

#### renderer

> **renderer**: `"maplibre"` \| `"mock"`

#### passed

> **passed**: `boolean`

***

### export

> **export**: `object`

#### ready

> **ready**: `boolean`

#### sourceCount

> **sourceCount**: `number`

#### layerCount

> **layerCount**: `number`
