---
agent: coordinator
period: 2026-W22
generated_at: 2026-05-25T01:57:26Z
repo_revision: "d3c0137"
inputs:
  - AGENTS.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/sprint-2026-W22-competitive-signal-response.md
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
  - docs/engineering/maplibre-version-drift-audit.md
  - docs/reviews/sceneview3d-stable-renderer-gate-2026-05-25.md
  - docs/reviews/sceneview3d-lifecycle-diagnostics-2026-05-25.md
  - docs/reviews/sceneview3d-src-evidence-decision-2026-05-25.md
  - packages/scene3d-three-adapter/src/index.ts
  - tests/adapter/scene3d-three-adapter.test.ts
  - tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts
owner: "@coordinator"
decision_level: advisory
---

# Weekly Digest: 2026-W22

## Cycle Conclusion

W22 refreshed the competitor view and converted it into an execution path rather
than a broad roadmap reset. The external signals reinforce the current GIS
Engine direction:

- PMTiles/vector source support is a competitive requirement, not an optional
  demo feature.
- SceneView3D should keep advancing through adapter-local evidence and release
  gates, not through immediate stable runtime promotion.
- MCP input/output schema discipline remains a release requirement for
  AI-native map editing.

The execution loop is complete for W22: SceneView3D Three adapter lifecycle
diagnostics now expose stable pre-load and post-destroy paths, MapLibre version
drift has a pre-upgrade audit checklist, and the SRC evidence decision accepts
prerequisite evidence while keeping stable runtime promotion blocked.

## Current Signals

| Source | Signal | Impact | Confidence |
| --- | --- | --- | --- |
| competitive-intel | Mapbox documents PMTiles vector source use; MapLibre release drift can affect module/WebGL baselines | Keep vector source evidence release-gated and add a MapLibre version-drift audit before upgrades | high |
| competitive-intel | CesiumJS, Three.js, and 3DTilesRendererJS remain active 3D reference points | Continue adapter-local SceneView3D renderer contract work; stable runtime stays blocked | high |
| competitive-intel | MCP tools spec includes output schemas | Keep public MCP `inputSchema` and `outputSchema` as blocking contract checks | high |
| product-strategist | W22 scorecard raises AI operability, 2D cloud-native, and 3D readiness scores, but not stable 3D runtime | Next iteration is evidence hardening, not broad scope expansion | high |
| adapter-agent | Lifecycle diagnostics now include `/runtime/not-loaded/{operation}` and `/runtime/destroyed/{operation}` | AI/debug tooling can identify failure state without parsing diagnostic messages | high |

## Decisions

1. Preserve stable `view.mode: "scene3d"` as blocked until SRC-006 passes.
2. Treat MapLibre upgrade pressure as an audit/checklist task before dependency
   movement.
3. Keep PMTiles/vector source examples tied to schema, resource-policy,
   smoke-snapshot, and visual-snapshot evidence.
4. Count the lifecycle diagnostics patch as the first W22 execution slice under
   `TASK-2026W22-CSI-003`.
5. Accept existing SRC evidence only as prerequisite contract evidence; stable
   runtime promotion remains No-go.

## Execution Status

| id | Status | Evidence |
| --- | --- | --- |
| TASK-2026W22-CSI-001 | done | `docs/research/competitor-updates-2026-W22.md` |
| TASK-2026W22-CSI-002 | done | `docs/research/capability-scorecard.md` |
| TASK-2026W22-CSI-003 | done | `packages/scene3d-three-adapter/src/index.ts`, adapter tests, smoke lifecycle tests, `docs/reviews/sceneview3d-lifecycle-diagnostics-2026-05-25.md` |
| TASK-2026W22-CSI-004 | done | this digest and `docs/planning/monthly-roadmap.md` |
| TASK-2026W22-CSI-005 | done | `docs/engineering/maplibre-version-drift-audit.md` |
| TASK-2026W22-CSI-006 | done | `docs/reviews/sceneview3d-src-evidence-decision-2026-05-25.md` |

## Next Handoff

- `@engine-agent` / `@docs-agent`: use the MapLibre version-drift checklist
  before any `maplibre-gl` package movement.
- `@quality-guardian` / `@coordinator`: keep SRC-006 no-go until a future full
  gate provides real renderer visual evidence or an approved release waiver.
- `@adapter-agent` / `@qa-agent`: keep lifecycle, snapshot, query, and visual
  evidence disjoint and adapter-local.
