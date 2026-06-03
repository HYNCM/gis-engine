# AI Map Workbench

> **Example / reference app.** This is a local visual example for reviewing
> GIS Engine's command-only mutation, diagnostics, and evidence surfaces. It is
> not a hosted product, SaaS, or GA application.

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
example. The server now enforces the provider-administration resource guardrails
inside the local example boundary:

- Provider base URLs must be absolute HTTPS URLs in product mode.
- Product-mode custom providers block localhost, private-network, link-local,
  file, data, blob, and other non-HTTPS targets.
- Local HTTP provider fixtures are allowed only when the server is created with
  `providerProductMode: false` for tests.
- Provider requests use deterministic timeout/abort behavior.
- Provider response bodies are byte-capped before JSON parsing.
- Blocked provider resources return `CAPABILITY.UNSUPPORTED` at
  `/providerProfile/baseUrl` without making a provider fetch.

Optional server limits:

```bash
GIS_WORKBENCH_PROVIDER_TIMEOUT_MS=20000
GIS_WORKBENCH_PROVIDER_RESPONSE_BYTE_CAP=65536
```

These guardrails do not approve product or hosted use. Product deployment still
requires product ownership, authorization, durable audit, review-action runtime,
repeatable UI evidence, and a later quality gate.

## Durable Audit Guardrails

`/api/audit` remains a local, in-memory, latest-50 session evidence endpoint.
AMW-008 defines future durable audit retention/export behavior, but this example
does not implement a database, export endpoint, auth system, browser file write,
or persistent review workflow.

`audit-contract.mjs` now contains pure contract helpers for the future durable
audit boundary. They validate compact record/export/deletion shapes, role and
project-scope authorization, payload caps, export caps, and payload-free
deletion receipts. These helpers do not add storage or public endpoints.

Future product-mode audit storage must keep records compact, retention-bound,
access-controlled, export-capped, deletion-aware, project-scoped, and free of
raw prompts, provider raw bodies, credentials, feature payloads, screenshots,
browser state, command bodies, patches, and full map specs.

## Review Action Guardrails

The workbench exposes local accept, block, and follow-up-required review
actions. They append in-memory review decision evidence through
`/api/review-decision` and can be listed through `/api/review-decisions`.
Browser clients send only an outcome, reason codes, and optional follow-up task
ids; the server derives ids, timestamps, session/project context, and evidence
references from compact audit records. Review decision creation is
project-scoped to reviewer/admin principals; service-only audit append authority
does not authorize reviewer outcomes.

Future review decisions must reference compact audit, provider, delivery,
command, and diagnostic evidence only. They must not directly mutate `MapSpec`,
write browser files, retain raw provider payloads, store command bodies or
patches, create hidden task state, or add new MCP tool names. This local review
decision path is not durable storage and does not approve product or hosted use.

## Evidence

The chat API returns compact review evidence:

- `provider`: provider id, raw-prompt retention state, and optional confidence.
- `generationEvidence`: prompt hash, planner provenance, delivery status, and
  command evidence from `createGenerationEvidenceBundle`.
- `commandEvidence`: committed/rolled-back state and changed-path counts from
  the server-side command transaction.
- `/api/audit`: the latest 50 payload-free session records with provider id,
  prompt hash when available, trace id, status, command count, diagnostic
  counts, and revision movement. Durable storage/export endpoints are still
  absent; the durable audit contract is exercised by focused tests only.
- `/api/review-decisions`: the latest in-memory review decisions with compact
  outcome, reason, audit, provider, command, and diagnostic references.

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
