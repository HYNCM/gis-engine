---
agent: code-reviewer
period: 2026-05-17
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
inputs:
  - AGENTS.md
  - README.md
  - docs/engineering
  - packages/engine/src
  - packages/ai/src
  - tests
decision_level: blocking
---

# Daily Audit

结论：初始审计发现的 2 个 P1 已关闭，当前没有源码级阻断项。剩余 2 个 P2 作为后续资源/性能证据任务跟踪，不阻断 v0.2 checkpoint。

最新验证：

- `pnpm build:schema`: pass。
- `pnpm check`: pass，19 个 Vitest 文件 / 108 个测试通过。
- `pnpm test:snapshot:visual`: pass，2 个 Playwright 测试通过。

## [P1][closed] 命令 schema 仍然接受未知字段

- Evidence: `packages/engine/src/spec/schemas/command.schema.ts:4` 到 `packages/engine/src/spec/schemas/command.schema.ts:73`。`CommandBaseSchema` 和 command variant 顶层没有严格拒绝未知字段。
- Impact: 破坏 schema-first 输入边界，AI 或调用方可以携带未建模字段进入命令层，影响 replay、审计和诊断可靠性。
- Required fix: 把 `CommandBaseSchema` 和各个命令 variant 收紧为 `additionalProperties: false` 或等价严格对象定义，并补拒绝未知字段的回归测试。
- Resolution: 已在后续提交中收紧 command schema，并由 schema / command 回归测试覆盖。
- Owner: engine schema owner
- Confidence: high

## [P1][closed] MCP 工具处理链没有统一遵守输入校验和结构化诊断

- Evidence: `packages/ai/src/mcp/server.ts:96` 到 `packages/ai/src/mcp/server.ts:139`；`packages/ai/src/mcp/server.ts:182` 到 `packages/ai/src/mcp/server.ts:205`。
- Impact: `export_spec` 在 `commands.length === 0` 时直接返回原始 `spec`，`validate_spec` / `get_context_summary` 缺参等失败路径返回 `{ message }`，不符合 tool failure 必须返回 diagnostic code 的约束。
- Required fix: 每个 MCP tool 入口先按公开 schema 做 Ajv 校验；所有失败统一转换成 `Diagnostic`；`export_spec` 也应先校验 `spec`，再决定是否 replay commands。
- Resolution: 已统一 MCP tool 输入校验和失败 Diagnostic 路径；tool descriptor 已补 `outputSchema`，strict `CapabilityReportSchema` 纳入 schema-sync 和 MCP 集成测试。
- Owner: ai/mcp owner
- Confidence: high

## [P2] 资源释放与销毁后行为只覆盖最小路径

- Evidence: `packages/engine/src/runtime/MapRuntime.ts:59` 到 `packages/engine/src/runtime/MapRuntime.ts:136`；`tests/resources/resource-release.test.ts` 目前主要覆盖重复 `destroy()`；`docs/engineering/ci-test-strategy.md:252` 到 `docs/engineering/ci-test-strategy.md:262` 要求更完整资源释放语义。
- Impact: 销毁后 `snapshot` / `queryFeatures`、listener、worker、cache 等生命周期回归容易漏掉。
- Required fix: 补 resource-release contract tests；如果公开 API 需要结构化失败，将销毁后调用路径改为 diagnostic result 或稳定错误契约。
- Owner: engine runtime owner
- Confidence: medium

## [P2] perf smoke 与文档中的性能目标不一致

- Evidence: `tests/perf/perf-smoke.test.ts:5` 到 `tests/perf/perf-smoke.test.ts:21` 只测 50 个 `setView` command replay；`docs/engineering/ci-test-strategy.md:236` 到 `docs/engineering/ci-test-strategy.md:250` 记录了 GeoJSON、pan/zoom、queryFeatures、snapshot、destroy 等目标。
- Impact: 当前 perf smoke 只能防止最基础命令吞吐回退，无法覆盖文档描述的渲染、查询和销毁性能风险。
- Required fix: 要么收敛文档里的 smoke 目标，要么补齐 create/render、queryFeatures、snapshot、destroy 的最小基线。
- Owner: engine test owner
- Confidence: medium

## Verification

- `pnpm build:schema`: pass。
- `pnpm check`: pass。
- `pnpm test:snapshot:visual`: pass，2 个 visual snapshot tests。
