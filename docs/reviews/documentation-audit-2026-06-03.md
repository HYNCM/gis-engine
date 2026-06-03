---
agent: docs
period: 2026-06-03
generated_at: 2026-06-03T03:24:45Z
repo_revision: "69b7a1de643502a80d29e6e6785fd4fa86141beb"
inputs:
  - AGENTS.md
  - README.md
  - docs/README.md
  - docs/reviews/REPORT_INDEX.md
  - docs/planning/evolution-framework.md
  - docs/engineering/maplibre-version-drift-audit.md
  - scripts/dashboard-generator.mjs
owner: "@docs"
decision_level: advisory
---

# Documentation Audit: 2026-06-03

## Summary

This audit closed the most visible documentation drift introduced by the recent
11-role to 5-agent consolidation. The main fixes were:

1. cut back the root/documentation entry points so readers stop landing in
   superseded sprint and archive files first;
2. replace the stale `docs/reviews/REPORT_INDEX.md` outage-style dashboard with
   a lean guide to the active review streams and retention rules;
3. realign governance/process docs that are still supposed to be current, not
   merely historical.

## Findings

### 1. Documentation entry points were too noisy

- Evidence: `README.md` listed a long mixed set of current docs, archived
  material, and dated review evidence in one flat block.
- Impact: readers had to infer authority manually and could enter the repo
  through stale gates or superseded planning notes.
- Action: reduce the root documentation list to current entry points and route
  historical exploration through `docs/README.md`.
- Confidence: high.

### 2. The doc map overstated dated planning files as timeless truth

- Evidence: the previous `docs/README.md` treated many planning snapshots as
  current source-of-truth documents and hard-coded stale counts such as the
  feature-spec total.
- Impact: the difference between governance docs and dated sprint evidence was
  blurry.
- Action: reclassify documents into current authority docs vs dated-but-active
  evidence, and add a legacy naming note.
- Confidence: high.

### 3. The review index had fallen behind the current operating model

- Evidence: the previous `docs/reviews/REPORT_INDEX.md` still described outages,
  SLAs, and handoffs in the superseded 11-role topology.
- Impact: it was no longer credible as a live index and made the review tree
  look more broken than it actually is.
- Action: replace it with a concise guide to review streams, rolling reports,
  and archive rules.
- Confidence: high.

### 4. Current process docs still mixed legacy ownership with present governance

- Evidence: `docs/planning/evolution-framework.md` and
  `docs/engineering/maplibre-version-drift-audit.md` still described the old
  role split even though `AGENTS.md` now defines 5 agents.
- Impact: process readers could not tell which role names were historical and
  which ones were still current.
- Action: align those docs with the current 5-agent model, while preserving a
  note that contract/code-level legacy tokens remain intentionally unchanged.
- Confidence: medium-high.

## Actions Completed

- Simplified `README.md` documentation links.
- Rewrote `docs/README.md` as the canonical authority map.
- Replaced `docs/reviews/REPORT_INDEX.md` with a current review-tree guide.
- Rewrote `docs/planning/evolution-framework.md` to match the consolidated
  5-agent governance model.
- Updated `docs/engineering/maplibre-version-drift-audit.md` to use current
  process owners without implying a schema/token migration.
- Regenerated `docs/planning/AGENT_HEALTH_DASHBOARD.md` from the current
  dashboard generator.

## Residual Debt

- Many dated planning and review snapshots before 2026-06-03 still carry legacy
  role labels. That is intentional historical evidence, not a new cleanup bug.
- Some runtime and schema contracts still use legacy text such as
  `coordinator`-approved waivers. Those strings should move only in a dedicated
  contract/code migration, not in a docs-only pass.
- Weekly automation templates and historical planning artifacts still need a
  broader follow-up if the repo wants every future generated document to use the
  consolidated naming model end to end.

## Validation

- `node scripts/dashboard-generator.mjs --period 2026-06-03` — passed and
  regenerated `docs/planning/AGENT_HEALTH_DASHBOARD.md`.
- `pnpm test:docs` — passed.
- `node scripts/doc-generator.mjs links` — passed after fixing 2 broken links.
- `git diff --check` — passed.
- `pnpm check` — partially validated but failed in
  `tests/examples/ai-map-workbench.test.ts` with sandbox-localhost
  `listen EPERM 127.0.0.1`; this is consistent with the known environment
  limitation and did not point at a docs regression.
