---
agent: ai-agent
period: 2026-W23
generated_at: 2026-06-01T16:55:00Z
repo_revision: "6ee7053c56bdd67e63f536db89c8e0eb110f7774"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-product-implementation.md
  - docs/planning/feature-specs/ai-map-workbench-provider-administration.md
  - docs/planning/sprint-2026-W23-ai-map-workbench-product-implementation.md
  - examples/ai-map-workbench/provider-profiles.mjs
  - examples/ai-map-workbench/openai-compatible-provider.mjs
  - examples/ai-map-workbench/server.mjs
  - examples/ai-map-workbench/README.md
  - tests/examples/ai-map-workbench.test.ts
owner: "@ai-agent @engine-agent @qa-agent"
decision_level: advisory
---

# AWP-002 Provider Resource Enforcement

## Decision

`TASK-2026W23-AWP-002` is implemented inside the current local/example boundary.
The workbench still stays under `examples/ai-map-workbench`; this change does
not move it to a product app, deploy a hosted service, add auth, add durable
storage, or add new MCP tool names.

The next queued task is `TASK-2026W23-AWP-003` product app ownership and project
model definition.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Base URL policy | implemented | `provider-profiles.mjs` validates absolute HTTPS URLs and blocks product-mode localhost, private-network, link-local, file, data, blob, and non-HTTPS targets. | Provider profiles cannot be enabled with unsafe resource targets. | Keep policy server-side; do not expose base URLs to browsers. | high |
| Block before fetch | implemented | `server.mjs` converts disabled provider resource state into `CAPABILITY.UNSUPPORTED` at `/providerProfile/baseUrl`; tests assert `fetchImpl` is not called. | Unsafe provider targets cannot trigger external IO. | Preserve blocked path and payload-free audit behavior. | high |
| Timeout and abort | implemented | `openai-compatible-provider.mjs` passes an `AbortSignal` and returns `/providerRequest/timeout` when the provider request or response body exceeds the timeout. | Slow provider calls fail deterministically without raw error leakage. | Tune timeout only through server configuration or explicit tests. | high |
| Response byte cap | implemented | Provider response text is read with a byte cap before JSON parsing; oversized content-length and chunked bodies return `/providerResponse/size`. | Large or hostile provider bodies cannot be parsed unbounded. | Keep the default cap at 64 KiB unless a new resource review changes it. | high |
| Browser-safe metadata | preserved | `/api/providers` still returns only id, label, protocol, model, enabled, and missing-credential fields. | Credentials, base URLs, request headers, raw prompts, and raw bodies stay server-only. | Keep UI provider selection to `providerId` only. | high |
| Command-only mutation | preserved | Blocked provider resource tests keep revision `1`, `commandCount: 0`, and payload-free audit records. | Provider denial cannot mutate the active `MapSpec`. | Keep future review actions append-only. | high |

## Boundaries Preserved

- No product app movement.
- No hosted deployment, auth system, secret manager, database, export endpoint,
  or product provider admin UI.
- No browser-visible provider base URL, credential variable, credential,
  request header, raw prompt, raw provider body, command body, patch,
  screenshot, feature payload, or full `MapSpec` retention.
- No direct provider commands or browser-side `MapSpec` mutation.
- No new MCP tool names.
- No MapLibre package movement.
- No stable SceneView3D runtime promotion.

## Verification

- `pnpm vitest run tests/examples/ai-map-workbench.test.ts` - passed, 66 tests.
- `pnpm test:examples` - passed, 2 files / 76 tests.
- `pnpm test:docs` - passed, 1 file / 2 tests.
- `pnpm check` - passed.
- `git diff --check` - passed.
