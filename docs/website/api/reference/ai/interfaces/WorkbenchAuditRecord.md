[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: WorkbenchAuditRecord

## Properties

### recordVersion

> **recordVersion**: `"amw.audit.v1"`

***

### projectId

> **projectId**: `string`

***

### sessionId

> **sessionId**: `string`

***

### recordId

> **recordId**: `string`

***

### id

> **id**: `string`

***

### createdAt

> **createdAt**: `string`

***

### timestamp

> **timestamp**: `string`

***

### status

> **status**: `string`

***

### providerId

> **providerId**: `string`

***

### commandCount

> **commandCount**: `number`

***

### diagnosticCounts

> **diagnosticCounts**: `Required`\&lt;`WorkbenchDiagnosticCounts`\&gt;

***

### promptHash?

> `optional` **promptHash?**: `string`

***

### traceId?

> `optional` **traceId?**: `string`

***

### diagnosticCodes?

> `optional` **diagnosticCodes?**: `Required`\&lt;`WorkbenchDiagnosticCode`\&gt;[]

***

### deliveryStatus?

> `optional` **deliveryStatus?**: `string`

***

### sourceReadiness?

> `optional` **sourceReadiness?**: `WorkbenchSourceReadiness`[]

***

### fromRevision

> **fromRevision**: `string`

***

### toRevision

> **toRevision**: `string`

***

### reviewOutcome?

> `optional` **reviewOutcome?**: `object`

#### decisionId

> **decisionId**: `string`

#### status

> **status**: `string`

#### reasonCode

> **reasonCode**: `string`
