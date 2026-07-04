# Spec: Phase 1 AI Map Authoring

Status: Reviewed for implementation
Source intent: [Project Definition](../intent/project-definition.md)
Generated: 2026-06-14

## Objective

Phase 1 makes GIS Engine a WebGIS development engine for AI Agent
collaboration. A developer should be able to describe a 2D WebGIS task in
natural language, have an AI Agent generate or modify a `MapSpec`, and then
verify the result through structured, replayable evidence.

The primary user is a developer building WebGIS or digital-twin scenes. The
AI Agent is a productivity layer, not a source of trust. Trust comes from the
engine contracts: schema validation, command-only mutation, structured
diagnostics, snapshot evidence, MCP input/output schemas, and CI gates.

Phase 1 is not a renderer replacement or a low-code product. It proves the
auditable authoring loop for a generic `MapSpec` core while keeping stable 2D
behavior first and 3D / digital-twin capabilities behind adapter and
extension boundaries.

## Phase 1 Decisions

- Canonical Phase 1 reference implementation: `examples/ai-map-workbench`.
- Minimal MCP entrypoint sample: `examples/mcp-server-setup`.
- Downstream consumer handoff reference: `examples/consumer-handoff-minimal`.
- Minimum closed loop: natural-language task -> structured intent and prompt
  hash -> generation command skeleton -> `validate_spec` -> `apply_commands`
  -> `snapshot_spec` -> `export_spec` -> `export_example_app` -> developer or
  CI review. Consumers may use any subset that still forms a valid evidence
  loop.
- Minimum authoring proof set: style edit, viewport change, source/layer
  addition, and unsupported-request diagnostics without mutation.
- Visual snapshot stance: smoke snapshots are required for Phase 1 proof.
  Visual snapshots are required for rendering changes and release-capable
  claims. Docs-only, schema-only, planning-only, and MCP-only changes may use a
  non-rendering waiver when they do not touch adapters, styles, snapshot
  fixtures, resources, browser examples, or rendering behavior.

## Tech Stack

- Language: TypeScript.
- Package manager: `pnpm@11.9.0`.
- Runtime: Node.js `>=20.0.0`.
- Validation: TypeBox schemas compiled with Ajv.
- Test runner: Vitest for deterministic tests, Playwright for visual snapshots.
- Public AI surface: MCP tools from `@gis-engine/ai`.
- Stable 2D renderer boundary: MapLibre adapter through `RendererAdapter`
  contracts.
- Experimental 3D boundary: `extensions.scene3d`, `@gis-engine/scene3d`, and
  `@gis-engine/scene3d-three-adapter` evidence only.

## Commands

Use the current repository scripts:

```bash
pnpm build:schema
pnpm check
pnpm test:snapshot:smoke
pnpm test:snapshot:visual
GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual
pnpm test:release:scene3d
pnpm --filter @gis-engine/scene3d-three-adapter build
pnpm example:ai-map-workbench
pnpm gate:run
```

For changes that only touch docs, run the path-aware gate plan first:

```bash
pnpm gate:plan
```

## Project Structure

The Phase 1 ownership map is:

```txt
packages/engine/src/spec/        MapSpec, source/layer/resource schemas
packages/engine/src/commands/    MapCommand and applyCommands contracts
packages/engine/src/diagnostics/ Structured diagnostic codes and helpers
packages/engine/src/generation/  Natural-language generation evidence helpers
packages/engine/src/renderer/    RendererAdapter boundary and 2D adapters
packages/ai/src/                 MCP tools and AI-facing schemas
packages/scene3d/src/            Extension-only SceneView3D contracts
packages/scene3d-three-adapter/  Adapter-local 3D evidence spike
examples/ai-map-workbench/       AI-assisted authoring example
examples/mcp-server-setup/       MCP tool setup example
tests/schema/                    Schema and resource-policy fixtures
tests/commands/                  Command replay, dry-run, rollback, conflict tests
tests/ai/                        MCP tool and generation evidence tests
tests/snapshot/                  Smoke and visual snapshot tests
docs/spec/                       Public contracts and phase specs
docs/website/guide/              Human-facing user documentation
```

## Code Style

Public behavior must be schema-first and command-driven. A Phase 1 AI edit
should look like this at the tool boundary:

