---
agent: orchestrator
period: 2026-09-24
generated_at: 2026-09-24T08:53:00Z
repo_revision: "ca106daef645eb52c684c9ad619b9ada91d9a8ad"
inputs:
  - apps/studio/server/index.mjs
  - vitest.config.ts
  - scripts/agent-registry.mjs
  - scripts/recovery-incident.mjs
  - .github/workflows/agent-daily.yml
  - docs/planning/next-step-plan.md
  - https://github.com/HYNCM/gis-engine/issues/66
  - https://github.com/HYNCM/gis-engine/pull/67
  - https://github.com/HYNCM/gis-engine/actions/runs/35944030692
owner: "@orchestrator"
decision_level: advisory
evidence_kind: project-review
---

# 项目评审与近期工作建议

当前最需要完成的是：修复状态与审计安全缺陷，恢复可信验证，再把 Workbench 候选交给目标用户完成真实闭环。Schema、命令、诊断、MCP 和快照已有较完整的实现及测试基础；当前瓶颈是实现到可验证交付的最后一段。

本报告是 2026-09-24 的建议快照，不替代 GitHub Issue 状态，不构成 merge/release PASS 或产品晋级决定。仅新增本报告；没有修改远程 Issue、合并 PR 或发布包。旧路线图保留为历史记录。

## 本轮证据与限制

- 本地 main 与本轮 `git ls-remote origin refs/heads/main` 一致，均为上述 SHA；工作区初始干净。
- GitHub 当前有 61 个 open Issues，其中 57 个带 agent-escalation 标签；其余为 #44、#45、#48、#66。历史“仅 3 个 follow-up”不代表当前状态。
- 最新 Daily run 35944030692：framework 73 tests 通过，最终 SLA 检查因四类 specialist evidence 仍停在 8 月 5 日而退出 2。Recovery run 35954870987 成功，只证明检测/核心门禁/登记流程完成，不证明原故障恢复。
- PR #67 是 draft，head 为 `031129e3fb0ab67f880176c7c04db86484c844d3`。8 月 19 日记录的 PR quality、MapLibre 5.24.0 两项检查均约六小时后 CANCELLED，兼容性汇总 SKIPPED。具体挂起原因尚未定位，不能称为全部 CI 通过。
- `pnpm build:schema` 通过。`pnpm check` 在 CLI 阶段失败：Vitest 同时收集 `.worktrees/workbench-v1`、`.pnpm-store/v11/projects/...` 和 main 的测试；失败来自嵌套 worktree 的 scaffold 测试。因此本轮不能给出 main 全量 check PASS，也不能把该失败直接归为 main CLI 功能缺陷。
- 排除上述两个嵌套目录后，对 CLI、examples、docs、framework、resources、perf、snapshot/smoke、studio 做补充验证：47 files / 575 tests 通过。这是局部验证，不替代修复配置后的标准 `pnpm check`。
- `pnpm knip` 退出 1：56 unused files、2 unused devDependencies、2 unlisted dependencies、9 unused exports、9 unused exported types、1 duplicate export、5 configuration hints，与 #44 待办相符；静态报告不是删除授权。
- 本地环境 Node 26.0.0、pnpm 11.9.0；正式 CI 应在仓库既有 Node 22/24 矩阵复验。未重新执行完整严格 2D visual、PR67 delivery 或真实用户研究。
- 本轮未刷新竞品、标准或 npm 漏洞数据库；PR67 所述一项 high、一项 moderate 仅是历史审计信号，需重新获取精确依赖链。

## 按执行顺序排列的工作

