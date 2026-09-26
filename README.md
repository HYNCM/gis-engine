# GIS Engine

GIS Engine v1.5.0 is a schema-first map runtime for deterministic, auditable map changes.

## Run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build:schema
pnpm check
```

Create a project:

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
```

## Core Concepts

- `MapSpec` is a generic core + extensions model. See [the schema](packages/engine/src/spec/schemas/map-spec.schema.ts) and [schema tests](tests/schema/schema-fixtures.test.ts).
- Mutations use `MapCommand` and `applyCommands`. See [command tests](tests/commands/apply-commands.test.ts).
- Diagnostics and snapshots are evidence contracts. See [diagnostic tests](tests/schema/schema-fixtures.test.ts) and [smoke snapshots](tests/snapshot/smoke).
- `examples/ai-map-workbench` is the Phase 1 reference implementation. The `validate -> apply -> snapshot -> export` path is the minimum closed loop, not the only workflow.

Generated-app scene browsing is an extension-only delivery signal. The stable `view.mode: "scene3d"` remains blocked until its promotion gate accepts renderer evidence.

## Project Surfaces

- `packages/engine`: MapSpec, validated commands, diagnostics and renderer contracts.
- `packages/ai` and `packages/cli`: agent access and buildable project delivery.
- `apps/studio`: local review UI; `examples/ai-map-workbench`: contract reference.
- `packages/scene3d*`: isolated experimental extensions, subject to promotion gates.

Start with one map-change-to-export path. See [current scope](docs/planning/next-step-plan.md)
for delivery priorities and optional maintenance tooling. Routine work uses PR CI;
periodic report generation is not required.

## Docs

- [Documentation map](docs/README.md)
- [Generated API reference](docs/website/api/reference)
- [Release notes](docs/website/release-notes.md)
- [Examples](examples)

Apache-2.0
