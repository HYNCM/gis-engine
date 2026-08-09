# GIS Engine Workbench

Workbench is the local-first product surface for the GIS Engine command and
evidence contracts. The `0.x` application does not claim hosted or 3D product
readiness.

## Run

```bash
pnpm workbench:server
pnpm workbench:dev
```

Set `WORKBENCH_DB_PATH` when review state must live outside the default local
SQLite path. `STUDIO_DB_PATH` remains a compatibility fallback. Provider
credentials are optional; deterministic mock flows remain the verification
baseline.

## Signposts

- [Server](server/index.mjs)
- [Frontend](src)
- [Workbench tests](../../tests/workbench)
- [Reference workbench](../../examples/ai-map-workbench)
