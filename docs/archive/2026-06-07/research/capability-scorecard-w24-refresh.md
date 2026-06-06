---
agent: product
period: 2026-W24
generated_at: 2026-06-05T13:05:41Z
repo_revision: "4012f51"
inputs:
  - docs/research/competitor-updates-2026-W24.md
  - docs/research/capability-scorecard.md
  - examples/ai-map-workbench/review-console.mjs
  - tests/examples/review-console.test.ts
  - tests/examples/qa-matrix.test.ts
  - tests/schema/cloud-native-policy.test.ts
  - tests/snapshot/strict-visual-maintenance.test.ts
  - tests/snapshot/app-template-visual.test.ts
  - tests/perf/perf-trend-ledger.test.ts
owner: "@product @orchestrator"
decision_level: advisory
---

# Capability Scorecard: 2026-W24 Refresh

Scores are advisory product signals, not release approvals. They reflect
accepted direction plus implementation evidence present at `4012f51`; final
Done status still depends on the current quality gates recorded in the planning
ledgers.

| Dimension | W23 Score | W24 Score | Evidence Note | Confidence |
| --- | ---: | ---: | --- | --- |
| AI operability | 9.5/10 | 9.6/10 | Review-console state is now computed from structured generation evidence, and QA matrix fixtures cover ready, blocked, needs-confirmation, and follow-up-required handoffs without adding MCP tools. | high |
| 2D performance | 6.5/10 | 6.6/10 | Strict GeoJSON/MVT/fill-extrusion-lite smoke coverage and perf trend harness exist, but there is still no MapLibre package movement or two-week trend history. | medium |
| 3D readiness | 5.4/10 | 5.4/10 | Cesium moved to `1.142.0`, but SceneView3D stable runtime remains blocked after SRC-006 and W24 adds no stable renderer promotion evidence. | high |
| Developer experience | 8.0/10 | 8.2/10 | SDK+CLI remains the launch surface, and the local review-console/QA matrix makes generated-app acceptance inspectable without promoting hosted Workbench scope. | high |
| Ecosystem and data readiness | 7.0/10 | 7.2/10 | PMTiles, GeoParquet, and FlatGeobuf now have metadata/policy validators and tests; runtime parsers, workers, range IO, and cloud-native feature queries remain blocked. | high |

## Score Movement Rationale

- AI operability rises only slightly because W24 improves reviewability, not
  the public MCP tool surface. The seven documented snake_case tools remain
  frozen.
- 2D performance rises only at evidence-maintenance level. The perf trend
  harness is useful, but `VPE-002` still needs repeated nightly data before a
  stronger score change.
- 3D readiness stays unchanged. External package movement does not override the
  SRC-006 No-go.
- Developer experience rises because review-console evidence and QA cards close
  the previous "document/test-centric" review gap for local acceptance.
- Ecosystem/data readiness rises because W24 adds explicit contract surfaces
  for cloud-native formats while preserving resource-policy blockers.

## Guardrails

- Do not use this scorecard as release approval.
- Do not mark `VPE-002` complete until trend data exists beyond the local
  harness.
- Do not claim GeoParquet or FlatGeobuf runtime source support.
- Do not claim PMTiles archive parsing, hidden range requests, or PMTiles
  feature query runtime.
- Do not promote stable `view.mode: "scene3d"`.
