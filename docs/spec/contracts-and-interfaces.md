# Contracts and Interfaces

## 目标

本文件把外部评审中指出的工程缺口转成可实现的接口契约。所有实现必须优先满足这些 contract，再扩展功能。

脚本位置、测试 harness、参考伪代码和默认策略见 [../engineering/implementation-playbook.md](../engineering/implementation-playbook.md)。

## Schema 和类型同步

### 单一事实来源

v0.1 采用 TypeBox schema 作为单一事实来源：

- TypeBox schema 生成 JSON Schema。
- TypeScript 类型通过 `Static<typeof Schema>` 得到。
- Ajv 负责 runtime validation。
- 发布物包含 `dist/schema/*.json`。

不允许手写一套 JSON Schema 再手写一套 `.d.ts`。

### CI 同步规则

CI 必须运行：

```txt
pnpm build:schema
pnpm test:schema-sync
pnpm test:schema-fixtures
```

校验内容：

- 生成的 schema 与仓库提交版本一致。
- 所有 valid fixtures 通过。
- 所有 invalid fixtures 失败且返回预期 diagnostic code。
- `metadata` 和 `extensions` 允许扩展字段，其他顶层字段默认禁止 unknown field。

## MapSpec Contract

```ts
export interface MapSpec {
  version: "0.1";
  id?: string;
  revision?: string;
  capabilities?: CapabilityRequest;
  view: ViewSpec;
  sources: Record<string, SourceSpec>;
  layers: LayerSpec[];
  interactions?: InteractionSpec;
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}
```

规则：

- `version` 必填。
- `sources` key 是 source id。
- `layers` 是有序数组，顺序即渲染顺序。
- layer id 必须唯一。
- layer source 必须引用已存在 source。
- `revision` 由 runtime 维护，用于并发冲突检测。
- 实验字段只能进入 `extensions`。

## Command Contract

### 命令基础字段

```ts
export interface MapCommandBase {
  id: string;
  version: "0.1";
  type: string;
  baseRevision?: string;
  author?: {
    type: "human" | "agent" | "system";
    id?: string;
    name?: string;
  };
  reason?: string;
  createdAt?: string;
  sourcePromptHash?: string;
  dryRun?: boolean;
}
```

### v0.1 命令集合

```ts
export type MapCommand =
  | AddSourceCommand
  | RemoveSourceCommand
  | AddLayerCommand
  | RemoveLayerCommand
  | SetPaintCommand
  | SetLayoutCommand
  | ReorderLayerCommand
  | SetViewCommand
  | FitBoundsCommand;
```

### 事务语义

```ts
export interface ApplyOptions {
  dryRun?: boolean;
  transaction?: "atomic" | "best-effort";
  collectTrace?: boolean;
}
```

规则：

- 默认 `transaction` 是 `atomic`。
- `atomic` 模式下任一命令失败，整批命令不改变 runtime state。
- `best-effort` 模式下成功命令保留，失败命令返回 `failed`。
- `dryRun` 不改变 runtime state，但必须返回将要产生的 patch、diagnostics 和 capability warnings。
- `baseRevision` 不匹配时返回 `CONFLICT.BASE_REVISION`。
- v0.1 默认不做自动合并；冲突只返回诊断和可选中等置信度 `SuggestedFix`，three-way merge 后置到 v0.2。

### Patch 格式

v0.1 使用 RFC 6902 JSON Patch。

```ts
export interface CommandResult {
  commandId: string;
  status: "applied" | "skipped" | "failed";
  baseRevision?: string;
  nextRevision?: string;
  changedPaths: string[];
  patch?: JsonPatchOperation[];
  inversePatch?: JsonPatchOperation[];
  diagnostics: Diagnostic[];
  traceId?: string;
}
```

规则：

- `patch` 表示实际变更。
- `inversePatch` 用于 rollback。
- `changedPaths` 必须稳定排序。
- `skipped` 用于幂等命令，例如重复添加完全相同的 source。
- `failed` 必须包含至少一个 error diagnostic。
- patch path 必须是规范 JSON Pointer；`remove` 和 `replace` 必须记录旧值以生成 `inversePatch`。
- v0.1 只声明并实现 `add`、`remove`、`replace`。`move`、`copy`、`test` 后置，避免类型承诺超过实现能力。

