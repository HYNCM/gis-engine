# v0.1 工程实施蓝图

## 目标

本文件把二次评审中剩余的高优先级问题转成实现级蓝图。它不替代 contract 文档，而是说明第一版代码应该如何组织脚本、测试、策略和参考实现。

实施顺序必须遵守：

```txt
schema -> command/patch -> diagnostics -> adapter harness -> snapshot harness -> AI tools -> examples -> CI
```

## 1. Schema CI 自动化

### 目录约定

```txt
packages/
  engine/
    src/
      spec/
        schemas/
          map-spec.schema.ts
          command.schema.ts
          diagnostics.schema.ts
          tool.schema.ts
        index.ts
    scripts/
      build-schema.ts
    dist/
      schema/
        mapspec.v0.1.schema.json
        commands.v0.1.schema.json
        diagnostics.v0.1.schema.json
        ai-tools.v0.1.schema.json
tests/
  schema/
    schema-sync.test.ts
    schema-fixtures.test.ts
  fixtures/
    specs/
      valid/
      invalid/
```

### 生成流程

```txt
pnpm --filter @gis-engine/engine build:schema
  -> import TypeBox schemas
  -> emit dist/schema/*.schema.json
  -> stable stringify with 2-space indentation
  -> validate emitted schemas with Ajv
```

### schema-sync 测试

`tests/schema/schema-sync.test.ts` 必须做三件事：

- 重新执行 schema build 到临时目录。
- 与仓库中的 `dist/schema/*.json` 做 byte-for-byte 比对。
- 若不同，输出需要运行的命令并失败。

### fixture 测试

规则：

- `valid/*.json` 必须通过 Ajv。
- `invalid/*.json` 必须失败。
- 每个 invalid fixture 必须包含同名 `.diagnostics.json`，列出预期 diagnostic code。

示例：

```txt
tests/fixtures/specs/invalid/layer-source-missing.map.json
tests/fixtures/specs/invalid/layer-source-missing.diagnostics.json
```

## 2. Command Apply 参考流程

### apply 伪代码

```ts
async function apply(commands, options = {}) {
  const mode = options.transaction ?? "atomic";
  const dryRun = options.dryRun ?? false;
  const before = clone(currentSpec);
  const results = [];
  const stagedPatches = [];

  for (const command of commands) {
    const validation = validateCommand(command, currentSpec);
    if (!validation.valid) {
      const failed = failedResult(command, validation.diagnostics);
      if (mode === "atomic") return rollbackAll(before, [...results, failed], dryRun);
      results.push(failed);
      continue;
    }

    if (command.baseRevision && command.baseRevision !== currentSpec.revision) {
      const failed = conflictResult(command, currentSpec.revision);
      if (mode === "atomic") return rollbackAll(before, [...results, failed], dryRun);
      results.push(failed);
      continue;
    }

    const patch = buildPatch(command, currentSpec);
    const normalizedPatch = normalizePatch(patch);
    const inversePatch = invertPatch(currentSpec, normalizedPatch);
    const diagnostics = validatePatch(normalizedPatch, currentSpec);

    if (hasError(diagnostics)) {
      const failed = failedResult(command, diagnostics);
      if (mode === "atomic") return rollbackAll(before, [...results, failed], dryRun);
      results.push(failed);
      continue;
    }

    const nextSpec = applyJsonPatch(currentSpec, normalizedPatch);
    const postDiagnostics = validateSpec(nextSpec);

    if (hasError(postDiagnostics)) {
      const failed = failedResult(command, postDiagnostics);
      if (mode === "atomic") return rollbackAll(before, [...results, failed], dryRun);
      results.push(failed);
      continue;
    }

    const result = successResult(command, normalizedPatch, inversePatch, nextSpec.revision);
    results.push(result);
    stagedPatches.push(normalizedPatch);
    if (!dryRun) currentSpec = nextSpec;
  }

  if (!dryRun) await adapter.applyPatch(flatten(stagedPatches), renderContext);
  return results;
}
```

### 事务策略

| 模式 | 行为 | 使用场景 |
| --- | --- | --- |
| `atomic` | 任一失败则整批不改变 state | AI 默认操作、用户批量修改 |
| `best-effort` | 成功命令保留，失败命令返回诊断 | 人类开发调试、迁移脚本 |
| `dryRun` | 不改变 state，但返回 patch、inversePatch、diagnostics | AI 预检查、review、权限审批 |

