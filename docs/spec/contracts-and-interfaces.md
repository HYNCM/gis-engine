# Contracts And Interfaces

## Context

Public behavior must remain machine-checkable across engine, adapter, and MCP consumers.

## Options

- Duplicate schema fields and tool behavior in prose.
- Keep prose at the boundary and point to schemas, generated references, and tests.

## Decision

Use a core + extensions contract. The reference implementation does not define the protocol, and `validate -> apply -> snapshot -> export` is only the minimum closed loop for evidence.

The canonical 14-tool MCP inventory is `apply_commands`, `validate_spec`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`, `diff_specs`, `generate_spec`, `inspect_data`, `edit_spec`, `query_features`, `style_recommend`, `transform_data`.

Successful calls expose schema-conforming `structuredContent`. Failures use a structured diagnostics envelope and retain the legacy JSON diagnostics text block.

## 核心 / 扩展矩阵

<!-- core-extension-boundary:contracts:start -->
> Generated from `docs/architecture/core-extension-boundary-matrix.json`. Run `pnpm docs:boundary` after editing the source.

| Contract area | Core | Extension / adapter | Notes |
| --- | --- | --- | --- |
| `MapSpec` 顶层 | `version`、`id`、`revision`、`view`、`sources`、`layers`、`interactions`、`metadata` | `extensions` 中的 scene / 3D / 行业 / 实验 payload | 核心字段应保持最小和可组合 |
| Scene / 3D | `extensions.scene3d` 作为版本化 payload | `SceneView3DExtensionSchema`、loader plan、mock snapshot/query、3D adapter spike | 不能把 `view.mode: "scene3d"` 提升成稳定 core 能力 |
| AI / MCP | 已公开的 snake_case 工具契约和输入/输出 schema | 新工具的扩展 payload、AI 证据和 adapter-local diagnostics | 新 tool 必须继续遵守 schema-first 和 contract tests |
| Workflow | `validate -> apply -> snapshot -> export` 作为证据最小闭环 | 其他消费者可以重排或只用其中一段 | 不把参考实现工作流写成唯一协议顺序 |
| Renderer boundary | `RendererAdapter` contract | MapLibre、WebGL2 lite、scene adapter 的实现细节 | renderer-specific 行为必须留在 adapter 后面 |
| Product consumer | `apps/workbench` consumes public `MapSpec`, command, diagnostic, and adapter contracts | Workbench-local project, plan, preview, apply, and export orchestration | The product workflow must not redefine core or `RendererAdapter` contracts; `examples/ai-map-workbench` remains Phase 1 reference evidence |
<!-- core-extension-boundary:contracts:end -->

## Signposts

- [MapSpec schema](../../packages/engine/src/spec/schemas/map-spec.schema.ts)
- [Commands](../../packages/engine/src/commands)
- [Diagnostics](../../packages/engine/src/diagnostics)
- [MCP descriptors](../../packages/ai/src/mcp/server.ts)
- [Generated API reference](../website/api/reference)
- [Contract tests](../../tests/ai/mcp-contract-convergence.test.ts)
