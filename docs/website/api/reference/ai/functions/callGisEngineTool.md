[**@gis-engine/ai v1.5.0**](../index.md)

***

# Function: callGisEngineTool()

> **callGisEngineTool**(`request`): `Promise`\<\{\[`key`: `string`\]: `unknown`; `_meta?`: \{\[`key`: `string`\]: `unknown`; `progressToken?`: `string` \| `number`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; \}; `content`: (\{ `type`: `"text"`; `text`: `string`; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; \} \| \{ `type`: `"image"`; `data`: `string`; `mimeType`: `string`; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; \} \| \{ `type`: `"audio"`; `data`: `string`; `mimeType`: `string`; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; \} \| \{ `uri`: `string`; `description?`: `string`; `mimeType?`: `string`; `size?`: `number`; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; `icons?`: `object`[]; `name`: `string`; `title?`: `string`; `type`: `"resource_link"`; \} \| \{ `type`: `"resource"`; `resource`: \{ `uri`: `string`; `mimeType?`: `string`; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; `text`: `string`; \} \| \{ `uri`: `string`; `mimeType?`: `string`; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; `blob`: `string`; \}; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; \})[]; `structuredContent?`: \{\[`key`: `string`\]: `unknown`; \}; `isError?`: `boolean`; \}\>

## Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | \{ `params`: \{ `name`: `string`; `arguments?`: `unknown`; \}; \} |
| `request.params` | \{ `name`: `string`; `arguments?`: `unknown`; \} |
| `request.params.name` | `string` |
| `request.params.arguments?` | `unknown` |

## Returns

`Promise`\<\{\[`key`: `string`\]: `unknown`; `_meta?`: \{\[`key`: `string`\]: `unknown`; `progressToken?`: `string` \| `number`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; \}; `content`: (\{ `type`: `"text"`; `text`: `string`; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; \} \| \{ `type`: `"image"`; `data`: `string`; `mimeType`: `string`; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; \} \| \{ `type`: `"audio"`; `data`: `string`; `mimeType`: `string`; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; \} \| \{ `uri`: `string`; `description?`: `string`; `mimeType?`: `string`; `size?`: `number`; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; `icons?`: `object`[]; `name`: `string`; `title?`: `string`; `type`: `"resource_link"`; \} \| \{ `type`: `"resource"`; `resource`: \{ `uri`: `string`; `mimeType?`: `string`; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; `text`: `string`; \} \| \{ `uri`: `string`; `mimeType?`: `string`; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; `blob`: `string`; \}; `annotations?`: \{ `audience?`: (`"user"` \| `"assistant"`)[]; `priority?`: `number`; `lastModified?`: `string`; \}; `_meta?`: \{\[`key`: `string`\]: `unknown`; \}; \})[]; `structuredContent?`: \{\[`key`: `string`\]: `unknown`; \}; `isError?`: `boolean`; \}\>
