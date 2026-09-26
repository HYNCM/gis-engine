# EvidenceRecord：AI 原生 + 对外可验证的交付证据契约

```yaml
agent: product + orchestrator (design)
period: 2026-W39
generated_at: 2026-09-26T15:26:08Z
repo_revision: "41c340e (codex/workbench-v1) / ca106da (main)"
inputs:
  - packages/engine/src/commands/applyCommands.ts
  - packages/engine/src/sources/{pmtiles-query.ts,readiness.ts}
  - packages/engine/src/spec/scene3d-promotion-gate.ts
  - packages/ai/src/tools/generationEvidence.ts
  - apps/workbench/server/export-service.mjs
  - scripts/first-run-acceptance.mjs
  - scripts/release-preflight.mjs
owner: "@builder(engine/ai) 实现，@quality 门禁判定，@orchestrator 记录状态"
decision_level: advisory
status: design-approved-pending-spec-review
```

## 1. 目标与定位

本设计只服务两个承诺，其余一律不服务：

1. **AI 原生**：agent 能在没有人工说明书的情况下发现自己能用什么、上次改了什么、结果如何被验证过。
2. **可信可交付**：一次 AI 改动结束后，产出一个第三方**不需要访问我们的 CI、不需要安装我们的包**就能独立复算的证据工件。

目标读者：**WebGIS 工程师**。可信的交付对象：**外部尽调 / 客户验收**。

竞品事实（2026-09-26 联网核对，来源见 §10）：上游已在占"给 AI agent 的地图知识入口"（MapLibre 官方 agent-skills，含
`maplibre-pmtiles-patterns`，2026-07-29 更新）。因此本项目的差异化不能建立在"AI 也能用地图引擎"，只能建立在
"AI 的改动可被第三方独立复算"。

## 2. 已确认的范围决定

| 决定 | 内容 |
| --- | --- |
| 复算形态 | **A3 分层双轨**：可信层包内自含结论与哈希链；深核层（重新回放 / 重新渲染）显式标注需引用条件 |
| 可信层断言 | **T1 未被篡改 + T2 可追溯** |
| 契约归属 | **E2**：`EvidenceRecord` 是 `packages/engine` 的公开契约，其余各方均为消费者 |
| 数据入口 | **D3**：PMTiles 单文件源接进运行时，使数据本体可哈希、可入包 |
| 暂缓 | **T3 结果一致（像素 + 渲染环境指纹）** 暂缓；**T4 可独立执行重放** 归深核层 |
| 明确不做 | F scene3d 稳定化、G 新增 MCP 工具、H Workbench 全面产品化 |

被 F/G/H 三条否决逼出的硬约束：**能力自描述不得通过新增 MCP 工具实现**，只能扩现有工具的 envelope。

## 3. 现状事实（设计的前提，非推测）

- `packages/ai/src/tools/generationEvidence.ts:599-614` 已存在 `GenerationEvidenceBundle`（promptHash / commandEvidence /
  plannerEvidence / snapshotEvidence / exportEvidence / diagnostics），但其 schema 是手写 JSON Schema 对象
  （:266）+ `Ajv({ strict: false })`（:620），不符合仓库的 TypeBox schema-first 规则，且未注册为 MCP 工具。
  本设计把它**收敛**为 `EvidenceRecord` 的 ai 侧视图，而不是并列第二套契约。
- 哈希规范化有三份互不相同的实现：`packages/engine/src/sources/pmtiles-query.ts:762`（私有 `stableStringify`）、
  Workbench 的 `createWorkbenchCanonicalHash`、`generationEvidence.ts:1296` 直接用 `JSON.stringify`。
  最后一份是键序相关的：**不收敛则 T1 在最基本的意义上不成立**。
- T2 所需的骨架已存在但从未被串起来：`MapCommand.author` 与 `command.sourcePromptHash` 已进入命令契约并被
  `applyCommands.ts:193-195` 写进 `CommandTrace`；`inversePatch`（:112）、`baseRevision/nextRevision`（:191-192）同样已有。
- 导出包已有证据物理载体：`artifact-manifest.json`（逐文件 `path/role/bytes/sha256`）、`preflight.json`、
  WIP 新增的 `delivery-summary.json`，角色分类在 `apps/workbench/server/export-service.mjs:289-294`，
  receipt 绑定在 :178-193。
