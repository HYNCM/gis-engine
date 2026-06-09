---
agent: engine-agent
period: 2026-W23
generated_at: 2026-06-01T17:45:36Z
repo_revision: "72baa560f38173c3cb84940018de8f2a9ff12129"
inputs:
  - docs/archive/2026-06-10/feature-specs/ai-map-workbench-review-actions.md
  - docs/archive/2026-06-10/reviews/amw-009-command-safe-review-actions-2026-06-02.md
  - docs/archive/2026-06-10/reviews/awp-004-authorized-durable-audit-contract-2026-06-02.md
  - examples/ai-map-workbench/review-decisions.mjs
  - examples/ai-map-workbench/server.mjs
  - examples/ai-map-workbench/public/app.js
  - tests/examples/ai-map-workbench.test.ts
owner: "@engine-agent @ai-agent @qa-agent"
decision_level: advisory
---

# AWP-005 Command-Safe Review Decisions

## Decision

`TASK-2026W23-AWP-005` is implemented inside the local/example boundary.
Reviewers can record accept, block, and follow-up-required decisions as
append-only in-memory evidence linked to compact audit/provider/command
diagnostics. Review decisions do not mutate `MapSpec`, write browser files,
persist raw payloads, create issue-tracker/planning state, add hosted behavior,
or add MCP tool names.

The next queued task is `TASK-2026W23-AWP-006` repeatable workbench UI evidence.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Review decision contract | implemented | `examples/ai-map-workbench/review-decisions.mjs` creates `amw.review.v1` decisions with server-owned ids/timestamps and compact audit evidence references. | Review actions become auditable evidence instead of a second mutation path. | Keep future schema work aligned to this compact shape. | high |
| Review authorization | implemented | Review decisions use project-scoped `admin`/`reviewer` authorization and reject `service` audit append principals at `/reviewDecision/authorization`. | Audit append authority cannot become review-decision authority by accident. | Keep durable audit roles and review-decision roles separate until product auth is designed. | high |
| Server endpoints | implemented | `POST /api/review-decision` and `GET /api/review-decisions` append/list in-memory decisions without returning full `MapSpec` or feature payloads. | Browser review controls can operate without durable storage or raw state leakage. | Add public schemas only if the API is promoted beyond the example. | high |
| Command safety | implemented | Tests reject requests containing raw prompt, commands, patches, or specs at `/reviewAction/commandSafety`. | Browser requests cannot smuggle direct map mutation or raw payload retention into review decisions. | Keep any future map-changing action on `MapCommand` + `applyCommands`. | high |
| Outcome rules | implemented | Tests cover accepted, blocked, follow-up-required, missing follow-up ids, and attempts to accept blocked evidence. | Review decisions enforce AMW-009 semantics with stable diagnostics. | Extend reason-code tests as product workflow expands. | high |
| UI controls | implemented | The workbench renders Accept, Block, and Follow up controls and shows recent review decisions; Playwright verifies browser requests send only outcome/reason/follow-up fields. | Reviewers can create local evidence without reading raw JSON. | AWP-006 must capture repeatable UI evidence for this workflow. | high |
| Boundary preservation | preserved | No durable database, auth UI, export endpoint, browser file write, product app movement, hosted deployment, or new MCP tool name was added. | Product promotion remains No-go until the later gate. | Keep AWP-007 as the promotion decision point. | high |

## Boundaries Preserved

- Review decisions are in-memory local example evidence, not durable product
  storage.
- Review decisions require project-scoped `admin` or `reviewer` authority;
  service-only audit append principals cannot create reviewer outcomes.
- No direct `MapSpec` mutation, direct provider commands, command body storage,
  patch storage, or browser file write.
- No raw prompt, provider raw body, credential, feature payload, screenshot,
  browser state, full `MapSpec`, or provider error body retention.
- No issue-tracker integration or planning markdown writes from browser UI.
- No hosted deployment, auth system, product app movement, or new MCP tool name.

## Verification

- `pnpm vitest run tests/examples/ai-map-workbench.test.ts` - passed, 75 tests.
- `pnpm test:examples` - passed, 85 tests.
- `pnpm test:docs` - passed, 2 tests.
- `pnpm check` - passed.
- `git diff --check` - passed.
