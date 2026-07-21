[**@gis-engine/ai v1.5.0**](../index.md)

***

# Function: createAuditDeletionReceipt()

> **createAuditDeletionReceipt**(`input`): `WorkbenchContractResult`\<[`WorkbenchAuditDeletionReceipt`](../interfaces/WorkbenchAuditDeletionReceipt.md), `"receipt"`\>

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `principal?`: `WorkbenchPrincipal`; `projectId?`: `string`; `deletedAt?`: `string`; `actorId?`: `string`; `reasonCode?`: `string`; `filterSummary?`: `Record`\<`string`, `unknown`\>; `deletedCount?`: `number`; \} |
| `input.principal?` | `WorkbenchPrincipal` |
| `input.projectId?` | `string` |
| `input.deletedAt?` | `string` |
| `input.actorId?` | `string` |
| `input.reasonCode?` | `string` |
| `input.filterSummary?` | `Record`\<`string`, `unknown`\> |
| `input.deletedCount?` | `number` |

## Returns

`WorkbenchContractResult`\<[`WorkbenchAuditDeletionReceipt`](../interfaces/WorkbenchAuditDeletionReceipt.md), `"receipt"`\>
