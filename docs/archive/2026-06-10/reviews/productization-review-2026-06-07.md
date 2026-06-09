---
agent: orchestrator
period: 2026-06-07
generated_at: 2026-06-06T18:32:04Z
repo_revision: "ca461e2"
inputs:
  - README.md
  - package.json
  - packages/engine/package.json
  - packages/ai/package.json
  - packages/cli/package.json
  - packages/scene3d/package.json
  - packages/scene3d-three-adapter/package.json
  - docs/archive/2026-06-10/planning/next-stage-goals-2026-06-06.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/task-burndown.md
  - docs/reviews/w24-quality-acceptance-2026-06-05.md
  - docs/research/competitor-updates-2026-W24.md
  - command: git tag --list
  - command: pnpm build:schema
  - command: node scripts/doc-generator.mjs links
  - command: pnpm test:docs
  - command: pnpm check
  - command: pnpm test:resources
  - command: pnpm test:perf:smoke
  - command: pnpm test:snapshot:smoke
  - command: pnpm test:studio
  - command: pnpm test:qa-matrix
  - command: pnpm build:cdn -- --dry-run
  - command: pnpm publish:dry
owner: "@orchestrator"
decision_level: advisory
---

# Productization Review: 2026-06-07

## Verdict

GIS Engine has crossed from pre-release architecture validation into a real
SDK+CLI product line: the GA packages are at `1.0.0`, the repository has a
`v1.0.0` tag, the npm publish workflow verifies lint/schema/check before
publish, W24 review-console and cloud-native contract evidence is accepted, and
the public shape remains schema-first, command-only, diagnostic-driven, and
MCP-contract-safe.

The next phase should not expand the surface area first. It should make the
product reproducible for users and release operators, then promote one
cloud-native source from contract evidence into a narrow runtime claim.

## Current Product State

| Area | Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| SDK + CLI release spine | GA packages are aligned at `1.0.0`; `@gis-engine/scene3d-three-adapter` stays independent `0.2.1` | package manifests; `git tag --list` shows `v1.0.0`; npm publish workflow | Release identity is now coherent | Treat old v0.2/v0.4 release-blocking review notes as stale historical evidence | high |
| AI operability | Seven MCP tool names remain frozen and output-schema guarded | AGENTS.md; AI package tests; W24 acceptance report | AI-native contract is strong enough for SDK+CLI launch | Keep all new product work on existing tool names | high |
| Workbench/Studio | Local review-console and QA matrix are accepted; hosted/product promotion remains No-go | W24 quality report; promotion-scope docs | Useful as reference and acceptance surface, not yet a hosted product | Require service ownership/auth/storage/export scope before promotion | high |
| Cloud-native sources | PMTiles, GeoParquet, and FlatGeobuf have schema/resource-policy contracts only | cloud-native source modules and tests | Users will still hit a runtime gap for real datasets | Promote one candidate through a SourceLoader/runtime gate | high |
| Release verification | Local runner is not a clean release runner: Node is `v26.0.0`, Biome platform binary is missing, listener/browser permissions are sandbox-blocked | `pnpm lint`, `pnpm check`, `pnpm test:snapshot:smoke` outputs | Release confidence depends on CI or a known listener/browser-capable runner | Add a reproducible release-runner preflight and rerun gates there | high |
| Docs and generated project hygiene | Some active docs linked to archived files; CLI/generated templates still carried old package versions before this review | doc link audit; CLI templates; getting-started package | New users can receive stale install instructions or generated package manifests | Fixed in this review and add a guardrail task | high |
| External package/competitor freshness | Current run could not refresh npm registry due DNS failure and approval-service 502 | `npm view` ENOTFOUND; escalation rejected by approval-service outage | Do not claim today's external latest state from this run | Re-run product refresh in a network-capable environment | medium |

## Findings

### P0: Generated Projects Still Pointed At Old GIS Engine Versions

