---
agent: docs
period: 2026-10-01
generated_at: 2026-10-01T08:00:00Z
repo_revision: "0ac2546"
inputs:
  - docs/reviews/doc-link-audit.md
  - docs/website/guide/snapshot-testing.md
  - scripts/gate-plan.mjs
  - .github/workflows/visual-baselines.yml
owner: "@docs"
decision_level: info
evidence_kind: specialist
---

# Documentation Audit — 2026-10-01

## Cross-reference integrity

`node scripts/doc-generator.mjs links` regenerated
`docs/reviews/doc-link-audit.md`: all active documentation cross-references
resolve (0 broken). The remediation batch updated every path it referenced:
the new `visual-baselines.yml` workflow, the committed
`tests/__snapshots__/` baseline tree, and the strict-visual gate commands in
`scripts/gate-plan.mjs`.

## Content alignment checks

- `docs/website/guide/snapshot-testing.md` now matches the enforced policy:
  pixel baselines under `tests/__snapshots__/` keyed per platform, comparison
  runs never write reference frames, and only the explicit
  `SNAPSHOT_UPDATE=1` path (local or the `visual-baselines` workflow) authors
  them. Verified against `playwright.config.ts` and
  `tests/framework/visual-pixel-baseline.test.ts`.
- Platform statement is accurate: committed baselines currently exist for
  macOS runners only; foreign platforms report a missing baseline, never a
  rendering regression.
- AGENTS.md command surface (`pnpm test:snapshot:visual`,
  `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 …`) is unchanged and still matches the
  scripts in `package.json`.
- Public API surface did not change in this batch (resource-policy hardening,
  runtime lifecycle guard, CLI escaping are behavioral fixes), so no new
  schema docs were required. CHANGELOG has no pending public-API entries from
  this batch.

## Follow-ups for @docs

1. When Linux baselines are committed, update the platform sentence in
   `snapshot-testing.md` to describe both committed platforms.
2. If `community.ts` escaping (advisory carry-over) lands, its generated-app
   docs need no change — no public surface moves.
