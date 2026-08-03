[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: SourceReadinessEntry

## Properties

### sourceId

> **sourceId**: `string`

***

### type

> **type**: `string`

***

### state

> **state**: [`SourceReadinessState`](../type-aliases/SourceReadinessState.md)

***

### displayReady

> **displayReady**: `boolean`

***

### queryReady

> **queryReady**: `boolean`

***

### fixtureEvidenceReady?

> `optional` **fixtureEvidenceReady?**: `boolean`

***

### fixtureEvidenceStatus?

> `optional` **fixtureEvidenceStatus?**: [`PMTilesFixtureEvidenceStatus`](../type-aliases/PMTilesFixtureEvidenceStatus.md)

***

### resourcePolicy

> **resourcePolicy**: [`SourceResourcePolicyStatus`](../type-aliases/SourceResourcePolicyStatus.md)

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

### limitations

> **limitations**: `string`[]

***

### nextAction

> **nextAction**: `string`

***

### capabilityDecision?

> `optional` **capabilityDecision?**: `object`

#### display

> `readonly` **display**: `object`

##### display.status

> `readonly` **status**: `"go"` = `"go"`

##### display.scope

> `readonly` **scope**: `"url-compatible-maplibre-vector-display"` = `"url-compatible-maplibre-vector-display"`

#### load

> `readonly` **load**: `object`

##### load.status

> `readonly` **status**: `"no-go"` = `"no-go"`

##### load.scope

> `readonly` **scope**: `"runtime-archive-load"` = `"runtime-archive-load"`

##### load.blockerCode

> `readonly` **blockerCode**: `"PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED"` = `PMTilesRuntimeBlockerCodes.ArchiveLoad`

#### featureQuery

> `readonly` **featureQuery**: `object`

##### featureQuery.status

> `readonly` **status**: `"no-go"` = `"no-go"`

##### featureQuery.scope

> `readonly` **scope**: `"runtime-archive-feature-query"` = `"runtime-archive-feature-query"`

##### featureQuery.blockerCode

> `readonly` **blockerCode**: `"PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED"` = `PMTilesRuntimeBlockerCodes.FeatureQuery`

#### loadPlan

> `readonly` **loadPlan**: `object`

##### loadPlan.status

> `readonly` **status**: `"go"` = `"go"`

##### loadPlan.scope

> `readonly` **scope**: `"io-free-caller-metadata-preflight"` = `"io-free-caller-metadata-preflight"`

#### loadGates

> `readonly` **loadGates**: readonly \[`"archive-metadata"`, `"columnar-directory-lookup"`, `"offset-continuation"`, `"internal-compression"`, `"leaf-directory-traversal"`, `"cancellation"`, `"byte-budget"`, `"range-budget"`, `"cache-behavior"`, `"resource-policy-before-io"`\] = `PMTilesLoadGateIds`

#### featureQueryGates

> `readonly` **featureQueryGates**: readonly \[`"query-semantics"`, `"query-diagnostics"`, `"adapter-boundary"`, `"payload-free-evidence"`, `"query-tests"`, `"docs"`\] = `PMTilesFeatureQueryGateIds`

***

### runtimeLoadPlan?

> `optional` **runtimeLoadPlan?**: [`SourceRuntimeReadinessSummary`](SourceRuntimeReadinessSummary.md)

***

### queryEvidence?

> `optional` **queryEvidence?**: [`SourcePMTilesQueryReadinessSummary`](SourcePMTilesQueryReadinessSummary.md)
