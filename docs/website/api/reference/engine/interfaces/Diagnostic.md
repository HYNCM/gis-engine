[**@gis-engine/engine v1.4.0**](../index.md)

***

# Interface: Diagnostic

## Properties

### severity

> **severity**: `"error"` \| `"warning"` \| `"info"`

***

### code

> **code**: `DiagnosticCode`

***

### blockerCode?

> `optional` **blockerCode?**: `Scene3DStableRuntimeBlockerCode`

***

### message

> **message**: `string`

***

### path?

> `optional` **path?**: `string`

***

### relatedResources?

> `optional` **relatedResources?**: [`RelatedResource`](RelatedResource.md)[]

***

### fix?

> `optional` **fix?**: [`SuggestedFix`](SuggestedFix.md)
