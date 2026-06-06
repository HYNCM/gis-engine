---
agent: orchestrator
period: ad-hoc
generated_at: 2026-06-06T19:43:01Z
repo_revision: "d57e62a"
inputs:
  - docs/README.md
  - docs/reviews/REPORT_INDEX.md
  - docs/planning/next-stage-tasks-2026-06-07.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/weekly-digest.md
  - docs/planning/task-burndown.md
  - docs/planning/dependency-graph.md
  - docs/research/capability-scorecard.md
  - docs/archive/2026-06-07/research/capability-scorecard-w24-refresh.md
  - docs/reviews/productization-review-2026-06-07.md
owner: "@orchestrator"
decision_level: advisory
---

# 文档精简方案 v2（优化版）

## 裁决

本轮文档精简应先做**权威入口校准**，再做归档和删除。当前不能按旧 v2
的 P0/P1 直接执行，因为其中若干目标仍是 active evidence 或被当前 planning
引用。

本优化版采用三条硬规则：

1. **先替换引用，再移动文件**：任何 `git mv` 之前必须有 `rg` 证据证明 active
   docs 已不再依赖原路径，或同一提交中完成引用替换。
2. **删除只用于生成物或未跟踪草稿**：tracked review/planning/spec 文档默认归档，
   不直接删除。
3. **当前权威文档不得被草稿取代**：未跟踪 merged 草稿不能取代已提交、已推送的
   canonical 文档。

## 执行记录

2026-06-07 已按引用驱动口径执行首轮精简：

| 阶段 | 执行结果 | 证据 |
| --- | --- | --- |
| P0 | 删除两个未跟踪、stale 的产品化 review 草稿；保留 canonical `productization-review-2026-06-07.md`。 | `git status --short` 不再显示两个草稿 |
| P1 | `capability-scorecard-w24-refresh.md` 归档为 dated appendix；W24 score movement 和 guardrails 吸收到 canonical scorecard。 | `docs/research/capability-scorecard.md`、`docs/archive/2026-06-07/research/` |
| P2 | AIN/GIR 2026-05-30 closed review stream 移入 archive，active planning/spec/evolution 引用同步到 archive 路径。 | `docs/archive/2026-06-07/reviews/` |
| P3 | 5 个 v0.2-era completed feature specs 移入 archive；active monthly roadmap 改为 archive evidence path。 | `docs/archive/2026-06-07/feature-specs/` |
| P4 | 明确 committed snapshot/generated report 政策，不把 dashboard、handoff ledger、doc-link audit 直接加入 `.gitignore`。 | `docs/engineering/documentation-artifact-policy.md` |

## 当前基线

截至 `d57e62a`：

| 项 | 当前状态 | 处理原则 |
| --- | --- | --- |
| `docs/` markdown 文件数 | 211 个 tracked/active 基线；包含本未跟踪计划时本地显示 212 | 统计时排除未跟踪草稿 |
| `docs/reviews/` 文件数 | 59 | 先按 `REPORT_INDEX.md` 判断 stream 权威性 |
| `docs/planning/feature-specs/` 文件数 | 27 | 先按 `docs/README.md` 和 planning 引用判断是否仍 active |
| rolling reports | `report-retention.mjs` 预览为 0 stale | 不手工删除 |
| 未跟踪草稿 | `doc-simplification-plan-v2.md`、`practical-productization-review-2026-06-06.md`、`productization-review-2026-06-07-merged.md` | 不纳入 tracked cleanup，先单独处置 |

## 权威入口保护清单

执行精简前先保护以下入口。验证引用时应排除本计划自身的命中，只看
`docs/README.md`、`docs/planning/`、`docs/research/`、`docs/reviews/` 和
`AGENTS.md` 中的 active 引用。

