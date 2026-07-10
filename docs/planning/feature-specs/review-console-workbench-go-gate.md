---
agent: orchestrator
period: 2026-W28
generated_at: 2026-07-10T16:23:47Z
repo_revision: "511a1c9288d14147edeeefb86e48139fce116ae5"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/25
  - docs/planning/feature-specs/ai-map-workbench-promotion-scope.md
  - docs/planning/feature-specs/studio-workbench-product-go-no-go.md
  - examples/ai-map-workbench/audit-contract.mjs
  - apps/studio/server/index.mjs
  - docs/reviews/quality-gate-workbench-product-route-2026-07-10.md
owner: "@product @builder @quality @orchestrator"
decision_level: blocking
---

# Review-console Workbench Product Route Go Gate

## Decision Target

GitHub issue
[#25](https://github.com/HYNCM/gis-engine/issues/25) was the P0
productization gate for moving AI Map Workbench from local/reference evidence
toward a product-owned review-console candidate route. It is closed after PR
#26 reached green remote CI on head `511a1c9288d14147edeeefb86e48139fce116ae5`.

This spec does not approve hosted GA. It defines the evidence package required
for @quality to issue a Go/No-go decision after implementation evidence lands.

## Product Boundary

| Boundary | Decision |
| --- | --- |
| Route | `/review-console/workbench/:projectId` |
| Status API | `/api/review-console/workbench/:projectId/status` |
| Owner split | `@product` product requirements; `@builder` runtime; `@quality` gate; `@orchestrator` planning state |
| Feature flag | `STUDIO_WORKBENCH_PRODUCT_ROUTE`, disabled by default |
| Hosted GA | Blocked until a separate launch issue approves auth, deployment, monitoring, and support policy |
| Reference fallback | `examples/ai-map-workbench` remains the local/reference fallback |

## Implementation Tasks

| Task | Status | Acceptance |
| --- | --- | --- |
| 1. Go gate issue/spec | Complete | #25 exists; this spec records route, owners, non-goals, and quality gate |
| 2. Shared audit/review contract | Implemented | Studio and Workbench consume `@gis-engine/ai` shared `amw.audit.v1` / `amw.review.v1` contract |
| 3. Feature-flagged route evidence | Implemented | Status API exposes route state and safe provider profiles; shell route stays disabled by default |
| 4. Export/deletion evidence | Implemented | Review export advertises contract caps; saved map delete returns compact deletion receipt |
| 5. Release evidence and quality decision | Complete | Required gates passed and @quality recorded Go/No-go |

## Required Evidence

- Shared contract source: `packages/ai/src/tools/workbenchReviewContract.ts`.
- Workbench compatibility wrappers:
  `examples/ai-map-workbench/audit-contract.mjs` and
  `examples/ai-map-workbench/review-decisions.mjs`.
- Studio route and export evidence: `apps/studio/server/index.mjs`.
- Studio contract wrappers: `apps/studio/server/audit.mjs` and
  `apps/studio/server/review-decisions.mjs`.
- Regression tests:
  `tests/examples/workbench-hardening.test.ts`,
  `tests/examples/ai-map-workbench.test.ts`, and
  `tests/studio/studio-server.test.ts`.

## Blocking Guardrails

- Browser-visible provider metadata must not include API keys, base URLs,
  session secrets, request headers, or service credentials.
- Review decisions remain append-only evidence. They must not mutate `MapSpec`
  directly.
- Audit/export/delete records must reject raw prompts, provider raw bodies,
  screenshots, full `MapSpec` payloads, command bodies, patches, and feature
  payload dumps.
- No new MCP tool names are approved.
- Route code must be rollbackable by disabling `STUDIO_WORKBENCH_PRODUCT_ROUTE`.
- `view.mode: "scene3d"`, cloud-native runtime loading, auth, billing,
  hosted deployment, and production support policy remain out of scope.

## Verification Plan

Required before @quality decision:

```bash
pnpm --filter @gis-engine/ai build
pnpm test:examples
pnpm test:studio
pnpm test:docs
pnpm check
```

Visual snapshot requirement: this change does not touch renderer adapters,
styles, visual fixtures, or browser map rendering. A fresh visual waiver is
acceptable if @quality agrees the route shell/status evidence is non-rendering
for the product gate.

## @quality Go/No-go

Decision: **conditional Go for product-route candidate evidence**.

Evidence:
[quality-gate-workbench-product-route-2026-07-10.md](../../reviews/quality-gate-workbench-product-route-2026-07-10.md).

It is still **No-go for hosted GA** because production auth, deployment,
monitoring, and support policy remain outside #25.

Remote evidence:

- PR: [#26](https://github.com/HYNCM/gis-engine/pull/26).
- CI: [29106929309](https://github.com/HYNCM/gis-engine/actions/runs/29106929309).
- PR Quality Check:
  [29106929357](https://github.com/HYNCM/gis-engine/actions/runs/29106929357).
- CI Auto-Fix Pipeline:
  [29106929319](https://github.com/HYNCM/gis-engine/actions/runs/29106929319).
- Bundle Size:
  [29106929328](https://github.com/HYNCM/gis-engine/actions/runs/29106929328).
