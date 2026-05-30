---
agent: docs-agent
period: 2026-05-30
generated_at: 2026-05-30T05:18:00Z
repo_revision: "40655ce798d4bbad5067a4ecafab915c45456392"
inputs:
  - README.md
  - packages/ai/README.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md
  - packages/ai/src/tools/generationEvidence.ts
  - packages/ai/src/tools/contextSummary.ts
  - tests/ai/generation-evidence.test.ts
  - tests/ai/mcp-integration.test.ts
owner: "@docs-agent"
decision_level: advisory
---

# AIN-005 Scene Browsing Delivery Copy

`TASK-2026W22-AIN-005` is closed as copy/evidence alignment. Generated-app
delivery now describes scene browsing as `extension-only` and keeps stable
runtime blocker codes visible without promoting `view.mode: "scene3d"` or
`snapshot.renderer: "scene3d"`.

The blocker code set remains `SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED`,
`SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED`, and
`SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED`.

## Evidence

| Requirement | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Generated-app copy says extension-only | `docs/planning/feature-specs/generated-app-delivery-ux.md` documents `sceneBrowsing.state: "extension-only"` and `sceneBrowsing.stableRuntimeBlocked: true`. | UI copy can avoid implying stable 3D runtime support. | Keep future copy bound to these fields. | high |
| AI package docs preserve the blocker boundary | `packages/ai/README.md` says `extensions.scene3d` is extension-only and stable runtime remains blocked. | AI tool consumers see the limitation at the package entry point. | Keep this wording aligned with schema fields. | high |
| Root README does not overclaim stable 3D | `README.md` still says stable `view.mode: "scene3d"` remains blocked and now references generated-app delivery docs. | Public project status stays honest. | Do not move SceneView3D from scaffold/handoff to stable without a new Go decision. | high |
| MCP context stays compact and extension-only | `contextSummary` exposes `scene3d.status=extension-only` and tests assert no `rendererEvidence` or `promotionEvidence` leaks into AI context. | MCP consumers get planning evidence, not renderer promotion evidence. | Continue using adapter-local release evidence outside public MCP summaries. | high |
| Stable scene snapshot remains blocked | AI tests reject `snapshot.renderer: "scene3d"` and stable scene3d runtime requests remain blocked with `SCENE3D.STABLE_RUNTIME_*` codes. | Delivery copy cannot be used to bypass release gates. | Keep `snapshot_spec` renderer enum at `maplibre | mock`. | high |

## Gate Output

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm build:schema` | pass | Public schemas still compile with SceneView3D blocker and delivery fields. |
| `pnpm --filter @gis-engine/ai build` | pass | AI package still compiles after documentation and evidence alignment. |
| `pnpm test:ai` | pass | Generated-app and MCP copy/evidence assertions remain green. |
| `pnpm test:release:scene3d` | pass | SceneView3D release gate remains green without stable runtime promotion. |
| `pnpm check` | pass | Full deterministic gate passed after AIN-003/004/005 planning updates. |
| `git diff --check` | pass | No whitespace errors. |

## Residual Risk

- This task does not make SceneView3D stable. It closes the delivery wording and
  evidence handoff only.
- Future renderer promotion still requires a separate quality-guardian and
  coordinator Go decision.