`packages/cli/src/templates/index.ts`, `examples/getting-started/package.json`,
and `packages/cli/src/generate.ts` still referenced `^0.2.0` or `0.4.0` even
though the GA package line is `1.0.0`. A user running `create-gis-map` could
therefore scaffold or generate a project that installs the wrong package line
or labels evidence with the wrong CLI version.

Action taken in this review: update generated dependencies to `^1.0.0`, read
the generate-path CLI version from `packages/cli/package.json`, and update the
CLI README/CDN version examples.

Confidence: high.

### P0: Release Runner Reproducibility Is Not Yet Closed

The current local environment is useful for deterministic TypeScript/Vitest
checks but is not a release runner:

- `pnpm lint` fails because `@biomejs/cli-darwin-arm64` is missing from
  `node_modules`.
- `pnpm check` reaches `tests/examples/ai-map-workbench.test.ts` and fails on
  `listen EPERM: operation not permitted 127.0.0.1`.
- `pnpm test:snapshot:smoke` fails only in the Chromium browser-runner case
  with macOS Mach port permission denial.
- Local Node is `v26.0.0`, while CI and workflows use Node 22.

Impact: the release gate cannot be honestly called complete from this local
run, even though the failures are environment/tooling-limited rather than
application logic failures.

Required next action: create a release-runner preflight that pins/validates
Node 22, pnpm 9.15.0, complete optional platform binaries, local listener
permission, and Playwright/Chromium capability before running release gates.

Confidence: high.

### P1: Cloud-Native Source Work Needs One Runtime Promotion Path

W24 correctly kept PMTiles, GeoParquet, and FlatGeobuf at contract/resource
policy level. For product usefulness, the next step should choose one source
candidate and prove a narrow runtime path without hidden fetches or broad parser
claims.

Recommended first candidate: PMTiles/vector source runtime, because it directly
supports browser map delivery and aligns with the existing vector-source and
resource-policy surface. The task must still be contract-first: caller-supplied
fetch/range capability, explicit resource policy, diagnostics before IO, and
snapshot/export evidence before any public support claim.

Confidence: medium, because today's external package refresh was blocked.

### P1: Active Planning Had Archived-Link Drift

The link audit found 10 broken references from active planning docs to files
archived under `docs/archive/2026-06-06/`. This review updates the active
markdown links and records the audit output.

Impact: not a runtime defect, but stale planning links increase the chance that
future tasks reopen closed work or miss the active evidence path.

Confidence: high.

## Next-Stage Task Queue

The durable task snapshot is recorded in
`docs/archive/2026-06-10/planning/next-stage-tasks-2026-06-07.md`.

| Rank | ID | Priority | Owner | Target | Exit Condition |
| --- | --- | --- | --- | --- | --- |
| 1 | TASK-2026W24-PROD-001 | P0 | `@builder` + `@quality` | Release-runner reproducibility | Node 22/pnpm/browser/listener/Biome preflight passes; `pnpm lint`, `pnpm build:schema`, `pnpm check`, `pnpm publish:dry`, `pnpm build:cdn`, and docs link audit pass in the same runner |
| 2 | TASK-2026W24-PROD-002 | P0 | `@builder` + `@docs` | Generated-project version hygiene | CLI templates, generate evidence, getting-started example, CLI README, and CDN docs all point to GA `1.0.0`; CLI tests cover generated dependency versions |
| 3 | TASK-2026W24-PROD-003 | P1 | `@docs` + `@orchestrator` | Active planning/docs link hygiene | `node scripts/doc-generator.mjs links` reports zero broken active links or only explicitly archived historical notes |
| 4 | TASK-2026W24-PROD-004 | P1 | `@builder` + `@quality` | First SourceLoader runtime promotion | One cloud-native candidate gets a runtime contract, diagnostics, resource-policy tests, snapshot/export evidence, and no hidden fetch/parser overclaim |
| 5 | TASK-2026W24-PROD-005 | P1 | `@builder` + `@quality` | SDK+CLI installability smoke | Fresh `create-gis-map` scaffold/generate outputs install and build against published or packed `1.0.0` artifacts |
| 6 | TASK-2026W24-PROD-006 | P2 | `@product` + `@orchestrator` | Workbench promotion intake | Hosted/product movement remains blocked unless ownership, auth/storage/export scope, and release-grade visual evidence are accepted |
| 7 | TASK-2026W24-PROD-007 | P2 | `@product` | External signal refresh | npm/official-source package evidence is refreshed in a network-capable run with checked dates |