### 并发策略

v0.1 默认不做自动合并。

`baseRevision` 不匹配时：

- 返回 `CONFLICT.BASE_REVISION`。
- 返回当前 `revision`。
- 如果能安全重放，提供 `SuggestedFix`，类型为 `command`，confidence 为 `medium`。
- 不自动 retry。
- 不做 three-way merge。

three-way merge 放入 v0.2 backlog。

## 3. JSON Patch 工具要求

建议内部模块：

```txt
packages/engine/src/spec/patch/
  buildPatch.ts
  invertPatch.ts
  normalizePatch.ts
  validatePatch.ts
  sortChangedPaths.ts
```

规则：

- patch path 必须使用 JSON Pointer。
- path 必须规范化，不能包含重复斜杠。
- `changedPaths` 来源于 patch path，并稳定排序。
- `inversePatch` 必须基于 patch 前 spec 生成。
- `remove` 和 `replace` 必须记录旧值，否则不能生成 inverse。
- patch 应用后必须重新跑 `validateSpec`。

禁止：

- 直接深度 merge spec。
- 在 command handler 中手写对象突变。
- 生成无法反向恢复的 patch 却标记为 applied。

## 4. Adapter Contract Harness

### 目录约定

```txt
tests/
  adapter/
    createAdapterContractSuite.ts
    maplibre-adapter.contract.test.ts
    webgl2-lite-adapter.contract.test.ts
  fixtures/
    adapter/
      basic-geojson.map.json
      raster-basemap.map.json
      unsupported-layer.map.json
```

### contract suite 流程

```txt
create adapter
getCapabilities
load valid spec
wait idle
snapshot
applyPatch
queryFeatures point
queryFeatures bbox
resize
snapshot again
destroy
assert ResourceReport
```

### 本地服务模板

Adapter tests 需要统一 local server：

```txt
tests/utils/startStaticServer.ts
  input: root directory
  output: { url, close }
```

要求：

- 默认绑定 `127.0.0.1`。
- 随机可用端口。
- 只服务 fixtures 和 examples。
- 测试结束必须 close。
- 禁止依赖公网资源。

## 5. Snapshot Baseline 管理

### 目录和产物

```txt
tests/fixtures/snapshots/baselines/
  basic-geojson.chromium.png
  raster-basemap.chromium.png
test-results/snapshots/
  actual/
  diff/
  reports/
```

### 判定策略

Snapshot validation 分两层：

1. Health check：必须通过。
2. Baseline diff：有 baseline 时执行。

Health check:

- canvas 尺寸正确。
- renderer 无 error。
- non-transparent pixels >= 阈值。
- changed pixels from background >= 阈值。
- target layer pixels >= 阈值，若 adapter 不支持 layer mask 则 warning。

Baseline diff:

- 默认允许 `0.5%` 像素差。
- 单个像素颜色 delta 默认阈值为 `10`。
- 没有 baseline 时不失败，但必须生成 actual image 和 warning。
- 更新 baseline 必须显式运行 `pnpm test:snapshot:update`。

### CI artifact

CI 必须归档：

- actual images。
- diff images。
- `SnapshotReport` JSON。
- browser console logs。
- renderer diagnostics。

## 6. Expression Validator 参考算法

### 类型集合

```ts
type ExprType =
  | "unknown"
  | "null"
  | "boolean"
  | "number"
  | "string"
  | "color"
  | "array"
  | "object";
```

### 推导流程

```txt
parse JSON array
validate operator arity
infer child expression types
infer operator output type
compare output type with paint/layout expected type
emit diagnostics
```

### 关键规则

- `get` 默认返回 `unknown`。
- 如果 fixture 提供 sample feature schema，则 `get` 可以返回具体类型。
- `to-number` 输出 number，但输入为 object/array 时 warning。
- `to-string` 输出 string。
- `literal` 输出 literal 对应类型。
- `case` 所有 output branch 必须兼容。
- `match` 所有 output branch 必须兼容。
- `interpolate` output 必须是 number 或 color。
- `step` output branch 必须兼容。
- 颜色属性接受 `color` 或可解析为 color 的 string。

诊断：

