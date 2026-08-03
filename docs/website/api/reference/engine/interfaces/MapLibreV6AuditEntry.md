[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: MapLibreV6AuditEntry

## Properties

### id

> **id**: `string`

Unique audit check identifier.

***

### description

> **description**: `string`

Short description of the check.

***

### breakingChange

> **breakingChange**: `string`

MapLibre v5→v6 breaking change reference.

***

### severity

> **severity**: [`MapLibreV6AuditSeverity`](../type-aliases/MapLibreV6AuditSeverity.md)

Audit result severity.

***

### impact

> **impact**: `string`

GIS Engine impact description.

***

### remediation

> **remediation**: `string`

Remediation status or notes.