## Diagnostic Contract

```ts
export interface Diagnostic {
  severity: "error" | "warning" | "info";
  code: DiagnosticCode;
  message: string;
  path?: string;
  relatedResources?: RelatedResource[];
  fix?: SuggestedFix;
}
```

### Code 命名空间

| 命名空间 | 示例 | 含义 |
| --- | --- | --- |
| `SPEC` | `SPEC.UNKNOWN_FIELD` | MapSpec 结构错误 |
| `SRC` | `SRC.NOT_FOUND` | source 错误 |
| `LAYER` | `LAYER.DUPLICATE_ID` | layer 错误 |
| `EXPR` | `EXPR.TYPE_MISMATCH` | expression 错误 |
| `VIEW` | `VIEW.OUT_OF_DATA_BOUNDS` | 视图错误 |
| `RENDER` | `RENDER.ADAPTER_ERROR` | 渲染错误 |
| `SNAPSHOT` | `SNAPSHOT.BLANK_CANVAS` | 截图验证错误 |
| `CAPABILITY` | `CAPABILITY.UNSUPPORTED` | 能力协商错误 |
| `COMMAND` | `COMMAND.INVALID_PATCH` | 命令错误 |
| `CONFLICT` | `CONFLICT.BASE_REVISION` | 并发冲突 |
| `MIGRATION` | `MIGRATION.UNSUPPORTED_VERSION` | 迁移错误 |
| `SECURITY` | `SECURITY.URL_BLOCKED` | 安全策略错误 |

### SuggestedFix

```ts
export interface SuggestedFix {
  kind: "json-patch" | "command" | "manual";
  confidence: "high" | "medium" | "low";
  message: string;
  patch?: JsonPatchOperation[];
  command?: MapCommand;
}
```

规则：

- `high` confidence fix 必须可由机器执行，但不等于自动执行。
- `manual` fix 只能给人类或 AI 解释，不能自动执行。
- 一个 diagnostic 最多给一个首选 fix，避免 AI 选择歧义。
- 自动应用必须经过 `FixPolicy`，默认需要 human confirmation 或 system migration 权限。

## Renderer Adapter Contract

```ts
export interface RendererAdapter {
  readonly id: string;
  readonly version: string;

  getCapabilities(): Promise<CapabilityReport>;
  load(spec: NormalizedMapSpec, context: RenderContext): Promise<void>;
  applyPatch(patch: JsonPatchOperation[], context: RenderContext): Promise<AdapterApplyResult>;
  queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult>;
  snapshot(options: SnapshotOptions): Promise<SnapshotResult>;
  resize(size: { width: number; height: number }): void;
  destroy(): Promise<ResourceReport>;

  on(event: "error" | "warning" | "stats", listener: AdapterEventListener): Unsubscribe;
}
```

### CapabilityReport

```ts
export interface CapabilityReport {
  renderer: string;
  dimensions: Array<"2d" | "2_5d" | "3d">;
  sources: string[];
  layers: string[];
  expressions: string[];
  queries: string[];
  snapshot: {
    supported: boolean;
    formats: Array<"png" | "jpeg" | "data-url">;
  };
  experimental: string[];
}
```

Adapter contract tests 必须验证：

- `load -> snapshot -> destroy` 成功。
- `applyPatch` 后 `exportSpec()` 和 renderer state 一致。
- unsupported layer 返回 `CAPABILITY.UNSUPPORTED`。
- adapter error 转成 `RENDER.ADAPTER_ERROR`。
- `destroy()` 返回资源释放报告。
- contract harness 必须使用本地静态服务、固定 fixtures、无公网依赖。

## Snapshot Contract

```ts
export interface SnapshotOptions {
  width?: number;
  height?: number;
  pixelRatio?: number;
  format?: "png" | "jpeg" | "data-url";
  targetLayers?: string[];
  validation?: SnapshotValidationOptions;
}

export interface SnapshotValidationOptions {
  minNonTransparentPixels?: number;
  minChangedPixelsFromBackground?: number;
  minTargetLayerPixels?: number;
  maxRendererErrors?: number;
}
```

