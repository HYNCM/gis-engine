---
agent: product
period: 2026-W23
generated_at: 2026-06-03T06:10:00Z
repo_revision: "367acd0"
inputs:
  - docs/planning/feature-specs/studio-local-review-ledger.md
  - docs/planning/feature-specs/studio-local-review-export-timeline-ux.md
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
owner: "@product"
decision_level: advisory
---

# Studio Local Review Ledger Query

## Goal

`SLX-003` made saved review export timelines easier to inspect. The adjacent
ledger surface still needs a lighter query workflow for reviewers who want to
inspect compact audit records and review decisions without parsing one large
ledger envelope. This slice adds server-side ledger filters and a local
left-rail read surface while preserving the payload-free saved workspace
boundary.

## Scope

| Surface | Required behavior | Must not do |
| --- | --- | --- |
| Review ledger endpoint | `GET /api/maps/:id/review-ledger` supports `audit_status`, `review_outcome`, and `limit` filters while keeping total, matching, and returned counts | Return `MapSpec`, raw prompts, provider bodies, credentials, screenshots, browser state |
| Review ledger UI | The left rail exposes compact audit-record and review-decision cards plus filters for audit status, review outcome, and limit | Turn the ledger into a mutation workflow or hidden browser-side query cache |
| Raw ledger access | The raw `studio.review-ledger.v1` envelope remains inspectable behind a folded panel | Download, file write, hosted sync, remote share link |

## Product Behavior

- Ledger queries must be local, read-only, side-effect-free, and evidence-only.
- Audit filters apply to audit records; review filters apply to review
  decisions. Both filters can be used at the same time without implying a join.
- The returned records must remain compact and bounded by `limit`.
- The full ledger counts must remain visible so filtered views still show their
  relationship to the saved workspace evidence set.

## Non-Goals

- No auth, hosted service, remote sync, file export, or browser file write.
- No new MCP tool name.
- No durable archive service or cross-project query service.
- No mutation of saved workspace evidence while inspecting the ledger.

## Acceptance Criteria

- `apps/studio/server/index.mjs` implements additive ledger filters and returned
  counts without changing the payload-free boundary.
- `apps/studio/src/App.tsx` and `apps/studio/src/components/ChatPanel.tsx`
  expose ledger query controls and compact audit/review cards.
- README and tests describe the new local behavior.
- Finish gates:
  - `pnpm test:studio`
  - `pnpm studio:build`
  - `pnpm test:docs`
  - `pnpm check`
  - `git diff --check`
