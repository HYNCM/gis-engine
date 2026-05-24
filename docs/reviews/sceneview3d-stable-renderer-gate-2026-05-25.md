---
agent: quality-guardian
period: 2026-05-25
generated_at: 2026-05-24T16:17:26Z
repo_revision: "487f80a45c14954cd9418c3a62ebc82601fedb62"
inputs:
  - docs/reviews/sceneview3d-promotion-gate-2026-05-24.md
  - docs/reviews/sceneview3d-stable-renderer-contract-qa-2026-05-24.md
  - docs/reviews/sceneview3d-stable-renderer-resource-policy-2026-05-24.md
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
  - package.json
  - command: pnpm -s build:schema
  - command: pnpm -s test:release:scene3d
  - command: pnpm -s test:resources
owner: "@quality-guardian"
decision_level: blocking
---

# SceneView3D Stable Renderer Gate

## Decision

Stable `view.mode: "scene3d"` runtime remains blocked.

This sidecar gate accepts the current smoke evidence as useful for the
SceneView3D stable renderer contract handoff, but it does not approve beta or
stable runtime promotion. No visual baselines were updated, no strict visual
snapshot was run in this slice, and no stable runtime switch is accepted.

## Gate Matrix

| Task | Required gate | Current smoke evidence | Beta/stable strict requirement | Stance |
| --- | --- | --- | --- | --- |
| SRC-004 snapshot/query evidence | `pnpm test:release:scene3d`; `pnpm test:snapshot:visual` when renderer output can change; adapter-local snapshot/query tests; evidence report naming browser metrics, fixtures, pick cases, and diagnostics | `pnpm -s test:release:scene3d` passed in a release-capable runner after sandbox Chromium was blocked; 2026-05-24 QA report records deterministic snapshot/query semantics | Strict visual snapshot evidence, real renderer nonblank frame metrics, stable camera/dimensions, resource readiness, pick identity, no-hit behavior, hidden/missing layer diagnostics, and quality-guardian acceptance | smoke pass, stable blocked |
| SRC-005 resource policy/release gates | `pnpm test:resources`; `pnpm test:schema -- tests/schema/resource-policy.test.ts` when schema policy changes; `pnpm test:release:scene3d`; visual snapshot gate or coordinator waiver only for non-rendering changes | `pnpm -s test:resources` passed; resource-policy report records external URL, tileset JSON, model, texture, worker, timeout, unsupported kind, and missing source diagnostics | Resource-policy implementation, tests, docs, example assets, and release-gate docs must stay aligned for every URL, tile, worker, model, texture, timeout, or external asset change | smoke pass, stable blocked |
| SRC-006 stable runtime decision | `pnpm build:schema` if public schema/tool contracts changed; `pnpm check`; `pnpm test:release:scene3d`; strict visual snapshot evidence or explicit release waiver; coordinator Go/No-go decision | `pnpm -s build:schema` passed; release smoke passed outside the sandbox; no coordinator promotion decision exists | Full final gate must include `pnpm check`, strict visual evidence or approved waiver, accepted SRC-001 through SRC-005 evidence, and coordinator-recorded promotion decision | no-go |

## Verification

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm -s build:schema` | pass | completed successfully with exit code 0 |
| `pnpm -s test:release:scene3d` | sandbox blocked, release-capable rerun pass | initial sandbox run failed when Chromium hit `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied (1100)`; the same command then passed outside the sandbox with 1 file and 5 tests passing |
| `pnpm -s test:resources` | pass | `tests/resources/resource-release.test.ts` and `tests/resources/scene3d-loader-policy.test.ts` passed, 2 files and 6 tests total |

Strict visual snapshot was intentionally not run for this sidecar slice. The
current work did not update visual baselines, and beta/stable renderer claims
still require strict visual evidence or a coordinator-approved release waiver.

## Findings

### Stable Runtime Promotion Is Still Blocked

- Evidence: `docs/reviews/sceneview3d-promotion-gate-2026-05-24.md` issued
  no-go for stable `view.mode: "scene3d"`; the current contract plan keeps
  SRC-006 blocked until SRC-001 through SRC-005 evidence is accepted.
- Impact: architecture and AI safety stay protected because smoke evidence
  cannot silently become a public stable runtime claim.
- Action: `@coordinator` and `@quality-guardian` keep stable runtime promotion
  blocked until a future gate accepts real renderer contract evidence.
- Confidence: high.

### Current Evidence Is Smoke-Level Only

- Evidence: `pnpm -s build:schema`, `pnpm -s test:release:scene3d`, and
  `pnpm -s test:resources` passed for this slice, but strict visual snapshot
  evidence and `pnpm check` were not run here.
- Impact: the handoff is useful for SRC-004/SRC-005 confidence, but it is not a
  complete release or stable promotion gate.
- Action: before any beta/stable claim, run `pnpm check`,
  `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual`, adapter
  contract tests, and the release gate in a release-capable environment.
- Confidence: high.

### Browser Gate Requires Release-Capable Execution

- Evidence: sandboxed Chromium failed with macOS MachPort permission denial, and
  the identical `pnpm -s test:release:scene3d` command passed outside the
  sandbox.
- Impact: sandbox launch failure should be recorded as an environment
  limitation, not as renderer evidence failure.
- Action: keep browser-backed release gates on a runner that can launch
  Playwright Chromium, and record any waiver or rerun context in the gate
  report.
- Confidence: high.

## Blocking / No-Go Conditions

Stable `view.mode: "scene3d"` remains no-go if any of the following are true:

1. SRC-004 lacks real renderer snapshot/query evidence with nonblank metrics,
   deterministic dimensions, resource readiness, pick identity, no-hit behavior,
   and structured hidden/missing layer diagnostics.
2. SRC-005 lacks resource-policy evidence for external URLs, 3D Tiles JSON,
   models, textures, workers, timeouts, examples, or loader budgets.
3. SRC-006 lacks `pnpm check`, `pnpm test:release:scene3d`, strict visual
   snapshot evidence or approved release waiver, and a coordinator-recorded
   Go/No-go decision.
4. Renderer dependencies leak into `@gis-engine/engine` or the scaffold
   `@gis-engine/scene3d` package.
5. Any public schema, MCP, command, diagnostic, or resource-policy contract
   changes without schema sync and focused contract tests.
