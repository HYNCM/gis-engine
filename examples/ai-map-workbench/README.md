# AI Map Workbench

`examples/ai-map-workbench` is a local visual example for GIS Engine. It pairs a
mock AI chat sidebar with a real MapLibre map display and keeps all map
mutation behind GIS Engine commands. Mock mode remains the default, but the
server can also accept an injected provider fixture for provider-gated review
tests. When server environment variables are configured, the same boundary can
call DeepSeek or another OpenAI-compatible chat completions endpoint from the
Node server.

## Run

From the repository root:

```bash
pnpm example:ai-map-workbench
```

Open the printed localhost URL.

Click a point on the map to run a real `queryFeatures` request against the
current inline GeoJSON data. Query results appear in the Feature query panel.

## Supported Mock Prompts

- `make points red`
- `make points blue`
- `increase point size`
- `decrease point size`
- `zoom to Hangzhou`
- `reset`

## Injected Provider Mode

Tests and local harnesses can call `createWorkbenchServer({ plannerProvider })`
from `server.mjs`. The provider must return structured output with
`promptHash` and `intent`; the server normalizes it through
`normalizeWorkbenchProviderPlan`, builds a generation command skeleton, and
commits map changes only through `applyCommands`.

Unsafe provider output is blocked before mutation. Raw prompts, free-form
JavaScript, direct commands, raw `MapSpec`, and patch payloads return
`CAPABILITY.UNSUPPORTED` diagnostics at `/providerOutput`.

## Server Provider Profiles

The workbench exposes safe provider metadata at `/api/providers`. The browser
selects a `providerId` only; credentials, base URLs, and provider request
details stay on the server.

DeepSeek profile:

```bash
DEEPSEEK_API_KEY=...
# optional
GIS_WORKBENCH_DEEPSEEK_BASE_URL=https://api.deepseek.com
GIS_WORKBENCH_DEEPSEEK_MODEL=deepseek-v4-flash
```

Custom OpenAI-compatible profile:

```bash
GIS_WORKBENCH_CUSTOM_PROVIDER_ID=my-provider
GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL="My Provider"
GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL=https://provider.example/v1
GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL=my-model
GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV=MY_PROVIDER_API_KEY
MY_PROVIDER_API_KEY=...
```

If `GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV` is omitted, the server reads
`GIS_WORKBENCH_CUSTOM_API_KEY`. Providers are enabled only when required values
and a non-empty API key are present. Provider output must be JSON with
structured `intent` and optional bounded `confidence`; it is still normalized
through `normalizeWorkbenchProviderPlan` and committed only through
`applyCommands`.
Evidence-facing provider ids and trace ids are accepted only as short
machine-readable tokens. Unsafe values are replaced or omitted before responses
or audit records are written, and prompt hashes must use the `sha256:*` evidence
shape.

## Provider Administration Guardrails

Provider profiles are local/server configuration, not browser configuration.
The browser-visible profile list is limited to provider id, label, protocol,
model, enabled state, and missing-credential state. API keys, credential
environment variable names, base URLs, request headers, raw prompts, raw
provider request bodies, and raw provider response bodies must stay server-only.

Only mock mode and OpenAI-compatible chat completions are in scope for this
example. Product or hosted use still needs the AMW provider-administration
follow-up: base URL scheme/host policy, timeout/abort behavior, response size
limits, durable audit rules, and product-owned credential/resource review.

## Evidence

The chat API returns compact review evidence:

- `provider`: provider id, raw-prompt retention state, and optional confidence.
- `generationEvidence`: prompt hash, planner provenance, delivery status, and
  command evidence from `createGenerationEvidenceBundle`.
- `commandEvidence`: committed/rolled-back state and changed-path counts from
  the server-side command transaction.
- `/api/audit`: the latest 50 payload-free session records with provider id,
  prompt hash when available, trace id, status, command count, diagnostic
  counts, and revision movement.

The audit endpoint intentionally does not store raw prompts, provider raw
outputs, map specs, feature payloads, screenshots, credentials, or browser
state.

## Boundaries

- Mock mode makes no external AI call. Configured server provider profiles may
  call DeepSeek or OpenAI-compatible chat completions from Node only.
- No provider credentials are stored or sent to browser-visible state.
- No provider response may directly return commands, JavaScript, raw `MapSpec`,
  or patch payloads.
- No browser-side `MapSpec` mutation is allowed.
- No new MCP tool names are introduced.
- No stable SceneView3D runtime or 3D renderer claim is made.
- No external basemap or network data source is required.
