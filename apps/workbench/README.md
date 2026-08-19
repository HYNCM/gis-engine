# GIS Engine Workbench

Workbench is the local-first product surface for the GIS Engine command and
evidence contracts. The `0.x` application does not claim hosted or 3D product
readiness.

## Run

```bash
pnpm workbench:build
pnpm exec gis-engine-workbench [project-directory]
```

The default address is `http://127.0.0.1:4321`. `project-directory` is the
selected root for `gis-engine.project.json`, `mapspec.json`, data, revisions,
and confirmed exports.

The Mock provider is always available. Configure the server-held
OpenAI-compatible profile with `DEEPSEEK_API_KEY` and optional
`DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL`; credentials and base URLs are never
returned to the browser or written into the project. Workbench always produces
a structured plan that must be previewed before apply.

Legacy SQLite remains read-only migration input:

```bash
pnpm workbench:migrate:export -- ~/.gis-engine/workbench/workbench.sqlite ./legacy-workbench-export.json
```

The command never mutates or deletes the source database and refuses to
overwrite the selected JSON export.

## Signposts

- [Server](server/index.mjs)
- [Frontend](src)
- [Workbench tests](../../tests/workbench)
- [Reference workbench](../../examples/ai-map-workbench)
