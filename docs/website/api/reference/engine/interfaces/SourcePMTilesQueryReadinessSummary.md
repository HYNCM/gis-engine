[**@gis-engine/engine v1.0.0**](../index.md)

***

# Interface: SourcePMTilesQueryReadinessSummary

## Properties

### status

> **status**: [`PMTilesQueryEvidenceStatus`](../type-aliases/PMTilesQueryEvidenceStatus.md)

***

### sourceLayerIds

> **sourceLayerIds**: `string`[]

***

### layerIds

> **layerIds**: `string`[]

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
