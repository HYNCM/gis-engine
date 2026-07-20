---
title: Documentation Artifact Policy
description: Committed snapshot and generated-report policy for documentation artifacts
generated_at: 2026-06-06T19:43:01Z
scope: "docs automation artifacts"
---

# Documentation Artifact Policy

This policy prevents documentation cleanup from deleting generated artifacts
that still act as current evidence.

## Current Decisions

| Artifact | Current Policy | Owner | Required Sync |
| --- | --- | --- | --- |
| `docs/planning/issues-snapshot.md` | Keep the last authenticated snapshot when GitHub issue state is unavailable. | `@orchestrator` | Regenerate with `node scripts/planning-evidence.mjs`; failed or unauthenticated fetches must exit non-zero without replacing the committed snapshot. |
| `docs/planning/AGENT_HEALTH_DASHBOARD.md` | Keep as a committed snapshot. Template-only reports are not specialist freshness evidence. | `@orchestrator` | Regenerate with `node scripts/planning-evidence.mjs` so its issue counts and evidence run id match the issue snapshot and handoff ledger; keep `docs/README.md` linked. |
| `docs/planning/handoff-ledger.json` | Keep as a committed snapshot. Template-only upstream or downstream reports cannot satisfy HOC consumption. | `@orchestrator` | Regenerate with `node scripts/planning-evidence.mjs` when issue or HOC inputs change; keep AGENTS and handoff-contract docs aligned. |
| `docs/reviews/doc-link-audit.md` | Keep as a committed generated report. | `@docs` | Regenerate with `node scripts/doc-generator.mjs links` after documentation restructuring. |

## Cleanup Rules

- Do not add these files to `.gitignore` without a matching update to
  `docs/README.md`, the generating script, and any tests that read the output.
- A generated file can become CI-only only after its current documentation
  entry point is replaced by a stable summary or artifact URL.
- Rolling reports remain governed by `node scripts/report-retention.mjs`; this
  policy is only for committed snapshots that current docs still cite.

## Verification

Run these gates after changing artifact policy or generated-report locations:

```bash
node scripts/planning-evidence.mjs --dry-run
node scripts/doc-generator.mjs links
pnpm test:docs
git diff --check
```
