---
agent: qa-agent
period: 2026-W23
generated_at: 2026-05-29T07:25:51Z
repo_revision: "06ae9e20dda0159954abd40b8870145104537555"
inputs:
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - docs/reviews/nla-004-generation-scenarios-2026-05-29.md
  - docs/reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md
  - tests/ai/prompt-evidence-scenarios.test.ts
owner: "@qa-agent"
decision_level: advisory
---

# NLA-006 Prompt Evidence Scenarios

## Summary

`TASK-2026W23-NLA-006` adds a QA-level prompt evidence matrix that exercises
the full natural-language app generation spine:

```txt
prompt -> MapGenerationCommandSkeleton -> apply_commands -> snapshot_spec -> export_spec -> export_example_app
```

The scenarios do not add an MCP tool alias. They continue to compose the
existing seven documented tool names and keep scene browsing extension-only.

## Evidence

- Evidence: `tests/ai/prompt-evidence-scenarios.test.ts` covers a
  feature-display prompt with source, layer, style edit, MapLibre snapshot,
  export evidence, and side-effect-free example evidence.
- Impact: user and AI operability; prompt-level display output is backed by
  command replay, render smoke evidence, and export readiness.
- Action: docs can describe feature-display generation as ready when the
  evidence bundle is `status=ready`.
- Confidence: high.

- Evidence: the spatial-analysis readiness prompt declares point and bbox query
  support through capabilities and still lists buffer/routing geoprocessing as
  blocked.
- Impact: AI safety; generated apps can plan query-ready maps without claiming
  unsupported geoprocessing.
- Action: keep future spatial-analysis prompts readiness-first until dedicated
  query/geoprocessing MCP contracts exist.
- Confidence: high.

- Evidence: the scene-browsing prompt produces `extensions.scene3d` context
  with mock snapshot/query summaries while `stableViewMode=false` and
  `runtimeSupported=false`.
- Impact: architecture; scene browsing evidence remains adapter-local and does
  not promote stable SceneView3D runtime fields.
- Action: continue routing scene browsing through extension evidence until a
  future SceneView3D Go decision changes the contract.
- Confidence: high.

- Evidence: a stable `view.mode: "scene3d"` prompt returns blocked evidence,
  skips snapshot/export readiness, and emits `SCENE3D.STABLE_RUNTIME_*`
  blocker diagnostics.
- Impact: release safety; prompt-level generation cannot smuggle stable 3D
  runtime output through the QA evidence path.
- Action: keep blocker diagnostics visible in prompt evidence and do not add a
  `generate_map_app` or renderer-specific shortcut.
- Confidence: high.

- Evidence: every scenario asserts the tool sequence remains
  `get_context_summary`, `validate_spec`, `apply_commands`, `snapshot_spec`,
  `export_spec`, and `export_example_app`.
- Impact: MCP contract stability; the generation flow remains auditable through
  existing snake_case tools.
- Action: future planner work should reuse this evidence matrix when it adds a
  real prompt parser.
- Confidence: high.

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm exec vitest run tests/ai/prompt-evidence-scenarios.test.ts` | pass | 4 prompt evidence scenarios passed |
| `pnpm test:ai` | pass | 5 AI test files and 33 AI tests passed |
| `pnpm check` | pass | full deterministic gate passed, including smoke snapshots |
| `git diff --check` | pass | no whitespace errors |

## Next Handoff

`TASK-2026W23-NLA-007` can align docs, examples, and release wording with the
now-tested evidence matrix. Stable SceneView3D runtime support remains blocked.