- 外部上手验收已有雏形框架：`scripts/first-run-acceptance.mjs`（默认 30 分钟预算，串 `cli-install-smoke` +
  `release-preflight`，输出到 `docs/reviews/first-run-acceptance-*.md`）。
- capability 真相源已有两处：`packages/engine/src/spec/scene3d-promotion-gate.ts`（`DEFAULT_SCENE3D_PROMOTION_GATE = "blocked"`）
  与 `packages/engine/src/sources/readiness.ts`。本设计**不新增第三份清单**。

## 4. 架构与单元边界

| 单元 | 位置 | 单一职责 | 依赖方向 |
| --- | --- | --- | --- |
| U1 证据核心 | `packages/engine/src/evidence/` | `canonicalHash()` 唯一实现、`EvidenceRecord` TypeBox schema、`verifyEvidenceRecord()` 纯函数、`EVIDENCE.*` 诊断码 | 只依赖 engine 内 spec/command |
| U2 哈希收敛 | engine + 三个调用方 | 用 U1 替换 pmtiles-query 私有实现、Workbench 实现、ai 的 `JSON.stringify` | 单向消费 U1 |
| U3 AI 面 | `packages/ai` | `GenerationEvidenceBundle` 改为 `EvidenceRecord` 视图；`export_spec` 返回记录；`get_context_summary` 输出 capability 矩阵；`validate_spec` 返回 blocked 清单 | 消费 U1，工具名与数量不变 |
| U4 CLI / 导出落盘 | `packages/cli` | `evidence.json` 写入导出包并纳入 manifest 角色 | 消费 U1 |
| U5 Workbench | `apps/workbench/server` | 导出包与 receipt 绑定 `recordId`；不自行定义证据字段 | 消费 U1 |
| V 可信层 | U1 内纯函数 + 零依赖单文件 verifier | 只复算哈希链闭合与 `plan→commands→specHash` 推导一致；不渲染、不联网 | 无外部依赖 |
| V 深核层 | 现有 `applyCommands` 重放 + 视觉快照 | 显式标注"需引用条件"，不在可信层承诺 | 消费 U1 |

边界规则：**证据契约只存在于 engine，其余四方都是消费者。** 因此 Workbench 分支是否合并（当前 PR #67 / #112
的合并顺序仍未定）不阻塞对外交付。

## 5. `EvidenceRecord` 契约字段

| 字段 | 承载 | 现状 |
| --- | --- | --- |
| `schemaVersion` | 版本演化 | 新 |
| `recordId` = `canonicalHash(去掉 recordId 的正文)` | T1 | 新 |
| `project: { id, baseRevision, revision }` | T2 | 已有来源 |
| `origin: { actor, promptHash?, planHash?, providerKind }` | T2 | 已有来源，未串联 |
| `commands: [{ command, outcome, diagnostics[], inversePatchHash }]` | T2 | 已有 `CommandTrace`，未序列化入记录 |
| `spec: { beforeHash, afterHash, diff }` | T2 | 依赖 U2 收敛后才成立 |
| `artifacts: [{ path, role, bytes, sha256 }]` | T1 | 已有来源 |
| `capabilities: { available[], blocked[{ code, reason }] }` | T2 | 由 §3 的两处真相源生成 |
| `toolchain: { engineVersion, nodeMajor, pnpmVersion }` | T1 | `release-preflight.mjs` 已在采集 |
| `issuedAt`、`issuer` | T1 | 新 |
| `exclusions: ["VISUAL_CONSISTENCY", "OFFLINE_REPLAY"]` | 反过度声称 | 新，**必留** |

字段级规则：

- `commands` 装**完整 `MapCommand` 原文**（有限的配置增量，非数据本体）。记录总体积受 `体积检查` 门禁约束，
  **超限则拒绝导出，不截断字段**——截断字段的证据包等于自毁 T1。
- `exclusions` 必须显式存在且默认非空。AGENTS.md 禁止把未验证能力写成产品主张；T3/T4 是被主动推迟的，
  若不写明，外部尽调方会自行脑补并在被追问时形成失信。
- `evidence.json` 只被引用、不被二次修改：下游（receipt、CLI 落盘、Workbench）只能追加自己的哈希绑定。

## 6. 数据流

