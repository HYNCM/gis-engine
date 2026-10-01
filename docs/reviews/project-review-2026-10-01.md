---
agent: quality
period: 2026-10-01
generated_at: 2026-10-01T04:22:25Z
repo_revision: "6e3093a17d7b47137eb50c7b68d69f5572821f4b"
inputs:
  - AGENTS.md
  - README.md
  - docs/planning/agent-handoff-contracts.md
  - docs/engineering/ci-test-strategy.md
  - git working tree including uncommitted visual baseline changes
  - /tmp/gis-engine-core-review-20261001.md
  - /tmp/gis-engine-workbench-ai-review-20261001.md
  - /tmp/gis-engine-delivery-review-20261001.md
  - /tmp/gis-engine-review-20261001-check.log
  - /tmp/gis-engine-review-20261001-visual.log
  - https://github.com/HYNCM/gis-engine/actions/runs/36698078018
  - https://github.com/HYNCM/gis-engine/actions/runs/36806226829
owner: "@quality"
decision_level: blocking
gate_result: block
handoff_contract: HOC-N3
scope: current project and working tree; review only
model_routing: inherited session; no explicit model override
---

评审结论：基础架构和现有测试具备较好的工程基础，但本轮发现 **6 项 P1、3 项 P2**。建议在解决安全边界、真实相机行为和发布通路问题前暂缓新发布；本轮未提交的像素基线改动也不应直接放行。这里的 block 是有复现证据的质量建议，不是自动执行的合并或发布决定。

HOC-N3 阻塞分类：`GATE.RESOURCE_POLICY_FAIL`（P1-1 至 P1-3 的资源/请求信任边界违规）。该分类来自定向复现；下文明确列出各已执行 gate 的通过结果与环境限制。

范围是当前提交及开始评审时已有的工作区改动。未修改实现、测试、已有文档或规划状态；新增本报告。没有发布包、提交 PR 评论或创建 Issues。复现使用临时项目，假远程资源在浏览器中被截获，没有读取真实外部资源或调用 AI provider。

项目当前定位清晰：Workbench 是独立的 0.x 本地预览产品，engine/ai/cli 的 v1.5.0 不代表 Workbench 已达到 GA；稳定 `view.mode: "scene3d"` 仍然被阻塞。Schema-first、命令事务、结构化诊断、MCP 14-tool 契约与 renderer adapter 分界有可执行测试支撑。SceneView3D 的通过证据包含 synthetic Canvas2D frame，不能作为真实 3D renderer 晋级依据。依据：[README](../../README.md)、[MCP 契约测试](../../tests/ai/mcp-contract-convergence.test.ts)、[Scene3D visual spec](../../tests/snapshot/visual/scene3d-three-adapter.spec.ts)。

**P1-1：反斜杠网络路径绕过资源主机白名单。**

定位：[resource-policy.ts](../../packages/engine/src/spec/resource-policy.ts)，第 83–92 行。仅 `//` 被识别为网络路径；两个反斜杠开头的 `\\tiles.example.com/points.geojson` 被按相对路径放行。默认策略的 `validateResourceUrl` 返回 `[]`，`validateSpec` 返回 `valid: true`，transformer 保留原串；但 WHATWG URL 解析后指向外部主机。真实 Chromium/MapLibre 复现中，`addSource + addLayer` 均返回 `applied`，并发起 `http://tiles.example.com/points.geojson` 请求，已被 Playwright 截获。

- Evidence：`/tmp/gis-engine-core-review-repro.log`、`/tmp/gis-engine-camera-review/repro.log`；主评审也独立复核了 validation → URL resolution → transformer 转发路径。
- Impact：安全、AI 安全。主机白名单无法约束来自不可信 MapSpec 的实际请求，且缺少预期 `SECURITY.URL_BLOCKED` 诊断。
- Action：`@builder`（engine）统一资源引用解析规则，在相对路径放行前检查反斜杠及混合分隔符网络路径；目标为 resource-policy 实现、schema resource-policy 回归和浏览器请求验证；`@quality` 验收。
- Confidence：high。