```ts
const validation = await callGisEngineTool({
  params: {
    name: "validate_spec",
    arguments: { spec },
  },
});

const result = await callGisEngineTool({
  params: {
    name: "apply_commands",
    arguments: {
      spec,
      commands: [
        {
          id: "cmd-set-city-color",
          version: "0.1",
          type: "setPaint",
          layerId: "cities",
          paint: { "circle-color": "#2563eb" },
          author: { type: "agent", id: "assistant" },
          reason: "Highlight city points for review",
          sourcePromptHash: "sha256:...",
        },
      ],
      options: { collectTrace: true },
    },
  },
});
```

Conventions:

- Public MCP tool names stay snake_case:
  `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`,
  `snapshot_spec`, `explain_spec`, and `export_example_app`.
- Public inputs and outputs must have TypeBox schemas and generated JSON
  Schema.
- AI mutations must produce `MapCommand[]`; direct `MapSpec` edits are not the
  trusted mutation path.
- Failures must include stable diagnostic codes, paths when available, and
  machine-readable evidence.
- Renderer-specific behavior must stay behind `RendererAdapter` or adapter-local
  evidence contracts.

## Testing Strategy

Phase 1 evidence is accepted only when each changed concern has a deterministic
test layer:

- Schema and fixtures: `pnpm build:schema`, `pnpm test:schema`, and
  `pnpm test:schema-sync`.
- Commands and auditability: `pnpm test:commands`, `pnpm test:patch`, and
  command replay fixtures when behavior changes.
- MCP tools and generation evidence: `pnpm test:ai`.
- Runtime and adapters: `pnpm test:runtime` and `pnpm test:adapter`.
- Examples: `pnpm test:examples` and the relevant example script.
- Resource policy: `pnpm test:resources` plus `tests/schema/resource-policy.test.ts`
  when URLs, tiles, workers, examples, or external assets change.
- Snapshots: `pnpm test:snapshot:smoke`; visual snapshots are required for
  rendering changes unless a valid non-rendering waiver is recorded.
- Full local confidence gate: `pnpm check`.

## Boundaries

Always:

- Treat `MapSpec` as the executable blueprint and the main product object.
  Keep the core minimal and move domain-specific behavior into extensions.
- Validate public inputs through TypeBox/Ajv schemas.
- Route runtime state changes through `MapCommand` and `applyCommands`.
- Preserve command dry-run, conflict, rollback, replay, trace, and diagnostic
  evidence when relevant.
- Expose MCP tools with both `inputSchema` and `outputSchema`.
- Keep `export_example_app` side-effect free unless a future contract changes
  that boundary.
  - Keep 3D and digital-twin work under extension or adapter-local evidence until
    promotion is approved.
  - Do not hard-code `validate -> apply -> snapshot -> export` as the only valid
    workflow; it is the minimum closed loop, not a universal sequence.

Ask first:

- Adding, removing, or renaming public MCP tools.
- Changing `MapSpec` top-level fields or public command names.
- Promoting `view.mode: "scene3d"` or any 3D runtime behavior to stable.
- Adding network, tile, worker, external asset, or resource-policy behavior.
- Introducing new runtime dependencies in `@gis-engine/engine`.
- Changing CI gate semantics or visual snapshot requirements.

Never:

- Trust AI output without validation and replay evidence.
- Mutate runtime map state through renderer-specific shortcuts.
- Return natural-language-only errors for public failure paths.
- Add camelCase MCP aliases or undocumented tool names.
- Pull MapLibre, Three.js, Cesium, or renderer-specific loaders into the core
  engine package.
- Claim competitor or standards information is current without checking it in
  the current run and recording sources and dates.

## Success Criteria

Phase 1 is complete when these conditions are true:

1. A developer can use an AI Agent to create or modify a valid 2D `MapSpec`
   from a natural-language task.
2. The accepted mutation path emits `MapCommand[]` and succeeds through
   `apply_commands` / `applyCommands` with traceable replay evidence.
3. `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`,
   `snapshot_spec`, `explain_spec`, and `export_example_app` all expose stable
   input and output schemas.
4. A generated or exported Web example can be run by a developer and can reload
   the same `MapSpec`.
5. CI can block bad changes through schema sync, command replay, structured
   diagnostics, resource policy checks, and key snapshot gates.
6. 3D and digital-twin capabilities are visible only as extension/adapter
   evidence, with stable runtime blockers still explicit.
7. Human-facing docs explain the Phase 1 authoring loop without implying that
   GIS Engine replaces MapLibre/Cesium or ships a complete low-code editor.

## Open Questions

No unresolved product questions block Task 2. Future implementation tasks may
add narrower questions when they inspect the workbench evidence path, MCP setup
guide, or browser visual proof in detail.