默认阈值：

- `minNonTransparentPixels`: `100`
- `minChangedPixelsFromBackground`: `100`
- `minTargetLayerPixels`: `20`
- `maxRendererErrors`: `0`

Baseline diff 策略：

- health check 必须通过。
- 有 baseline 时允许默认 `0.5%` 像素差。
- 单像素颜色 delta 默认阈值为 `10`。
- 没有 baseline 时生成 warning 和 actual image，不直接失败。
- 更新 baseline 必须显式运行 snapshot update 命令。

算法要求：

- 固定 viewport 和 pixel ratio。
- 等待 renderer idle 或超时。
- 读取 canvas pixels。
- 统计 alpha 大于 0 的像素。
- 统计与背景色不同的像素。
- 如果 adapter 支持 layer mask，统计目标图层可见像素。
- 无法统计目标图层时返回 warning，不伪造通过。

## Expression 子集

v0.1 只支持 JSON-array expression 子集：

```txt
Expression =
  ["get", propertyName]
  ["literal", value]
  ["case", condition, trueValue, falseValue]
  ["match", input, label, output, ..., fallback]
  ["interpolate", ["linear"], input, stopInput, stopOutput, ...,]
  ["step", input, defaultOutput, stopInput, stopOutput, ...]
  ["zoom"]
  ["to-number", input]
  ["to-string", input]
```

类型规则：

- paint property 声明 expected type。
- expression validator 必须推导 output type。
- output type 不匹配时返回 `EXPR.TYPE_MISMATCH`。
- 属性不存在时返回 warning `EXPR.PROPERTY_UNKNOWN`，不直接失败。
- 颜色字符串必须通过 color validator。
- `get` 在没有 sample feature schema 时输出 `unknown`。
- `interpolate` 输出只能是 number 或 color。
- `case`、`match`、`step` 的输出分支必须类型兼容。

## Migration Contract

```ts
export interface Migration {
  from: string;
  to: string;
  migrate(spec: unknown): MigrationResult;
}

export interface MigrationResult {
  spec?: MapSpec;
  diagnostics: Diagnostic[];
  appliedPatches: JsonPatchOperation[];
}
```

规则：

- 每个 breaking schema change 必须提供 migration。
- migration 必须可 dry-run。
- migration 输出必须通过目标版本 schema。
- 不支持版本返回 `MIGRATION.UNSUPPORTED_VERSION`。

## Audit 和 Trace

```ts
export interface CommandTrace {
  traceId: string;
  commandId: string;
  startedAt: string;
  endedAt: string;
  author?: MapCommandBase["author"];
  reason?: string;
  sourcePromptHash?: string;
  diagnostics: Diagnostic[];
  changedPaths: string[];
}
```

规则：

- `apply` 默认记录内存 trace。
- `exportSpec()` 不默认包含 trace，除非显式开启。
- `sourcePromptHash` 只保存 hash，不保存原始 prompt。
- destructive command 可被 policy layer 拦截。

## Concurrency Contract

v0.1 使用 optimistic concurrency。

- `revision` 由 runtime 维护。
- command 可携带 `baseRevision`。
- 不匹配时拒绝并返回 `CONFLICT.BASE_REVISION`。
- 不做自动 retry。
- 不做 three-way merge。
- 若命令可安全重放，可以返回 confidence 为 `medium` 的 `SuggestedFix`。
- 所有冲突必须写入 trace。

## Security Contract

- `MapSpec` 不允许执行任意 JavaScript。
- expression 必须纯函数化。
- URL source 必须经过 allowlist 或 policy check。
- 默认只允许相对 URL、`localhost`、`127.0.0.1` 和显式配置的 `https` host。
- 默认禁止任意 `file:` 和未配置公网 host。
- 远程资源必须有 timeout 和 size limit。
- `exportExampleApp` 只能写入受控目标目录，或返回文件清单。
- MCP tools 不得读取 renderer 私有对象。
- 远程资源失败必须返回 diagnostic，不能静默降级。
