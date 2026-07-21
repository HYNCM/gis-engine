[**@gis-engine/ai v1.5.0**](../index.md)

***

# Function: createAuditExportEnvelope()

> **createAuditExportEnvelope**(`input`): `WorkbenchContractResult`\<[`WorkbenchAuditExportEnvelope`](../interfaces/WorkbenchAuditExportEnvelope.md), `"envelope"`\>

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `principal?`: `WorkbenchPrincipal`; `projectId?`: `string`; `generatedAt?`: `string`; `records?`: [`WorkbenchAuditRecord`](../interfaces/WorkbenchAuditRecord.md)[]; `filters?`: `Record`\<`string`, `unknown`\>; `nextCursor?`: `string`; \} |
| `input.principal?` | `WorkbenchPrincipal` |
| `input.projectId?` | `string` |
| `input.generatedAt?` | `string` |
| `input.records?` | [`WorkbenchAuditRecord`](../interfaces/WorkbenchAuditRecord.md)[] |
| `input.filters?` | `Record`\<`string`, `unknown`\> |
| `input.nextCursor?` | `string` |

## Returns

`WorkbenchContractResult`\<[`WorkbenchAuditExportEnvelope`](../interfaces/WorkbenchAuditExportEnvelope.md), `"envelope"`\>
