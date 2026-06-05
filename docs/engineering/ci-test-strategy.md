# CI 与测试策略

## 目标

CI 的目标不是只证明代码能编译，而是证明 AI 生成、修改和验证地图的核心闭环稳定。

必测闭环：

```txt
fixtures -> schema validation -> command replay -> renderer adapter -> snapshot -> exportSpec -> reload
```

## 计划脚本

当前 `package.json` 脚本为单一事实源；本节用于说明 gate 语义，更新脚本时必须同步此处。

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "build:schema": "pnpm --filter @gis-engine/engine build:schema && pnpm --filter @gis-engine/scene3d build && pnpm --filter @gis-engine/ai build:schema",
    "test": "pnpm test:schema && pnpm test:schema-sync && pnpm test:commands && pnpm test:patch && pnpm test:runtime && pnpm test:adapter && pnpm test:ai && pnpm test:cli && pnpm test:examples && pnpm test:docs && pnpm test:resources && pnpm test:perf:smoke && pnpm test:snapshot:smoke",
    "test:schema": "vitest run tests/schema/schema-fixtures.test.ts tests/schema/expression-validator.test.ts tests/schema/resource-policy.test.ts",
    "test:schema-sync": "vitest run tests/schema-sync",
    "test:commands": "vitest run tests/commands",
    "test:patch": "vitest run tests/patch",
    "test:runtime": "vitest run tests/runtime",
    "test:adapter": "vitest run tests/adapter",
    "test:examples": "vitest run tests/examples",
    "test:snapshot": "pnpm test:snapshot:smoke && pnpm test:snapshot:visual",
    "test:snapshot:smoke": "vitest run tests/snapshot/smoke",
    "test:snapshot:visual": "playwright test tests/snapshot/visual",
    "test:snapshot:update": "GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 SNAPSHOT_UPDATE=1 pnpm test:snapshot:visual",
    "test:ai": "vitest run tests/ai",
    "test:cli": "vitest run tests/cli",
    "test:qa-matrix": "vitest run tests/examples/qa-matrix.test.ts",
    "test:perf:smoke": "vitest run tests/perf",
    "test:perf:trend": "vitest run tests/perf/perf-trend-ledger.test.ts",
    "test:perf:nightly": "vitest run tests/nightly-perf",
    "test:resources": "vitest run tests/resources",
    "test:docs": "vitest run tests/docs",
    "test:studio": "vitest run tests/studio",
    "test:release:scene3d": "vitest run tests/snapshot/smoke/scene3d-release-visual-gate.test.ts",
    "test:release:rc": "pnpm build:schema && pnpm check && pnpm test:snapshot:visual",
    "test:release:strict": "pnpm build:schema && pnpm check && GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual",
    "check": "pnpm build && pnpm test && pnpm test:studio"
  }
}
```

目录约定、fixture 规则和 snapshot baseline 管理策略见下文各章节。

## Required Gates

CI 分为 PR、main-nightly、release 三档。PR 目标是稳定阻断确定性问题，main-nightly 负责尽早发现视觉环境和 baseline 漂移，release 负责完整验收。

| Gate | PR | main-nightly | release |
| --- | --- | --- | --- |
| schema sync | 必跑且阻断 | 必跑且阻断 | 必跑且阻断 |
| schema fixtures | 必跑且阻断 | 必跑且阻断 | 必跑且阻断 |
| command replay | 必跑且阻断 | 必跑且阻断 | 必跑且阻断 |
| diagnostics codes | 必跑且阻断 | 必跑且阻断 | 必跑且阻断 |
| MapLibre adapter contract | 必跑且阻断 | 必跑且阻断 | 必跑且阻断 |
| snapshot smoke | 必跑且阻断 | 必跑且阻断 | 必跑且阻断 |
| snapshot visual | 条件运行；无 GPU/WebGL 时生成 skipped report，不阻断 | 条件运行；环境可用时阻断，环境不可用时告警并归档 | 必跑且阻断；或 `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1` 时必跑且阻断 |
| WebGL2 lite contract | 否 | 如果声明 experimental 则运行 | 是，如果声明 experimental |
| AI tool contract | 必跑且阻断 | 必跑且阻断 | 必跑且阻断 |
| resource release | 必跑且阻断 | 必跑且阻断 | 必跑且阻断 |
| perf smoke | 否 | `pnpm test:perf:nightly` 条件运行；失败告警 | `pnpm test:perf:nightly` 必跑且阻断 |
| perf trend | 否 | `pnpm test:perf:trend` 周度运行并归档趋势报告 | `scripts/perf-trend.mjs` 生成的 `docs/reviews/perf-trend-*.md` 周度证据 |
| migration tests | 变更 schema 时必跑且阻断 | 变更 schema 时必跑且阻断 | 必跑且阻断 |

`GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1` 会把 `snapshot:visual` 从可降级 gate 提升为强制 gate。该环境变量适用于 release、手动验收、baseline 更新和任何需要确认真实 MapLibre GL 渲染的 CI job。

## Fixtures

建议目录：

```txt
tests/fixtures/
  specs/
    valid/
    invalid/
  commands/
    valid/
    invalid/
    replay/
  data/
    geojson/
    pmtiles/
    raster/
  snapshots/
    baselines/