**P1-2：应用计划时绕过明确的网络资源确认。**

定位：[workbench-service.mjs](../../apps/workbench/server/workbench-service.mjs)，第 335–374 行；对照预览的第 284–290 行。创建包含 GeoJSON URL `http://127.0.0.1:8080/private.geojson` 和 `resourceRequests: [{kind: "url", resource: "…", confirmed: false}]` 的合法计划。预览返回 `WORKBENCH.NETWORK_CONFIRMATION_REQUIRED`；相同计划使用正确的 hash/project/baseRevision 直接 apply，却返回 `ok: true`，revision 从 0 变为 1，并持久化该 URL。

- Evidence：Workbench 专项报告的实际复现输出；apply API 第 484 行直接进入上述路径。复现没有实际访问该 URL。
- Impact：安全、AI 可操作性。服务端接受了计划明确标记为未确认的资源，后续渲染可能访问它。本发现不依赖“所有 API 是否都必须先 preview”的产品约定。
- Action：`@builder` 在 apply 提交边界再次校验确认状态，并从命令/结果推导新增资源，防止漏填 `resourceRequests` 绕过；目标为 Workbench API 回归，验证拒绝后 revision 和文件不变；`@quality` 验收。
- Confidence：high。

**P1-3：本地 HTTP 服务接受外部 Origin 的文件写入请求。**

定位：[index.mjs](../../apps/workbench/server/index.mjs)，第 1763–1773 行及 body parser 第 122–164 行。真实本地服务器收到 `Origin: https://example.invalid`、`Content-Type: text/plain` 的 JSON `POST /api/projects/review-project/data/attach` 后返回 HTTP 200，创建数据文件并使 revision 0→1。请求进入路由前没有 Origin/Host 校验或对应的授权校验。

- Evidence：Workbench 专项报告包含响应和持久化结果，使用全新临时 project root。
- Impact：安全。允许浏览器简单媒体类型携带跨来源写入，存在 CSRF 边界缺口。复现是实际 HTTP 请求，未声称已在所有浏览器中完成网页攻击；PNA/LNA 等浏览器限制可能影响部分请求路径。
- Action：`@builder` 增加可信 Origin/Host 校验、JSON mutation 媒体类型限制和服务端不可猜测的授权 token 或等效机制；目标为实际 HTTP server 的拒绝用例，验证无文件/revision 变动；`@quality` 验收。
- Confidence：high（请求被接受和写入已验证；网页攻击可达性取决于浏览器环境）。

**P1-4：setView / fitBounds 返回成功，真实 MapLibre 相机不更新。**

定位：[MapLibre adapter](../../packages/engine/src/renderer/maplibre/adapter.ts)，第 181–183 行；相关 [buildPatch.ts](../../packages/engine/src/commands/buildPatch.ts) 第 116–142 行和 [styleDiff.ts](../../packages/engine/src/renderer/maplibre/styleDiff.ts) 第 26–43 行。命令生成整个 `/view` 替换，增量逻辑仅识别 `/view/center` 等字段路径，回退只调用 `setStyle`。附带的 `/revision` 也会触发未识别路径的回退。

真实 Chromium/WebGL 中，初始相机为 center `[120,30]`、zoom `5`、bearing `0`。应用 `setView({center:[110,20],zoom:8,bearing:45})` 并等待 idle，返回 `applied`，exportSpec 为新视图，真实相机仍为旧值。接着 `fitBounds([100,10,105,15])` 也成功且 spec 更新，相机仍不移动。

- Evidence：`/tmp/gis-engine-camera-review/repro.log`，同时记录 command result、exportSpec 和 idle 后的真实 camera；使用当前源码及真实 MapLibre。
- Impact：用户、正确性、AI 可操作性。命令成功证据与 snapshot/query 所观察的地图不一致，居中、缩放和范围聚焦失效。
- Action：`@builder`（adapter）显式同步整个 view/bounds 到相机，正确处理 revision 元数据；目标为真实浏览器 command → camera → snapshot 回归；`@quality` 验收。
- Confidence：high。

