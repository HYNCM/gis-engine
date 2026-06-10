[**@gis-engine/ai v1.0.0**](../index.md)

***

# Variable: ApplyCommandsToolResultSchema

> `const` **ApplyCommandsToolResultSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.spec

> `readonly` **spec**: `TObject`\<\{ `version`: `TLiteral`\&lt;`"0.1"`\&gt;; `id`: `TOptional`\&lt;`TString`\&gt;; `revision`: `TOptional`\&lt;`TString`\&gt;; `capabilities`: `TOptional`\<`TObject`\<\{ `dimensions`: `TOptional`\<`TArray`\<`TUnion`\<\[..., ..., ...\]\>\>\>; `renderer`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>\>; `experimental`: `TOptional`\<`TArray`\&lt;`TString`\&gt;\>; \}\>\>; `view`: `TObject`\<\{ `mode`: `TOptional`\<`TUnion`\<\[`TLiteral`\&lt;`"map2d"`\&gt;, `TLiteral`\&lt;`"map2_5d"`\&gt;, `TLiteral`\&lt;`"scene3d"`\&gt;\]\>\>; `center`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`\]\>\>; `zoom`: `TOptional`\&lt;`TNumber`\&gt;; `bearing`: `TOptional`\&lt;`TNumber`\&gt;; `pitch`: `TOptional`\&lt;`TNumber`\&gt;; `bounds`: `TOptional`\<`TTuple`\<\[`TNumber`, `TNumber`, `TNumber`, `TNumber`\]\>\>; \}\>; `sources`: `TRecord`\<`TString`, `TUnion`\<\[`TObject`\<\{ `type`: `TLiteral`\&lt;`"geojson"`\&gt;; `data`: `TUnion`\<\[..., ...\]\>; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"raster"`\&gt;; `tiles`: `TArray`\&lt;`TString`\&gt;; `tileSize`: `TOptional`\&lt;`TNumber`\&gt;; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"pmtiles"`\&gt;; `url`: `TString`; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `attribution`: `TOptional`\&lt;`TString`\&gt;; \}\>, `TObject`\<\{ `type`: `TLiteral`\&lt;`"flatgeobuf"`\&gt;; `url`: `TString`; `hasIndex`: `TOptional`\&lt;`TBoolean`\&gt;; `featureCount`: `TOptional`\&lt;`TInteger`\&gt;; `bbox`: `TOptional`\<`TTuple`\&lt;...\&gt;\>; `geometryType`: `TOptional`\<`TUnion`\&lt;...\&gt;\>; `fileBytes`: `TOptional`\&lt;`TInteger`\&gt;; \}\>\]\>\>; `layers`: `TArray`\<`TObject`\<\{ `id`: `TString`; `type`: `TUnion`\<\[`TLiteral`\&lt;`"background"`\&gt;, `TLiteral`\&lt;`"raster"`\&gt;, `TLiteral`\&lt;`"fill"`\&gt;, `TLiteral`\&lt;`"line"`\&gt;, `TLiteral`\&lt;`"circle"`\&gt;, `TLiteral`\&lt;`"symbol-lite"`\&gt;, `TLiteral`\&lt;`"fill-extrusion-lite"`\&gt;\]\>; `source`: `TOptional`\&lt;`TString`\&gt;; `filter`: `TOptional`\<`TUnsafe`\&lt;`Expression`\&gt;\>; `minzoom`: `TOptional`\&lt;`TNumber`\&gt;; `maxzoom`: `TOptional`\&lt;`TNumber`\&gt;; `layout`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `paint`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\>\>; `interactions`: `TOptional`\<`TObject`\<\{ `pan`: `TOptional`\&lt;`TBoolean`\&gt;; `zoom`: `TOptional`\&lt;`TBoolean`\&gt;; `hover`: `TOptional`\&lt;`TBoolean`\&gt;; `click`: `TOptional`\&lt;`TBoolean`\&gt;; `select`: `TOptional`\&lt;`TBoolean`\&gt;; `popup`: `TOptional`\&lt;`TBoolean`\&gt;; \}\>\>; `metadata`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; `extensions`: `TOptional`\<`TRecord`\<`TString`, `TUnknown`\>\>; \}\> = `MapSpecSchema`

#### properties.results

> `readonly` **results**: `object`

#### properties.results.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.results.items

> `readonly` **items**: `object` = `CommandResultSchema`

#### properties.results.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.results.items.properties

> `readonly` **properties**: `object`

#### properties.results.items.properties.commandId

> `readonly` **commandId**: `object`

#### properties.results.items.properties.commandId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.sequenceId

> `readonly` **sequenceId**: `object`

#### properties.results.items.properties.sequenceId.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.results.items.properties.status

> `readonly` **status**: `object`

#### properties.results.items.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.status.enum

> `readonly` **enum**: readonly \[`"applied"`, `"skipped"`, `"failed"`\]

#### properties.results.items.properties.baseRevision

> `readonly` **baseRevision**: `object`

#### properties.results.items.properties.baseRevision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.nextRevision

> `readonly` **nextRevision**: `object`

#### properties.results.items.properties.nextRevision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.changedPaths

> `readonly` **changedPaths**: `object`

#### properties.results.items.properties.changedPaths.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.results.items.properties.changedPaths.items

> `readonly` **items**: `object`

#### properties.results.items.properties.changedPaths.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.patch

> `readonly` **patch**: `object`

#### properties.results.items.properties.patch.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.results.items.properties.patch.items

> `readonly` **items**: `object` = `JsonPatchOperationSchema`

#### properties.results.items.properties.patch.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.results.items.properties.patch.items.properties

> `readonly` **properties**: `object`

#### properties.results.items.properties.patch.items.properties.op

> `readonly` **op**: `object`

#### properties.results.items.properties.patch.items.properties.op.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.patch.items.properties.op.enum

> `readonly` **enum**: readonly \[`"add"`, `"remove"`, `"replace"`\]

#### properties.results.items.properties.patch.items.properties.path

> `readonly` **path**: `object`

#### properties.results.items.properties.patch.items.properties.path.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.patch.items.properties.value

> `readonly` **value**: `object` = `{}`

#### properties.results.items.properties.patch.items.required

> `readonly` **required**: readonly \[`"op"`, `"path"`\]

#### properties.results.items.properties.patch.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.results.items.properties.inversePatch

> `readonly` **inversePatch**: `object`

#### properties.results.items.properties.inversePatch.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.results.items.properties.inversePatch.items

> `readonly` **items**: `object` = `JsonPatchOperationSchema`

#### properties.results.items.properties.inversePatch.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.results.items.properties.inversePatch.items.properties

> `readonly` **properties**: `object`

#### properties.results.items.properties.inversePatch.items.properties.op

> `readonly` **op**: `object`

#### properties.results.items.properties.inversePatch.items.properties.op.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.inversePatch.items.properties.op.enum

> `readonly` **enum**: readonly \[`"add"`, `"remove"`, `"replace"`\]

#### properties.results.items.properties.inversePatch.items.properties.path

> `readonly` **path**: `object`

#### properties.results.items.properties.inversePatch.items.properties.path.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.properties.inversePatch.items.properties.value

> `readonly` **value**: `object` = `{}`

#### properties.results.items.properties.inversePatch.items.required

> `readonly` **required**: readonly \[`"op"`, `"path"`\]

#### properties.results.items.properties.inversePatch.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.results.items.properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.results.items.properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.results.items.properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\&lt;...\&gt;[]\>; `blockerCode`: `TOptional`\<`TUnion`\&lt;...[]\&gt;\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: ...; `confidence`: ...; `message`: ...; `patch`: ...; `command`: ...; \}\>\>; \}\> = `DiagnosticContractSchema`

#### properties.results.items.properties.traceId

> `readonly` **traceId**: `object`

#### properties.results.items.properties.traceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.results.items.required

> `readonly` **required**: readonly \[`"commandId"`, `"sequenceId"`, `"status"`, `"changedPaths"`, `"diagnostics"`\]

#### properties.results.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.transaction

> `readonly` **transaction**: `object`

#### properties.transaction.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.transaction.enum

> `readonly` **enum**: readonly \[`"atomic"`, `"best-effort"`\]

#### properties.dryRun

> `readonly` **dryRun**: `object`

#### properties.dryRun.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.committed

> `readonly` **committed**: `object`

#### properties.committed.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.rolledBack

> `readonly` **rolledBack**: `object`

#### properties.rolledBack.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.traceId

> `readonly` **traceId**: `object`

#### properties.traceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces

> `readonly` **traces**: `object`

#### properties.traces.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.traces.items

> `readonly` **items**: `object` = `CommandTraceSchema`

#### properties.traces.items.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.traces.items.properties

> `readonly` **properties**: `object`

#### properties.traces.items.properties.traceId

> `readonly` **traceId**: `object`

#### properties.traces.items.properties.traceId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.commandId

> `readonly` **commandId**: `object`

#### properties.traces.items.properties.commandId.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.sequenceId

> `readonly` **sequenceId**: `object`

#### properties.traces.items.properties.sequenceId.type

> `readonly` **type**: `"number"` = `"number"`

#### properties.traces.items.properties.status

> `readonly` **status**: `object`

#### properties.traces.items.properties.status.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.status.enum

> `readonly` **enum**: readonly \[`"applied"`, `"skipped"`, `"failed"`\]

#### properties.traces.items.properties.startedAt

> `readonly` **startedAt**: `object`

#### properties.traces.items.properties.startedAt.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.endedAt

> `readonly` **endedAt**: `object`

#### properties.traces.items.properties.endedAt.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.baseRevision

> `readonly` **baseRevision**: `object`

#### properties.traces.items.properties.baseRevision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.nextRevision

> `readonly` **nextRevision**: `object`

#### properties.traces.items.properties.nextRevision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.author

> `readonly` **author**: `object` = `CommandAuthorSchema`

#### properties.traces.items.properties.author.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.traces.items.properties.author.properties

> `readonly` **properties**: `object`

#### properties.traces.items.properties.author.properties.type

> `readonly` **type**: `object`

#### properties.traces.items.properties.author.properties.type.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.author.properties.type.enum

> `readonly` **enum**: readonly \[`"human"`, `"agent"`, `"system"`\]

#### properties.traces.items.properties.author.properties.id

> `readonly` **id**: `object`

#### properties.traces.items.properties.author.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.author.properties.name

> `readonly` **name**: `object`

#### properties.traces.items.properties.author.properties.name.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.author.required

> `readonly` **required**: readonly \[`"type"`\]

#### properties.traces.items.properties.author.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

#### properties.traces.items.properties.reason

> `readonly` **reason**: `object`

#### properties.traces.items.properties.reason.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.sourcePromptHash

> `readonly` **sourcePromptHash**: `object`

#### properties.traces.items.properties.sourcePromptHash.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.properties.diagnostics

> `readonly` **diagnostics**: `object`

#### properties.traces.items.properties.diagnostics.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.traces.items.properties.diagnostics.items

> `readonly` **items**: `TObject`\<\{ `severity`: `TUnion`\<\[`TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;, `TLiteral`\&lt;...\&gt;\]\>; `code`: `TUnion`\<`TLiteral`\&lt;...\&gt;[]\>; `blockerCode`: `TOptional`\<`TUnion`\&lt;...[]\&gt;\>; `message`: `TString`; `path`: `TOptional`\&lt;`TString`\&gt;; `relatedResources`: `TOptional`\<`TArray`\<`TObject`\&lt;...\&gt;\>\>; `fix`: `TOptional`\<`TObject`\<\{ `kind`: ...; `confidence`: ...; `message`: ...; `patch`: ...; `command`: ...; \}\>\>; \}\> = `DiagnosticContractSchema`

#### properties.traces.items.properties.changedPaths

> `readonly` **changedPaths**: `object`

#### properties.traces.items.properties.changedPaths.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.traces.items.properties.changedPaths.items

> `readonly` **items**: `object`

#### properties.traces.items.properties.changedPaths.items.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.traces.items.required

> `readonly` **required**: readonly \[`"traceId"`, `"commandId"`, `"sequenceId"`, `"status"`, `"startedAt"`, `"endedAt"`, `"diagnostics"`, `"changedPaths"`\]

#### properties.traces.items.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"spec"`, `"results"`, `"transaction"`, `"dryRun"`, `"committed"`, `"rolledBack"`, `"traceId"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
