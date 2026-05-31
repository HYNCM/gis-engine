# AI Map Workbench

`examples/ai-map-workbench` is a local visual example for GIS Engine. It pairs a
mock AI chat sidebar with a real MapLibre map display and keeps all map
mutation behind GIS Engine commands. Mock mode remains the default, but the
server can also accept an injected provider fixture for provider-gated review
tests.

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

- No real AI provider is called.
- No provider credentials are stored or sent to browser-visible state.
- No browser-side `MapSpec` mutation is allowed.
- No new MCP tool names are introduced.
- No stable SceneView3D runtime or 3D renderer claim is made.
- No external basemap or network data source is required.
