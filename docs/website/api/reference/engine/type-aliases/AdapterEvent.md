[**@gis-engine/engine v1.5.0**](../index.md)

***

# Type Alias: AdapterEvent

> **AdapterEvent** = `"error"` \| `"warning"` \| `"stats"` \| `"click"` \| `"mousemove"` \| `"moveend"` \| `"zoomend"` \| `"data"` \| `"idle"` \| `"load"` \| `"interaction"`

All event types emitted by renderer adapters.

Diagnostic events: `"error"`, `"warning"`, `"stats"`
Map interaction / lifecycle events: `"click"`, `"mousemove"`, `"moveend"`,
`"zoomend"`, `"data"`, `"idle"`, `"load"`
Interaction state change: `"interaction"` — fired when InteractionSpec is applied.