| 文档 | 当前引用证据 | 处置 |
| --- | --- | --- |
| `docs/reviews/productization-review-2026-06-07.md` | `docs/planning/next-stage-tasks-2026-06-07.md:7`；未跟踪 merged 草稿也引用它 | 保留 canonical；不得用未跟踪草稿覆盖 |
| `docs/planning/feature-specs/ai-map-workbench-promotion-scope.md` | `monthly-roadmap.md:28/50`、`weekly-digest.md:9/54/111`、`task-burndown.md:8/84`、`dependency-graph.md:11/152` | 保留，直到新的 Workbench product-promotion contract 吸收 checklist |
| `docs/research/capability-scorecard.md` | `docs/README.md:46`、`agent-handoff-contracts.md:51`、`monthly-roadmap.md:15`、`task-burndown.md:15`、多份 feature spec front matter | 保留为 scorecard canonical |
| `docs/archive/2026-06-07/research/capability-scorecard-w24-refresh.md` | 执行前旧路径被 `docs/README.md:46`、`monthly-roadmap.md:11`、`weekly-digest.md:11`、`task-burndown.md:12/103`、`dependency-graph.md:13/197` 引用 | 已合并到 canonical，并归档为 dated appendix |
| `docs/planning/sprint-2026-W25-sceneview3d-v1.md` | `monthly-roadmap.md:359`、`dependency-graph.md:15/106`、`task-burndown.md:28/812` | 保留，直到 SceneView3D DAG 摘要进入 stable renderer contract 或 roadmap |
| `docs/planning/feature-specs/cloud-native-source-readiness.md` | `monthly-roadmap.md:24/135`、`weekly-digest.md:267/275`、`task-burndown.md:45/251/311`、`dependency-graph.md:40/139` | 保留，直到 source promotion contract 吸收 readiness/blocked diagnostics |
| `docs/planning/feature-specs/generated-app-review-console.md` | `monthly-roadmap.md:446`、`weekly-digest.md:273/275`、`task-burndown.md:298/310`、`product-architecture/ai-map-workbench-product-architecture.md:9` | 保留，直到 review-console contract 进入当前 product architecture |
| `docs/planning/feature-specs/natural-language-map-app-generation.md` | `monthly-roadmap.md:16/366/440`、`task-burndown.md:16/215`、`dependency-graph.md:25` | 保留，直到 NL generation contract 被 current contract/docs 吸收 |

## 执行口径

每个候选文件必须先填完这四列，才能进入 `git mv` 或删除提交：

| 字段 | 要求 |
| --- | --- |
| `rg evidence` | `rg -n "<file-or-stream>" docs README.md AGENTS.md` 的 active 命中；历史 archive 命中单独列出 |
| `replacement target` | active 引用要改到的 canonical 文档、archive index、或摘要入口 |
| `move type` | `delete-untracked`、`delete-generated`、`git-mv-archive`、`merge-then-archive` 四选一 |
| `stage gate` | 本阶段必须通过的命令；至少包含 links、`pnpm test:docs`、whitespace check |

## 不可执行项

以下旧 v2 建议必须撤销或改写：

| 旧建议 | 当前判断 | 替代动作 |
| --- | --- | --- |
| 删除 `docs/reviews/productization-review-2026-06-07.md` | 阻断。该文件是 tracked canonical，并包含 `d57e62a` 的执行 addendum、CLI install smoke、release preflight、Workbench checklist、外部信号刷新。 | 保留。若要做综合版，必须基于当前 canonical 重新生成，并作为新增评审而非替代删除。 |
| 以 `productization-review-2026-06-07-merged.md` 取代 canonical | 阻断。merged 文件未跟踪，且基于 `269e0c4` 的旧事实。 | 若仍需要，先重写为 current-snapshot review，再经过单独评审和提交。 |
| 归档 `ai-map-workbench-promotion-scope.md` | 阻断。它承载 `TASK-2026W24-PROD-006` 的 promotion checklist。 | 保留为 active feature spec，直到有新的产品化入口吸收 checklist。 |
| 批量归档所有 AMW/AWP review stream | 暂缓。部分文件仍在 7 天窗口内，且 promotion/product scope 仍被 active planning 引用。 | 到期后按 stream 单独归档，并同步 `REPORT_INDEX.md`。 |
| 归档 `sprint-2026-W25-sceneview3d-v1.md` | 暂缓。它仍被 monthly roadmap、dependency graph、task burndown 作为 SceneView3D DAG 引用。 | 先把 DAG 摘要吸收到 active SceneView3D contract，再归档。 |
| 归档 `capability-scorecard.md`、保留 refresh 版 | 暂缓。`capability-scorecard.md` 已含 2026-06-07 productization refresh，`docs/README.md` 当前同时引用两者。 | 先合并 scorecard，再更新 `docs/README.md` 和 research 引用。 |
| 将 `handoff-ledger.json` 直接加入 `.gitignore` | 暂缓。`docs/README.md` 仍把它列为 automation health 来源。 | 先决定它是 committed snapshot 还是 generated artifact，再同步 docs/scripts/tests。 |

