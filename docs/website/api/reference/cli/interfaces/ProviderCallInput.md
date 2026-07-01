[**@gis-engine/cli v1.1.0**](../index.md)

***

# Interface: ProviderCallInput

## Properties

### profile

> **profile**: [`ProviderProfile`](ProviderProfile.md)

***

### apiKey

> **apiKey**: `string`

***

### message

> **message**: `string`

***

### fetchImpl?

> `optional` **fetchImpl?**: \{(`input`, `init?`): `Promise`\&lt;`Response`\&gt;; (`input`, `init?`): `Promise`\&lt;`Response`\&gt;; \}

#### Call Signature

> (`input`, `init?`): `Promise`\&lt;`Response`\&gt;

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `URL` \| `RequestInfo` |
| `init?` | `RequestInit` |

##### Returns

`Promise`\&lt;`Response`\&gt;

#### Call Signature

> (`input`, `init?`): `Promise`\&lt;`Response`\&gt;

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` \| `URL` \| `Request` |
| `init?` | `RequestInit` |

##### Returns

`Promise`\&lt;`Response`\&gt;

***

### timeoutMs?

> `optional` **timeoutMs?**: `number`

***

### responseByteCap?

> `optional` **responseByteCap?**: `number`
