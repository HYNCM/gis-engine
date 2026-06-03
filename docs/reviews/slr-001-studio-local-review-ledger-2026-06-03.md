---
agent: quality
period: 2026-06-03
generated_at: 2026-06-03T02:35:00Z
repo_revision: "bd53ad3"
inputs:
  - docs/planning/feature-specs/studio-local-review-ledger.md
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
  - apps/studio/README.md
  - tests/studio/studio-server.test.ts
  - tests/studio/studio-bundle.test.ts
owner: "@quality"
decision_level: advisory
---

# SLR-001 Studio Local Review Ledger

## Decision

`TASK-2026W23-SLR-001` is accepted. Studio now exposes a side-effect-free local
review ledger for saved workspaces: users can inspect compact audit and review
evidence without opening the larger saved-workspace handoff envelope or writing
any files.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Stable review-ledger contract | pass | `apps/studio/server/index.mjs` now parses `/api/maps/:id/review-ledger` and returns `studio.review-ledger.v1` envelopes with workspace metadata, handoff status, audit/review counts, and compact evidence only. | Saved Studio workspaces now expose a smaller evidence-first read surface for audit and approval workflows. | Keep the ledger compact and versioned if new summary fields are added. | high |
| Handoff / ledger separation | pass | The new ledger builder omits `MapSpec` and aggregates audit status, review outcomes, and diagnostic totals while reusing the saved compact evidence arrays. | Product consumers can choose between full workspace handoff and evidence-only ledger instead of parsing one oversized JSON surface. | Preserve the current split: handoff for saved workspace state, ledger for compact review evidence. | high |
| In-app inspection workflow | pass | `apps/studio/src/App.tsx` and `apps/studio/src/components/ChatPanel.tsx` add a `Ledger` action and a left-rail `Review Ledger` viewer next to the existing handoff inspection path. | Local Studio can surface saved review evidence as a first-class product read surface instead of a hidden server route. | Keep the saved-map action cluster compact and local-only. | high |
| Boundary preservation | pass | The ledger route is read-only, returns no `MapSpec`, raw prompt, provider body, credential, screenshot, browser state, or file output, and stays within the current local SQLite boundary. | Productization advances toward durable handoff/review workflows without reopening hosted or file-output policy. | If future download/export behavior is needed, open a separate explicit file-output slice first. | high |
| Focused regression coverage | pass | `tests/studio/studio-server.test.ts` covers route parsing and ledger shape; `tests/studio/studio-bundle.test.ts` asserts the `Ledger` UI surface and fetch path. | The new review-ledger contract now has deterministic regression coverage. | Re-run Studio tests on future ledger/status changes. | high |

## Browser Smoke Notes

Isolated local smoke run against `http://127.0.0.1:4326/` with
`STUDIO_DB_PATH=/tmp/studio-ledger-*/studio.sqlite` confirmed that:

- the saved-map row now surfaces `Ledger` beside `Inspect`, `Load`, and `Delete`;
- `Ledger` opens `studio.review-ledger.v1` with compact audit/review evidence
  and no `spec` field;
- after resetting the current workspace back to `v0` / `No basemap`, the saved
  ledger still showed `v4` / `osm` / `accepted`;
- after `Load`, the right evidence rail returned to the saved prompt/review
  context instead of keeping the transient reset prompt.

## Boundaries Preserved

- No file download, browser file write, export archive, share link, hosted sync,
  or remote upload path.
- No `MapSpec`, raw prompt, provider raw body, credentials, screenshots, or
  browser state in the ledger envelope.
- No new MCP tool names.
- No hosted auth or product durable review-ledger service claim.

## Verification

- `pnpm test:studio` - passed, 34 tests.
- `pnpm studio:build` - passed.
- `pnpm test:docs` - passed, 2 tests.
- `pnpm check` - passed.
- `git diff --check` - passed.

This report satisfies `TASK-2026W23-SLR-001`.
