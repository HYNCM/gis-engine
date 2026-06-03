agent: product
period: 2026-W23
generated_at: 2026-06-03T02:00:00Z
repo_revision: "9ddea22"
inputs:
  - docs/planning/feature-specs/studio-local-workspace-continuity.md
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
owner: "@product"
decision_level: advisory
---

# Studio Local Handoff Envelope

## Goal

`SLW-001` 之后，Studio 已能在本地恢复 workspace continuity，但用户仍缺一层
可检查、可交接、可复核的 side-effect-free handoff surface。本切片补一条 local
handoff envelope：已保存地图可以在 Studio 内直接检查 compact workspace
envelope，而不触发 file write、download archive、hosted sync 或 product
durable audit claim。

## Scope

| Surface | Required behavior | Must not do |
| --- | --- | --- |
| Handoff endpoint | `GET /api/maps/:id/handoff` 返回 compact envelope：workspace metadata、handoff status、`MapSpec`、compact audit/review evidence | 不写文件、不返回 raw provider body、raw prompt、credentials、screenshots |
| Handoff status | 从最新 review decision 派生 `needs-review` / `accepted` / `blocked` / `follow-up-required` | 不从自由文本推断状态，不生成隐藏 task state |
| Handoff inspection UI | Saved map 卡片可在 Studio 左栏中 inspect envelope | 不做下载、浏览器文件写入、clipboard automation 或 remote share link |

## Product Behavior

- handoff envelope 必须是 inspectable JSON，而不是 browser-side inferred prose。
- handoff envelope 必须保留：
  - workspace id / name / revision / basemap
  - sourceCount / layerCount
  - compact audit records
  - compact review decisions
  - 派生 handoff status 与最新 review reason/follow-up ids
- handoff inspection 必须 stay in-app and side-effect-free。

## Non-Goals

- 不做 export archive、download file、share link、remote upload、browser file write。
- 不打开新的 product durable audit/export claim。
- 不新增 MCP tool name。

## Acceptance Criteria

- `apps/studio/server/index.mjs` 暴露 `handoff` route 和 stable envelope builder。
- `apps/studio/src/App.tsx` / `apps/studio/src/components/ChatPanel.tsx`
  暴露 inspect flow。
- docs、planning、tests 与行为同步。
- 完成门禁至少包括：
  - `pnpm test:studio`
  - `pnpm studio:build`
  - `pnpm test:docs`
  - `pnpm check`
  - `git diff --check`