```
AI: plan(promptHash) → applyCommands(traces, inversePatch)
CLI/Workbench: 项目 revision 历史 + 导出暂存文件
        ↓
buildEvidenceRecord(specBefore, specAfter, commands, artifacts, capabilities, toolchain)
        ↓ canonicalHash()（engine 唯一实现）
recordId = canonicalHash(body 去掉 recordId)
        ↓
evidence.json → 导出包 manifest（role: "evidence"）
        ↓
receipt / 导出结论绑定 recordId

第三方复算：取包 → node evidence-verifier.mjs evidence.json → { ok, assertions[], diagnostics[] }
```

设计决定与其代价：

1. **可信层 verifier 必须可独立分发**：`verifyEvidenceRecord()` 在 engine 实现，构建时额外产出零依赖单文件
   `evidence-verifier.mjs`（仅用 `node:crypto`）。若复算必须先安装 `@gis-engine/engine`，T1 即退化为 A1 引用型。
   代价：同一逻辑两份实现，必须有结论一致性测试。
2. **capability 矩阵从既有真相源生成**（promotion gate + readiness），不新造清单，避免第三处漂移源。
3. **D3 PMTiles 走 protocol 适配**，不引入渲染分支，保持 `RendererAdapter` 边界；依赖引入需过资源策略与体积门禁。

## 7. 错误处理

新增 `EVIDENCE.*` 稳定诊断码，全部结构化，禁止自然语言 throw：

| 码 | 触发 | 为何不可合并 |
| --- | --- | --- |
| `EVIDENCE.RECORD_INVALID` | 记录不过自身 schema | 构造期错误 |
| `EVIDENCE.CHAIN_BROKEN` | `recordId` 与正文复算不符 | 篡改与损坏必须可区分：前者是安全事件，后者是实现缺陷 |
| `EVIDENCE.ARTIFACT_MISMATCH` | 文件哈希与记录不一致 | 尽调方需能定位到具体文件 |
| `EVIDENCE.DERIVATION_FAILED` | `plan→commands→specHash` 推导不闭合 | T2 专属失败 |
| `EVIDENCE.SCHEMA_VERSION_UNSUPPORTED` | verifier 遇到更新的 `schemaVersion` | verifier 版本会先于记录老化 |
| `EVIDENCE.CAPABILITY_DRIFT` | 记录内 capability 与 engine gate 实际值不一致 | 防止 gate 变更后记录仍声称 blocked |

策略：

- `verify()` 的返回形态固定为 `{ ok: boolean, assertions: Array<{ id, status, detail }>, diagnostics: Diagnostic[] }`，
  不返回 boolean。`id` 取稳定枚举
  `"CHAIN_CLOSED" | "ARTIFACTS_MATCH" | "DERIVATION_CLOSED" | "TOOLCHAIN_RECORDED" | "VISUAL_CONSISTENCY" | "OFFLINE_REPLAY"`；
  `status` 取 `"passed" | "failed" | "not-covered"`。**在当前范围下 `VISUAL_CONSISTENCY` 与 `OFFLINE_REPLAY` 恒为
  `not-covered`**（对应 T3 暂缓、T4 归深核层）；被主动排除的能力必须以 `not-covered` 显式出现在断言清单里，
  不得静默缺席——这是 `exclusions` 字段在对外的复算结论中的落点。
- 构建期失败 ⇒ 整个导出失败，绝不产出半证据包。

## 8. 验收断言（先于实现冻结）

实现前必须落成可执行测试，禁止"做完再定义成功"：

1. 对合法记录改动任意一个字节 ⇒ `EVIDENCE.CHAIN_BROKEN`。
2. 记录中 `spec.afterHash` 与命令序列重算结果不符 ⇒ `EVIDENCE.DERIVATION_FAILED`。
3. manifest 内某文件被替换 ⇒ `EVIDENCE.ARTIFACT_MISMATCH`，且路径指向该文件。
4. engine 版 `verifyEvidenceRecord()` 与零依赖单文件 verifier 对同一 fixture 输出**序列化后完全相同**的
   `{ ok, assertions, diagnostics }`（比较字符串，不做深度宽松相等）。
5. 一个 PMTiles 源项目导出的包内，数据文件哈希入链，且复算不访问任何网络端点。
6. 记录缺 `exclusions` 或缺任一根骨架字段（`recordId`/`project`/`commands`/`spec`/`artifacts`）⇒ schema invalid。

## 9. 测试与门禁

