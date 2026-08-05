---
agent: builder
period: 2026-W32
generated_at: 2026-08-03T17:00:07Z
repo_revision: "ebd3034d9c8544b678cf7d9ca134a971f90f4c35"
inputs:
  - https://modelcontextprotocol.io/specification/2026-07-28/changelog.md
  - https://github.com/modelcontextprotocol/typescript-sdk/blob/main/README.md
  - https://github.com/modelcontextprotocol/typescript-sdk/releases
  - https://www.npmjs.com/package/@modelcontextprotocol/server
  - https://www.npmjs.com/package/@modelcontextprotocol/sdk
  - packages/ai/package.json
  - packages/ai/src/mcp/server.ts
  - tests/ai/mcp-contract-convergence.test.ts
owner: "@builder"
decision_level: advisory
evidence_kind: specialist
---

# MCP 2026-07-28 Compatibility Boundary

## Decision

The MCP `2026-07-28` candidate is **No-go** as the GIS Engine runtime default.
The accepted default remains `2025-11-25` on
`@modelcontextprotocol/sdk@^1.29.0` (actual `packages/ai` module resolution
`1.29.0`; npm legacy-line latest `1.30.0`). The TypeScript SDK README and npm
package metadata checked on 2026-08-04 show stable split v2 packages, including
`@modelcontextprotocol/server@2.0.0`, but GIS Engine has not migrated or
conformance-tested the v2 discovery, lifecycle, result, cache, or subscription
contracts.

The official evidence has a wording inconsistency: the TypeScript SDK main
README and npm package line identify v2 as stable, while the 2.0.0 GitHub
release body still contains "first beta release" wording. This gate uses the
current README/package availability and does not treat that stale release-body
phrase as evidence that v2 is unavailable. The No-go is based only on missing
GIS Engine migration and conformance evidence.

This is a no-default-change compatibility gate. It does not add dual-revision
runtime handling and does not modify public MCP behavior.

## Compatibility Matrix

| Coverage key | Status | Candidate behavior | Repository evidence and gap |
| --- | --- | --- | --- |
| `discovery` | blocked | The server MUST implement `server/discover`; a client MAY call it before other requests or use it as a probe | The SDK 1.x implementation negotiates with `initialize` and exposes `tools/list`; there is no v2 discovery path |
| `transportLifecycle` | blocked | Sessions and `initialize` are replaced by per-request protocol revision and capability context | The current server and in-memory contract tests exercise the 2025-11-25 session lifecycle only |
| `resultType` | blocked | Result-bearing definitions require `resultType` | Current tools declare input/output JSON schemas and conforming results, but do not declare or negotiate the v2 result type |
| `cacheMetadata` | blocked | List results can define `ttlMs` and `cacheScope` | No cache lifetime/scope semantics or invalidation tests exist |
| `subscriptions` | blocked | Subscription capability uses `subscriptions/listen` | No listen lifecycle, authorization, cancellation, or replay tests exist |
| `extensions` | not-applicable | Extensions require explicit definition and capability negotiation | GIS Engine claims no extension; adding one requires a separate public-contract issue |
| `oldClientBehavior` | supported (policy only) | A `2026-07-28` client MUST treat a result from an earlier-protocol server that omits `resultType` as complete | The fixture records this compatibility rule; it does not claim a v2 runtime or dual-client conformance path |

## Frozen Public Contract

Promotion work must not change the canonical `tools/list` order:

1. `apply_commands`
2. `validate_spec`
3. `export_spec`
4. `get_context_summary`
5. `snapshot_spec`
6. `explain_spec`
7. `export_example_app`
8. `diff_specs`
9. `generate_spec`
10. `inspect_data`
11. `edit_spec`
12. `query_features`
13. `style_recommend`
14. `transform_data`

All 14 descriptors must continue to expose both `inputSchema` and
`outputSchema` using `http://json-schema.org/draft-07/schema#`. Successful
calls must retain schema-conforming `structuredContent`. Execution failures
must retain the `{ diagnostics: Diagnostic[] }` structured envelope and the
legacy JSON diagnostics text block. A `2026-07-28` client MUST treat a result
from an earlier-protocol server that omits `resultType` as complete. This is a
client-side compatibility interpretation only; it cannot relax any of these
descriptor or result invariants.

The dedicated `pnpm test:compat:mcp` gate runs both
`tests/ai/mcp-2026-07-28-compatibility.test.ts` and
`tests/ai/mcp-contract-convergence.test.ts`. It therefore validates the
candidate compatibility fixture and live 14-tool descriptors together with
successful `structuredContent`, output-schema conformance, the
`{ diagnostics: Diagnostic[] }` failure envelope, and the legacy JSON text
fallback.

## Promotion Gates

A future default or dual-revision proposal must provide all of the following:

| Gate | Required evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| SDK migration | Split v2 packages pinned and their build/runtime dependency boundaries reviewed | Prevents accidental mixed-major transports | `@builder` implements migration on a dedicated branch | high |
| Discovery and lifecycle | Positive and negative `server/discover`, per-request revision, and capability tests | Prevents accepting requests under the wrong contract | `@builder` adds real client/server transport fixtures | high |
| Result contract | `resultType`, structured success, diagnostic failure, and earlier-server omission cases | Preserves machine-verifiable AI results | `@quality` validates both protocol revisions | high |
| Cache and subscriptions | `ttlMs`, `cacheScope`, invalidation, `subscriptions/listen`, cancellation, and authorization cases | Prevents stale state and unbounded listeners | Owners define semantics before implementation | high |
| Extension isolation | Explicit names, schemas, negotiation, diagnostics, and fallback | Prevents undocumented protocol surface growth | Open a separate public-contract issue for each extension | high |
| Full regression | Schema build, AI suite, docs suite, deterministic checks, and MCP conformance suite | Protects the frozen 14-tool contract | `@quality` issues the final Go/No-go decision | high |

## Rollback

Rollback is the current state: retain `@modelcontextprotocol/sdk@^1.29.0`, keep
`GIS_ENGINE_MCP_PROTOCOL_VERSION` at `2025-11-25`, and keep the 14-tool
descriptor/result contract unchanged. A failed v2 experiment must remove its
split-package dependency and candidate-only transport code without rewriting
the stable schemas or result fallback.

## Non-Goals

- No runtime default promotion to `2026-07-28`.
- No dual-protocol server or client shim.
- No new MCP tool names, aliases, or ordering changes.
- No schema dialect migration.
- No cache, subscription, or extension implementation.
- No removal of `structuredContent` or the legacy JSON text fallback.
