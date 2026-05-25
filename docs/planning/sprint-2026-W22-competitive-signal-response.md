---
agent: task-distributor
period: 2026-W22
generated_at: 2026-05-25T01:57:26Z
repo_revision: "d3c0137"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
  - docs/engineering/maplibre-version-drift-audit.md
  - docs/reviews/sceneview3d-stable-renderer-gate-2026-05-25.md
  - docs/reviews/sceneview3d-lifecycle-diagnostics-2026-05-25.md
  - docs/reviews/sceneview3d-src-evidence-decision-2026-05-25.md
owner: "@task-distributor"
decision_level: advisory
---

# Sprint Plan: W22 Competitive Signal Response

## Goal

Use the current competitor sweep to keep GIS Engine's next iteration small,
verifiable, and aligned with the repo's AI-native gate rules.

The main product decision is unchanged: cloud-native 2D source support stays
important, and SceneView3D work advances only through adapter-local evidence.
Stable `view.mode: "scene3d"` remains blocked until SRC-006 is accepted.

## Task Ledger

| id | title | epic | priority | complexity | owner | status | requirements | acceptance | dependencies | due date | estimated hours |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| TASK-2026W22-CSI-001 | Publish W22 competitor signal report | Competitive intelligence | P1 | S | `@competitive-intel` | done | dated official sources; evidence/action/confidence | `docs/research/competitor-updates-2026-W22.md` exists with source URLs and dated recommendations | none | 2026-05-25 | 2 |
| TASK-2026W22-CSI-002 | Refresh capability scorecard | Planning | P1 | S | `@product-strategist` | done | dated score deltas; no unsupported stable 3D claim | `docs/research/capability-scorecard.md` reflects W22 scores and keeps stable SceneView3D blocked | CSI-001 | 2026-05-25 | 1 |
| TASK-2026W22-CSI-003 | Add path-stable SceneView3D lifecycle diagnostics | SceneView3D stable renderer contract | P1 | S | `@adapter-agent` | done | structured diagnostics; adapter boundary; focused tests | pre-load and post-destroy runtime diagnostics include stable paths and adapter resources; adapter/smoke tests and review report cover paths | SRC-001, SRC-003 | 2026-05-25 | 3 |
| TASK-2026W22-CSI-004 | Record W22 coordinator digest and roadmap adjustment | Planning | P1 | S | `@coordinator` | done | single-writer planning update; current sources | weekly digest and roadmap name the W22 response path and execution evidence | CSI-001, CSI-002, CSI-003 | 2026-05-25 | 2 |
| TASK-2026W22-CSI-005 | Add MapLibre version-drift audit checklist | 2D adapter compatibility | P1 | M | `@engine-agent`, `@docs-agent` | done | schema/resource/snapshot gates; package version boundary | `docs/engineering/maplibre-version-drift-audit.md` names transformer, vector source, resource policy, smoke snapshot, visual snapshot, release runner, dependency boundary, and rollback decision checks before any MapLibre upgrade | CSI-001 | 2026-05-27 | 4 |
| TASK-2026W22-CSI-006 | Decide whether SRC evidence can close planning status | SceneView3D governance | P1 | M | `@quality-guardian`, `@coordinator` | done | use owner evidence; do not over-promote stable runtime | `docs/reviews/sceneview3d-src-evidence-decision-2026-05-25.md` accepts prerequisite evidence while keeping stable `view.mode: "scene3d"` no-go | CSI-003; existing SRC reports | 2026-05-29 | 4 |

## Execution Notes

- CSI-001 through CSI-004 are intentionally small: they convert the current
  competitor sweep into repo evidence and close one lifecycle-diagnostics slice.
- CSI-005 is complete. It did not upgrade `maplibre-gl`; it defines the audit
  checklist for a future upgrade.
- CSI-006 is complete for this W22 decision snapshot. It accepts existing SRC
  prerequisite evidence for planning input and keeps stable runtime blocked.

## Finish Gates

- `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`
- `pnpm test:snapshot:smoke -- tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts`
- `pnpm --filter @gis-engine/scene3d-three-adapter build`
- `pnpm -s build:schema`
- `pnpm -s check`

Visual snapshot gates are not required for CSI-003 because it changes lifecycle
diagnostic metadata and docs only. They become required again for rendering,
fixture, visual evidence, browser-runner, or adapter-output changes.

## Recommendations

### Preserve The Stable 3D Blocker

- Evidence: W22 competitor sweep supports adapter-local 3D evidence, not a core
  runtime jump.
- Impact: architecture and AI safety.
- Action: keep `view.mode: "scene3d"` stable promotion behind SRC-006.
- Confidence: high.

### Treat MapLibre Drift As A Planning Item

- Evidence: MapLibre release signals include ESM/WebGL baseline movement.
- Impact: developer experience and 2D compatibility.
- Action: define the audit first, then consider dependency movement.
- Confidence: medium.
