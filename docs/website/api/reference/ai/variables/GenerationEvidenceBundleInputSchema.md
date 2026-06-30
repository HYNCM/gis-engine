[**@gis-engine/ai v1.2.0**](../index.md)

***

# Variable: GenerationEvidenceBundleInputSchema

> `const` **GenerationEvidenceBundleInputSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.promptHash

> `readonly` **promptHash**: `object`

#### properties.promptHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.promptHash.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.skeleton

> `readonly` **skeleton**: `TObject`\<\{ `status`: `TUnion`\<\[`TLiteral`\&lt;`"ready"`\&gt;, `TLiteral`\&lt;`"blocked"`\&gt;\]\>; `targetDomains`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"feature-display"`\&gt;, `TLiteral`\&lt;`"spatial-analysis"`\&gt;, `TLiteral`\&lt;`"scene-browsing"`\&gt;\]\>\>; `analysisEvidence`: `TObject`\<\{ `requested`: `TBoolean`; `status`: `TUnion`\<\[`TLiteral`\&lt;`"ready"`\&gt;, `TLiteral`\&lt;`"blocked"`\&gt;, `TLiteral`\&lt;`"not-requested"`\&gt;\]\>; `requestedOperations`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"point-query"`\&gt;, `TLiteral`\&lt;`"bbox-query"`\&gt;, `TLiteral`\&lt;`"buffer"`\&gt;, `TLiteral`\&lt;`"intersection"`\&gt;, `TLiteral`\&lt;`"overlay"`\&gt;, `TLiteral`\&lt;`"routing"`\&gt;, `TLiteral`\&lt;`"aggregation"`\&gt;\]\>\>; `acceptedQueryOperations`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"point-query"`\&gt;, `TLiteral`\&lt;`"bbox-query"`\&gt;\]\>\>; `blockedOperations`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"point-query"`\&gt;, `TLiteral`\&lt;`"bbox-query"`\&gt;, `TLiteral`\&lt;`"buffer"`\&gt;, `TLiteral`\&lt;`"intersection"`\&gt;, `TLiteral`\&lt;`"overlay"`\&gt;, `TLiteral`\&lt;`"routing"`\&gt;, `TLiteral`\&lt;`"aggregation"`\&gt;\]\>\>; `diagnostics`: `TArray`\<`TObject`\<\{ `severity`: `TUnion`\<\[..., ..., ...\]\>; `code`: `TUnion`\&lt;...[]\&gt;; `blockerCode`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\&lt;...\&gt;\>; `fix`: `TOptional`\<`TObject`\&lt;...\&gt;\>; \}\>\>; \}\>; `baseSpec`: `TObject`\<\{ `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `id`: `TOptional`\&lt;`TString`\&gt;; `revision`: `TOptional`\&lt;`TString`\&gt;; `capabilities`: `TOptional`\<`TObject`\<\{ `dimensions`: `TOptional`\<`TArray`\&lt;...\&gt;\>; `renderer`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `experimental`: `TOptional`\<`TArray`\&lt;...\&gt;\>; \}\>\>; `view`: `TObject`\<\{ `mode`: `TOptional`\<`TUnion`\<\[..., ..., ...\]\>\>; `center`: `TOptional`\<`TTuple`\<\[..., ...\]\>\>; `zoom`: `TOptional`\&lt;`TNumber`\&gt;; `bearing`: `TOptional`\&lt;`TNumber`\&gt;; `pitch`: `TOptional`\&lt;`TNumber`\&gt;; `bounds`: `TOptional`\<`TTuple`\<\[..., ..., ..., ...\]\>\>; \}\>; `sources`: `TRecord`\<`TString`, `TUnion`\<\[`TObject`\<\{ `type`: ...; `data`: ...; \}\>, `TObject`\<\{ `type`: ...; `tiles`: ...; `tileSize`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `hasIndex`: ...; `featureCount`: ...; `bbox`: ...; `geometryType`: ...; `fileBytes`: ...; \}\>\]\>\>; `layers`: `TArray`\<`TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[..., ..., ..., ..., ..., ..., ...\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;...\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<..., ...\>\>; `paint`: `TOptional`\<`TRecord`\<..., ...\>\>; `metadata`: `TOptional`\<`TRecord`\<..., ...\>\>; \}\>\>; `interactions`: `TOptional`\<`TObject`\<\{ `pan`: `TOptional`\&lt;`TBoolean`\&gt;; `zoom`: `TOptional`\&lt;`TBoolean`\&gt;; `hover`: `TOptional`\&lt;`TBoolean`\&gt;; `click`: `TOptional`\&lt;`TBoolean`\&gt;; `select`: `TOptional`\&lt;`TBoolean`\&gt;; `popup`: `TOptional`\&lt;`TBoolean`\&gt;; \}\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `extensions`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\>; `spec`: `TObject`\<\{ `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `id`: `TOptional`\&lt;`TString`\&gt;; `revision`: `TOptional`\&lt;`TString`\&gt;; `capabilities`: `TOptional`\<`TObject`\<\{ `dimensions`: `TOptional`\<`TArray`\&lt;...\&gt;\>; `renderer`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `experimental`: `TOptional`\<`TArray`\&lt;...\&gt;\>; \}\>\>; `view`: `TObject`\<\{ `mode`: `TOptional`\<`TUnion`\<\[..., ..., ...\]\>\>; `center`: `TOptional`\<`TTuple`\<\[..., ...\]\>\>; `zoom`: `TOptional`\&lt;`TNumber`\&gt;; `bearing`: `TOptional`\&lt;`TNumber`\&gt;; `pitch`: `TOptional`\&lt;`TNumber`\&gt;; `bounds`: `TOptional`\<`TTuple`\<\[..., ..., ..., ...\]\>\>; \}\>; `sources`: `TRecord`\<`TString`, `TUnion`\<\[`TObject`\<\{ `type`: ...; `data`: ...; \}\>, `TObject`\<\{ `type`: ...; `tiles`: ...; `tileSize`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `minzoom`: ...; `maxzoom`: ...; `attribution`: ...; \}\>, `TObject`\<\{ `type`: ...; `url`: ...; `hasIndex`: ...; `featureCount`: ...; `bbox`: ...; `geometryType`: ...; `fileBytes`: ...; \}\>\]\>\>; `layers`: `TArray`\<`TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[..., ..., ..., ..., ..., ..., ...\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;...\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<..., ...\>\>; `paint`: `TOptional`\<`TRecord`\<..., ...\>\>; `metadata`: `TOptional`\<`TRecord`\<..., ...\>\>; \}\>\>; `interactions`: `TOptional`\<`TObject`\<\{ `pan`: `TOptional`\&lt;`TBoolean`\&gt;; `zoom`: `TOptional`\&lt;`TBoolean`\&gt;; `hover`: `TOptional`\&lt;`TBoolean`\&gt;; `click`: `TOptional`\&lt;`TBoolean`\&gt;; `select`: `TOptional`\&lt;`TBoolean`\&gt;; `popup`: `TOptional`\&lt;`TBoolean`\&gt;; \}\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `extensions`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\>; `commands`: `TArray`\<`TUnion`\<\[`TObject`\<\{ `author`: `TOptional`\<`TObject`\&lt;...\&gt;\>; `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `source`: `TUnion`\<\[..., ..., ..., ...\]\>; `sourceId`: `TString`; `type`: `TLiteral`\&lt;`"addSource"`\&gt;; \}\>, `TObject`\<\{ `author`: `TOptional`\<`TObject`\&lt;...\&gt;\>; `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `sourceId`: `TString`; `type`: `TLiteral`\&lt;`"removeSource"`\&gt;; \}\>, `TObject`\<\{ `author`: `TOptional`\<`TObject`\&lt;...\&gt;\>; `id`: `TString`; `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `baseRevision`: `TOptional`\&lt;`TString`\&gt;; `reason`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `sourcePromptHash`: `TOptional`\&lt;`TString`\&gt;; `dryRun`: `TOptional`\&lt;`TBoolean`\&gt;; `type`: `TLiteral`\&lt;`"addLayer"`\&gt;; `layer`: `TObject`\<\{ `id`: ...; `type`: ...; `source`: ...; `filter`: ...; `minzoom`: ...; `maxzoom`: ...; `layout`: ...; `paint`: ...; `metadata`: ...; \}\>; `beforeLayerId`: `TOptional`\&lt;`TString`\&gt;; \}\>\]\>\>; `diagnostics`: `TArray`\<`TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;`"error"`\&gt;, `TLiteral`\&lt;`"warning"`\&gt;, `TLiteral`\&lt;`"info"`\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\<... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ... \| ...\>[]\>; `blockerCode`: `TOptional`\<`TUnion`\<`TLiteral`\&lt;...\&gt;[]\>\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\<\{ `kind`: ...; `id`: ...; `path`: ...; \}\>\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: `TUnion`\&lt;...\&gt;; `confidence`: `TUnion`\&lt;...\&gt;; `message`: `TString`; `patch`: `TOptional`\&lt;...\&gt;; `command`: `TOptional`\&lt;...\&gt;; \}\>\>; \}\>\>; `traceId`: `TString`; \}\>

#### properties.planner

> `readonly` **planner**: `object`

#### properties.planner.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.planner.properties

> `readonly` **properties**: `object`

#### properties.planner.properties.plan

> `readonly` **plan**: `TObject`\<\{ `status`: `TUnion`\<\[`TLiteral`\&lt;`"ready"`\&gt;, `TLiteral`\&lt;`"blocked"`\&gt;\]\>; `traceId`: `TString`; `request`: `TObject`\<\{ `mapId`: `TOptional`\&lt;`TString`\&gt;; `promptHash`: `TOptional`\&lt;`TString`\&gt;; `createdAt`: `TOptional`\&lt;`TString`\&gt;; `traceId`: `TOptional`\&lt;`TString`\&gt;; `targetDomains`: `TOptional`\<`TArray`\<`TUnion`\&lt;...\&gt;\>\>; `baseSpec`: `TOptional`\<`TObject`\<\{ `version`: ...; `id`: ...; `revision`: ...; `capabilities`: ...; `view`: ...; `sources`: ...; `layers`: ...; `interactions`: ...; `metadata`: ...; `extensions`: ...; \}\>\>; `capabilities`: `TOptional`\<`TObject`\<\{ `dimensions`: ...; `renderer`: ...; `experimental`: ...; \}\>\>; `view`: `TOptional`\<`TObject`\<\{ `mode`: ...; `center`: ...; `zoom`: ...; `bearing`: ...; `pitch`: ...; `bounds`: ...; \}\>\>; `sources`: `TOptional`\<`TRecord`\<`TString`, `TUnion`\&lt;...\&gt;\>\>; `layers`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `styleEdits`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `interactions`: `TOptional`\<`TObject`\<\{ `pan`: ...; `zoom`: ...; `hover`: ...; `click`: ...; `select`: ...; `popup`: ...; \}\>\>; `analysis`: `TOptional`\<`TObject`\<\{ `operations`: ...; \}\>\>; `scene3d`: `TOptional`\<`TObject`\<\{ `camera`: ...; `lights`: ...; `depth`: ...; `terrain`: ...; `sources`: ...; `layers`: ...; `snapshot`: ...; `resourcePolicy`: ...; \}\>\>; \}\>; `diagnostics`: `TArray`\<`TObject`\<\{ `severity`: `TUnion`\<\[..., ..., ...\]\>; `code`: `TUnion`\&lt;...[]\&gt;; `blockerCode`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\&lt;...\&gt;\>; `fix`: `TOptional`\<`TObject`\&lt;...\&gt;\>; \}\>\>; `provenance`: `TObject`\<\{ `plannerId`: `TString`; `promptHash`: `TString`; `retainedRawPrompt`: `TLiteral`\&lt;`false`\&gt;; `acceptedIntentFields`: `TArray`\&lt;`TString`\&gt;; `unsupportedIntentFields`: `TArray`\&lt;`TString`\&gt;; \}\>; \}\>

#### properties.planner.properties.confidence

> `readonly` **confidence**: `object` = `PlannerConfidenceSchema`

#### properties.planner.properties.confidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.planner.properties.confidence.properties

> `readonly` **properties**: `object`

#### properties.planner.properties.confidence.properties.level

> `readonly` **level**: `object`

#### properties.planner.properties.confidence.properties.level.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.planner.properties.confidence.properties.level.enum

> `readonly` **enum**: readonly \[`"high"`, `"medium"`, `"low"`, `"unknown"`\]

#### properties.planner.properties.confidence.properties.score

> `readonly` **score**: `object`

#### properties.planner.properties.confidence.properties.score.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.planner.properties.confidence.properties.score.minimum

> `readonly` **minimum**: `0` = `0`

#### properties.planner.properties.confidence.properties.score.maximum

> `readonly` **maximum**: `1` = `1`

#### properties.planner.properties.confidence.properties.reasons

> `readonly` **reasons**: `object`

#### properties.planner.properties.confidence.properties.reasons.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.planner.properties.confidence.properties.reasons.items

> `readonly` **items**: `object`

#### properties.planner.properties.confidence.properties.reasons.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.planner.properties.confidence.required

> `readonly` **required**: readonly \[`"level"`, `"score"`, `"reasons"`\]

#### properties.planner.properties.confidence.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.planner.required

> `readonly` **required**: readonly \[`"plan"`\]

#### properties.planner.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.capabilities

> `readonly` **capabilities**: `TObject`\<\{ `renderer`: `TString`; `dimensions`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"2d"`\&gt;, `TLiteral`\&lt;`"2_5d"`\&gt;, `TLiteral`\&lt;`"3d"`\&gt;\]\>\>; `sources`: `TArray`\&lt;`TString`\&gt;; `layers`: `TArray`\&lt;`TString`\&gt;; `expressions`: `TArray`\&lt;`TString`\&gt;; `queries`: `TArray`\&lt;`TString`\&gt;; `snapshot`: `TObject`\<\{ `supported`: `TBoolean`; `formats`: `TArray`\<`TUnion`\<\[`TLiteral`\&lt;`"png"`\&gt;, `TLiteral`\&lt;`"jpeg"`\&gt;, `TLiteral`\&lt;`"data-url"`\&gt;\]\>\>; \}\>; `experimental`: `TArray`\&lt;`TString`\&gt;; \}\>

#### properties.snapshot

> `readonly` **snapshot**: `object`

#### properties.snapshot.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.snapshot.properties

> `readonly` **properties**: `object`

#### properties.snapshot.properties.renderer

> `readonly` **renderer**: `object` = `SnapshotSpecToolInputSchema.properties.renderer`

#### properties.snapshot.properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.snapshot.properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.snapshot.properties.options

> `readonly` **options**: `object` = `SnapshotSpecToolInputSchema.properties.snapshot`

#### properties.snapshot.properties.options.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.snapshot.properties.options.properties

> `readonly` **properties**: `object`

#### properties.snapshot.properties.options.properties.width

> `readonly` **width**: `object`

#### properties.snapshot.properties.options.properties.width.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.snapshot.properties.options.properties.height

> `readonly` **height**: `object`

#### properties.snapshot.properties.options.properties.height.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.snapshot.properties.options.properties.pixelRatio

> `readonly` **pixelRatio**: `object`

#### properties.snapshot.properties.options.properties.pixelRatio.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.snapshot.properties.options.properties.format

> `readonly` **format**: `object`

#### properties.snapshot.properties.options.properties.format.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.snapshot.properties.options.properties.format.enum

> `readonly` **enum**: readonly \[`"png"`, `"jpeg"`, `"data-url"`\]

#### properties.snapshot.properties.options.properties.targetLayers

> `readonly` **targetLayers**: `object`

#### properties.snapshot.properties.options.properties.targetLayers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.snapshot.properties.options.properties.targetLayers.items

> `readonly` **items**: `object`

#### properties.snapshot.properties.options.properties.targetLayers.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.snapshot.properties.options.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.snapshot.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueries

> `readonly` **spatialQueries**: `object`

#### properties.spatialQueries.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueries.properties

> `readonly` **properties**: `object`

#### properties.spatialQueries.properties.renderer

> `readonly` **renderer**: `object` = `SnapshotSpecToolInputSchema.properties.renderer`

#### properties.spatialQueries.properties.renderer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueries.properties.renderer.enum

> `readonly` **enum**: readonly \[`"maplibre"`, `"mock"`\]

#### properties.spatialQueries.properties.cases

> `readonly` **cases**: `object`

#### properties.spatialQueries.properties.cases.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.spatialQueries.properties.cases.items

> `readonly` **items**: `object` = `SpatialQueryCaseSchema`

#### properties.spatialQueries.properties.cases.items.anyOf

> `readonly` **anyOf**: readonly \[\{ `type`: `"object"`; `properties`: \{ `id`: \{ `type`: `"string"`; `minLength`: `1`; \}; `operation`: \{ `type`: `"string"`; `const`: `"point-query"`; \}; `point`: \{ `type`: `"array"`; `items`: \{ `type`: ...; \}; `minItems`: `2`; `maxItems`: `2`; \}; `layers`: \{ `type`: `"array"`; `items`: \{ `type`: ...; \}; \}; \}; `required`: readonly \[`"id"`, `"operation"`, `"point"`\]; `additionalProperties`: `false`; \}, \{ `type`: `"object"`; `properties`: \{ `id`: \{ `type`: `"string"`; `minLength`: `1`; \}; `operation`: \{ `type`: `"string"`; `const`: `"bbox-query"`; \}; `bbox`: \{ `type`: `"array"`; `items`: \{ `type`: ...; \}; `minItems`: `4`; `maxItems`: `4`; \}; `layers`: \{ `type`: `"array"`; `items`: \{ `type`: ...; \}; \}; \}; `required`: readonly \[`"id"`, `"operation"`, `"bbox"`\]; `additionalProperties`: `false`; \}\]

#### properties.spatialQueries.properties.capabilityWaiver

> `readonly` **capabilityWaiver**: `object` = `SpatialQueryCapabilityWaiverSchema`

#### properties.spatialQueries.properties.capabilityWaiver.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.spatialQueries.properties.capabilityWaiver.properties

> `readonly` **properties**: `object`

#### properties.spatialQueries.properties.capabilityWaiver.properties.reason

> `readonly` **reason**: `object`

#### properties.spatialQueries.properties.capabilityWaiver.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueries.properties.capabilityWaiver.properties.reason.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.spatialQueries.properties.capabilityWaiver.properties.approvedBy

> `readonly` **approvedBy**: `object`

#### properties.spatialQueries.properties.capabilityWaiver.properties.approvedBy.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueries.properties.capabilityWaiver.properties.approvedBy.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.spatialQueries.properties.capabilityWaiver.properties.followUpTaskId

> `readonly` **followUpTaskId**: `object`

#### properties.spatialQueries.properties.capabilityWaiver.properties.followUpTaskId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.spatialQueries.properties.capabilityWaiver.properties.followUpTaskId.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.spatialQueries.properties.capabilityWaiver.required

> `readonly` **required**: readonly \[`"reason"`, `"approvedBy"`, `"followUpTaskId"`\]

#### properties.spatialQueries.properties.capabilityWaiver.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.spatialQueries.required

> `readonly` **required**: readonly \[`"cases"`\]

#### properties.spatialQueries.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.pmtilesQueryEvidence

> `readonly` **pmtilesQueryEvidence**: `object`

#### properties.pmtilesQueryEvidence.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.pmtilesQueryEvidence.additionalProperties

> `readonly` **additionalProperties**: `object` = `PMTilesQueryEvidenceInputSchema`

#### properties.pmtilesQueryEvidence.additionalProperties.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties

> `readonly` **properties**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features

> `readonly` **features**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items

> `readonly` **items**: `object` = `PMTilesQueryFixtureFeatureSchema`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties

> `readonly` **properties**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.id

> `readonly` **id**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.id.anyOf

> `readonly` **anyOf**: readonly \[\{ `type`: ...; \}, \{ `type`: ...; \}\]

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.sourceLayer

> `readonly` **sourceLayer**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.sourceLayer.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.sourceLayer.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.bbox

> `readonly` **bbox**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.bbox.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.bbox.items

> `readonly` **items**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.bbox.items.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.bbox.minItems

> `readonly` **minItems**: `4` = `4`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.bbox.maxItems

> `readonly` **maxItems**: `4` = `4`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.geometry

> `readonly` **geometry**: `object` = `{}`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.properties

> `readonly` **properties**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.properties.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.properties.properties.additionalProperties

> `readonly` **additionalProperties**: `true` = `true`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.required

> `readonly` **required**: readonly \[`"sourceLayer"`\]

#### properties.pmtilesQueryEvidence.additionalProperties.properties.features.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases

> `readonly` **cases**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items

> `readonly` **items**: `object` = `PMTilesQueryEvidenceCaseInputSchema`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties

> `readonly` **properties**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.id

> `readonly` **id**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.id.minLength

> `readonly` **minLength**: `1` = `1`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.layers

> `readonly` **layers**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.layers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.layers.items

> `readonly` **items**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.layers.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.point

> `readonly` **point**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.point.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.point.items

> `readonly` **items**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.point.items.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.point.minItems

> `readonly` **minItems**: `2` = `2`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.point.maxItems

> `readonly` **maxItems**: `2` = `2`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.bbox

> `readonly` **bbox**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.bbox.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.bbox.items

> `readonly` **items**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.bbox.items.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.bbox.minItems

> `readonly` **minItems**: `4` = `4`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.bbox.maxItems

> `readonly` **maxItems**: `4` = `4`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.resultLimit.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.resultLimit.minimum

> `readonly` **minimum**: `1` = `1`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader

> `readonly` **loader**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties

> `readonly` **properties**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.archive

> `readonly` **archive**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.archive.type

> `readonly` **type**: ... = `"string"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.archive.enum

> `readonly` **enum**: ...

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.responseBytes

> `readonly` **responseBytes**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.responseBytes.type

> `readonly` **type**: ... = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.responseBytes.minimum

> `readonly` **minimum**: ... = `0`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.elapsedMs

> `readonly` **elapsedMs**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.elapsedMs.type

> `readonly` **type**: ... = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.elapsedMs.minimum

> `readonly` **minimum**: ... = `0`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.worker

> `readonly` **worker**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.worker.type

> `readonly` **type**: ... = `"string"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.properties.worker.enum

> `readonly` **enum**: ...

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.properties.loader.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.required

> `readonly` **required**: readonly \[`"id"`\]

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.anyOf

> `readonly` **anyOf**: readonly \[\{ `required`: readonly \[`"point"`\]; \}, \{ `required`: readonly \[`"bbox"`\]; \}\]

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.cases.minItems

> `readonly` **minItems**: `1` = `1`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.resultLimit

> `readonly` **resultLimit**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.resultLimit.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.resultLimit.minimum

> `readonly` **minimum**: `1` = `1`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract

> `readonly` **loaderContract**: `object` = `PMTilesQueryLoaderContractSchema`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.properties

> `readonly` **properties**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.properties.timeoutMs

> `readonly` **timeoutMs**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.properties.timeoutMs.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.properties.timeoutMs.minimum

> `readonly` **minimum**: `1` = `1`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.properties.byteBudgetBytes

> `readonly` **byteBudgetBytes**: `object`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.properties.byteBudgetBytes.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.properties.byteBudgetBytes.minimum

> `readonly` **minimum**: `1` = `1`

#### properties.pmtilesQueryEvidence.additionalProperties.properties.loaderContract.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.pmtilesQueryEvidence.additionalProperties.required

> `readonly` **required**: readonly \[`"features"`, `"cases"`\]

#### properties.pmtilesQueryEvidence.additionalProperties.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.exampleId

> `readonly` **exampleId**: `object` = `ExportExampleAppToolInputSchema.properties.exampleId`

#### properties.exampleId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.exampleId.enum

> `readonly` **enum**: readonly \[`"basic-geojson"`, `"ai-map-edit"`, `"raster-basemap"`, `"pmtiles-local"`, `"vector-tile-url"`, `"fill-extrusion-lite"`\] = `exampleIds`

### required

> `readonly` **required**: readonly \[`"promptHash"`, `"skeleton"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
