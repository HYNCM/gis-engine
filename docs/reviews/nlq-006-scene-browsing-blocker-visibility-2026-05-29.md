---
agent: adapter-agent
period: 2026-W23
generated_at: 2026-05-29T10:00:00Z
repo_revision: "25e35aadf069c34901309fcc9da30d84c070dc79"
inputs:
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - docs/reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md
  - docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md
  - packages/ai/src/tools/exportExampleApp.ts
  - packages/ai/src/tools/generationEvidence.ts
  - tests/ai/generation-scenarios.test.ts
  - tests/ai/prompt-evidence-scenarios.test.ts
  - tests/ai/mcp-integration.test.ts
owner: "@adapter-agent"
decision_level: advisory
---

# NLQ-006 Scene Browsing Blocker Visibility

## Summary

`TASK-2026W23-NLQ-006` keeps generated-app handoff honest about SceneView3D:
`extensions.scene3d` can appear as extension-only evidence, but stable
`view.mode: "scene3d"` runtime support remains blocked.

The compact `export_example_app` manifest evidence now carries a
`sceneBrowsing` summary with extension presence, source/layer counts,
source/layer ids, pickable-layer count, mock snapshot/query counts,
`stableViewMode: false`, `runtimeSupported: false`, and stable-runtime blocker
codes. This makes the generated-app manifest preserve compact
`extensions.scene3d` context without copying camera payloads, resource payloads,
renderer evidence, or stable runtime claims.

## Evidence

- Evidence: `ExampleAppGenerationEvidenceSummarySchema` now includes
  `sceneBrowsing` with extension presence, compact source/layer identifiers,
  mock evidence counts, and `stableRuntimeBlockerCodes`.
- Impact: AI operability; a generated app manifest can no longer show
  snapshot/export evidence while hiding the SceneView3D stable-runtime blocker.
- Action: keep this field compact and metadata-only; do not include renderer
  visual evidence or file contents in `export_example_app`.
- Confidence: high.

- Evidence: `createGenerationEvidenceBundle()` builds `sceneBrowsing` from the
  existing context summary and structured diagnostics.
- Impact: architecture; scene browsing visibility reuses the documented MCP
  tool chain and does not add a tool alias or side-effecting export behavior.
- Action: continue composing
  `get_context_summary -> validate_spec -> apply_commands -> snapshot_spec ->
  export_spec -> export_example_app`.
- Confidence: high.

- Evidence: scene browsing tests assert extension-only generated apps carry
  blocker codes while `stableViewMode` and `runtimeSupported` stay false.
- Impact: release safety; prompt-level generation cannot smuggle stable 3D
  runtime support through the generated-app manifest.
- Action: keep `snapshot.renderer: "scene3d"` rejected by the generation
  evidence input schema until a future stable-runtime Go decision exists.
- Confidence: high.

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @gis-engine/ai build` | pass | AI package TypeScript build accepts the manifest schema/type change |
| `pnpm exec vitest run tests/ai/generation-scenarios.test.ts tests/ai/prompt-evidence-scenarios.test.ts tests/ai/generation-evidence.test.ts tests/ai/mcp-integration.test.ts` | pass | targeted AI evidence and MCP manifest tests pass |
| `pnpm build:schema` | pass | required before accepting public schema/tool contract changes |
| `pnpm test:ai` | pass | generated-app evidence bundle and MCP tests pass |
| `pnpm test:adapter` | pass | adapter/package boundary checks stay green |
| `pnpm test:release:scene3d` | pass | SceneView3D release gate still reports extension-only runtime |
| `pnpm check` | pass | full deterministic gate passes |
| `git diff --check` | pass | no whitespace errors |

## Next Handoff

`TASK-2026W23-NLQ-007` can serialize the quality-hardening planning closure once
the coordinator accepts this owner evidence. Stable SceneView3D runtime remains
blocked under the SRC-006 No-go decision.
