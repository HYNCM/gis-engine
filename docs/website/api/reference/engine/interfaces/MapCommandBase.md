[**@gis-engine/engine v1.4.0**](../index.md)

***

# Interface: MapCommandBase

## Extended by

- [`AddSourceCommand`](AddSourceCommand.md)
- [`RemoveSourceCommand`](RemoveSourceCommand.md)
- [`AddLayerCommand`](AddLayerCommand.md)
- [`RemoveLayerCommand`](RemoveLayerCommand.md)
- [`SetPaintCommand`](SetPaintCommand.md)
- [`SetLayoutCommand`](SetLayoutCommand.md)
- [`SetFilterCommand`](SetFilterCommand.md)
- [`SetLayerZoomRangeCommand`](SetLayerZoomRangeCommand.md)
- [`ReorderLayerCommand`](ReorderLayerCommand.md)
- [`SetViewCommand`](SetViewCommand.md)
- [`SetCapabilitiesCommand`](SetCapabilitiesCommand.md)
- [`SetInteractionsCommand`](SetInteractionsCommand.md)
- [`FitBoundsCommand`](FitBoundsCommand.md)
- [`SetSceneCameraCommand`](SetSceneCameraCommand.md)
- [`AddSceneSourceCommand`](AddSceneSourceCommand.md)
- [`RemoveSceneSourceCommand`](RemoveSceneSourceCommand.md)
- [`AddSceneLayerCommand`](AddSceneLayerCommand.md)
- [`RemoveSceneLayerCommand`](RemoveSceneLayerCommand.md)
- [`SetSceneLayerVisibilityCommand`](SetSceneLayerVisibilityCommand.md)

## Properties

### id

> **id**: `string`

***

### version

> **version**: `"0.1"`

***

### type

> **type**: `string`

***

### baseRevision?

> `optional` **baseRevision?**: `string`

***

### author?

> `optional` **author?**: `object`

#### type

> **type**: `"human"` \| `"agent"` \| `"system"`

#### id?

> `optional` **id?**: `string`

#### name?

> `optional` **name?**: `string`

***

### reason?

> `optional` **reason?**: `string`

***

### createdAt?

> `optional` **createdAt?**: `string`

***

### sourcePromptHash?

> `optional` **sourcePromptHash?**: `string`

***

### dryRun?

> `optional` **dryRun?**: `boolean`
