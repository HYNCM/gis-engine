# @gis-engine/cli

Version v1.5.0 scaffolds map projects and runs the same validated generation pipeline used by repository acceptance tests.

## Run

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./my-map/map.json --json
npm exec --package @gis-engine/cli@latest -- create-gis-map --verify-artifacts ./my-map --json
```

Mock generation is deterministic and needs no API key. Provider-backed generation must preserve the same schema, diagnostics, and evidence contracts. Use `--dry-run` when output must not be written.

## Signposts

- [CLI entry](src/bin.ts)
- [Scaffold tests](../../tests/cli/scaffold.test.ts)
- [Generation tests](../../tests/cli/generate.test.ts)
- [Generated API reference](../../docs/website/api/reference/cli)
- [First-run acceptance](../../scripts/first-run-acceptance.mjs)
