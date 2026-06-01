---
agent: product-strategist
period: 2026-W23
generated_at: 2026-06-01T14:16:38Z
repo_revision: "7f59f3ef6711a15dba844ee5277c3f397ef3f264"
inputs:
  - docs/research/competitor-updates-2026-W23.md
  - docs/reviews/amw-004-promotion-gate-2026-05-31.md
  - docs/reviews/amw-005-provider-profiles-2026-05-31.md
  - docs/planning/feature-specs/ai-map-workbench-real-system-evolution.md
  - examples/ai-map-workbench
owner: "@product-strategist @coordinator"
decision_level: advisory
---

# AI Map Workbench Product Boundary

## Product Goal

Define the boundary that must exist before AI Map Workbench can move from
`examples/ai-map-workbench` into a product-owned generated-app review surface.
The next implementation work should make review decisions, provider safety, and
audit semantics explicit without adding production hosting, direct browser
mutation, file writes, new MCP aliases, or stable SceneView3D runtime claims.

The current workbench is accepted as a provider-gated local review system. This
spec keeps that success intact and names the missing product boundary:
ownership, provider administration, resource/credential policy, durable audit,
review actions, and visual/release evidence.

## Users

- Product reviewer deciding whether generated map evidence should be accepted,
  blocked, or routed to follow-up.
- Developer wiring server-side model profiles while keeping credentials out of
  browser state and audit records.
- QA agent validating review workflow, evidence rails, and visual stability.
- Coordinator deciding whether the workbench can graduate from `examples/`.

## Required Product Boundary

| Boundary | Required Before Promotion | Must Not Do |
| --- | --- | --- |
| App ownership | Name product owner, route shape, release gate, and file/module boundary. | Move example code into a product app without an owner or release surface. |
| Provider administration | Define provider profile lifecycle, safe public metadata, missing-credential states, allowed protocols, and denial paths. | Expose API keys, base URLs, raw provider bodies, or arbitrary request templates to the browser. |
| Resource and abuse policy | Record allowed external provider calls, timeout/error behavior, prompt/body leak-hardening, and audit-safe diagnostics. | Hide network calls, bypass resource policy, or store raw prompts by default. |
| Durable audit | Define retention, privacy, export, access-control, and payload caps. | Treat the current bounded in-memory audit as production persistence. |
| Review actions | Define accept, block, and follow-up-required actions as structured review decisions. | Let actions mutate `MapSpec` directly or write files from browser UI. |
| Visual evidence | Add deterministic UI smoke or visual evidence for map framing, evidence rails, provider selector, and review actions. | Promote with only an ad-hoc browser check. |

## Review Action Semantics

Review actions are product decisions about evidence, not renderer mutations.
They should produce structured records that reference prompt hash, trace id,
provider id, command evidence, diagnostic counts, delivery status, source
readiness, spatial query readiness, and review outcome.

Allowed initial outcomes:

- `accepted`: reviewer accepts the current generated-app evidence for handoff.
- `blocked`: reviewer rejects the handoff and records diagnostic categories.
- `follow-up-required`: reviewer creates a bounded follow-up target without
  claiming the app is ready.

These actions must not directly edit `MapSpec`, bypass `applyCommands`, start
external fetches, write generated app files, or expose raw provider payloads.

## Non-Goals

- No hosted deployment in this sprint.
- No auth system or durable database implementation yet.
- No arbitrary provider request templating.
- No raw prompt retention by default.
- No browser-side secret, base URL, provider body, or command mutation.
- No new MCP tool names.
- No MapLibre package movement.
- No PMTiles archive parsing, vector tile decoding, or cloud-native query
  promotion.
- No stable `view.mode: "scene3d"` runtime promotion.

## Promotion Gates

| Gate | Required Evidence |
| --- | --- |
| Product ownership | Product-app boundary spec names owner, route/module boundary, and release gate. |
| Provider safety | Tests or design evidence prove browser-visible provider metadata is safe and credentials remain server-only. |
| Resource policy | External provider calls have timeout, error, leak-hardening, and audit-denial rules. |
| Durable audit | Retention/export/privacy model exists before persistence implementation. |
| Review actions | Accept/block/follow-up actions are structured, payload-bounded, and command-safe. |
| Visual quality | Browser smoke or visual evidence covers product-critical layout states. |
| Quality gate | `@quality-guardian` and `@coordinator` issue a product-promotion Go/No-go before moving out of `examples/`. |

## Recommended Task Slice

1. `AMW-006`: freeze this product boundary and the sprint DAG.
2. `AMW-007`: design provider credential/resource administration.
3. `AMW-008`: design durable audit retention, privacy, and export behavior.
4. `AMW-009`: specify command-safe review actions.
5. `AMW-010`: run the product-promotion Go/No-go gate with visual evidence.

## 2026-06-01 AMW-007 Addendum

`AMW-007` is captured in
`docs/planning/feature-specs/ai-map-workbench-provider-administration.md` and
`docs/reviews/amw-007-provider-resource-admin-2026-06-01.md`. The provider
administration design keeps current server-only credentials and browser-safe
metadata, records base URL, timeout, size, and diagnostic follow-ups, and keeps
product promotion blocked. That handoff fed the durable audit retention/export
design now closed under `AMW-008`.

## 2026-06-01 AMW-008 Addendum

`AMW-008` is captured in
`docs/planning/feature-specs/ai-map-workbench-durable-audit.md` and
`docs/reviews/amw-008-durable-audit-retention-export-2026-06-01.md`. The durable
audit design preserves the current latest-50 in-memory audit behavior for the
example and defines future product-mode retention, privacy, access control,
export shape, payload caps, deletion behavior, and diagnostic paths before any
persistent storage implementation. Product promotion remains blocked. The next
task at that point was command-safe review action design under `AMW-009`.

## 2026-06-02 AMW-009 Addendum

`AMW-009` is captured in
`docs/planning/feature-specs/ai-map-workbench-review-actions.md` and
`docs/reviews/amw-009-command-safe-review-actions-2026-06-02.md`. The review
action design defines `accepted`, `blocked`, and `follow-up-required` as compact
review decisions that reference existing audit, provider, delivery, command, and
diagnostic evidence without direct `MapSpec` mutation, browser file writes, raw
provider payload retention, or new MCP tool names. Product promotion remains
blocked. The next task is the product-promotion Go/No-go gate under `AMW-010`.
