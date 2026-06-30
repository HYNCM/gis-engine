[**@gis-engine/engine v1.2.0**](../index.md)

***

# Interface: SourceValidationResult

Result of validating a single source spec against resource policy
and source-type-specific constraints.

## Properties

### status

> **status**: [`SourceValidationStatus`](../type-aliases/SourceValidationStatus.md)

Final lifecycle status after validation.

***

### sourceId

> **sourceId**: `string`

Source id from the MapSpec sources map.

***

### sourceType

> **sourceType**: `string`

Source type discriminator (e.g. "geojson", "raster").

***

### diagnostics

> **diagnostics**: [`Diagnostic`](Diagnostic.md)[]

Diagnostics produced during validation.

***

### capabilities?

> `optional` **capabilities?**: [`SourceCapabilitySummary`](SourceCapabilitySummary.md)

Capability summary when validation succeeds.