**P1-5：main 自动发布没有依赖同一提交的完整质量门禁。**

定位：[release.yml](../../.github/workflows/release.yml)，第 54–58、80–86 行；[publish-ga-packages.mjs](../../scripts/publish-ga-packages.mjs)，第 66–83 行。main push 的发布通路只做 schema build/build，随后直接 `pnpm release:publish`；publisher 检查 token 和版本是否已发布后调用 `pnpm publish --no-git-checks`，没有运行 `pnpm check` 或等待同 SHA 的 CI 成功。真实发布入口也未在这条路径执行要求的严格视觉门禁。

- Evidence：workflow 和 publisher 完整控制流；同 SHA 的 CI/Release 成功记录仅证明这次运行成功，不能补上发布依赖关系。没有执行真实发布。
- Impact：发布质量。新版本能在确定性测试失败、或 CI 尚未结束时进入 npm 发布。手动/tag 入口的 `release:verify` 也需检查严格视觉步骤，目前该 wrapper 未运行该 suite。
- Action：`@orchestrator` 组织 CI framework 修复，`@builder` 实现；目标为所有真实 publish 入口依赖同 SHA 的 release gates，包含安装 smoke 与严格视觉，或符合仓库条件的明确 waiver；`@quality` 验证失败 gate 不会到达 publish。
- Confidence：high。

**P1-6：新像素基线只有 macOS，Ubuntu 严格视觉门禁缺少参考帧。**

此项属于开始评审时已有的**未提交改动**。定位：[playwright.config.ts](../../playwright.config.ts)，第 15–16 行，及新 `tests/__snapshots__/**` 中五张 `*-darwin.png`。配置使用 `{-platform}`，PR quality 在 Ubuntu 运行，所以期待 `*-linux.png`。新增基线没有对应 Linux 文件。

在独立临时目录，用实际 PNG 和已安装的 Playwright 1.60.0，设 `CI=1 GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1` 并采用 Linux 后缀复现：首次退出 1，提示缺失参考帧，同时把 actual 写入 baseline；不设 `SNAPSHOT_UPDATE` 再跑则退出 0。不能把首次行为描述为自动通过。没有在本机运行真实 Ubuntu/WebGL，结论来自明确的平台路径规则及隔离 matcher 复现。

- Evidence：`/tmp/gis-engine-review-20261001-linux-baseline-repro.log`、[Ubuntu PR runner](../../.github/workflows/pr-quality.yml) 第 80–108 行和基线文件清单。
- Impact：合并可靠性、视觉证据。当前 macOS 的 5 项通过不能证明 Ubuntu PR 可以通过；普通运行写参考帧也违反仅显式更新 baseline 的策略。
- Action：`@builder`（qa）在规范 Ubuntu runner 显式生成并审查 Linux 基线，或让严格 gate 使用与基线相符的平台；普通比较采用 `updateSnapshots: "none"`，显式更新才开启写入；目标为跨平台 gate 和缺失 baseline 拒绝且不写参考帧的行为验证；`@quality` 验收。
- Confidence：high。

**P2-1：destroy 等待期间重置队列，允许操作跨越销毁。**

定位：[MapRuntime.ts](../../packages/engine/src/runtime/MapRuntime.ts)，第 159–166 行。destroy 先把 applyQueue 改为已完成 Promise，再等旧队列；closing 状态尚未设置。受控 Promise adapter 复现顺序为 `apply-start-1 → apply-start-2 → apply-end-1 → destroy → apply-end-2`，第二个操作在销毁后仍返回 `applied`。

