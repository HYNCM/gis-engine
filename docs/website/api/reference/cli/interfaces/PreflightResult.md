[**@gis-engine/cli v1.4.0**](../index.md)

***

# Interface: PreflightResult

## Properties

### ok

> **ok**: `boolean`

***

### status

> **status**: `"blocked"` \| `"ready"` \| `"metadata-required"`

***

### filePath

> **filePath**: `string`

***

### mode

> **mode**: `"mapspec-preflight"`

***

### inputs

> **inputs**: `object`

#### requireArchiveMetadata

> **requireArchiveMetadata**: `boolean`

#### pmtilesMetadataSourceIds

> **pmtilesMetadataSourceIds**: `string`[]

***

### validation

> **validation**: `object`

#### valid

> **valid**: `boolean`

#### stats

> **stats**: `object`

##### stats.sourceCount

> **sourceCount**: `number`

##### stats.layerCount

> **layerCount**: `number`

##### stats.visibleLayerCount

> **visibleLayerCount**: `number`

#### diagnosticCounts

> **diagnosticCounts**: [`PreflightDiagnosticCounts`](PreflightDiagnosticCounts.md)

***

### sourceReadiness

> **sourceReadiness**: `SourceReadinessReport`

***

### pmtiles

> **pmtiles**: `PMTilesRuntimeLoadPlan`

***

### diagnostics

> **diagnostics**: `Diagnostic`[]
