---
agent: ai-agent
period: 2026-05-27
generated_at: 2026-05-26T17:05:00Z
repo_revision: "661d6dc"
inputs:
  - packages/ai/src/tools/contextSummary.ts
  - packages/ai/src/mcp/server.ts
  - packages/ai/README.md
  - docs/spec/contracts-and-interfaces.md
  - tests/ai/mcp-integration.test.ts
  - tests/schema-sync/schema-sync.test.ts
  - command: pnpm test:ai
  - command: pnpm test:schema-sync
  - command: pnpm --filter @gis-engine/ai build
owner: "@ai-agent"
decision_level: advisory
---

# AI Orchestration Capability Summary

## Scope

This ai-agent slice supports the product goal: a user describes a map
application in natural language, and the AI can plan against GIS Engine's
current capabilities for geographic feature display, spatial analysis, and
scene browsing.

This slice does not add new MCP tool names, does not introduce a natural
language runtime, and does not promote stable `view.mode: "scene3d"`.

## Findings

### Feature Display Is Discoverable As A Supported Track

- Evidence: `get_context_summary` and `explain_spec` now return
  `capabilitySummary.domains[]` with `feature-display`, its status, supported
  evidence, and the existing toolchain: `validate_spec`, `apply_commands`,
  `export_spec`, `snapshot_spec`, and `export_example_app`.
- Impact: AI planners can choose command-only edits and snapshot/export gates
  for normal map rendering instead of guessing from raw layers.
- Action: keep new display features represented through schema, commands,
  diagnostics, and `capabilitySummary` before exposing them to natural-language
  flows.
- Confidence: high.

### Spatial Analysis Is Explicitly Experimental

- Evidence: `capabilitySummary` reports `spatial-analysis` from capability
  metadata and runtime point/bbox query contracts, while explicitly blocking
  buffer, intersection, overlay, routing, and aggregation as public MCP tools.
- Impact: natural-language prompts such as "analyze nearby features" can be
  routed to documented query readiness or refused with a stable boundary, not
  silently treated as full geoprocessing support.
- Action: add a dedicated public analysis tool only after schema, diagnostics,
  command/read-only semantics, and tests are designed.
- Confidence: high.

### Scene Browsing Remains Extension-Only

- Evidence: `capabilitySummary` reports `scene-browsing` as experimental when
  `extensions.scene3d` is present and valid, and blocked when stable
  `view.mode: "scene3d"` is requested.
- Impact: AI can plan 3D scene evidence without claiming stable runtime
  browsing.
- Action: keep stable runtime promotion under `TASK-2026W23-SRC-006`.
- Confidence: high.

## Verification

| Command | Result |
| --- | --- |
| `pnpm test:ai` | pass |
| `pnpm test:schema-sync` | pass |
| `pnpm --filter @gis-engine/ai build` | pass |