- Evidence：`/tmp/gis-engine-core-review-repro.ts`、`/tmp/gis-engine-core-review-repro.log`；通过手动 Promise 控制，未依赖 sleep 时长。
- Impact：正确性、资源生命周期。卸载与异步编辑相遇时打破串行化，并可能访问已释放 renderer。
- Action：`@builder`（engine）在 destroy 开始同步进入 closing 状态，拒绝新操作并等待已受理队列；目标为生命周期并发回归；`@quality` 验收。
- Confidence：high。

**P2-2：合法项目名含引号时，导出成功但生成代码无法解析。**

定位：[delivery.ts](../../packages/cli/src/delivery.ts)，第 147 行；HTML 同类插值见 [templates/index.ts](../../packages/cli/src/templates/index.ts) 第 244 行。合法名称 `Cities "2026"` 导出 preview/commit 都返回 `ok: true`，生成 `console.error("[Cities "2026"] failed …", error)`，TypeScript parser 返回两条 TS1005。

- Evidence：Workbench 专项报告中的实际导出和 parser 输出。
- Impact：产品、开发者体验。artifact 哈希验证通过，但用户按交付说明构建会失败。
- Action：`@builder`（CLI）对 JS 字符串用 JSON 序列化，对 HTML 使用文本转义；目标为带引号、反斜杠、换行等名称的生成代码解析/构建回归；`@quality` 验收。
- Confidence：high。

**P2-3：独立修改像素基线或 Playwright 配置不会选到像素比较门禁。**

定位：[gate-plan.mjs](../../scripts/gate-plan.mjs)，第 163–184 行。调用生产 `buildGatePlan`，仅 `playwright.config.ts` 或新 PNG 路径变动时只选 diff/schema/check；仅 Scene3D visual spec 变动时只多选 smoke。`pnpm check` 不运行实际像素 matcher。当前整组改动因同时修改 MapLibre visual spec，已经选中严格 gate；缺口在后续独立改配置、基线或 Scene3D visual 的变更。

- Evidence：主评审和交付专项均调用生产 planner，所得 command 清单一致。
- Impact：门禁可靠性。不匹配的参考帧或 comparator 配置可以取得 path-aware pass，延后到下次 renderer PR 才暴露。
- Action：`@orchestrator` / `@builder`（qa）把配置、`tests/__snapshots__/**` 和整个 `tests/snapshot/visual/**` 纳入严格 visual 触发条件；目标为生产 planner 的独立路径行为测试；按 framework change 执行框架测试，`@quality` 验收。
- Confidence：high。

**已执行的验证与证据范围**

本地环境为 macOS、Node 26.0.0、pnpm 11.9.0。未切换或安装运行时。

| 验证 | 结果 | 原始证据 |
| --- | --- | --- |
| `pnpm build:schema` | pass | `/tmp/gis-engine-review-20261001-schema.log` |
| `pnpm check` | pass；103 个测试文件、1401 项测试，含框架、资源、MCP、smoke、Workbench | `/tmp/gis-engine-review-20261001-check.log` |
| `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` | pass；5 项；macOS baseline | `/tmp/gis-engine-review-20261001-visual.log` |
| `pnpm test:release:scene3d` | pass；7 项；不授予稳定 3D 晋级 | `/tmp/gis-engine-review-20261001-scene3d.log` |
| scene3d-three-adapter build | pass | `/tmp/gis-engine-review-20261001-adapter-build.log` |
| `pnpm test:workbench:e2e` | pass；1 项 Mock golden path | `/tmp/gis-engine-review-20261001-workbench-e2e.log` |
| `pnpm test:e2e:browser` | pass；5 项真实浏览器集成 | `/tmp/gis-engine-review-20261001-browser.log` |
| `pnpm test:compat:maplibre` | pass；5.24.0 与 6.1.0 | `/tmp/gis-engine-review-20261001-compat.log`、`test-results/maplibre-compatibility/summary.json` |
| `pnpm lint` | pass；24 warnings、2 infos | `/tmp/gis-engine-review-20261001-lint.log` |
| 相对文档链接扫描 | pass；596 个 tracked markdown、0 broken；沿用脚本提取规则，只读执行 | `/tmp/gis-engine-review-20261001-doc-links.log` |
| `git diff --check` | pass | 本轮命令输出 |
| `pnpm release:preflight` | fail；本地 Node 26，要求 `.nvmrc` 的 Node 22；其余 probe pass | `/tmp/gis-engine-review-20261001-preflight.log` |

