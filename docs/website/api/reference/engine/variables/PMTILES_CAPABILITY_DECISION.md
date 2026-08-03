[**@gis-engine/engine v1.5.0**](../index.md)

***

# Variable: PMTILES\_CAPABILITY\_DECISION

> `const` **PMTILES\_CAPABILITY\_DECISION**: `object`

## Type Declaration

### display

> `readonly` **display**: `object`

#### display.status

> `readonly` **status**: `"go"` = `"go"`

#### display.scope

> `readonly` **scope**: `"url-compatible-maplibre-vector-display"` = `"url-compatible-maplibre-vector-display"`

### load

> `readonly` **load**: `object`

#### load.status

> `readonly` **status**: `"no-go"` = `"no-go"`

#### load.scope

> `readonly` **scope**: `"runtime-archive-load"` = `"runtime-archive-load"`

#### load.blockerCode

> `readonly` **blockerCode**: `"PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED"` = `PMTilesRuntimeBlockerCodes.ArchiveLoad`

### featureQuery

> `readonly` **featureQuery**: `object`

#### featureQuery.status

> `readonly` **status**: `"no-go"` = `"no-go"`

#### featureQuery.scope

> `readonly` **scope**: `"runtime-archive-feature-query"` = `"runtime-archive-feature-query"`

#### featureQuery.blockerCode

> `readonly` **blockerCode**: `"PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED"` = `PMTilesRuntimeBlockerCodes.FeatureQuery`

### loadPlan

> `readonly` **loadPlan**: `object`

#### loadPlan.status

> `readonly` **status**: `"go"` = `"go"`

#### loadPlan.scope

> `readonly` **scope**: `"io-free-caller-metadata-preflight"` = `"io-free-caller-metadata-preflight"`

### loadGates

> `readonly` **loadGates**: readonly \[`"archive-metadata"`, `"columnar-directory-lookup"`, `"offset-continuation"`, `"internal-compression"`, `"leaf-directory-traversal"`, `"cancellation"`, `"byte-budget"`, `"range-budget"`, `"cache-behavior"`, `"resource-policy-before-io"`\] = `PMTilesLoadGateIds`

### featureQueryGates

> `readonly` **featureQueryGates**: readonly \[`"query-semantics"`, `"query-diagnostics"`, `"adapter-boundary"`, `"payload-free-evidence"`, `"query-tests"`, `"docs"`\] = `PMTilesFeatureQueryGateIds`
