# Provider Configuration

Provider profiles control how the CLI generate pipeline executes
`planMapGenerationRequest` and command skeleton building.

## Priority

Flags > env vars > `~/.gis-engine/config.json` > defaults.

```bash
# Flag
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate --provider deepseek
# Env var
GIS_ENGINE_PROVIDER=deepseek npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate
# Config file (~/.gis-engine/config.json)
{ "provider": "deepseek", "template": "vite-ts" }
```

## Mock Provider (Default)

Deterministic, no API key, no external calls. Default for all modes.

Diagnostics: `MOCK.PLANNER_ACTIVE`, `MOCK.DETERMINISTIC_OUTPUT`,
`MOCK.NO_EXTERNAL_CALLS`.

## OpenAI-Compatible Providers

Known IDs: `deepseek`, `openai`. Both use the OpenAI chat completions API.

| Env Var | Purpose |
|---|---|
| `GIS_ENGINE_API_KEY` | API key |
| `GIS_ENGINE_BASE_URL` | Completions endpoint URL |
| `GIS_ENGINE_MODEL` | Model override (optional) |

Unconfigured providers return: `PROVIDER.CONFIG_REQUIRED`,
`PROVIDER.BASE_URL_REQUIRED`, `PROVIDER.SERVER_ONLY`.

## Local Provider Smoke

Use the repository smoke before wiring real credentials into an adoption or
release check:

```bash
pnpm smoke:provider
```

The smoke starts a local `127.0.0.1` OpenAI-compatible test server and runs the
CLI generate path with `--provider openai`, `--base-url`, `--api-key`, and
`--timeout`. It covers:

- successful provider response to reviewable generated map;
- generated map `--preflight` and `--verify-artifacts`;
- malformed provider content;
- provider HTTP error;
- provider timeout;
- command-output and generated-file checks that the test API key and raw prompt
  are not retained.

This gate intentionally does not call a real provider and must not require CI
secrets.

## Diagnostics

Use `--dry-run` to inspect status without executing:

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -p deepseek --dry-run
```

Output shows provider ID, status (`ready` | `mock` | `unconfigured`), and mode
(`mock` | `openai-compatible`).

## Security

- Raw API keys are never written to generated files.
- Raw prompts are never retained in MapSpec or diagnostics.
- Provider config is resolved at invocation time and not persisted.