- operator 未知：`EXPR.UNKNOWN_OPERATOR`。
- 参数数量错误：`EXPR.INVALID_ARITY`。
- 类型不匹配：`EXPR.TYPE_MISMATCH`。
- 颜色解析失败：`EXPR.INVALID_COLOR`。
- 属性未知：`EXPR.PROPERTY_UNKNOWN` warning。

## 7. Security 和 URL Policy

### ResourcePolicy

```ts
export interface ResourcePolicy {
  allowedSchemes: Array<"http:" | "https:" | "file:" | "data:" | "blob:">;
  allowedHosts?: string[];
  allowedPathPrefixes?: string[];
  maxResourceBytes?: number;
  timeoutMs?: number;
}
```

### 默认策略

v0.1 默认策略：

- 允许相对 URL。
- 允许 `http://127.0.0.1:*` 和 `http://localhost:*`。
- 允许明确配置的 `https` host。
- 禁止任意 `file:`。
- 禁止未配置公网 host。
- 远程资源默认超时 `10000ms`。
- PMTiles 和 GeoJSON fixture 必须走相对路径或 localhost。

失败返回：

- `SECURITY.URL_BLOCKED`
- `SECURITY.RESOURCE_TIMEOUT`
- `SECURITY.RESOURCE_TOO_LARGE`

### CSP 建议

示例应用默认 CSP：

```txt
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self' http://127.0.0.1:* http://localhost:*;
worker-src 'self' blob:;
```

## 8. SuggestedFix Governance

自动修复必须经过策略层。

```ts
export interface FixPolicy {
  allowAutoApply: boolean;
  allowedAuthors: Array<"human" | "agent" | "system">;
  allowedFixKinds: Array<"json-patch" | "command">;
  requireDryRun: boolean;
  maxPatchOperations: number;
}
```

默认策略：

- `allowAutoApply: false`。
- 只有 human confirmed 或 system migration 可以自动应用。
- agent 生成的 fix 必须先 dry-run。
- destructive patch 需要 human approval。
- 自动修复必须写入 `CommandTrace`。

High confidence 不等于自动执行。它只表示 fix 可机器执行，是否执行由 policy 决定。

## 9. Resource Release Assertions

### ResourceTracker

```ts
export interface ResourceTracker {
  eventListeners: number;
  animationFrames: number;
  workers: number;
  webglBuffers: number;
  webglTextures: number;
  webglPrograms: number;
  tileCacheEntries: number;
}
```

### destroy 测试流程

```txt
create map
load fixture
pan/zoom once
snapshot once
capture ResourceTracker before destroy
call destroy
capture ResourceReport
assert listeners == 0 or adapter reports unverifiable
assert raf == 0
assert workers == 0 or returned to pool
assert tile cache == 0
call snapshot and expect RENDER.DESTROYED
call queryFeatures and expect RENDER.DESTROYED
```

对于浏览器无法直接验证的 WebGL resource，adapter 必须返回：

```ts
{
  verifiable: false,
  reason: "Browser does not expose live WebGL resource counts"
}
```

不能用空报告假装释放成功。

## 10. 下一步实施顺序

1. 初始化 `pnpm workspace`。
2. 创建 `packages/engine` 和 `packages/ai`。
3. 添加 TypeBox、Ajv、Vitest、Playwright。
4. 实现 schema build 和 schema-sync test。
5. 实现 patch utilities。
6. 实现 command dry-run/apply reference path。
7. 实现 diagnostics code registry。
8. 实现 adapter contract harness。
9. 实现 snapshot health check。
10. 添加 4 个 fixtures 示例。

## 11. 当前落地状态

本仓库已经开始从蓝图进入最小实现：

- 已创建 root workspace 配置。
- 已创建 `packages/engine` 和 `packages/ai`。
- 已创建 TypeBox schema、schema build 脚本和 Ajv validation 入口。
- 已创建 JSON Patch 工具、`applyCommands` 最小实现和 command replay fixture。
- 已创建 adapter contract suite 模板和本地静态服务工具。
- 已创建基础 GeoJSON 示例和 AI map edit 示例。

仍未实现：

- MapLibre adapter。
- Playwright snapshot harness。
- MCP server。
- expression validator。
- URL policy runtime。
- GitHub Actions workflow。
