[**@gis-engine/ai v1.5.0**](../index.md)

***

# Interface: Scene3DContextSummary

## Properties

### status

> **status**: `"extension-only"`

***

### stableViewMode

> **stableViewMode**: `false`

***

### runtimeSupported

> **runtimeSupported**: `false`

***

### sourceCount

> **sourceCount**: `number`

***

### layerCount

> **layerCount**: `number`

***

### visibleLayerCount

> **visibleLayerCount**: `number`

***

### pickableLayerCount

> **pickableLayerCount**: `number`

***

### sources

> **sources**: `object`[]

#### id

> **id**: `string`

#### type

> **type**: `string`

***

### layers

> **layers**: `object`[]

#### id

> **id**: `string`

#### type

> **type**: `string`

#### source

> **source**: `string`

#### visibility

> **visibility**: `"visible"` \| `"none"`

#### pickable

> **pickable**: `boolean`

***

### resourcePolicy

> **resourcePolicy**: `object`

#### present

> **present**: `boolean`

#### maxTilesetJsonBytes?

> `optional` **maxTilesetJsonBytes?**: `number`

#### maxModelBytes?

> `optional` **maxModelBytes?**: `number`

#### maxTextureCount?

> `optional` **maxTextureCount?**: `number`

#### maxTextureBytes?

> `optional` **maxTextureBytes?**: `number`

#### maxWorkers?

> `optional` **maxWorkers?**: `number`

#### timeoutMs?

> `optional` **timeoutMs?**: `number`

***

### snapshot

> **snapshot**: `object`

#### mockPassed

> **mockPassed**: `boolean`

#### pendingSourceIds

> **pendingSourceIds**: `string`[]

#### diagnosticCounts

> **diagnosticCounts**: `Record`\<`Diagnostic`\[`"severity"`\], `number`\>

***

### query

> **query**: `object`

#### pickCount

> **pickCount**: `number`

#### diagnosticCounts

> **diagnosticCounts**: `Record`\<`Diagnostic`\[`"severity"`\], `number`\>

***

### capabilities

> **capabilities**: `object`

#### renderer

> **renderer**: `string`

#### dimensions

> **dimensions**: (`"2d"` \| `"2_5d"` \| `"3d"`)[]

#### sources

> **sources**: `string`[]

#### layers

> **layers**: `string`[]

#### expressions

> **expressions**: `string`[]

#### queries

> **queries**: `string`[]

#### snapshot

> **snapshot**: `object`

##### snapshot.supported

> **supported**: `boolean`

##### snapshot.formats

> **formats**: (`"png"` \| `"jpeg"` \| `"data-url"`)[]

#### experimental

> **experimental**: `string`[]
