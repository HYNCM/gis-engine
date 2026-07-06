---
agent: orchestrator
period: 2026-W28
generated_at: 2026-07-06T15:48:06Z
repo_revision: "8cc3a74"
inputs:
  - docs/planning/issues-snapshot.md
  - docs/reviews/quality-gate-2026-07-06.md
  - docs/reviews/documentation-audit-2026-07-06.md
  - docs/reviews/first-run-acceptance-2026-07-06.md
  - docs/architecture/core-extension-boundary-matrix.json
  - docs/planning/next-step-plan.md
  - CHANGELOG.md
owner: "@orchestrator"
decision_level: info
---

# Weekly Digest

This active file is a compact pointer for automation. The previous digest was
archived to
[archive/2026-06-30/planning/weekly-digest.md](../archive/2026-06-30/planning/weekly-digest.md).

## Current Digest

| Topic | Current Reading | Evidence |
| --- | --- | --- |
| Open work | GitHub Issues snapshot has 0 open issues after #22 closure | [issues-snapshot.md](./issues-snapshot.md) |
| Release | v1.5.0 repo release state is current for SDK maturity and CLI first-run acceptance | [CHANGELOG.md](../../CHANGELOG.md) |
| First-run acceptance | Strict Node 22 / pnpm 11.9 release-env path passed in 30.6s; Vite scaffold now installs `maplibre-gl` and imports the CSS | [first-run acceptance](../reviews/first-run-acceptance-2026-07-06.md) |
| CLI test coverage | 215 tests across 8 files (+74 new); lint, community, generate, bin-dispatch fully covered | [v1.5 plan](../../../.changeset/v1.5-sdk-maturity.md) |
| CI matrix | Node 22+24, macOS lint job | [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) |
| Performance | Smoke budgets tightened; applyCommands batch benchmarks added | [performance-benchmarks.md](../../engineering/performance-benchmarks.md) |
| Visual snapshots | 4 MapLibre scenarios + SceneView3D adapter (5 total) | [maplibre-visual.spec.ts](../../../tests/snapshot/visual/maplibre-visual.spec.ts) |
| Docs | Boundary regression tests, migration guide, example README standardization | [v1.4-to-v1.5.md](../../migration/v1.4-to-v1.5.md) |
| Core/extension matrix | #22 is closed; architecture/spec matrices are generated from one JSON source and checked by docs regression | [matrix source](../architecture/core-extension-boundary-matrix.json) |
| Governance | 2026-07-06 quality and docs machine evidence are fresh; this digest consumes HOC-N3 | [quality gate](../reviews/quality-gate-2026-07-06.md) |
| SceneView3D | Remains experimental; stable view.mode still blocked | [CHANGELOG.md](../../CHANGELOG.md) |
| Next steps | v1.6 planning: SceneView3D evidence, cloud-native sources, expression completeness | [monthly-roadmap.md](./monthly-roadmap.md) |
| PMTiles runtime query | Runtime query remains No-go; future loader/query gate required | [PMTiles boundary](./feature-specs/pmtiles-runtime-query-promotion-boundary.md) |
| Workbench | Studio/Workbench product movement remains No-go | [Studio/Workbench No-go](./feature-specs/studio-workbench-product-go-no-go.md) |
| External signals | @product research remains at W24; do not claim current competitor or standards state until refreshed | [competitor update](../research/competitor-updates-2026-W24.md) |

## Maintenance

Weekly automation may overwrite this file. Keep it short and route dated
evidence to archive batches or issue snapshots.