```

fixture 规则：

- valid spec 必须能 `createMap -> snapshot -> exportSpec -> reload`。
- invalid spec 必须包含预期 diagnostic code。
- command replay fixture 必须包含 before、commands、after。
- 所有 fixtures 禁止依赖随机公网服务。

## Snapshot Harness

Snapshot 分为两层：

- `snapshot:smoke`：必跑。使用 Node/Vitest 和 adapter contract 验证 `load -> snapshot -> exportSpec` 的结构化结果、diagnostics 和状态一致性，不要求真实 WebGL；当前覆盖 GeoJSON、vector tile 和 gated `fill-extrusion-lite`。
- `snapshot:visual`：条件跑。使用 Playwright、真实浏览器和真实 MapLibre GL canvas 验证像素健康度和可选 baseline diff。当前覆盖 GeoJSON 基础场景、本地生成 MVT 的 vector tile release 场景和 gated `fill-extrusion-lite` beta 场景。
- `scene3d.release.visual`：release-runner 3D smoke gate。当前没有稳定
  SceneView3D renderer，因此 gate 以 `snapshotScene3DMock`、
  `queryScene3DMock` 和可选 renderer visual evidence 组成；release 模式下
  如果没有真实 renderer visual evidence，必须带 coordinator waiver 和 follow-up
  task id，且 waiver 不能绕过 pending resource、blank scene、layer/source 或
  query evidence 诊断。直接命令是 `pnpm test:release:scene3d`，默认也包含在
  `pnpm test:snapshot:smoke` / `pnpm check` 中。

工具：

- Playwright。
- 固定 Chromium baseline。
- Safari/WebKit 和 Firefox 做兼容 smoke。

`snapshot:visual` 流程：

```txt
probe browser + GPU/WebGL capability
start example server
open fixture page
wait for map idle
capture canvas pixels
run snapshot validation
compare optional baseline
collect browser console warnings/errors
write SnapshotReport
```

环境探测失败时：

- PR：写入 `skipped: true` 和 `skipReason`，归档 report 与 console log，不阻断。
- main-nightly：写入 `skipped: true` 和 `skipReason`，归档 report，并产生 CI warning。
- release 或 `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1`：探测失败等同 `snapshot:visual` 失败，必须阻断。

默认判定：

- canvas 存在且尺寸正确。
- non-transparent pixels 大于阈值。
- changed pixels from background 大于阈值。
- target layer pixels 大于阈值，若 adapter 不支持则返回 warning。
- browser console 没有 error。
- renderer diagnostics 没有 error。

Baseline 管理：

- baseline 存放在 `tests/fixtures/snapshots/baselines/`。
- actual、diff、report 输出到 `test-results/snapshots/`。
- 默认允许 `0.5%` 像素差。
- 单像素颜色 delta 默认阈值为 `10`。
- 没有 baseline 时生成 warning 和 actual image，不直接失败。
- 只有显式运行 `pnpm test:snapshot:update` 才能更新 baseline。

SnapshotReport:

```ts
export interface SnapshotReport {
  passed: boolean;
  skipped: boolean;
  skipReason?: {
    code: "BROWSER_UNAVAILABLE" | "WEBGL_UNAVAILABLE" | "GPU_UNAVAILABLE" | "BASELINE_MISSING" | "UNSUPPORTED_ADAPTER";
    message: string;
  };
  mode: "smoke" | "visual";
  ciTier: "pr" | "main-nightly" | "release" | "local";
  width: number;
  height: number;
  pixelRatio: number;
  nonTransparentPixels: number;
  changedPixelsFromBackground: number;
  targetLayerPixels?: Record<string, number>;
  diagnostics: Diagnostic[];
  consoleErrors: string[];
  artifacts: {
    actualImage?: string;
    diffImage?: string;
    reportJson?: string;
    consoleLog?: string;
  };
}
```

## Command Replay Tests

每个 command 必须覆盖：

- valid apply。
- dry-run。
- repeated apply 幂等。
- baseRevision mismatch。
- atomic rollback。
- best-effort partial apply。
- export 后重新加载一致。
- conflict 只返回 `CONFLICT.BASE_REVISION`，v0.1 不自动 retry 和 three-way merge。

示例 fixture：

```txt
tests/fixtures/commands/replay/style-update/
  before.map.json
  commands.json
  after.map.json
  expected-results.json
