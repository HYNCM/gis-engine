---
agent: product
period: 2026-W23
generated_at: 2026-06-03T02:20:00Z
repo_revision: "bd53ad3"
inputs:
  - docs/planning/feature-specs/studio-local-handoff-envelope.md
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
owner: "@product"
decision_level: advisory
---

# Studio Local Review Ledger

## Goal

`SLH-001` 之后，Studio 已能把 saved workspace 作为 handoff envelope 直接检查，
但 handoff 仍然同时携带 `MapSpec` 与 compact evidence。下一条本地产品切片把
compact 审阅证据单独收成一个 side-effect-free review ledger：用户可以直接检查
saved workspace 的 audit / review trail，而不必把完整 spec 作为默认读面。

## Scope

| Surface | Required behavior | Must not do |
| --- | --- | --- |
| Review ledger endpoint | `GET /api/maps/:id/review-ledger` 返回 compact evidence-only envelope：workspace metadata、handoff status、audit/review summary、audit records、review decisions | 不返回 `MapSpec`、raw prompt、provider body、credentials、screenshots、browser state |
| Ledger inspection UI | Saved map 卡片可在 Studio 左栏中 inspect review ledger | 不做 download、browser file write、clipboard automation、share link 或 remote upload |
| Handoff / ledger boundary | handoff 继续承载 saved workspace + `MapSpec`；review ledger 专注 compact review/audit trail | 不把两个 surface 合并成一个不可区分的“大 JSON” |

## Product Behavior

- review ledger 必须是 evidence-first 的 inspectable JSON，不依赖 browser-side
  prose 推断。
- review ledger 必须保留：
  - workspace id / name / revision / basemap / timestamps
  - 派生 handoff status 与最新 review reason/follow-up ids
  - audit status counts
  - review outcome counts
  - diagnostic totals
  - compact audit records
  - compact review decisions
- review ledger 必须保持 local、read-only、side-effect-free。

## Non-Goals

- 不做 file download、export archive、share link、hosted sync、remote upload。
- 不新增 MCP tool name。
- 不打开 hosted auth / product durable audit / review ledger 服务化边界。
- 不把 current session evidence 自动写回 saved workspace。

## Acceptance Criteria

- `apps/studio/server/index.mjs` 暴露 `review-ledger` route 和 stable ledger builder。
- `apps/studio/src/App.tsx` / `apps/studio/src/components/ChatPanel.tsx`
  暴露 ledger inspect flow。
- README、planning、tests 与行为同步。
- 完成门禁至少包括：
  - `pnpm test:studio`
  - `pnpm studio:build`
  - `pnpm test:docs`
  - `pnpm check`
  - `git diff --check`
