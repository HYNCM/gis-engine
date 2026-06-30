[**@gis-engine/engine v1.1.0**](../index.md)

***

# Interface: PMTilesQueryEvidence

## Properties

### status

> **status**: [`PMTilesQueryEvidenceStatus`](../type-aliases/PMTilesQueryEvidenceStatus.md)

***

### sourceId

> **sourceId**: `string`

***

### sourceLayerIds

> **sourceLayerIds**: `string`[]

***

### layerIds

> **layerIds**: `string`[]

***

### loaderContract

> **loaderContract**: [`PMTilesQueryLoaderContract`](PMTilesQueryLoaderContract.md)

***

### fixtureFeatureCount

> **fixtureFeatureCount**: `number`

***

### fixtureDigest

> **fixtureDigest**: `string`

***

### cases

> **cases**: [`PMTilesQueryEvidenceCase`](PMTilesQueryEvidenceCase.md)[]

***

### diagnostics

> **diagnostics**: [`Diagnostic`](Diagnostic.md)[]

***

### diagnosticCounts

> **diagnosticCounts**: `DiagnosticCounts`

***

### requirements

> **requirements**: `object`

#### callerSuppliedDecodedFeatures

> **callerSuppliedDecodedFeatures**: `true`

#### archiveParsing

> **archiveParsing**: `false`

#### hiddenFetch

> **hiddenFetch**: `false`

#### rangeRequests

> **rangeRequests**: `false`

#### worker

> **worker**: `false`

#### featurePayloadReturned

> **featurePayloadReturned**: `false`

***

### summary

> **summary**: `object`

#### caseCount

> **caseCount**: `number`

#### readyCaseCount

> **readyCaseCount**: `number`

#### emptyCaseCount

> **emptyCaseCount**: `number`

#### blockedCaseCount

> **blockedCaseCount**: `number`

#### matchedFeatureCount

> **matchedFeatureCount**: `number`

#### returnedFeatureCount

> **returnedFeatureCount**: `number`

#### resultTruncated

> **resultTruncated**: `boolean`
