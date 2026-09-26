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
- A generated package ships a recomputable `EvidenceRecord`. Verify it with `node evidence-verifier.mjs evidence.json --root . --json`. See [EvidenceRecord recompute](docs/engineering/evidence-record.md) and [its schema](packages/engine/src/evidence/schema.ts).
- `examples/ai-map-workbench` is the Phase 1 reference implementation. The `validate -> apply -> snapshot -> export` path is the minimum closed loop, not the only workflow.

Generated-app scene browsing is an extension-only delivery signal. The stable `view.mode: "scene3d"` remains blocked until its promotion gate accepts renderer evidence.

## Docs

- [Documentation map](docs/README.md)
- [Generated API reference](docs/website/api/reference)
- [Release notes](docs/website/release-notes.md)
- [Examples](examples)

Apache-2.0
