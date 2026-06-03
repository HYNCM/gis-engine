---
agent: quality
period: 2026-06-03
generated_at: 2026-06-03T06:30:00Z
repo_revision: "367acd0"
inputs:
  - docs/planning/feature-specs/studio-local-review-ledger-query.md
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
  - apps/studio/README.md
  - tests/studio/studio-server.test.ts
  - tests/studio/studio-bundle.test.ts
owner: "@quality"
decision_level: advisory
---

# SLL-001 Studio Local Review Ledger Query

## Decision

`SLL-001` is accepted. Studio keeps the saved review ledger local,
side-effect-free, and payload-free while making it queryable by audit status and
review outcome from the left rail.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Filtered ledger contract | pass | `apps/studio/server/index.mjs` adds `audit_status`, `review_outcome`, and `limit` handling to `/api/maps/:id/review-ledger`, with total, matching, and returned counts. | Saved workspace ledgers are now easier to inspect without parsing an oversized evidence block. | Keep filter additions additive and bounded. | high |
| Local ledger UI | pass | `apps/studio/src/components/ChatPanel.tsx` renders audit-record and review-decision cards with filter controls and a folded raw ledger envelope. | Reviewers get a first-class local ledger read surface next to export timelines. | Keep cards compact and evidence-only. | high |
| Boundary preservation | pass | The ledger surface still omits `MapSpec`, raw prompts, provider bodies, credentials, screenshots, browser state, file writes, hosted sync, and MCP aliases. | Productization advances the local review workflow without crossing hosted/auth/export boundaries. | Open a separate planning loop before any hosted or file-output work. | high |
| Focused regression coverage | pass | `tests/studio/studio-server.test.ts` covers filtered ledger shapes; `tests/studio/studio-bundle.test.ts` asserts ledger query UI and fetch wiring. | Future ledger changes have deterministic tripwires. | Re-run Studio tests on ledger filter changes. | high |
| Browser smoke | pass | Local Studio ran on `127.0.0.1:44321` with `STUDIO_DB_PATH=/private/tmp/gis-engine-studio-ledger-smoke.sqlite`; saved `Map 1` kept audit `3` and review `2` after active workspace reset, and filtered ledger cards narrowed to blocked audit `1/3` plus follow-up review `1/2`. Screenshot: `/private/tmp/studio-ledger-smoke.png`. | The left-rail ledger reads saved workspace evidence instead of current transient session state. | Keep future UI changes covered by a local browser smoke when saved evidence behavior changes. | high |

## Verification

- `pnpm test:studio` - passed, 38 tests.
- `pnpm studio:build` - passed.
- `pnpm test:docs` - passed, 2 tests.
- `pnpm check` - passed after rerun with local listener permission; the first sandboxed run was blocked by `listen EPERM: operation not permitted 127.0.0.1`.
- `git diff --check` - passed.
- Browser smoke - passed; no browser `warn` or `error` console entries.