Node 版本导致的 preflight 失败属于本地环境限制，未记为源码缺陷。本轮没有跑完整 Node 22 `release:verify`、真实 provider smoke 或真实 Ubuntu 新基线比较；没有据此宣称完整 release-ready。通过既有测试也不解除上述有直接复现的 P1/P2。

2026-10-01 本轮只读查询确认，同 SHA 的 [CI](https://github.com/HYNCM/gis-engine/actions/runs/36698078018)、[Release](https://github.com/HYNCM/gis-engine/actions/runs/36698077940) 和 [Deploy Docs](https://github.com/HYNCM/gis-engine/actions/runs/36698077868) 均为 success。这里的 Release success 不等于本轮审查了每个发布 gate，也不代表一定新发布了包。

[Agent Daily Cadence](https://github.com/HYNCM/gis-engine/actions/runs/36806226829) 则因 SLA/HOC evidence 过期退出 2：orchestrator 约 1019h、product 约 1354h、quality 约 1020h、docs 约 1354h。证据为该 run 的 failed logs，保存在 `/tmp/gis-engine-review-20261001-ci-failed.log`。运作建议（advisory）：`@orchestrator` 组织对应专家刷新实质报告并完成交接消费，目标为有效 SLA/HOC evidence；影响是规划与门禁输入可信度，confidence high。不要把 stale report 失败归因于当前源码 build。

**HOC-N3 八项检查**

| Area | 结果 |
| --- | --- |
| Architecture | schema/extension/adapter 分界基本清晰；未发现需另列的依赖越界 |
| AI operability | block：命令成功证据与真实相机不一致，资源确认可绕过 |
| Commands | P2：destroy 窗口打破串行化；常规事务测试通过 |
| Diagnostics | block：资源策略漏报 `SECURITY.URL_BLOCKED`，apply 未执行已有确认诊断 |
| Tests | 既有 gates pass；定向复现暴露未覆盖行为，Ubuntu 新基线缺口明确 |
| Docs | 产品/3D 口径清晰；导出可构建性和 baseline 显式更新策略被复现反例推翻 |
| Security | block：资源主机约束和本地 HTTP 信任边界有实证缺口 |
| TypeScript | 仓库 build pass；特定合法项目名的导出代码有 TS1005 |

三份专项报告均已读取，revision 与本报告一致，并检查 required front matter、八项 checklist、定向证据及限制；其全项目 gate 状态以主评审上表为准。下面记录本轮消费的报告内容哈希，报告和复现脚本位于临时目录；本文件已保留关键条件与结果，避免结论仅依赖临时日志。

| 输入报告 | SHA-256 |
| --- | --- |
| `/tmp/gis-engine-core-review-20261001.md` | `5d598609df1997f4e5fd8dfb2cd412cdf17b828589c7eb413bd3ae34a225f87a` |
| `/tmp/gis-engine-workbench-ai-review-20261001.md` | `a56ed5948e5fc9c7804230e6a23e58dd81e0133bf7753346078dd46e17319cf3` |
| `/tmp/gis-engine-delivery-review-20261001.md` | `00f87ad3dc20aecafcd6258c4027e795fbc4f3f57a06aca495988546088e1cc1` |

建议修复顺序为资源策略和 Workbench 提交/来源校验、真实相机同步、发布依赖与跨平台视觉闭环，然后处理三个 P2。修复后由 `@quality` 重跑针对性回归及适用 gates，再把最终 HOC-N3 交给 `@orchestrator`。本报告不更新规划状态，也不授予稳定 SceneView3D 晋级。
