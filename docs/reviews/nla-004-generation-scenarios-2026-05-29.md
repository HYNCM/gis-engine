---
agent: qa-agent
period: 2026-W23
generated_at: 2026-05-29T07:05:30Z
repo_revision: "957094d07fa61a77c8630f9f58b0db57cd1a3d49"
inputs:
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - tests/ai/generation-scenarios.test.ts
owner: "@qa-agent"
decision_level: advisory
---

# NLA-004 Minimum Generation Scenarios

## Summary

`TASK-2026W23-NLA-004` now has executable minimum scenarios for the first two
natural-language generation domains:

- `feature-display`: source, layer, style, command replay, dry-run, rollback,
  snapshot, export, and example evidence.
- `spatial-analysis`: point/bbox query readiness through capability metadata,
  plus structured diagnostics for blocked geoprocessing claims.
- blocked analysis operations: buffer, overlay, routing, aggregation, and
  similar non-public geoprocessing requests are represented as
  `CAPABILITY.UNSUPPORTED` diagnostics before evidence is accepted.

These tests use the `NLA-002` command skeleton and the `NLA-003` evidence
bundle. They do not add MCP tools and do not promote stable SceneView3D.

## Scenario Evidence

- Evidence: `tests/ai/generation-scenarios.test.ts` builds a feature-display
  skeleton with GeoJSON source, fill/line layers, paint styles, and generated
  `styleEdits`.
- Impact: product and AI safety; generated visual app content is replayable and
  rollback-verifiable.
- Action: keep future prompt examples grounded in this command-first pattern.
- Confidence: high.

- Evidence: generated `styleEdits` become `setPaint` and `setLayout` commands,
  and the feature-display scenario replays commands with `applyCommands`, runs
  a dry-run, rolls back inverse patches, and validates the
  `GenerationEvidenceBundle` snapshot/export summaries.
- Impact: architecture; command-only mutation and evidence-first export are
  tested together instead of as isolated helpers.
- Action: use this as the minimum acceptance shape for richer generated display
  scenarios.
- Confidence: high.

- Evidence: the spatial-analysis scenario supplies `queries: ["point", "bbox"]`
  capability metadata and asserts that unsupported buffer/routing style
  geoprocessing remains in the blocked domain text and warning diagnostics.
- Impact: product; AI can plan query readiness without over-claiming public
  geoprocessing tools.
- Action: future `NLA-006` prompt evidence can reuse the same readiness
  boundary.
- Confidence: high.

- Evidence: `tests/commands/map-generation-contract.test.ts` verifies blocked
  `analysis.operations` such as `buffer` and `routing` return structured
  `CAPABILITY.UNSUPPORTED` errors at `/analysis/operations/*`.
- Impact: AI safety; unsupported analysis requests cannot silently pass as a
  generated app.
- Action: keep future geoprocessing work behind explicit command/schema
  contracts.
- Confidence: high.

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test:commands -- tests/commands/map-generation-contract.test.ts` | pass | command suite includes 6 generation contract tests; 40 command tests total |
| `pnpm test:ai -- tests/ai/generation-scenarios.test.ts` | pass | AI suite includes 3 generation scenario tests; 27 AI tests total |
| `pnpm --filter @gis-engine/ai build` | pass | TypeScript AI package build |
| `pnpm --filter @gis-engine/engine build` | pass | TypeScript engine package build |
| `pnpm build:schema` | pass | generation request schema includes style edits and analysis operations |
| `pnpm test:schema-sync` | pass | public schemas remain Ajv-compilable |

## Next Handoff

`TASK-2026W23-NLA-005` should keep scene browsing under `extensions.scene3d`
only. `TASK-2026W23-NLA-006` can then compose feature display, spatial-analysis
readiness, and scene browsing boundary evidence into prompt-level scenarios.
