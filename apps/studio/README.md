# AI Map Studio

Studio is a local review surface for the GIS Engine command and evidence contracts. It is not a hosted-product claim.

## Run

```bash
pnpm studio:server
pnpm studio:dev
```

Set `STUDIO_DB_PATH` when review state must live outside the default local SQLite path. Provider credentials are optional; deterministic mock flows remain the verification baseline.

## Signposts

- [Server](server/index.mjs)
- [Frontend](src)
- [Studio tests](../../tests/studio)
- [Reference workbench](../../examples/ai-map-workbench)
