# capability-declaration

## Goal

Demonstrate the MapSpec `capabilities` field and how the engine handles
different capability requests: standard, 2.5D, experimental, and blocked.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map and capability panel side by side.

## What It Shows

| Capability | View Mode | Status |
|---|---|---|
| `2d` | map2d | Always supported by MapLibre |
| `2_5d` | map2_5d | Supported with pitch and bearing |
| `experimental: fill-extrusion-lite` | map2_5d | Beta — may produce warnings |
| `3d` + `renderer: scene3d` | scene3d | Blocked on MapLibre adapter |

## Capability Gate Mechanism

The `capabilities` field in MapSpec declares what the spec requires. The engine
and adapter check these against their supported features:

- **Supported**: spec renders normally
- **Experimental**: spec renders with diagnostic warnings
- **Blocked**: spec fails validation or is blocked at runtime
- **Graceful degradation**: unsupported capabilities may fall back to a lower
  dimension

## Expected Output

- Left: rendered map showing the first supported capability (standard 2D)
- Right: panel showing all 4 test cases with their status and diagnostics
- Console: full capability request and diagnostic output for each case

## Limits And Follow-up

- Scene3D capability requires the `@gis-engine/scene3d-three-adapter` package.
  The MapLibre adapter blocks 3D requests.
- Experimental capabilities may change between releases without notice.
- For 2.5D rendering see
  [`../fill-extrusion-lite`](../fill-extrusion-lite/README.md).
