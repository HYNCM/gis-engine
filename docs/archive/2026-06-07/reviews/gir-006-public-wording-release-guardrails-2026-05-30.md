---
agent: docs-agent
period: 2026-05-30
generated_at: 2026-05-30T07:07:50Z
repo_revision: "eb08dbd"
inputs:
  - README.md
  - CHANGELOG.md
  - docs/README.md
  - docs/engineering/release-wording-guardrails.md
  - docs/engineering/supported-feature-matrix.md
  - docs/archive/2026-06-06/planning/v0.2-release.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - docs/planning/feature-specs/spatial-analysis-promotion-criteria.md
  - packages/ai/README.md
  - packages/scene3d/README.md
  - packages/scene3d-three-adapter/README.md
  - tests/docs/release-wording-guardrails.test.ts
owner: "@docs-agent"
decision_level: advisory
---

# GIR-006 Public Wording And Release Guardrails

`TASK-2026W22-GIR-006` is complete. Public release wording now has a dedicated
guardrail document and a deterministic docs test that scans the current public
copy surface for release-blocking capability claims.

## Evidence

| Requirement | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Stable SceneView3D runtime stays blocked | `README.md`, `packages/ai/README.md`, `packages/scene3d/README.md`, `packages/scene3d-three-adapter/README.md`, and `docs/archive/2026-06-06/planning/v0.2-release.md` keep scene browsing extension-only or no-go wording. | Generated-app scene browsing cannot be mistaken for stable `view.mode: "scene3d"` support. | Keep future 3D wording behind SRC-style promotion evidence. | high |
| Generated-app export stays side-effect free | `docs/planning/feature-specs/generated-app-delivery-ux.md`, `docs/planning/feature-specs/cloud-native-source-readiness.md`, and `docs/engineering/release-wording-guardrails.md` state that export handoff is manifest/file metadata only and must not fetch, parse, or write files. | AI delivery remains reviewable without hidden local writes. | Design a separate file-output policy before adding write behavior. | high |
| Unsupported source claims stay blocked | `docs/engineering/release-wording-guardrails.md` and `docs/planning/feature-specs/cloud-native-source-readiness.md` keep GeoParquet, FlatGeobuf, GeoTIFF, GeoZarr, PMTiles archive parsing, and PMTiles feature query behind readiness or blocked states. | Cloud-native roadmap pressure does not become unsupported runtime claims. | Promote each source only through schema, resource-policy, diagnostics, adapter, and test gates. | high |
| Advanced spatial-analysis claims stay blocked | `docs/planning/feature-specs/spatial-analysis-promotion-criteria.md` keeps buffer, intersection, overlay, routing, aggregation, and richer geoprocessing behind future operation tasks. | Generated-app review copy can explain blocked analysis without implying execution support. | Harden point/bbox evidence separately before richer operations. | high |
| Release wording guardrail is testable | `tests/docs/release-wording-guardrails.test.ts` asserts required guardrail statements and rejects positive claims for stable SceneView3D runtime, side-effect export writes, blocked source support, and advanced geoprocessing support. | Future docs changes get a deterministic tripwire before release. | Keep `pnpm test:docs` inside `pnpm check`. | high |

## Gate Output

| Command | Result | Notes |
| --- | --- | --- |
| `git diff --check` | pass | No whitespace or patch formatting issues. |
| `pnpm test:docs` | pass | 2 release-wording guardrail tests passed. |
| `pnpm check` | pass | Full build and deterministic test suite passed, including the SceneView3D release visual gate inside `pnpm test:snapshot:smoke`. |
| `pnpm test:release:scene3d` | not run separately | GIR-006 changed wording/tests only; the same release visual gate path passed under `pnpm check`. |

## Quality Guardian Note

No blocker was found in the audited public wording. GIR-006 is a docs/test
guardrail change, not a renderer-evidence change, so the SceneView3D release
visual gate remains conditional rather than required for this slice.

## Decision

`TASK-2026W22-GIR-006` is complete. The Generated App Review Console task batch
is closed; the orchestrator should return to planning state for the next
competitor/product/task loop.
