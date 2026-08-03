[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: CommandTrace

## Properties

### traceId

> **traceId**: `string`

***

### commandId

> **commandId**: `string`

***

### sequenceId

> **sequenceId**: `number`

***

### status

> **status**: `"applied"` \| `"skipped"` \| `"failed"`

***

### startedAt

> **startedAt**: `string`

***

### endedAt

> **endedAt**: `string`

***

### baseRevision?

> `optional` **baseRevision?**: `string`

***

### nextRevision?

> `optional` **nextRevision?**: `string`

***

### author?

> `optional` **author?**: `object`

#### type

> **type**: `"human"` \| `"agent"` \| `"system"`

#### id?

> `optional` **id?**: `string`

#### name?

> `optional` **name?**: `string`

***

### reason?

> `optional` **reason?**: `string`

***

### sourcePromptHash?

> `optional` **sourcePromptHash?**: `string`

***

### diagnostics

> **diagnostics**: `object`[]

#### severity

> **severity**: `"error"` \| `"warning"` \| `"info"`

#### code

> **code**: `"SPEC.UNKNOWN_FIELD"` \| `"SPEC.INVALID_VERSION"` \| `"SPEC.INVALID_TYPE"` \| `"SPEC.MISSING_FIELD"` \| `"SRC.NOT_FOUND"` \| `"LAYER.DUPLICATE_ID"` \| `"LAYER.NOT_FOUND"` \| `"LAYER.SOURCE_MISSING"` \| `"LAYER.SOURCE_INCOMPATIBLE"` \| `"LAYER.ZOOM_RANGE_INVALID"` \| `"EXPR.TYPE_MISMATCH"` \| `"EXPR.UNKNOWN_OPERATOR"` \| `"EXPR.INVALID_ARITY"` \| `"EXPR.INVALID_COLOR"` \| `"EXPR.PROPERTY_UNKNOWN"` \| `"VIEW.OUT_OF_DATA_BOUNDS"` \| `"RENDER.ADAPTER_ERROR"` \| `"RENDER.DESTROYED"` \| `"SNAPSHOT.BLANK_CANVAS"` \| `"SNAPSHOT.RESOURCE_PENDING"` \| `"CAPABILITY.UNSUPPORTED"` \| `"PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED"` \| `"PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED"` \| `"GEOPARQUET.VERSION_REQUIRED"` \| `"GEOPARQUET.VERSION_UNSUPPORTED"` \| `"GEOPARQUET.METADATA_AMBIGUOUS"` \| `"GEOPARQUET.METADATA_INCOMPATIBLE"` \| `"COMMAND.INVALID_PATCH"` \| `"COMMAND.UNSUPPORTED"` \| `"CONFLICT.BASE_REVISION"` \| `"MIGRATION.UNSUPPORTED_VERSION"` \| `"SECURITY.URL_BLOCKED"` \| `"SECURITY.RESOURCE_TIMEOUT"` \| `"SECURITY.RESOURCE_TOO_LARGE"` \| `"SECURITY.UNSUPPORTED_ASSET_TYPE"` \| `"GEO.INVALID_COORDINATES"` \| `"GEO.EMPTY_BBOX"` \| `"QUERY.EMPTY_RESULT"` \| `"SCHEMA.INVALID"` = `DiagnosticCodeSchema`

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

***

### changedPaths

> **changedPaths**: `string`[]