## 阶段计划

### P0：零风险整理（不删除 tracked 文档）

目标：清理工作树和生成物政策，不移动 active docs。

| 动作 | 目标 | 验证 |
| --- | --- | --- |
| 处理未跟踪产品化草稿 | `practical-productization-review-2026-06-06.md`、`productization-review-2026-06-07-merged.md` | 二选一：删除未跟踪草稿，或重写后作为新 review 提交；不得替代 canonical |
| 保留 `docs/reviews/productization-review-2026-06-07.md` | 当前产品化执行证据 | `rg -n "productization-review-2026-06-07" docs/planning docs/reviews docs/research` |
| 明确 `doc-link-audit.md` 政策 | 当前脚本会生成 `docs/reviews/doc-link-audit.md` | 如果继续 tracked，则保留；如果改为生成物，则同步 `.gitignore`、`doc-generator.mjs`、引用文档 |
| 运行 rolling retention 预览 | 不手工删除 7 天窗口内报告 | `node scripts/report-retention.mjs` 输出 `0 stale` |

P0 退出条件：

```bash
git status --short
node scripts/report-retention.mjs
node scripts/doc-generator.mjs links
pnpm test:docs
git diff --check
```

### P1：引用驱动的 scorecard 合并

目标：减少 research 入口歧义，但不丢失 2026-06-07 和 W24 refresh 内容。

推荐路径：

1. 将 `capability-scorecard-w24-refresh.md` 的 W24 score movement 和证据合并进
   `capability-scorecard.md`。
2. 保留 `capability-scorecard.md` 作为 canonical scorecard。
3. 将 `capability-scorecard-w24-refresh.md` 归档到
   `docs/archive/2026-06-07/research/`，或改名为 dated appendix。
4. 更新 `docs/README.md` 的 research 入口，只保留 canonical + competitor update。
5. 修复 `capability-scorecard.md` front matter 中不存在的 `nla-*` / `nlq-*`
   inputs：要么移除，要么替换成实际存在的 archive/summary 证据。

P1 候选矩阵：

| 候选 | `rg` 结论 | 替换目标 | 移动类型 |
| --- | --- | --- | --- |
| `docs/archive/2026-06-07/research/capability-scorecard-w24-refresh.md` | 执行前 active planning 和 `docs/README.md` 引用旧 research 路径；执行后只保留 archive appendix 引用 | 已合并进 `docs/research/capability-scorecard.md`；`docs/README.md` Research 行只保留 canonical scorecard + competitor update | `merge-then-archive` |
| `docs/research/capability-scorecard.md` | architecture、feature specs、handoff contracts、planning 均引用 | 不移动；作为唯一 current scorecard | 不移动 |

P1 验证：

```bash
rg -n "capability-scorecard-w24-refresh|capability-scorecard.md" docs
node scripts/doc-generator.mjs links
pnpm test:docs
git diff --check
```

### P2：完成 stream 的批量归档（按批次，不跨批混合）

目标：把已关闭且不再作为 active evidence 的 review stream 移入 archive。

归档前每个 stream 必须满足：

- 关闭决策文件存在；
- outcome 已吸收到 current planning/contract；
- active docs 的引用会在同一提交中改到 archive 路径或摘要入口；
- 文件日期超出 rolling/active 窗口，或明确不受 rolling 窗口约束。

候选批次：

| 批次 | 初步状态 | 默认动作 |
| --- | --- | --- |
| `ain-*`、`gir-*` | 较早，候选归档价值高 | 可优先做一个小批次试运行 |
| `amw-*`、`awp-*` | 与 Workbench promotion scope 仍有关联 | 等 promotion checklist 吸收完成后再归档 |
| `ser-*` / `sl*` | Studio local stream，多数为 2026-06-03 | 先确认 Studio planning 是否仍引用 |
| `sceneview3d-src-*`、MapLibre gate、W24 quality、perf trend | 当前仍有 release/roadmap 参考价值 | 暂不归档 |

P2 首批试运行建议只选一个 stream，例如 `ain-*` 或 `gir-*`。如果 `rg` 结果
仍显示 active planning 依赖具体文件，则先把结论移入 `monthly-roadmap.md`、
`task-burndown.md`、`dependency-graph.md` 或 `REPORT_INDEX.md` 的摘要，再移动文件。

