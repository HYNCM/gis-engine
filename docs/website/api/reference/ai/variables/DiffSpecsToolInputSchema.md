[**@gis-engine/ai v1.4.0**](../index.md)

***

# Variable: DiffSpecsToolInputSchema

> `const` **DiffSpecsToolInputSchema**: `object`

## Type Declaration

### type

> `readonly` **type**: `"object"` = `"object"`

### properties

> `readonly` **properties**: `object`

#### properties.before

> `readonly` **before**: `object` = `MapSpecInputSchema`

#### properties.before.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.before.properties

> `readonly` **properties**: `object`

#### properties.before.properties.version

> `readonly` **version**: `object`

#### properties.before.properties.version.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.before.properties.id

> `readonly` **id**: `object`

#### properties.before.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.before.properties.revision

> `readonly` **revision**: `object`

#### properties.before.properties.revision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.before.properties.view

> `readonly` **view**: `object`

#### properties.before.properties.view.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.before.properties.sources

> `readonly` **sources**: `object`

#### properties.before.properties.sources.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.before.properties.layers

> `readonly` **layers**: `object`

#### properties.before.properties.layers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.before.properties.interactions

> `readonly` **interactions**: `object`

#### properties.before.properties.interactions.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.before.properties.metadata

> `readonly` **metadata**: `object`

#### properties.before.properties.metadata.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.before.properties.extensions

> `readonly` **extensions**: `object`

#### properties.before.properties.extensions.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.before.properties.capabilities

> `readonly` **capabilities**: `object`

#### properties.before.properties.capabilities.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.before.required

> `readonly` **required**: readonly \[`"version"`, `"view"`, `"sources"`, `"layers"`\]

#### properties.before.additionalProperties

> `readonly` **additionalProperties**: `true` = `true`

#### properties.after

> `readonly` **after**: `object` = `MapSpecInputSchema`

#### properties.after.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.after.properties

> `readonly` **properties**: `object`

#### properties.after.properties.version

> `readonly` **version**: `object`

#### properties.after.properties.version.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.after.properties.id

> `readonly` **id**: `object`

#### properties.after.properties.id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.after.properties.revision

> `readonly` **revision**: `object`

#### properties.after.properties.revision.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.after.properties.view

> `readonly` **view**: `object`

#### properties.after.properties.view.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.after.properties.sources

> `readonly` **sources**: `object`

#### properties.after.properties.sources.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.after.properties.layers

> `readonly` **layers**: `object`

#### properties.after.properties.layers.type

> `readonly` **type**: `"array"` = `"array"`

#### properties.after.properties.interactions

> `readonly` **interactions**: `object`

#### properties.after.properties.interactions.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.after.properties.metadata

> `readonly` **metadata**: `object`

#### properties.after.properties.metadata.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.after.properties.extensions

> `readonly` **extensions**: `object`

#### properties.after.properties.extensions.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.after.properties.capabilities

> `readonly` **capabilities**: `object`

#### properties.after.properties.capabilities.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.after.required

> `readonly` **required**: readonly \[`"version"`, `"view"`, `"sources"`, `"layers"`\]

#### properties.after.additionalProperties

> `readonly` **additionalProperties**: `true` = `true`

#### properties.options

> `readonly` **options**: `object`

#### properties.options.type

> `readonly` **type**: `"object"` = `"object"`

#### properties.options.properties

> `readonly` **properties**: `object`

#### properties.options.properties.ignoreMetadata

> `readonly` **ignoreMetadata**: `object`

#### properties.options.properties.ignoreMetadata.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.options.properties.ignoreRevision

> `readonly` **ignoreRevision**: `object`

#### properties.options.properties.ignoreRevision.type

> `readonly` **type**: `"boolean"` = `"boolean"`

#### properties.options.additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### required

> `readonly` **required**: readonly \[`"before"`, `"after"`\]

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`
