---
agent: competitive-intel
period: 2026-W27
generated_at: 2026-05-18T03:33:14Z
repo_revision: "b2c0c3b"
inputs:
  - https://github.com/CesiumGS/cesium/releases
  - https://github.com/CesiumGS/cesium/wiki/CesiumJS-Features-Checklist
  - https://cesium.com/why-cesium/3d-tiles/
  - https://github.com/CesiumGS/3d-tiles
  - https://github.com/mrdoob/three.js/releases
  - https://threejs.org/docs/pages/WebGLRenderer.html
  - https://threejs.org/manual/en/webgpurenderer
  - https://github.com/NASA-AMMOS/3DTilesRendererJS
decision_level: advisory
---

# SceneView3D Adapter Feasibility

Checked on 2026-05-18. Do not treat these version notes as current after this
date without rechecking the source URLs.

## Executive Decision

Start with a narrow `@gis-engine/scene3d-three-adapter` spike using Three.js and
3DTilesRendererJS behind the existing `@gis-engine/scene3d` boundary. Keep
CesiumJS as the reference implementation for full geospatial behavior and as a
candidate for a later high-fidelity adapter.

Reason: GIS Engine's next risk is not raw 3D feature coverage; it is whether 3D
can obey schema-first, command-only, deterministic snapshot/query, resource
policy, and MCP context gates. Three.js plus 3DTilesRendererJS exposes more of
the render loop and loading boundary, which is easier to wrap with
`validateSceneResourceLoadPlan` and the new release visual gate. CesiumJS is
more complete for geospatial 3D but brings a larger scene/runtime model that
needs a stricter side-effect and resource interception design before it can be
AI-native.

## Source Signals

| Source | Observed signal | Impact | Confidence |
| --- | --- | --- | --- |
| CesiumJS releases | CesiumJS 1.141 was published 2026-05-01; highlights include Node 22 minimum and vector tileset `EXT_structural_metadata` property support. | Cesium remains highly active and geospatially mature; adopting it introduces Node/runtime floor and release-tracking requirements. | high |
| CesiumJS feature checklist | Official checklist lists streaming/styling/interacting with 3D Tiles, high-resolution terrain, imagery layers, glTF models, picking, camera navigation, precision handling, and 3D/2D/Columbus modes. | Best out-of-box geospatial coverage, but many capabilities must be gated so they do not bypass `MapSpec` and command semantics. | high |
| Cesium 3D Tiles docs | 3D Tiles is described as an open OGC standard for massive heterogeneous datasets built on glTF, with 3D Tiles 1.1 now the successor to "3D Tiles Next". | Confirms that the GIS Engine 3D roadmap should keep 3D Tiles 1.1/glTF metadata first-class. | high |
| 3D Tiles specification repo | 3D Tiles 1.1 directly supports glTF tile contents, multiple contents, implicit tiling, and structured metadata; legacy b3dm/i3dm/pnts/cmpt formats are deprecated in favor of glTF content. | Scene source schema should bias future fixtures toward glTF content and structured metadata instead of old tile payload assumptions. | high |
| Three.js releases/docs | Three.js has recent r182/r181/r180 release activity; WebGLRenderer uses WebGL 2, and WebGPURenderer is positioned as the next-generation renderer with WebGL 2 fallback. | Three.js is viable for controlled adapter experiments and future WebGPU exploration, but geospatial semantics are not native. | medium |
| 3DTilesRendererJS | The project provides a JavaScript renderer for 3D Tiles using Three.js, Babylon.js, and r3f; it says it supports most 3D Tiles spec features with exceptions and has examples for Cesium ion, Google tiles, quantized mesh, GeoJSON, vector tiles, and overlays. | Strong candidate for a minimal SceneView3D adapter spike because it focuses on 3D Tiles while keeping engine choice isolated. | medium |

## Feasibility Scorecard

| Dimension | CesiumJS adapter | Three.js + 3DTilesRendererJS adapter |
| --- | ---: | ---: |
| 3D geospatial completeness | 9 | 7 |
| AI operability / deterministic control | 6 | 8 |
| Resource policy interceptability | 5 | 8 |
| Snapshot/query contract fit | 6 | 7 |
| Bundle/dependency isolation risk | 5 | 7 |
| Time to first controlled spike | 6 | 8 |

Scores are directional. CesiumJS wins full geospatial coverage; Three.js wins
the first AI-native controlled adapter experiment.

## Recommended Adapter Path

1. Create a separate spike package only after W28 planning approval:
   `@gis-engine/scene3d-three-adapter`.
2. Keep `@gis-engine/engine` and `@gis-engine/scene3d` free of direct Three.js,
   CesiumJS, loader, worker, or remote asset dependencies.
3. Use one local 3D Tiles/glTF fixture and one local terrain/overlay fixture.
4. Require the adapter to submit a deterministic load plan to
   `validateSceneResourceLoadPlan` before loading resources.
5. Implement only the current adapter intersection:
   `load(extension)`, `snapshot()`, `query(point)`, `destroy()`, and capability
   reporting.
6. Promote from mock to runtime only when `evaluateScene3DReleaseVisualGate`
   has real renderer visual evidence rather than waiver-only evidence.

## CesiumJS Follow-Up

CesiumJS should remain in the feasibility track for:

- high-fidelity terrain and imagery;
- full 3D Tiles / glTF / point cloud behavior;
- globe precision and large coordinate handling;
- reference picking and camera behavior.

Before a Cesium adapter is accepted, it must prove that asset loading, workers,
network requests, Ion credentials, time-dynamic state, and internal scene
mutation can be isolated behind GIS Engine resource policy and command replay
contracts.

## Blocking Rules

- Do not add CesiumJS, Three.js, 3DTilesRendererJS, glTF loaders, or workers to
  `@gis-engine/engine`.
- Do not enable stable `view.mode: "scene3d"` from this feasibility decision.
- Do not fetch remote Ion/Google/tileset assets in tests unless the resource
  policy, credentials story, and release runner are explicitly updated.
- Do not replace `snapshotScene3DMock`, `queryScene3DMock`, or
  `evaluateScene3DReleaseVisualGate`; the first adapter must pass through them
  or provide stricter evidence.