每个批次命令模板：

```bash
rg -n "<candidate-file-or-stream>" docs README.md AGENTS.md
mkdir -p docs/archive/2026-06-07/reviews
git mv docs/reviews/<file> docs/archive/2026-06-07/reviews/<file>
# 同一提交内修正所有 active links
node scripts/doc-generator.mjs links
pnpm test:docs
git diff --check
```

### P3：feature-spec 归档（仅做已吸收的规格）

目标：减少 `feature-specs/` 扫描负担，但保留仍定义当前边界的规格。

暂时保留：

| 文件 | 保留理由 |
| --- | --- |
| `ai-map-workbench-promotion-scope.md` | 当前 Workbench promotion intake checklist |
| `ai-map-workbench-product-boundary.md`、`ai-map-workbench-product-implementation.md` | Workbench 产品边界仍被 roadmap/architecture 引用 |
| `cloud-native-source-readiness.md`、`cloud-native-source-promotion-candidates.md` | 当前 PROD source runtime promotion 的输入 |
| `generated-app-review-console.md`、`generated-app-delivery-ux.md`、`natural-language-map-app-generation.md` | monthly roadmap、task burndown、dependency graph 仍引用 |
| `sceneview3d-*`、`spatial-analysis-*`、`studio-local-*` | 仍是当前能力边界或 promotion guardrail |

可候选归档的 feature spec 必须先证明：

```bash
rg -n "feature-specs/<file>" docs README.md AGENTS.md
```

如果结果只剩历史 review 或 archive，可归档；如果 active planning 仍引用，先合并摘要再移动。

P3 候选矩阵：

| 候选类型 | 当前判断 | 替换目标 |
| --- | --- | --- |
| current planning 仍引用的 spec | 暂不移动 | 对应 planning 摘要或 current contract |
| 只被 dated review 引用的 spec | 可进入小批次 | `docs/archive/2026-06-07/feature-specs/` 和 archive index |
| 已被 `docs/archive/2026-06-06/README.md` 标记 absorbed 的 spec | 优先复核 | canonical scorecard、engineering contract 或 README 状态行 |

### P4：CI artifact 政策

目标：明确哪些文件是 committed snapshot，哪些是 generated artifact。

暂不直接 `.gitignore`：

- `docs/planning/AGENT_HEALTH_DASHBOARD.md`
- `docs/planning/handoff-ledger.json`
- `docs/reviews/doc-link-audit.md`

需要先做一份 artifact policy：

| 文件 | 当前用途 | 决策选项 |
| --- | --- | --- |
| `AGENT_HEALTH_DASHBOARD.md` | `docs/README.md` automation health 入口 | 继续 committed snapshot，或改为 CI artifact 并更新 docs |
| `handoff-ledger.json` | HOC consumption state | 继续 committed snapshot，或改为 generated artifact 并更新 scripts/docs/tests |
| `doc-link-audit.md` | `doc-generator.mjs links` 输出 | 保留 tracked output，或改成 ignored generated report |

## 最终验收

每个阶段都必须独立提交、独立可回滚。最终合并前至少运行：

```bash
node scripts/report-retention.mjs
node scripts/doc-generator.mjs links
pnpm test:docs
git diff --check
```

如果归档影响 active planning、research、review index，还需运行：

```bash
pnpm build:schema
pnpm check
```

## 预期效果

本优化版不承诺一次性减少 45-55 个文件。更稳妥的目标是：

| 阶段 | 预期减少 | 说明 |
| --- | ---: | --- |
| P0 | 0 tracked 文件 | 只清理/处置未跟踪草稿和生成物政策 |
| P1 | 1 个 research 入口 | scorecard 合并后减少重复入口 |
| P2 | 10-20 个 review 文件 | 先做 AIN/GIR 小批次，再扩展到 AMW/AWP/Studio streams |
| P3 | 0-8 个 feature specs | 只移动已被 active planning 吸收的规格 |

总目标从“快速减少文件数”调整为“减少权威入口歧义”。文件数下降是副产品，不是首要指标。

## 变更记录

| 日期 | 版本 | 变更 |
| --- | --- | --- |
| 2026-06-07 | v2 optimized | 基于评审修正：撤销 canonical productization 删除建议；保留 Workbench promotion scope；scorecard 改为先合并再归档；P1/P2 改为引用驱动；新增 artifact policy 阶段 |
