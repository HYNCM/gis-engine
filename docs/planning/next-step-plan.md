---
agent: orchestrator
period: 2026-W25
generated_at: 2026-06-14T00:00:00Z
repo_revision: "unknown"
inputs:
  - docs/planning/feature-specs/current-product-definition.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/weekly-digest.md
  - docs/planning/issues-snapshot.md
  - docs/reviews/first-run-acceptance-2026-06-10.md
  - docs/reviews/provider-smoke-2026-06-10.md
  - docs/reviews/generated-project-audit-regression-2026-06-10.md
owner: "@orchestrator"
decision_level: advisory
---

# Next Step Plan

## Goal

Continue productization by making the SDK+CLI adoption path easier to inspect,
easier to verify, and harder to misread.

## Phase 1: Definition Lock

- [ ] Confirm the current product definition as SDK+CLI first.
- [ ] Keep Workbench, stable SceneView3D, and PMTiles runtime query in bounded
      no-go / promotion-gate status.
- [ ] Use the current definition doc as the entry point for future execution.

**Verify**

- [ ] Definition doc exists and matches current roadmap/boundary docs.
- [ ] No planning artifact claims hosted Workbench or stable 3D promotion.

## Phase 2: Adoption DX

- [ ] Add one small improvement to first-run or CLI install reporting.
- [ ] Keep the change machine-readable and reviewable.
- [ ] Preserve the existing smoke gates and raw-prompt-retention checks.

**Verify**

- [ ] Targeted tests pass.
- [ ] `pnpm smoke:first-run` or `pnpm smoke:cli-install` still passes.
- [ ] Docs snapshot links stay green.

## Phase 3: Queue Refresh

- [ ] Regenerate issue snapshot after the next accepted change.
- [ ] Decide the next issue from the current adoption friction, not from
      archived roadmap pressure.

**Verify**

- [ ] `docs/planning/issues-snapshot.md` reflects current GitHub issue state.
- [ ] Next issue has a single clear owner and gate.

## Immediate Next Slice

Create a structured report section for the first-run / install smoke evidence
so the adoption path is easier to audit without reading raw command logs.
