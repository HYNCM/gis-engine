---
agent: quality
period: 2026-07-10
generated_at: 2026-07-10T16:06:04Z
repo_revision: "70399d7b5ba956b7f714d007ebe871e4fd9024e0"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/25
  - docs/planning/feature-specs/review-console-workbench-go-gate.md
  - packages/ai/src/tools/workbenchReviewContract.ts
  - apps/studio/server/index.mjs
  - tests/studio/studio-server.test.ts
owner: "@quality"
decision_level: blocking
---

# Quality Gate: Workbench Product Route

## Decision

**Conditional Go** for the #25 feature-flagged product-route candidate evidence.

**No-go** for hosted GA, production auth, deployment, monitoring, billing,
support policy, or public hosted product claims. Those remain blocked until a
separate launch issue provides production ownership and release evidence.

## Findings

| Area | Decision | Evidence |
| --- | --- | --- |
| Shared contract | Pass | Studio and Workbench now consume `amw.audit.v1` and `amw.review.v1` from `@gis-engine/ai` |
| Command-only mutation | Pass | Review decisions remain append-only evidence; route work does not add a map mutation path |
| Provider secret safety | Pass | Status API exposes provider id/label/protocol/model only; smoke output confirmed no `baseUrl` key |
| Export/deletion evidence | Pass | Review export advertises contract caps; map deletion creates `amw.audit.deletion.v1` receipt |
| Feature flag rollback | Pass | `STUDIO_WORKBENCH_PRODUCT_ROUTE` defaults off and disables the shell route |
| MCP contract | Pass | No MCP tool names or schemas changed |
| Rendering/visual | Waived for this gate | No renderer adapter, style transformer, visual fixture, or map-rendering behavior changed |

## Verification

Commands run with Node `v26.0.0` and pnpm `11.9.0`:

```bash
pnpm --filter @gis-engine/ai build
pnpm test:examples
pnpm test:studio
pnpm test:docs
pnpm check
```

Server smoke:

```bash
PORT=4337 STUDIO_WORKBENCH_PRODUCT_ROUTE=1 node apps/studio/server/index.mjs
curl http://127.0.0.1:4337/api/review-console/workbench/project_studio/status
curl http://127.0.0.1:4337/review-console/workbench/project_studio
```

Observed smoke result: status API returned `enabled: true`, `access: allowed`,
`productReadiness: candidate`, `hostedGa: false`, `amw.audit.v1`,
`amw.review.v1`, and no provider `baseUrl`; route shell returned HTTP 200.

## Residual Risks

- `pnpm lint` still reports unrelated pre-existing lint debt in `.vercel-tmp`,
  `packages/ai/src/tools/transformData.ts`,
  `packages/cli/src/templates/community.ts`,
  `packages/engine/src/sources/geoparquet-wasm.ts`, and
  `packages/engine/src/sources/pmtiles-loader.ts`. This gate did not introduce
  those findings.
- The product route is not authenticated or deployed. It must remain behind
  `STUDIO_WORKBENCH_PRODUCT_ROUTE` until a separate launch issue lands auth,
  deployment, monitoring, and support policy.

## Required Next Step

Close #25 only after the implementation branch is pushed, remote CI succeeds on
the pushed head, and the issue body or closing comment links this quality gate.
