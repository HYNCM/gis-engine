---
agent: ai-agent
period: 2026-W23
generated_at: 2026-06-01T14:45:00Z
repo_revision: "a70a690868dc4487a8a285647d2b689d186300ed"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-provider-administration.md
  - docs/planning/sprint-2026-W23-ai-map-workbench-product-boundary.md
  - docs/reviews/amw-004-promotion-gate-2026-05-31.md
  - docs/reviews/amw-005-provider-profiles-2026-05-31.md
  - examples/ai-map-workbench/provider-profiles.mjs
  - examples/ai-map-workbench/openai-compatible-provider.mjs
  - examples/ai-map-workbench/server.mjs
  - tests/examples/ai-map-workbench.test.ts
owner: "@ai-agent @engine-agent @docs-agent"
decision_level: advisory
---

# AMW-007 Provider Resource Administration

## Decision

Provider credential and resource administration is accepted as a design
handoff. The current code already preserves server-only credentials,
browser-safe provider metadata, provider output normalization, command-only
mutation, and payload-free audit evidence. Product or hosted usage remains
blocked until a later implementation task adds explicit base URL policy,
timeout/abort behavior, response size caps, and any required tests.

This report satisfies `TASK-2026W23-AMW-007` as a design task and queued the
durable audit retention/export design follow-up. After
`docs/reviews/amw-008-durable-audit-retention-export-2026-06-01.md`, AMW-008 is
closed. After `docs/reviews/amw-009-command-safe-review-actions-2026-06-02.md`,
AMW-009 is also closed and `TASK-2026W23-AMW-010` is the current next queued
task.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Profile lifecycle | accepted | `examples/ai-map-workbench/provider-profiles.mjs` builds mock, DeepSeek, and custom profiles from server env, with enabled/missing-credential state. | Provider configuration remains server-owned. | Future implementation should distinguish missing-resource from missing-credential for custom profiles. | high |
| Browser-safe metadata | accepted | `publicProviderProfiles()` exposes only id, label, protocol, model, enabled, and missingCredential; tests assert chat payloads omit `apiKey`, `baseUrl`, and raw fields. | Browser UI can select a provider without receiving credentials or base URLs. | Add bounded identity-field validation before product promotion. | high |
| Allowed protocol | accepted with follow-up | Server accepts mock and `openai-chat-completions`; unsupported protocol returns `/providerProfile`. | Arbitrary provider protocols are blocked. | Add explicit base URL scheme/host policy and tests before hosted/product use. | high |
| Request lifecycle | follow-up required | Current provider calls do not define timeout, abort, retry, response byte cap, or concurrency policy. | Hung or oversized provider responses are not yet product-safe. | AMW implementation follow-up must add timeout and size diagnostics. | high |
| Leak hardening | accepted | Existing tests cover API key, raw prompt, raw provider body, unsafe intent keys, confidence reason filtering, stale output, and unknown provider id sanitization. | Current local system avoids obvious credential/body leaks. | Preserve leak filters and extend them for any new provider protocol. | high |
| Diagnostic paths | accepted | Current code uses `/providerProfile`, `/providerRequest`, `/providerResponse`, `/providerOutput`, and `/providerRevision`. | Reviewers and agents can reason about failure source without parsing prose. | Reserve `/providerProfile/baseUrl`, `/providerRequest/timeout`, and `/providerResponse/size` for future gates. | high |
| Resource policy alignment | accepted | `docs/planning/feature-specs/ai-map-workbench-provider-administration.md` records provider resource rules without changing runtime policy code. | Product planning gets explicit external-call boundaries while implementation remains unchanged. | Map any future URL/resource policy change to engine policy docs and tests. | high |

## Follow-Up Requirements

Before AI Map Workbench can leave `examples/` or become hosted, a future
implementation task must:

1. Validate custom provider base URL scheme and host.
2. Block localhost, private network, link-local, file/data/blob, and non-HTTPS
   URLs in product mode.
3. Add request timeout/abort diagnostics.
4. Cap provider response bytes before JSON parsing.
5. Bound and validate public provider id, label, and model fields.
6. Distinguish missing credential from missing base URL/model in provider
   state.
7. Add regression tests for blocked provider base URLs and oversized/timeout
   responses.

## Boundaries Preserved

- No code changes in this design slice.
- No hosted deployment or provider admin UI.
- No credential storage or secret manager integration.
- No arbitrary provider request templates.
- No browser-visible base URLs, credential env vars, or raw provider bodies.
- No raw prompt retention by default.
- No new MCP tool names.
- No direct provider commands or browser-side `MapSpec` mutation.

## Verification

Required for this design handoff:

- `pnpm test:examples`
- `pnpm test:docs`
- `pnpm check`
- `git diff --check`

AMW-008 subsequently closed as durable audit retention/export design and AMW-009
subsequently closed as command-safe review action design, so the current next
queued task is `TASK-2026W23-AMW-010`.