| 顺序 | 工作与优先级 | 影响、证据、置信度 | 负责人和目标产物 | 验收条件 |
| --- | --- | --- | --- | --- |
| 1 | P1：隔离测试发现范围 | 验证可信度；`vitest.config.ts` 无 test include/exclude 边界，本轮 check 实际混入两套副本；高 | @builder QA；配置修复及发现范围回归测试，@quality 验证 | 同时存在嵌套 worktree/store 时，仅发现当前 checkout 测试；保留全部合法测试；Node 22/24 标准 `pnpm check` 通过 |
| 2 | P1：阻止陈旧 AI 结果修改新地图 | 用户数据正确性；`apps/studio/server/index.mjs:1872` await 后在 1907 对届时 activeSpec 应用；epoch 仅递增不校验；高（源码，未 HTTP 复现） | @builder engine/AI；地图身份、revision、epoch 校验与结构化冲突诊断 | 延迟 provider 返回前切图、重载或另一次 apply，旧结果必须拒绝；新地图不变，审计 revision 对齐；同图无冲突流程通过 |
| 3 | P1：reset 命令与证据一致 | 架构/审计；`index.mjs:396`、587 直接创建 spec 并返回 manual evidence；@quality 函数复现 applyCommands 调用 0 次却 committed=true，revision 7→0；高 | @builder engine；合法 reset 命令语义，或明确独立新建地图事件，@quality 复核 | 实际状态变化与命令/事件证据一致；覆盖 identity、revision、回放、失败；不能伪造 commandCount；公共能力遵循 schema-first |
| 4 | P1：修复专业证据生产与告警闭环 | 交付阻塞/告警噪声；上述 Daily run、`scripts/agent-runner.mjs:366` 仅生成 template；recovery marker 包含 run ID；高 | @orchestrator + @builder；以 #109 为当前入口，形成关联根因任务、真实证据生产路径及恢复验证 | 模板不能充当 specialist；周更 cadence 与 48h SLA 矛盾获得明确策略和边界测试；同根因跨 run 聚合并保留每个 run；原失败 workflow 成功替代后才关闭事故；framework/SLA/HOC 通过 |
| 5 | P1：完成 #66 / PR67 工程交付门禁 | 用户价值/交付；两个 CANCELLED、历史依赖审计及 draft 状态；高 | @builder adapter/QA + @quality；PR67 最终 head 的质量结论、安装导出证据 | 定位挂起并设置合理超时与清理，不靠延长六小时或跳过门禁；Node 矩阵、资源、严格 visual、Mock E2E、导出 install/build 全绿；重跑审计并处置准确依赖链；核对 main 两处状态缺陷在候选分支是否存在 |
| 6 | 产品主线：完成 Workbench Alpha 用户验证（#66 原标签 P0） | 用户价值；#66 明确无人完成用户门禁；高 | @product 组织目标用户、@builder 修阻塞、@quality 审证据；逐次匿名化任务结果与导出产物 | 5 名目标 WebGIS 工程师，至少 4 人在 30 分钟内完成创建/重开→数据检查→计划审阅→明确应用→导出；所有导出项目 install/build，敏感内容不泄漏 |
| 7 | P2：有界偿还 #44/#45/#48 | 可维护性/发布安全；本轮 knip、retention 脚本及 release.yml；高 | #44 @builder QA，#45 @orchestrator+@docs，#48 @builder，统一 @quality 验证 | 逐项分类 knip，不广泛 ignore；retention 明确单位且保护证据引用，先预览/测试；release action 升级验证版本 PR 路径，不触发发布 |

顺序 2、3 是当前 main Studio 的确定风险，不是对 PR67 的未经验证指控。若候选分支已有对应保护，应以回归测试证明并避免重复开发。

顺序 4 的修复不应只更新报告日期或放宽 fail-closed 条件。`agent-registry.mjs` 将 product/orchestrator 设为 weekly，却配置 48h 最大年龄；要将计划执行时间、完成期限和报告有效期拆清楚，保留真实逾期阻断。Recovery 当前按同一个 run 幂等，并未实现跨 run 根因聚合，因此不能简单把 57 条记录全认定为重复并批量删除。

顺序 7 中 #45 有现实执行风险：`.github/workflows/agent-daily.yml:143` 在门禁前调用 retention `--apply`。本轮未证明远端证据已被删除；落实政策前应禁止不可审计的清理，对被规划/HOC引用的证据加保护，并覆盖缺失/无效时间戳、同日多报告、空档和边界值。

## 建议的两周排期

- 第 1–2 个工作日：完成测试边界和两处状态安全修复；并定位 PR67 取消检查的最后执行阶段。
- 第 3–5 个工作日：恢复专业评审生产与原 workflow 成功替代，完成 PR67 最终 head 的工程证据。@product 可同时准备用户任务脚本及招募；通过安全/交付门禁后开展试用。
- 第 6–10 个工作日：执行 5 人 Alpha，优先修阻塞和失败诊断，再复测。至少保留 20%–30% 容量用于上述基础设施和 #44/#45/#48；未完成的维护项顺延，不以降低验收换取日期。

这是工作量排期建议，不是交付承诺；目标用户可用时间和 CI 根因尚未知。通过 Alpha 后再进入 #66 的 local-v1：至少 10 人、成功率 ≥80%、P90 ≤30 分钟，并完成重开、冲突、恢复、迁移、安装升级门禁。晋级仍须人类 Go/No-go。

## 本轮不应扩张的方向

继续维持稳定 SceneView3D、GeoParquet runtime、PMTiles archive/query、hosted/cloud 协作的既有边界；暂无证据支持把它们排在交付闭环之前。PR47 的 engine-family 2.0 合约版本车与 Workbench 成熟度独立，不应通过合并版本 PR代替用户验收。

## 执行时的 Issue 与交接约束

沿用 #66/#44/#45/#48 和现有事故入口，新增的测试隔离/状态安全任务先查重再建 Issue；本报告未向远程写入建议。实施者以 HOC-N2 提交代码及证据，@quality 完成适用门禁后以 HOC-N3 向 @orchestrator 交接，再更新正式规划状态。本轮局部质量审查不是完整 HOC-N3 PASS；内部产品建议不是新鲜竞品 HOC-N1，旧 scorecard 不用于当前竞品排序。

复查日志（本机临时）：`/tmp/gis-review-schema.log`、`/tmp/gis-review-check.log`、`/tmp/gis-review-focused.log`、`/tmp/gis-review-knip.log`、`/tmp/gis-review-daily.log`、`/tmp/gis-review-matrix.log`。远程证据应通过前述 run/PR/Issue 链接复取；实施 PR应持久化自己的最终验证证据。
