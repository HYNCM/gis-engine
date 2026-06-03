---
agent: product
period: 2026-W23
generated_at: 2026-06-03T05:10:00Z
repo_revision: "3705146"
inputs:
  - docs/planning/feature-specs/studio-local-review-export-filters.md
  - apps/studio/src/App.tsx
  - apps/studio/src/components/ChatPanel.tsx
owner: "@product"
decision_level: advisory
---

# Studio Local Review Export Timeline UX

## Goal

`SLX-002` 之后，Studio 已能对 saved workspace review export 做
`kind/status` 过滤，但左栏仍然主要暴露原始 JSON envelope。下一条本地产品切片
把 export viewer 升级成更可扫读的时间线读面：直接显示 compact returned
events、支持 page size 调整、支持 `Newer` / `Older` 双向分页，同时保留 raw
envelope 作为次级 inspect 面。

## Scope

| Surface | Required behavior | Must not do |
| --- | --- | --- |
| Review export viewer | 直接渲染 returned event timeline cards，显示时间、kind、status、provider、command / delivery / diagnostic summary | 不引入 raw payload、full command body、browser-only prose 推断 |
| Pagination controls | Viewer 支持 `Newer` / `Older` 双向分页，并允许调整 page size；filter 或 page-size 变化后回到第一页 | 不打破当前 server-side cursor semantics 或引入 hidden client cache |
| Raw envelope access | 保留 raw export envelope 作为折叠式 inspect surface，而不是唯一默认读面 | 不删除 inspectable JSON envelope，也不改成下载 / file write |

## Product Behavior

- review export viewer 必须继续 local、read-only、side-effect-free。
- event cards 必须直接来自当前 export envelope 的 compact events。
- page size 必须复用现有 export `limit` contract，而不是新增 hosted 或 durable query
  scope。
- pagination 必须保持 filter context，不因 `Newer` / `Older` 丢失当前
  `kind/status/limit`。

## Non-Goals

- 不做 auth、hosted service、remote sync、file export、browser file write。
- 不新增 MCP tool name。
- 不新增 durable archive 或历史查询服务语义。
- 不把 review export 变成 full audit/review editor。

## Acceptance Criteria

- `apps/studio/src/App.tsx` / `apps/studio/src/components/ChatPanel.tsx`
  暴露 event timeline cards、page size、双向分页、以及 raw envelope 折叠查看。
- 现有 export filter contract 保持兼容，page size 通过 `limit` query 使用。
- README、planning、tests 与行为同步。
- 完成门禁至少包括：
  - `pnpm test:studio`
  - `pnpm studio:build`
  - `pnpm test:docs`
  - `pnpm check`
  - `git diff --check`
