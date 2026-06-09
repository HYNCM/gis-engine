agent: product
period: 2026-W23
generated_at: 2026-06-03T01:15:00Z
repo_revision: "9ddea22"
inputs:
  - apps/studio/server/store.mjs
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
  - docs/archive/2026-06-10/reviews/ser-001-studio-review-evidence-2026-06-03.md
owner: "@product"
decision_level: advisory
---

# Studio Local Workspace Continuity

## Goal

Studio 在 `MLC-001` 之后已经具备可编辑、可审阅的本地 product loop，但“保存”
仍然只是一个写入动作，用户无法把它当作真正的本地工作区来回切换。本切片把
Studio 推进到更接近产品的 local workspace continuity：已保存地图必须可见、
可载入、可删除，并且载入后仍能恢复 compact basemap / audit / review evidence
上下文。

## Scope

| Surface | Required behavior | Must not do |
| --- | --- | --- |
| Saved map list | Studio UI 展示本地已保存地图、revision、basemap、audit/review count 和更新时间 | 不把 list 变成 remote sync、project browser 或 hosted file manager |
| Load/delete workflow | 用户可从 UI 载入或删除本地 map entry；载入后当前工作区状态与 evidence rail 同步更新 | 不绕过 server contract 直接在 browser 内伪造 `MapSpec` 或 evidence state |
| Local persistence payload | SQLite 记录 `MapSpec`、`basemapId`、compact audit records、compact review decisions | 不持久化 raw prompt、provider body、credentials、screenshots、command bodies、patches、full provider errors |
| Old database compatibility | 旧的 Studio SQLite 文件在启动后自动补齐新增列 | 不要求用户手工清空数据库才能升级 |

## Product Behavior

- `POST /api/maps/save` 必须保存当前 `MapSpec`、当前 basemap、当前 bounded
  audit records 和当前 bounded review decisions。
- `GET /api/maps` 必须返回 saved workspace summary，而不是只有 write-only id。
- `POST /api/maps/:id/load` 必须恢复：
  - `MapSpec`
  - basemap selection
  - compact audit history
  - compact review history
- 载入后的 evidence rail 必须直接可见，不要求用户先重新发送 prompt。
- 载入历史 workspace 后，新的 map mutation 仍然只能通过 `MapCommand` /
  `applyCommands` 进入 evidence rail。

## Non-Goals

- 不做 hosted deployment、remote sync、multi-user collaboration、auth、share link、
  export/download 包装、browser file write 或 project dashboard。
- 不新增 MCP tool name、MCP alias 或 browser-side hidden mutation path。
- 不把 current local SQLite persistence 升格成 product durable audit/export claim。
- 不把 review decision 变成第二条 map mutation path。

## Acceptance Criteria

- `apps/studio/server/store.mjs` 支持 schema migration，并持久化 basemap 与 compact evidence。
- `apps/studio/server/index.mjs` 的 save/list/load/delete contract 与 UI 行为一致。
- `apps/studio/src/App.tsx` / `apps/studio/src/components/ChatPanel.tsx` 暴露 saved workspace workflow。
- README、planning、tests 与当前 Studio 行为同步。
- 完成门禁至少包括：
  - `pnpm test:studio`
  - `pnpm studio:build`
  - `pnpm test:docs`
  - `pnpm check`
  - `git diff --check`