| 层 | 内容 |
| --- | --- |
| schema | `tests/schema/evidence-record.test.ts`：正向 fixture + 每个必填字段缺失的负向 |
| 单元 | `tests/evidence/`：canonicalHash 键序无关性、recordId 复算 |
| 负向 | §8 断言 1–3 的破坏性实验；必须验证测试是承重的（把实现替换成旧行为时测试应失败） |
| 双实现 | §8 断言 4 |
| MCP 契约 | 14 工具名字与数量不变，仅 `export_spec` / `get_context_summary` / `validate_spec` 的 `outputSchema` 变化；**是否算 breaking change 由 @quality 判定，实现方不自行放行** |
| 体积 | `evidence.json` 与 verifier 单文件计入 `体积检查` / package-size policy |
| 上游漂移 | MapLibre 兼容矩阵保持不变；D3 不新增渲染路径 |
| 外部彩排 | `first-run-acceptance.mjs` 增加"第三方复算"步骤，按 §8 断言 5 走一遍 |

门禁影响：新增公开契约 ⇒ `pnpm build:schema`、`pnpm check`、MCP contract 必需。
**视觉快照门禁判定为可豁免**，理由必须写入 PR：本设计不触碰 renderer adapter、样式转换、快照代码、视觉 fixture、
URL/tile/worker 资源路径（T3 已暂缓，D3 仅走 protocol 适配）。豁免仍需通过确定性门禁与 smoke 快照。

## 10. 实施顺序与遗留问题

顺序：**第 0 步** capability 矩阵（U3 的 `get_context_summary` + `validate_spec` 两半）→ **第 1 步** U1 的
`canonicalHash()` 与 U2 哈希收敛（必须同一提交，否则收敛过程中会出现"新哈希调旧实现"的中间态）→ **第 2 步**
U1 的 `EvidenceRecord` schema + `verifyEvidenceRecord()` + 零依赖 verifier → **第 3 步** U4/U5 落盘与 receipt 绑定 →
**第 4 步** D3 PMTiles。

capability 放最前，是因为它的字段被 `EvidenceRecord.capabilities` 引用，后做会让记录契约返工。
`canonicalHash` 必须先于记录契约，因为 §8 断言 1 的成立依赖键序无关的哈希。

**本设计包含两个可独立交付的子项目，需各自成 plan：**

- 子项目 A（第 0–3 步）：证据契约与可信层复算。这是本 spec 的主体。
- 子项目 B（第 4 步）：PMTiles 运行时接入。它有自己的依赖引入、资源策略与体积评估面，且不参与 §8 的 1–4、6 断言；
  只有断言 5 依赖它。把它并进同一个 plan 会让 A 的交付被 B 的依赖决策拖住。

本设计不解决、且明确留给后续的问题：

- T3 视觉一致性所需"渲染环境指纹"契约完全未定义；上游 MapLibre 一月连发 v6.5→v6.11.2，一旦启用 T3 就是持续成本。
- 零依赖 verifier 与 engine 实现的长期一致性维护是双份负担。
- `EvidenceRecord` 对外即成公开接口，字段演化需版本化策略（本设计只留 `schemaVersion` 与
  `EVIDENCE.SCHEMA_VERSION_UNSUPPORTED`，未定义迁移规则）。
- 外部验收缺裁判：Workbench v1 验收协议仍卡在需要点名 5 位目标 WebGIS 工程师，没有他们，"可信"缺独立第三方验证。
- PR #112（Studio 修复）与 `codex/workbench-v1` 的合并顺序仍未定；#112 的修复在此分支上会被 `apps/studio` 删除吞掉。
- W4 其余自然语言 throw（`applyPatch.ts` 等）只被部分收掉，未列入本切片。

## 11. 证据来源（外部信息均为 2026-09-26 核对）

- https://github.com/maplibre/maplibre-gl-js/releases （v6.11.2，2026-09-24）
- https://deck.gl/docs/whats-new （v9.4，WebGPU 实验、elevation-aware controller、`pickable:'3d'`）
- https://felt.com/blog/a-brand-new-era-of-gis （2026-06-02；RBAC + 审计日志，未声明配置版本化）
- https://carto.com/ai-agents/ （直连 BigQuery/Redshift/Snowflake/Databricks，提供 MCP 接入）
- https://github.com/maplibre/maplibre-agent-skills/blob/main/skills/maplibre-pmtiles-patterns/SKILL.md （2026-07-29）
- https://www.maplibre.org/maplibre-gl-js/docs/examples/pmtiles-source-and-protocol/
- https://docs.protomaps.com/pmtiles/maplibre
- https://modelcontextprotocol.io/specification/2026-07-28
