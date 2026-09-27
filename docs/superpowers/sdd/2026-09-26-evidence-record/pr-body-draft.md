# PR body draft — EvidenceRecord 子项目 A（Task 1–8）

Written by the controller while the final fix round runs. Everything marked **@quality** is a decision
this branch deliberately did not self-approve.

## What ships

`EVIDENCE` 可信层：一条引擎自有的、可被第三方零依赖复算的证据记录。

1. **能力矩阵真相源**（Task 1/2）：`buildEngineCapabilityMatrix` 从 source readiness 推导，接进
   `get_context_summary` 与 `validate_spec` 的对外描述。
2. **哈希收敛**（Task 3）：`canonicalHash` 成为唯一实现，三处私有实现（`pmtiles-query.ts` 的
   `stableStringify` 等）改为消费共享字符串化。注意：`packages/engine/src/sources/pmtiles-query.ts`
   的改动属 Task 3 的哈希收敛（删私有实现、保留其 FNV 短 id 格式），**不是** PMTiles 子项目 B 的功能
   工作；spec §8 断言 5 仍然排除 PMTiles。
3. **`EvidenceRecord` + `verifyEvidenceRecord`**（Task 4/5）：TypeBox schema、结构化 `EVIDENCE.*`
   诊断码、六个断言、纯数据复算（不执行 `applyCommands`），`MAX_EVIDENCE_RECORD_BYTES` 拒绝而非截断。
4. **零依赖单文件 verifier**（Task 6）：`evidence-verifier.mjs` 由构建脚本内联
   `canonical-stringify` + `record`，构建期扫描模块描述符，任何非 `node:`/非 `BUNDLE` 依赖直接失败。
   三条独立纯度锁（源码 regex、浏览器侧 BFS、构建扫描、无 `node_modules` 实跑）。
5. **CLI 落盘绑定**（Task 7）：导出包写 `evidence.json` + `evidence-verifier.mjs`，manifest 角色与
   `requiredReviewFiles`，`--verify-artifacts` 侧的 record↔manifest 交叉核对。
6. **外部彩排**（Task 8）：`cli-install-smoke` 在真正隔离的 consumer 目录里以打包后的 verifier 复算，
   并验证篡改记录必须退出码 `2`；该步骤经 `release-verify` → `npm-release.yml` 是发布阻断门禁。

## Gate evidence

- `pnpm check`（build + test + studio）
- `pnpm test:agent-framework`、`pnpm test:docs`（`scripts/**` 属 coordination surface）
- `pnpm test:evidence`、`pnpm test:schema-sync`、`pnpm test:cli`
- 真实彩排报告：`docs/reviews/first-run-acceptance-2026-09-26.md`（`Status: passed`，含
  `Third-party evidence recompute | passed`）
- `pnpm size:check`（engine 239,763/262,144、cli 65,260/65,536；预算文件在本轮未被改动）
- 全分支评审 → 一轮修复（`6c68350`/`d682cdc`/`8e35115`）→ 定向复审 **Loop can close**（457 项聚焦门禁由
  复审者自己复跑）→ 复审者新增的两个 Minor 由控制者收尾（`f0376ba` 收窄 SKILL 的可验证声明并把
  `recordId` 复算钉进 docs 测试，`519e30f` 清理 Biome 报警）

## Visual snapshot waiver（@quality）

本分支不改动 renderer adapter、layer/source 变换、样式、snapshot 代码、URL/tile/worker、浏览器
example 或 resource policy；`apps/studio/vite.config.ts` 的最终 diff 为空（Task 3 一度想用
`rollupOptions.external: ["node:crypto"]` 掩盖模块边界问题，已完整回退，改为真正的子路径边界 +
BFS 守卫）。按 AGENTS.md 的 waiver 规则，这是 "explicitly labeled as non-rendering" 且无法改变视觉
输出的改动。请求 @quality 记录该 waiver。

## Public-contract delta（`pnpm schema:diff` 在这里是假阴性）

`scripts/schema-diff.mjs:23` 只扫 `packages/engine/src/spec/schemas/`，而证据契约在
`packages/engine/src/evidence/schema.ts` 与 `packages/cli` 表面，所以 `schema:diff` 打印
Breaking 0 / Non-Breaking 0 / Info 0 —— 这是漏报，不是干净报告。真实的九项 delta 见
`.superpowers/sdd/2026-09-26-evidence-record/task-7-report.md` §6（逐字）：新契约
`evidence-record.v0.1`、新导出路径 `@gis-engine/engine/evidence-verifier.mjs`、
`GenerationEvidenceBundleSchema` 增加可选 `recordId`、`evidence.json` **载荷格式替换（breaking，无兼容
层、无双写）**、`artifact-manifest.json` 的 `requiredReviewFiles` 精确数组与角色、`verifyArtifacts`
五个新诊断码（严格收紧）、mock provider 生成内容变化、engine 预算 204,800→262,144、
`GenerateResult.evidenceStatus` 增加 `"rejected"`。

