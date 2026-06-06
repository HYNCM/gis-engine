---
agent: product-strategist
period: 2026-W23
generated_at: 2026-06-02T16:32:57Z
repo_revision: "2412c662bfc8"
inputs:
  - docs/engineering/supported-feature-matrix.md
  - docs/spec/contracts-and-interfaces.md
  - docs/archive/2026-06-07/feature-specs/style-diff-layer-order.md
  - apps/studio/server/provider.mjs
  - apps/studio/server/index.mjs
  - apps/studio/src/components/MapStage.tsx
owner: "@product-strategist"
decision_level: advisory
---

# MapLibre Capability Commands

## Goal

Studio 的下一条产品化主线是把自然语言地图编辑从“可证明的能力骨架”
推进到“用户能直接体验的命令闭环”。本切片冻结一组受限但可交付的
MapLibre capability commands，让 provider 输出、`MapCommand` 执行、诊断
反馈、前端相机同步和公开文档保持一致。

## Scope

| Capability | Studio action | Required behavior | Must not do |
| --- | --- | --- | --- |
| Layer filter | `setFilter` | 仅接受 boolean filter expression 子集或 `null` 清除，所有变更通过 `applyCommands` 提交 | 不做 advanced filter synthesis、source-layer targeting、browser-side direct mutation |
| Layer zoom range | `setLayerZoomRange` | 仅更新目标 layer 的 `minzoom` / `maxzoom`，并保持 `0 <= minzoom <= maxzoom <= 24` | 不引入 renderer-only visibility hacks |
| Layer ordering | `reorderLayer` | `beforeLayerId` 命中时稳定插入；省略 `beforeLayerId` 时把 layer 移到图层数组末尾 | 不在 missing anchor 时 silently append |
| Layer visibility | `setLayout` with `layout.visibility` | 仅合并目标 layer layout keys，`visibility` 的 hide/show 保持 command-only 语义 | 不把 DOM/UI state 伪装成 layer contract |
| Camera fitting | `fitBounds` | provider 可输出 `[west, south, east, north]` bounds；Studio 能把它同步到地图相机 | 不把 terrain-aware camera、padding persistence、animation options 升格成 public contract |

## Command Semantics

| Command | Contract |
| --- | --- |
| `setFilter` | 写入或移除 `LayerSpec.filter`；非 boolean 表达式返回稳定诊断 |
| `setLayerZoomRange` | 仅写入目标 layer 的 `minzoom` / `maxzoom`；无效区间返回稳定诊断 |
| `reorderLayer.beforeLayerId` | 目标 layer 移动到 anchor 之前；missing anchor 返回 `LAYER.NOT_FOUND` |
| `reorderLayer` without `beforeLayerId` | 把目标 layer 移到图层数组末尾，保持 deterministic replay |
| `setLayout` with `visibility` | 仅合并 layout keys，不重写未触达字段 |
| `fitBounds` | 把 `view.bounds` 作为 command-level camera intent 交给 Studio 前端消费；当 summary 中没有 `center/zoom` 时由 `MapStage` 执行 `map.fitBounds()` |

## Diagnostics

| Failure | Diagnostic | Path |
| --- | --- | --- |
| target layer missing | `LAYER.NOT_FOUND` | `/layerId` |
| `beforeLayerId` missing | `LAYER.NOT_FOUND` | `/beforeLayerId` |
| non-boolean filter | `EXPR.TYPE_MISMATCH` | `/layers/{i}/filter` |
| invalid zoom range | `LAYER.ZOOM_RANGE_INVALID` | `/minzoom` |
| unsupported capability request | `STUDIO.MAPLIBRE_CAPABILITY_UNSUPPORTED` | `/providerOutput/action` |

## Product Behavior

- provider prompt 必须明确列出 `setFilter`、`setLayerZoomRange`、
  `reorderLayer`、`fitBounds` 和 `setLayout.visibility` 的 payload 形状。
- provider 返回的所有 capability actions 都必须先映射到 `MapCommand`，
  然后再由 engine `applyCommands()` 执行。
- `statePayload.summary` 必须在 `fitBounds` 生效时暴露 `bounds`，供 Studio
  前端同步相机。
- `MapStage` 优先消费 `center/zoom`；只有 `center/zoom` 缺失时才消费
  `bounds`，避免旧的 view state 抢占 `fitBounds`。

## Non-Goals

- 不新增 MCP tool name、MCP alias 或 browser-side hidden mutation path。
- 不扩展 terrain / projection / sky / light / globe / feature-state。
- 不处理 vector source-layer targeting、rendered query、feature-state write path。
- 不做 `maplibre-gl` 包升级或 drift 审计复开。
- 不触发 stable `view.mode: "scene3d"` promotion。

## Acceptance Criteria

- `apps/studio/server/provider.mjs` 的 provider contract 能稳定表达本切片内的 actions。
- `apps/studio/server/index.mjs` 对所有本切片 actions 只走 `MapCommand`。
- `apps/studio/src/components/MapStage.tsx` 能消费 `fitBounds` 的 summary state。
- 文档、tests、schema 和 Studio 实际行为同步。
- 完成门禁至少包括：
  - `pnpm build:schema`
  - `pnpm test:commands`
  - `pnpm test:adapter`
  - `pnpm test:studio`
  - `pnpm test:snapshot:visual`
  - `pnpm check`
  - `git diff --check`
