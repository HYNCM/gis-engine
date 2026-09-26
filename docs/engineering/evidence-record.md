# EvidenceRecord 对外复算

一次 AI 改动导出的包里有 `evidence.json` 与 `evidence-verifier.mjs`。复算不需要本项目源码、
不需要 npm 依赖、不需要网络：

```bash
node evidence-verifier.mjs evidence.json --root . --json
```

结论形态固定为 `{ ok, assertions[], diagnostics[] }`。`assertions[].status` 取
`passed | failed | not-covered`；`VISUAL_CONSISTENCY` 与 `OFFLINE_REPLAY` 在当前范围下恒为
`not-covered`——这两项是被主动推迟的，不是实现遗漏。

退出码：`0` 全部断言绿，`2` 至少一条断言失败，`1` 用法或 IO 层面的拒绝（包括下面提到的超限字节）。

## 断言语义

| id | 复算了什么 |
| --- | --- |
| `CHAIN_CLOSED` | `recordId` 等于正文的规范化 SHA-256，改一个数据字节即失败 |
| `ARTIFACTS_MATCH` | 每个文件的 sha256 与字节数与记录一致 |
| `DERIVATION_CLOSED` | 命令序列的 revision 链与逆补丁哈希在记录内自洽（不执行命令） |
| `TOOLCHAIN_RECORDED` | 引擎 / Node / pnpm 版本已入记录 |

可信层只做纯数据复算：它不渲染地图、不访问网络、不执行 `applyCommands`。这是设计约束，不是
实现进度——一旦可信层需要执行命令，它就不再是审计方手里那个可以直接读的东西。

## 字节级完整性

`evidence.json` 里不含自身的哈希，所以格式级（含缩进、键序）与内容级的字节篡改由
`artifact-manifest.json` 兜住：

```bash
npx @gis-engine/cli create-gis-map --verify-artifacts ./my-map
```

`verify` 逐条比对 manifest 的 `bytes` 与 `sha256`，并把 manifest 的文件集与记录内的
`artifacts[]` 交叉核对：manifest 哈希了、记录却没 attest 的文件报
`ARTIFACT_MANIFEST.EVIDENCE_ARTIFACT_MISSING`，反之报 `ARTIFACT_MANIFEST.EVIDENCE_ARTIFACT_UNLISTED`。
没有这一步交叉核对，一条悄悄缩短的 `artifacts[]` 依然能让 manifest 和单文件 verifier 同时报绿——
证据面缩小却无人发现。

## 记录从哪来

`gis-engine <project> --generate` 在写完其它所有产物之后、写 `artifact-manifest.json` 之前生成
`evidence.json`，所以 `artifacts[]` 不自指。命令、spec 前后哈希、能力矩阵、工具链版本都取自同一次
`applyCommands` 的真实产出，不接受第二个来源。记录超过 `MAX_EVIDENCE_RECORD_BYTES`（1,048,576 字节）
时 CLI 丢弃整个输出目录并以退出码 1 结束：不截断字段，不放宽预算。

## 威胁模型

复算面对的是不受信任的输入，审计方要知道自己手里各道防线分别挡住什么。

- **读侧字节上限。** `runEvidenceVerifierCli` 在 `JSON.parse` 之前按字节数拒绝超过
  `MAX_EVIDENCE_RECORD_BYTES` 的 `evidence.json`，退出码 1，文案点名实测字节数与上限，并且不产出
  任何断言结论。生产侧与审计侧共用同一个"拒绝而非截断"的预算：一份更大的落盘记录只可能是伪造或
  损坏的，不是合法的复算输入。
- **`--root` 内的路径约束。** `artifacts[].path` 必须是干净的 root 相对 POSIX 路径：`/` 连接、不含
  `..`、无前导 `/`、无盘符、无反斜杠、无 NUL。越界的 path 是一个 finding，不是一个待打开的文件。
- **符号链接是本方案刻意接受的残余面。** 上面那条判断是 `isInsideRoot` 的**纯字符串**实现，因此
  root 内一个指向 root 外部的**符号链接**照样会被 `readFile` 跟随。这是刻意选择的代价，不是遗漏：
  `--root` 由审计方自己提供，root 内的符号链接属于审计方自己的信任域；而补上 `node:fs` 的
  `realpath` 判断会让 `evidence-verifier.mjs` 失去零依赖闭包——那个单文件能独立分发，靠的正是它只
  引用 `node:` 内建。换句话说，挡住"记录指到 root 外面"和挡住"审计方自己放在 root 里的一扇门"不是
  同一件事，前者是这条路径约束的职责，后者不是。
- **`recordId` 只覆盖数据模型。** 它规范化的是记录正文，不覆盖磁盘上的文件格式与记录之外的文件，
  所以格式级篡改必须走上面那一节的 manifest 交叉核对。

## 相关入口

- [记录契约](../../packages/engine/src/evidence/schema.ts) — `evidence-record.v0.1` 的 TypeBox 定义
- [记录构建与复算](../../packages/engine/src/evidence/record.ts) — `buildEvidenceRecord` / `verifyEvidenceRecord` / verifier CLI 入口
- [单文件 verifier 闭包](../../packages/engine/scripts/build-evidence-verifier.ts)
- [导出包落盘顺序](../../packages/cli/src/generate.ts) 与 [manifest 字节级核对](../../packages/cli/src/artifacts.ts)
- [`tests/evidence/`](../../tests/evidence) 与 [`tests/cli/evidence-export.test.ts`](../../tests/cli/evidence-export.test.ts) — 可执行的语义定义
