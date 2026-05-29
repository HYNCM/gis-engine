---
agent: adapter-agent
period: 2026-W23
generated_at: 2026-05-29T07:19:29Z
repo_revision: "e2215b877343aa708af0f0d098316d6d3c0208e8"
inputs:
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - docs/reviews/nla-004-generation-scenarios-2026-05-29.md
  - tests/ai/generation-scenarios.test.ts
  - tests/ai/generation-evidence.test.ts
  - tests/adapter/scene3d-three-adapter.test.ts
owner: "@adapter-agent"
decision_level: advisory
---

# NLA-005 Scene Browsing Extension Boundary

## Summary

`TASK-2026W23-NLA-005` keeps scene browsing generation under the existing
`extensions.scene3d` boundary. The generation flow can attach extension-only
camera/source/layer evidence, but it does not set stable `view.mode: "scene3d"`,
does not set `capabilities.renderer: "scene3d"`, and does not move renderer
dependencies into `@gis-engine/engine` or `@gis-engine/ai`.

No adapter runtime code changed in this slice. The adapter and release gates
were rerun to prove the boundary still holds.

## Evidence

- Evidence: `tests/ai/generation-scenarios.test.ts` now covers an
  extension-only scene browsing generation bundle.
- Impact: AI orchestration; scene browsing evidence is available to the
  generation handoff without implying stable runtime support.
- Action: keep prompt-level scene browsing under `scene3d.status=extension-only`
  until a future stable-runtime Go decision exists.
- Confidence: high.

- Evidence: stable `view.mode: "scene3d"` generation requests produce blocked
  evidence with `SCENE3D.STABLE_RUNTIME_*` blocker codes.
- Impact: architecture and release safety; generated apps cannot use stable 3D
  fields as a fallback path.
- Action: future scene browsing prompts must either provide
  `extensions.scene3d` evidence or return structured diagnostics.
- Confidence: high.

- Evidence: `GenerationEvidenceBundleInputSchema` rejects
  `snapshot.renderer: "scene3d"`; the generation evidence bundle accepts only
  the existing `maplibre` and `mock` snapshot paths.
- Impact: AI contract safety; renderer evidence cannot be smuggled into the
  generation bundle as a pseudo-stable SceneView3D snapshot.
- Action: keep any future real renderer evidence behind the adapter/release gate
  rather than the AI generation input schema.
- Confidence: high.

- Evidence: adapter build/tests and the SceneView3D release visual gate pass
  without adapter source changes.
- Impact: adapter boundary; renderer dependencies remain adapter-local and
  existing browser evidence gates are not weakened by the generation flow.
- Action: keep renderer evidence summaries out of public MCP context unless a
  future coordinator decision changes the contract.
- Confidence: high.

- Evidence: `tests/adapter/scene3d-three-adapter.test.ts` asserts
  `packages/engine/src`, `packages/scene3d/src`, and `packages/ai/src` do not
  import `@gis-engine/scene3d-three-adapter`.
- Impact: package boundary; the renderer adapter remains adapter-local and
  cannot leak into core or AI orchestration code.
- Action: keep this import boundary test aligned with any future adapter package
  rename or split.
- Confidence: high.

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm build:schema` | pass | engine, scene3d, and AI schema/build outputs are in sync |
| `pnpm test:schema-sync` | pass | 14 schema-sync tests passed |
| `pnpm test:ai` | pass | AI suite includes 5 generation scenario tests; 29 AI tests total |
| `pnpm test:commands` | pass | 40 command tests passed |
| `pnpm --filter @gis-engine/scene3d-three-adapter build` | pass | adapter TypeScript build |
| `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts` | pass | adapter suite passed; import boundary assertions included; 46 adapter tests total |
| `pnpm test:release:scene3d` | pass | release visual gate passed |
| `pnpm check` | pass | full deterministic gate passed, including smoke snapshots |
| `git diff --check` | pass | no whitespace errors |

## Next Handoff

`TASK-2026W23-NLA-006` can now compose prompt-level evidence across
feature-display, spatial-analysis readiness, and scene browsing boundary
scenarios. Stable SceneView3D runtime promotion remains outside this NLA loop.