## 需要 @quality 记名的决策

1. **`evidence.json` 格式替换的迁移**：旧包里的 `evidence.json` 是 `GenerationEvidenceBundle`，新包是
   `EvidenceRecord`；本分支选择不做兼容层（brief 明令），旧包行为由
   `tests/cli/evidence-export.test.ts:270-295` 用真实 key set 钉住并报 `EVIDENCE_RECORD_INVALID`。
2. **engine 预算 204,800 → 262,144**：实测归因 —— engine 236,057→237,324；证据子系统 ≈38.7 KB；
   非证据部分 197,354（main 本身在预算内）；只删 verifier 仍然超限（226,159）。
   `baselineBytes` 刻意留在 193,984 让回归可见。
3. **CLI 只剩 276 B 的 blocking 余量**（65,260/65,536 = 99.6%）：本分支**没有**擅自上调。任何无关的
   CLI 改动都会红掉一个 blocking 门禁。需要一个有 owner 的 issue 与 @quality 的判断，随本 PR 一起落地。
4. **`tests/docs/documentation-minimalism.test.ts` 豁免 `docs/superpowers/**`**：未在计划内（计划里
   grep 该测试为 0 命中），但由用户在对话中明确选择「把 superpowers 工件排除出口径（推荐）」，理由
   是过程工件不是产品文档，且重复内容锁仍覆盖 `docs/superpowers/**`。已在 SDD ledger 记名。
5. **没有 changeset**：实现者拒绝自行 bump 版本是正确的 —— semver 判断属 @quality；但没有 changeset
   意味着 `evidence.json` 的格式替换会在版本号不变的情况下发布，必须显式决定。
6. **`recordId` 目前无仓库内生产者**：`packages/ai/src/tools/generationEvidence.ts:417,614` 只有
   schema/类型；唯一指定消费者是分支门控的 Task 9。计划曾要求一处 `recordId` 回写，经评审确认无人
   读取后按代码事实删除。
7. **size 门禁的真实覆盖**：`pnpm check` 不含 `size:check`，且 `bundle-size.yml` 只在 `packages/**`
   触发，因此过去约 7 周该 "blocking" 门禁从未真正跑过；本分支是第一次。属于本地/CI 一致性的独立
   问题，本计划不修。

## Follow-ups owed（不在本 PR）

- **F1 残留（请求 @quality 判断检测完备性）**：打包 spec 复算以记录自己声明的 `role === "mapspec"`
  条目为键，因此一份**不声明**或**改角色**的 spec 文件仍会报 `DERIVATION_CLOSED passed`。省略那半边由
  `crossCheckEvidenceRecord`（`packages/cli/src/artifacts.ts:151-237`，`EVIDENCE_ARTIFACT_MISSING`）
  兜住；改角色那半边当前无人检测。关闭它要先决定"记录必须声明什么"，那是 spec 层面的问题，不是收尾代码
  改动。评审判断：这不是本次修复引入的新洞，修复只是严格缩小了伪造面。
- **verifier argv 的边角**：`--root a --root b` 取后者，`--root --json` 会把 `--json` 当目录名消费。
  仓库内没有任何调用方使用这两种形态，未知 flag 仍然 exit 1；记录在此，不在本 PR 修。
- `expectedCapabilities` 目前只有测试调用方（Task 9 是计划中的消费者）；`--verify-artifacts` 侧的
  能力漂移接线被有意推迟，并在威胁模型里对尽调方明确"单文件 verifier 无法检测漂移"。
- readiness→matrix 有三处拼法且互相不一致（`packages/ai/src/mcp/server.ts:894` 以 `report.valid`
  为门，`contextSummary.ts:216` 与 `generate.ts:745` 无条件推导）：`plan:552` 逐字如此规定，属计划
  缺陷；要么去掉门，要么用测试钉住差异。
- `scripts/gate-plan.mjs` 没有 `scripts/cli-install-smoke.mjs` 的行；彩排证据只在发布时产生。
- `docs/engineering/ci-test-strategy.md:69-75` 的失败模式枚举未提及证据复算。
