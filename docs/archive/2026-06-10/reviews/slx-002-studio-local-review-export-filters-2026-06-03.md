---
agent: quality
period: 2026-06-03
generated_at: 2026-06-03T04:35:00Z
repo_revision: "3705146"
inputs:
  - docs/archive/2026-06-10/feature-specs/studio-local-review-export-filters.md
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
  - apps/studio/README.md
  - tests/studio/studio-server.test.ts
  - tests/studio/studio-bundle.test.ts
owner: "@quality"
decision_level: advisory
---

# SLX-002 Studio Local Review Export Filters

## Decision

`TASK-2026W23-SLX-002` is accepted. Studio keeps the local review export surface
payload-free and side-effect-free while adding stable server-side filter
controls for saved audit/review timelines, so reviewers can narrow export
evidence by event kind and status without leaving the local Studio shell.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Stable filtered export contract | pass | `apps/studio/server/index.mjs` extends `/api/maps/:id/review-export` with additive `kind/status` filters, matching counts, and page window summary while keeping `studio.review-export.v1` payload-free. | Saved Studio workspaces now expose a more usable local review export surface without changing persistence or file-output boundaries. | Keep future export additions additive unless a breaking shape change requires a new version. | high |
| Filtered timeline semantics | pass | The export builder applies server-side filters before pagination, so `nextCursor` and page counts operate on the filtered timeline rather than the unfiltered event list. | Reviewers can inspect bounded subsets deterministically instead of mentally re-filtering raw pages. | Preserve server-side filtering as the source of truth for pagination semantics. | high |
| In-app filter workflow | pass | `apps/studio/src/App.tsx` and `apps/studio/src/components/ChatPanel.tsx` add kind toggles, a status selector, and filter-aware `Older` pagination in the left rail. | The product surface becomes faster to inspect during local handoff and review loops. | Keep the filter controls local-only and tied to saved-workspace exports. | high |
| Boundary preservation | pass | The filtered export route still omits `MapSpec`, raw prompt, provider body, credentials, screenshots, browser state, file writes, and hosted sync behavior. | Productization deepens the local review/export surface without reopening auth, download, or hosted claims. | If future archive/download behavior is needed, open a new explicit file-output slice first. | high |
| Focused regression coverage | pass | `tests/studio/studio-server.test.ts` covers filtered export summaries and filter pagination semantics; `tests/studio/studio-bundle.test.ts` asserts the filter-aware UI surface and query construction hooks. | The new local export contract has deterministic regression tripwires. | Re-run Studio tests when filter dimensions or review status values change. | high |

## Browser Smoke Notes

Local smoke against `http://127.0.0.1:5173/` with the Studio server on
`http://127.0.0.1:4321/` confirmed that:

- the saved-map `Export` viewer now exposes `All / Audit / Review` toggles plus
  a `Status` selector;
- changing filters narrows the saved review export JSON without showing a
  `spec` field or any raw prompt/provider payloads;
- `Older` keeps the active filter context while moving deeper into the saved
  timeline;
- the current transient workspace state still does not overwrite the saved
  export evidence surface;
- browser console logs stayed free of `warn` and `error` entries during the
  filtered export flow.

## Boundaries Preserved

- No file download, browser file write, export archive, share link, hosted sync,
  or remote upload path.
- No `MapSpec`, raw prompt, provider raw body, credentials, screenshots, or
  browser state in the review export envelope.
- No new MCP tool names.
- No hosted auth or product durable export service claim.

## Verification

- `pnpm test:studio` - passed.
- `pnpm studio:build` - passed.
- `pnpm test:docs` - passed.
- `pnpm check` - passed.
- `git diff --check` - passed.

This report satisfies `TASK-2026W23-SLX-002`.
