---
agent: product
period: 2026-W23
generated_at: 2026-06-03T04:05:00Z
repo_revision: "3705146"
inputs:
  - docs/archive/2026-06-10/feature-specs/studio-local-review-export.md
  - apps/studio/server/index.mjs
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
owner: "@product"
decision_level: advisory
---

# Studio Local Review Export Filters

## Goal

`SLX-001` 之后，Studio 已能把 saved workspace 的 compact audit/review timeline
分页导出，但导出面仍然只能按 cursor 翻页，不能稳定收窄事件流。下一条本地产品
切片继续留在 side-effect-free review export 面上，补齐 server-side
`kind/status` 过滤与 page window summary，让 saved review evidence 更像一个
可操作的本地审阅查询面，而不是只能整页翻看的 JSON timeline。

## Scope

| Surface | Required behavior | Must not do |
| --- | --- | --- |
| Review export endpoint | `GET /api/maps/:id/review-export` 支持 `kind` / `status` query filters，并返回 matching counts、page timestamp summary，以及当前 filters | 不返回 `MapSpec`、raw prompt、provider body、credentials、screenshots、browser state |
| Review export envelope | 继续保持 `studio.review-export.v1` 的 side-effect-free JSON envelope；新增字段必须是 additive、compact、payload-free | 不把 compact timeline 扩成 full payload dump、browser prose dump、或 hidden state |
| Review export UI | Saved map export viewer 提供 kind toggle、status select，并在翻到更早事件时保留当前 filter context | 不做 file download、browser file write、clipboard automation、share link、hosted sync |

## Product Behavior

- review export 必须继续是 local、read-only、side-effect-free。
- export filters 必须至少支持：
  - `kind`: `all` / `audit` / `review`
  - `status`: `all` / compact audit-review status values
- export summary 必须继续保留 total audit/review counts，并额外给出：
  - matching event counts
  - matching audit/review counts
  - current page newest / oldest timestamps
- filter change 必须重置到当前 filter 下的第一页，而不是沿用旧 cursor。

## Non-Goals

- 不做 auth、hosted service、remote sync、file export、browser file write。
- 不新增 MCP tool name。
- 不把 review export 提升为 durable archive/query service。
- 不把 current session evidence 自动写回 saved workspace 之外的持久层。

## Acceptance Criteria

- `apps/studio/server/index.mjs` 在 `review-export` builder 中实现 stable
  `kind/status` filter contract 和 matching/page summary。
- `apps/studio/src/App.tsx` / `apps/studio/src/components/ChatPanel.tsx`
  暴露 export filter inspect flow，并在 `Older` 翻页时保留 filter context。
- README、planning、tests 与行为同步。
- 完成门禁至少包括：
  - `pnpm test:studio`
  - `pnpm studio:build`
  - `pnpm test:docs`
  - `pnpm check`
  - `git diff --check`
