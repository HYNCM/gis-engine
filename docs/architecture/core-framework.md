# Core Framework Decision

## Context

GIS Engine must support current 2D rendering without fixing the generic model to one renderer, dimension, reference implementation, or workflow.

## Options

- Put renderer and product fields in the stable core.
- Keep a small core + extensions contract and isolate renderer behavior behind adapters.

## Decision

Use the core + extensions model. `MapSpec` keeps `version`, `view`, `sources`, `layers`, `interactions`, `metadata`, and `extensions`; renderer details stay behind `RendererAdapter`.

`examples/ai-map-workbench` is the Phase 1 参考实现. `validate -> apply -> snapshot -> export` is the 最小闭环, not a required order for every consumer.

## 核心 / 扩展矩阵

<!-- core-extension-boundary:framework:start -->
> Generated from `docs/architecture/core-extension-boundary-matrix.json`. Run `pnpm docs:boundary` after editing the source.

| 区域 | Core 保留什么 | 扩展 / adapter 承担什么 | 备注 |
| --- | --- | --- | --- |
| `MapSpec` 核心字段 | `version`、`view`、`sources`、`layers`、`interactions`、`metadata` | 行业域、scene、3D、实验能力放入 `extensions` | 核心字段保持最小、通用、可组合 |
| `extensions.*` | 只保留版本化扩展入口 | `scene3d`、`aiHints`、terrain、vertical payload、第三方插件字段 | 3D / scene / 行业能力走扩展命名空间 |
| `RendererAdapter` | 只定义稳定渲染契约 | MapLibre、WebGL2 lite、scene adapter 的实现细节 | 具体渲染器行为必须留在 adapter 后面 |
| 参考实现 | 提供可运行 proof-of-concept | 不定义产品形态，也不替代主协议 | `examples/ai-map-workbench` 只做 Phase 1 参考实现 |
| 产品消费者 | `apps/workbench` 消费公开的 `MapSpec`、command、diagnostic 和 adapter 契约 | Workbench 本地项目、计划、预览、应用和导出编排 | 产品工作流不得重定义 core 或 `RendererAdapter` 契约 |
| 工作流 | `validate -> apply -> snapshot -> export` 作为最小闭环 | 其他消费者可按需要重组顺序 | 该闭环是证据最小闭环，不是唯一流程 |
<!-- core-extension-boundary:framework:end -->

See [the structured matrix](core-extension-boundary-matrix.json), [MapSpec schema](../../packages/engine/src/spec/schemas/map-spec.schema.ts), and [boundary regression test](../../tests/docs/canonical-boundary-regression.test.ts).
