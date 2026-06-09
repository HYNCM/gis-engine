---
agent: product-strategist
period: 2026-W23
generated_at: 2026-06-01T14:45:00Z
repo_revision: "a70a690868dc4487a8a285647d2b689d186300ed"
inputs:
  - docs/archive/2026-06-10/feature-specs/ai-map-workbench-product-boundary.md
  - docs/archive/2026-06-10/reviews/amw-005-provider-profiles-2026-05-31.md
  - examples/ai-map-workbench/provider-profiles.mjs
  - examples/ai-map-workbench/openai-compatible-provider.mjs
  - examples/ai-map-workbench/server.mjs
  - tests/examples/ai-map-workbench.test.ts
owner: "@ai-agent @engine-agent @docs-agent"
decision_level: advisory
---

# AI Map Workbench Provider Administration

## Purpose

Define the provider credential and resource administration boundary required by
`TASK-2026W23-AMW-007`. This is a design contract for future implementation,
not a product-hosting approval. The current workbench remains under
`examples/ai-map-workbench`.

## Current Accepted State

- Provider profiles are server-owned and environment-driven.
- Browser-visible provider metadata is limited to id, label, protocol, model,
  enabled, and missing-credential state.
- Browser requests send only `message` and `providerId`.
- Credentials, base URLs, credential environment variable names, raw provider
  request bodies, and raw provider response bodies stay server-only.
- Provider output is normalized through `normalizeWorkbenchProviderPlan` and
  map mutation still goes through `applyCommands`.
- Unsafe output uses structured diagnostics and does not mutate the active spec.

## Provider Profile Lifecycle

| State | Meaning | Browser Metadata | Required Diagnostic If Selected |
| --- | --- | --- | --- |
| `ready` | Profile has a supported protocol, safe identity fields, configured resource target, model, and credential. | `enabled: true`, `missingCredential: false` | none |
| `missing-credential` | Profile shape is valid but credential lookup returns no non-empty key. | `enabled: false`, `missingCredential: true` | `CAPABILITY.UNSUPPORTED` at `/providerProfile` |
| `missing-resource` | Custom profile is missing base URL or model. | `enabled: false`, `missingCredential: false` | `CAPABILITY.UNSUPPORTED` at `/providerProfile` |
| `unsupported-protocol` | Profile protocol is not `mock` or `openai-chat-completions`. | `enabled: false` | `CAPABILITY.UNSUPPORTED` at `/providerProfile` |
| `blocked-resource` | Base URL violates the provider resource policy. | `enabled: false` | `CAPABILITY.UNSUPPORTED` at `/providerProfile/baseUrl` |
| `runtime-failure` | Request times out, fails, or returns invalid provider content. | evidence only; no raw body | `CAPABILITY.UNSUPPORTED` at `/providerRequest` or `/providerResponse` |

Future implementation should distinguish these states internally even when the
browser receives only the compact public metadata shape.

## Resource Policy

Allowed in the next implementation slice:

- `mock` provider with no external network call.
- `openai-chat-completions` protocol for server-side POST requests to an
  explicitly configured HTTPS base URL.
- DeepSeek default base URL only as the built-in profile default.
- Custom provider base URLs only from server configuration.

Blocked until separate security/resource review:

- Browser-configured provider URLs.
- Arbitrary HTTP request templates.
- Non-HTTPS provider base URLs except local test fixtures.
- Private network, localhost, link-local, or file/data/blob URLs for custom
  providers in product mode.
- Provider-controlled tool calls, file uploads, streaming side channels,
  workers, webhooks, or callback URLs.

Required future checks:

- Validate provider base URL scheme and host before enabling a profile.
- Record a stable diagnostic path for blocked URLs:
  `/providerProfile/baseUrl`.
- Apply deterministic timeout/abort behavior to provider requests.
- Do not retry automatically until rate-limit and duplicate-mutation behavior
  are explicitly designed.
- Cap provider response bytes before JSON parsing.

## Browser-Safe Metadata Rules

Public profile fields are public product copy. They must be bounded and safe:

- `id`: short machine token, `[A-Za-z0-9][A-Za-z0-9._-]{0,63}`.
- `label`: human label, bounded length, no credentials or URLs.
- `protocol`: known enum, currently `mock` or `openai-chat-completions`.
- `model`: display string only; bounded length, no URL or credential material.
- `enabled`: boolean derived by server policy.
- `missingCredential`: boolean only; no credential environment variable name.

Never expose:

- API keys or credential environment variable names.
- Base URLs.
- Request headers.
- Raw prompt text.
- Raw provider request or response bodies.
- Provider error body, stack trace, account id, organization id, or quota body.

## Provider Request And Response Limits

Future implementation should add these constants before product promotion:

| Limit | Default Target | Diagnostic |
| --- | ---: | --- |
| Request timeout | 20 seconds | `/providerRequest/timeout` |
| Response byte cap | 64 KiB | `/providerResponse/size` |
| Confidence reasons | 3 reasons, 160 chars each | omit unsafe reasons |
| Audit records | current bounded count until durable audit is designed | no raw payload |

The current stale-output revision guard remains required, but it is not a
substitute for request cancellation or timeout handling.

## Diagnostic Path Rules

- `/providerProfile`: missing profile, missing credential, missing model, or
  unsupported protocol.
- `/providerProfile/baseUrl`: blocked provider base URL.
- `/providerRequest`: HTTP failure, network failure, timeout, or abort.
- `/providerResponse`: invalid JSON, missing message content, unsafe provider
  response content, missing structured intent, or oversized response.
- `/providerOutput`: normalized provider output fails the GIS Engine planner
  boundary or includes raw prompt, JavaScript, direct commands, `MapSpec`, or
  patches.
- `/providerRevision`: provider output is stale because the active map revision
  changed.

## Non-Goals

- No hosted provider administration UI yet.
- No credential storage, rotation, or secret manager integration.
- No durable audit database.
- No arbitrary provider request templates.
- No browser-visible base URL or credential configuration.
- No new MCP tool names.
- No direct provider commands or browser-side `MapSpec` mutation.
