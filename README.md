# GIS Engine Workbench

GIS Engine Workbench is the local-first, open-source AI development workspace
for WebGIS engineers. It turns data and a natural-language requirement into a
reviewed, validated MapLibre 2D project that can enter Git. The current
Workbench release line is an independent `0.x` local preview.

`@gis-engine/engine`, `@gis-engine/ai`, `@gis-engine/cli`, and the canonical
14-tool MCP server are the shared foundation, not parallel product narratives.
The current foundation package release is `v1.5.0`; that semver does not imply
Workbench product maturity.

## Run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build:schema
pnpm workbench:build
pnpm exec gis-engine-workbench ./my-map
```

Open `http://127.0.0.1:4321`, then create or reopen the project, inspect data,
review the structured plan, explicitly apply it, and confirm the export.

The existing scaffold command remains supported:

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
```

## Product Boundaries

- Workbench project files (`gis-engine.project.json`, `mapspec.json`, data, and
  revision/export evidence) are authoritative. SQLite is compatibility or
  index state only.
- AI credentials stay on the local server. Plans retain a prompt hash, never
  the raw prompt or raw provider response.
- Workbench v1 is MapLibre 2D only. Stable 3D remains behind an independent
  promotion gate.
- Hosted previews, cloud collaboration, and enterprise governance are not part
  of the local v1 claim.
- Engine semver does not promote Workbench maturity. In particular, PR #47 is
  an engine-family GeoParquet metadata-contract release only.

## Foundation Contracts

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
- [Workbench v1 specification](docs/planning/feature-specs/gis-engine-workbench-v1.md)
- [Workbench install and migration](docs/migration/workbench-0.1.md)

Apache-2.0
