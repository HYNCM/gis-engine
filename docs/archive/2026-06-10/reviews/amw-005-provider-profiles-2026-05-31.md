---
agent: ai-agent
period: 2026-06-01
generated_at: 2026-06-01T08:53:09Z
repo_revision: "cfa0f50e4f716e430a36a01389f32668e0070600"
inputs:
  - docs/superpowers/specs/2026-05-31-workbench-provider-profiles-design.md
  - docs/superpowers/plans/2026-05-31-workbench-provider-profiles.md
  - examples/ai-map-workbench/provider-profiles.mjs
  - examples/ai-map-workbench/openai-compatible-provider.mjs
  - examples/ai-map-workbench/server.mjs
  - examples/ai-map-workbench/public/app.js
  - examples/ai-map-workbench/public/index.html
  - tests/examples/ai-map-workbench.test.ts
owner: "@ai-agent"
decision_level: advisory
---

# AMW-005 Provider Profiles Review

## Decision

Server-side provider profiles are acceptable for the local AI Map Workbench
review slice. The browser receives safe provider metadata and sends only a
`providerId`; the server owns credential lookup, OpenAI-compatible chat
completion calls, structured intent parsing, provider normalization, command
application, bounded evidence, and payload-free audit records.

This remains under `examples/ai-map-workbench`. It does not promote the
workbench into a hosted product, durable audit system, authenticated provider
console, arbitrary HTTP templating layer, or stable SceneView3D workflow.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Credential boundary | pass | `publicProviderProfiles()` projects only id, label, protocol, model, enabled, and missing-credential state; browser tests assert `/api/chat` sends only `message` plus `providerId`. | Provider API keys and base URLs stay out of browser-visible state, responses, and audit records. | Keep all credential lookup in `provider-profiles.mjs` and server wiring. | high |
| Command mutation boundary | pass | Selected provider output still flows through `normalizeWorkbenchProviderPlan`, `createMapGenerationCommandSkeleton`, and `applyCommands`. | DeepSeek or compatible providers cannot directly mutate `MapSpec`. | Keep forbidden raw command/spec/patch fields blocked at `/providerOutput`. | high |
| Provider output safety | pass | Adapter tests cover missing credentials, HTTP failures, invalid JSON, missing content, unsafe intent markers, bounded confidence reasons, and safe structured-intent references. | Raw prompt, API key, and raw provider details are not returned as provider evidence. | Reuse the sanitizer guard when adding more provider protocols. | high |
| DeepSeek defaults | pass | Official DeepSeek docs were checked on 2026-06-01; `https://api.deepseek.com` remains the OpenAI-format base URL, the chat API lists `deepseek-v4-flash` / `deepseek-v4-pro`, and `deepseek-chat` is documented as a compatibility alias that will be deprecated in the future. | New profiles avoid starting from a deprecated-track alias while staying OpenAI-compatible. | Keep `GIS_WORKBENCH_DEEPSEEK_MODEL` as the override for future model changes. | high |
| UI provider selector | pass | Browser-backed Vitest coverage loads `/api/providers`, verifies mock default, rejects disabled options, sends selected provider id, and keeps completed evidence tied to the last payload. | Reviewer-visible status describes the next request while evidence remains historical and payload-scoped. | Keep selector state separate from provider evidence rendering. | high |
| Product promotion | hold | AMW-004 promotion hold remains in force and the implementation stays under `examples/ai-map-workbench`. | Hosted usage still needs auth, retention, durable audit, provider admin UX, and resource/security review. | Do not market this as production provider hosting. | high |

## Verification

- `pnpm vitest run tests/examples/ai-map-workbench.test.ts -t "provider selector UI contract"` - red first on status copy, then passed, 2 matching tests.
- `pnpm vitest run tests/examples/ai-map-workbench.test.ts -t "default DeepSeek base URL"` - red first on the deprecated default model, then passed.
- `pnpm vitest run tests/ai/workbench-provider-plan.test.ts tests/examples/ai-map-workbench.test.ts` - passed, 2 files / 57 tests.
- `pnpm test:examples` - passed, 2 files / 65 tests.
- `pnpm test:docs` - passed, 1 file / 2 tests.
- `git diff --check` - passed.
- `pnpm check` - passed, including package builds and deterministic schema, command, adapter, AI, example, docs, resource, perf smoke, and snapshot smoke tests.

## Follow-Up

- Decide whether AMW provider profiles need product-owned auth, retention, and
  provider-administration UX before leaving `examples/`.
- Keep arbitrary provider request templates out of scope until resource-policy
  and abuse-path review exist.