## Gate Evidence From This Run

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm build:schema` | PASS | engine, scene3d, and AI schema/build completed |
| `pnpm test:docs` | PASS | 3 docs guardrail tests passed |
| `node scripts/doc-generator.mjs links` (initial) | FOUND ISSUES | 10 active broken references found before link fixes |
| `node scripts/doc-generator.mjs links` (final) | PASS | active links complete after archive-link fixes |
| `pnpm test:resources` | PASS | 11 resource tests passed |
| `pnpm test:perf:smoke` | PASS | perf trend/smoke tests passed |
| `pnpm test:studio` | PASS | 40 Studio tests passed |
| `pnpm test:qa-matrix` | PASS | 24 QA matrix tests passed |
| `pnpm build:cdn -- --dry-run` | PASS | engine, AI, and scene3d CDN entries resolved to `1.0.0` |
| `pnpm lint` | ENV-LIMITED | missing Biome platform binary in local `node_modules` |
| `pnpm check` | ENV-LIMITED | sandbox blocks `127.0.0.1` listener in AI Map Workbench tests |
| `pnpm test:snapshot:smoke` | ENV-LIMITED | Chromium Mach port permission denied in local sandbox |
| `pnpm publish:dry` | ENV-LIMITED | local build completed; npm dry-run phase failed on registry DNS/cache permission, and non-sandbox rerun could not be approved because the approval service returned 502 |

## 2026-06-07 Execution Addendum

Follow-up execution found a new P0 in the published-package path: the
documented `npx create-gis-map` command targets an unpublished unscoped package,
and the scoped package's installed bin could be inert when executed through an
npm-style symlink. The implemented fix changes the CLI direct-execution guard
to compare real filesystem paths, updates user-facing Quick Start commands to
the scoped package form, and adds CLI tests for symlinked bin execution. The
same install smoke also fixed generated `vite-ts` template drift: scaffolded
specs now include the required `view`, use public `MapSpec.version: "0.1"`,
and avoid top-level await so Vite's default production target can build.

Release-runner reproducibility is now encoded as `pnpm release:preflight`,
backed by `.nvmrc` (`22`) and checks for pnpm `9.15.0`, Biome, localhost
listener capability, and Playwright/Chromium. SDK+CLI installability is encoded
as `pnpm smoke:cli-install`, which packs `@gis-engine/cli`, installs it in a
fresh temporary consumer project, runs the installed `create-gis-map` binary,
builds a generated Vite project, and checks mock generate output.

Workbench promotion intake remains No-go for hosted/product movement. The
required future checklist is recorded in
`docs/planning/feature-specs/ai-map-workbench-promotion-scope.md` and blocks on
runtime owner, route/module boundary, auth/storage/export, release visual
evidence, resource-policy evidence, MCP contract safety, and rollback plan.

External package signals were refreshed at `2026-06-06T19:20:59Z`
(`2026-06-07` Asia/Shanghai) and recorded in
`docs/research/competitor-updates-2026-W24.md`. The refresh confirms the
published GIS Engine `1.0.0` package line and does not change the existing
roadmap gates.

## Non-Goals

- Do not promote stable `view.mode: "scene3d"`.
- Do not add new MCP tool names or aliases.
- Do not turn PMTiles, GeoParquet, or FlatGeobuf contract evidence into runtime
  support claims without a separate quality gate.
- Do not move AI Map Workbench into hosted/product scope without a fresh
  promotion task.
