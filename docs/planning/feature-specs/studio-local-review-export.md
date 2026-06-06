---
agent: product
period: 2026-W23
generated_at: 2026-06-03T03:05:00Z
repo_revision: "5babfe9"
inputs:
  - ../../archive/2026-06-06/feature-specs/studio-local-review-ledger.md
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
owner: "@product"
decision_level: advisory
---

# Studio Local Review Export

## Goal

`SLR-001` 之后，Studio 已能检查 saved workspace 的 compact review ledger，但
ledger 仍然是一整块 evidence JSON。下一条本地产品切片把 compact 审阅证据再推进
成一个分页的 side-effect-free review export envelope：用户可以分批检查 saved
audit/review timeline，而不触发文件写入、下载或 hosted sync。

## Scope

| Surface | Required behavior | Must not do |
| --- | --- | --- |
| Review export endpoint | `GET /api/maps/:id/review-export` 返回 compact paginated envelope：workspace metadata、handoff status、cursor/limit、summary、timeline events、`nextCursor` | 不写文件、不返回 `MapSpec`、raw prompt、provider body、credentials、screenshots、browser state |
| Review export timeline | audit records 与 review decisions 归一成 compact event timeline，并按时间倒序分页 | 不把 timeline 变成 full payload dump、command body dump 或 browser-side拼接文本 |
| Review export UI | Saved map 卡片可在 Studio 左栏 inspect review export，并在 `nextCursor` 存在时继续查看更早事件 | 不做 download archive、browser file write、clipboard automation 或 remote share link |

## Product Behavior

- review export 必须是 side-effect-free 的 inspectable JSON envelope。
- review export 必须保留：
  - workspace id / name / revision / basemap / timestamps
  - handoff status 与最新 review decision pointers
  - audit/review event totals
  - current cursor / limit
  - compact paginated events
  - `nextCursor` when more events remain
- review export 必须省略 `MapSpec`，并保持 payload-free evidence boundary。

## Non-Goals

- 不做 file download、browser file write、share link、remote upload、hosted sync。
- 不新增 MCP tool name。
- 不实现 durable database、auth system、export endpoint 下载、或 hosted review service。
- 不把 current session evidence 自动写回 saved workspace 之外的持久层。

## Acceptance Criteria

- `apps/studio/server/index.mjs` 暴露 `review-export` route 和 paginated export builder。
- `apps/studio/src/App.tsx` / `apps/studio/src/components/ChatPanel.tsx`
  暴露 export inspect flow 与更早事件翻页入口。
- README、planning、tests 与行为同步。
- 完成门禁至少包括：
  - `pnpm test:studio`
  - `pnpm studio:build`
  - `pnpm test:docs`
  - `pnpm check`
  - `git diff --check`
