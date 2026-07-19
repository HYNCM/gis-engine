[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: WorkbenchReviewDecision

## Properties

### recordVersion

> **recordVersion**: `"amw.review.v1"`

***

### decisionId

> **decisionId**: `string`

***

### createdAt

> **createdAt**: `string`

***

### projectId

> **projectId**: `string`

***

### sessionId

> **sessionId**: `string`

***

### auditRecordId

> **auditRecordId**: `string`

***

### outcome

> **outcome**: `string`

***

### providerId

> **providerId**: `string`

***

### deliveryStatus

> **deliveryStatus**: `string`

***

### commandEvidence

> **commandEvidence**: `object`

#### commandCount

> **commandCount**: `number`

#### committed

> **committed**: `boolean`

#### rolledBack

> **rolledBack**: `boolean`

#### failed

> **failed**: `boolean`

#### changedPathCount

> **changedPathCount**: `number`

***

### diagnosticCounts

> **diagnosticCounts**: `Required`\&lt;`WorkbenchDiagnosticCounts`\&gt;

***

### reasonCodes

> **reasonCodes**: `string`[]

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

### followUpTaskIds?

> `optional` **followUpTaskIds?**: `string`[]