```

## Adapter Contract Tests

所有 renderer adapter 共用同一套 contract tests。

必测：

- `getCapabilities()`。
- `load(spec)`。
- `applyPatch(patch)`。
- `queryFeatures(point)`。
- `queryFeatures(bbox)`。
- `snapshot()`。
- `resize()`。
- `destroy()`。
- error/warning event 转换。

MapLibre adapter 和 WebGL2 lite adapter 的一致性只要求覆盖交集：

- GeoJSON。
- raster。
- background。
- fill。
- line。
- circle。

Contract harness 必须通过 `tests/adapter/createAdapterContractSuite.ts` 复用，不允许每个 adapter 自己写一套不一致的测试。

## AI Tool Contract Tests

工具：

- `validate_spec`
- `apply_commands`
- `explain_spec`
- `snapshot_spec`
- `export_spec`
- `get_context_summary`
- `export_example_app`

规则：

- tool descriptor 必须有 `inputSchema` 和 `outputSchema`。
- output 必须结构化。
- 不允许只返回自然语言。
- tool 不直接访问 renderer 私有对象。
- tool failure 必须返回 diagnostic code。

## Performance Smoke

v0.1 release 前至少运行：

| 场景 | 目标 |
| --- | --- |
| 1k GeoJSON features | create + render 不超过 1s |
| 10k GeoJSON features | create + render 不超过 3s |
| 100k GeoJSON features | 允许 warning，不允许崩溃 |
| pan/zoom 5s | 无连续 long task 超过 500ms |
| queryFeatures point | p95 不超过 50ms |
| snapshot 1024x768 | 不超过 2s |
| destroy | 无残留 raf、listener、worker |

这些不是长期性能承诺，只是防止当前可发布线出现明显不可用状态。当前 PR 级 perf smoke 仍是小样本确定性 guard；更大的 1k/10k/100k 场景保留给 nightly/release runner，perf trend 则在周度 workflow 中归档为审查证据，避免把不稳定的大数据压测放进默认 `pnpm check`。

## Current Gate Evidence

截至 2026-05-17 v0.2 checkpoint：

- `pnpm build:schema` 覆盖 engine 和 AI schema artifact。
- `pnpm check` 覆盖 build plus schema、schema-sync、commands、patch、runtime、adapter、AI、examples、resources、perf smoke、snapshot smoke。
- 默认 `pnpm test:snapshot:visual` 通过 2 个 Playwright 场景：GeoJSON 和 generated local MVT。
- `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` 需要具备 Chromium/WebGL 权限的 runner；当前 macOS 默认沙箱会因 Chromium Mach port 权限失败。

## Resource Release Tests

`destroy()` 必须验证：

- DOM event listener 被移除。
- requestAnimationFrame 被取消。
- worker 被 terminate 或归还 pool。
- WebGL buffer/texture/program 被释放或 adapter 报告不可直接验证。
- tile cache 清空。
- 后续调用 `snapshot` 和 `queryFeatures` 返回明确错误。
- 浏览器无法直接验证的 WebGL resource 必须在 `ResourceReport` 标记 `verifiable: false` 和原因，不能空报成功。

## CI 输出

CI 必须归档：

- schema artifacts。
- validation reports。
- command replay reports。
- snapshot images。
- snapshot reports。
- performance smoke reports。
- resource reports。

这些产物用于 AI eval 和回归分析。
