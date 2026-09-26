# GIS Engine Operating Guide

GIS Engine focuses on verifiable map changes and buildable delivery. Use the
existing renderer ecosystem; keep speculative capabilities behind extensions.
This guide defines responsibilities, not a running multi-agent scheduler.

## Default Workflow

1. Read the relevant code, tests and GitHub Issue; define one bounded outcome.
2. Implement through existing contracts and add behavior-focused coverage.
3. Run `pnpm gate:plan`, then the applicable gates; record exact revision/results.
4. Review the diff and evidence; update public docs when behavior changes.

GitHub Issues are canonical task state. Planning markdown is a dated snapshot.
Use one implementation owner and one quality reviewer per change. Invoke product
research when a decision needs external evidence; documentation follows delivery.
Do not manufacture daily reports, role handoffs or evolution metrics for routine
changes. Preserve historical evidence rather than creating another archive.

## Repository Rules

All agents must respect the existing GIS Engine architecture:

- Schema first: public inputs must be described by TypeBox schemas and validated
  with Ajv.
- Core model discipline: `MapSpec` is the generic core + extensions contract,
  not hard-coded to the current 2D path; keep domain-specific capability in
  extension namespaces or adapter boundaries.
- Command-only mutation: runtime state changes must go through `MapCommand` and
  `applyCommands`.
- Structured diagnostics: failures must return stable diagnostic codes instead
  of natural-language-only errors.
- Snapshot verification: changes affecting rendering must keep deterministic
  smoke snapshots green and use visual snapshots for release-capable checks.
- Adapter boundary: renderer-specific behavior must stay behind
  `RendererAdapter` contracts.
- Reference implementation boundary: `examples/ai-map-workbench` is the
  canonical Phase 1 reference implementation, not a product-claim commitment.
- Workflow boundary: `validate -> apply -> snapshot -> export` is the minimum
  closed loop for evidence, not the only valid workflow order for all
  consumers.
- MCP contract: the v1.5 14-tool canonical default inventory uses the following
  snake_case names, returned in this order by `tools/list`:
  `apply_commands`, `validate_spec`, `export_spec`, `get_context_summary`,
  `snapshot_spec`, `explain_spec`, `export_example_app`, `diff_specs`,
  `generate_spec`, `inspect_data`, `edit_spec`, `query_features`,
  `style_recommend`, and `transform_data`. The first seven are the Phase 1
  Core lifecycle group; `diff_specs`, `generate_spec`, and `edit_spec` are
  Authoring extensions; `inspect_data`, `query_features`, `style_recommend`,
  and `transform_data` are Data intelligence tools. Every public descriptor
  must expose both `inputSchema` and `outputSchema`; successful calls expose
  schema-conforming `structuredContent`, while execution failures use the
  `{ diagnostics: Diagnostic[] }` structured envelope and retain the legacy
  JSON diagnostics text block. The server targets MCP `2025-11-25`; public
  `inputSchema` and `outputSchema` descriptors use the JSON Schema draft-07
  dialect.
- Resource policy: URL, tile, worker, example, and external asset changes must
  be checked against `packages/engine/src/spec/resource-policy.ts`,
  `tests/schema/resource-policy.test.ts`, and the resource policy sections in
  `docs/engineering/ci-test-strategy.md`. If a dedicated
  `docs/security/resource-policy.md` is added later, it becomes the human-facing
  policy entry point and must stay aligned with the implementation and tests.
- Coordination surfaces: `scripts/**`, `.github/workflows/**`, `AGENTS.md`, and
  the planning/handoff/evolution ledgers are framework changes, not docs-only
  edits. Path-aware gating must run the agent-framework test suite for them.

Use the current repo scripts unless a task explicitly changes them:

```bash
pnpm build:schema
pnpm check
pnpm test:release:scene3d
pnpm --filter @gis-engine/scene3d-three-adapter build
pnpm test:snapshot:visual
GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual
```

Do not claim that competitor or standards information is current unless it was
checked in the current run and the source/date are recorded.

## Shared Artifact Contract

Every agent report should begin with this front matter:

```yaml
agent: orchestrator | product | quality | builder | docs
period: YYYY-Www | YYYY-MM | YYYY-MM-DD | ad-hoc
generated_at: YYYY-MM-DDTHH:mm:ssZ
repo_revision: "<git sha or unknown>"
inputs:
  - path-or-url
owner: "@agent-or-team"
decision_level: info | advisory | blocking | emergency
```

Every recommendation must include:

- Evidence: source URL, local file path, CI run, command output, or PR diff.
- Impact: user, product, architecture, AI safety, performance, or security.
- Action: owner, next step, and target artifact.
- Confidence: high, medium, or low.

## Ownership and Handoffs

| Role | Responsibility | Boundary |
| --- | --- | --- |
| @orchestrator | Priorities, issue decomposition, accepted planning updates | Single writer of planning state; no evidence-free promotion |
| @product | Dated competitor evidence and user-value recommendations | Do not turn marketing claims into verified capability |
| @builder | Engine, AI, adapter and QA implementation | No renderer dependencies in core; no release decision |
| @quality | Architecture review and deterministic merge/release gates | No implementation edits while reviewing; no silent waivers |
| @docs | Public docs and release notes | No overriding technical or release decisions |

Roles are responsibilities, not five mandatory jobs. Specialist delegation is
appropriate for independent research or review; routine work stays with its owner.
Other roles propose planning changes; @orchestrator serializes accepted updates.
Reserve 20%–30% of a sprint for verified debt and reliability work. P0 and release
blockers take priority. Do not auto-modify public contracts, resource boundaries,
core gate semantics or product promotion decisions; promotion requires human Go/No-go.

For actual inter-agent handoffs use
[the handoff contracts](docs/planning/agent-handoff-contracts.md):

- HOC-N1: product → orchestrator; dated sources, fresh scorecard and justified priorities.
- HOC-N2: builder → quality; changed code, test output, scope and known limitations.
- HOC-N3: quality → orchestrator; applicable gate results and pass/block/waiver decision.

Validate the relevant contract before consumption. A template is never specialist
evidence. A fresh timestamp is not a new review. Preserve stable diagnostics for
missing, malformed, future or stale evidence. Do not claim a handoff is consumed
without citing the actual upstream evidence. Only generate aggregate planning
snapshots when needed; authenticated fetch failures must preserve the last valid state.

## Quality Gates

| Gate | When required |
| --- | --- |
| `pnpm build:schema` | Schema/tools changes and releases |
| `pnpm check` | Implementation and framework changes; all releases |
| `pnpm test:agent-framework` | Scripts, workflows, AGENTS and coordination changes |
| Resource-policy tests | URL, tile, worker, external asset or example changes |
| MCP contract tests | AI tool changes |
| `pnpm test:release:scene3d` | SceneView3D evidence changes and beta/release claims |
| Strict visual snapshots | Rendering changes for release; otherwise conditional PR evidence |
| Release notes | All releases; public changes include docs and runnable examples |

Block merge for missing public schemas, mutation outside commands, hidden network
side effects, missing error diagnostic paths, or public type widening to `any`.
Review dry-run, conflicts, rollback and replay when command behavior changes.
Performance-sensitive changes need at least smoke evidence. Keep mock/MapLibre
adapter contracts consistent. Coverage gaps and internal-only missing docs are
advisory unless a required gate or contract is violated.

A visual waiver requires an explicitly non-rendering change and a reason visual
output cannot change. It is unavailable for adapters, layer/source transformation,
styles, snapshots, visual fixtures, URLs, tiles, workers, browser examples or
resource policy. Waived changes still pass deterministic and smoke gates.

SceneView3D renderer evidence must pass resource policy before acceptance. Stable
`view.mode: "scene3d"` stays blocked until @quality accepts real renderer
snapshot/query/visual evidence and @orchestrator records the human promotion decision.
`examples/ai-map-workbench` and Studio remain reference/local surfaces; a draft
Workbench implementation or an engine version PR is not hosted or local-v1 promotion.

Report review findings on the PR, including exact revision, tests and limitations;
do not create a second dated report for every passing PR. Automatic evidence does
not independently authorize merge or release. Blocking decisions require explicit
human or @orchestrator approval. Existing unresolved findings remain unresolved
when automation is simplified.

## Automation and Optional Tools

CI and PR Quality Check provide event-driven build, schema, contract, resource,
snapshot and framework evidence. Release and publish workflows keep their existing
boundaries. `agent-review.yml` is the single manual supplementary review entry:
checks or docs, logs as Actions artifacts, read-only repository permissions.
It does not schedule report generation, commit planning state, delete reports or
open escalation issues. Removing a scheduler does not waive a quality gate.

Use these normal entry points:

```bash
pnpm gate:plan
pnpm gate:run
pnpm check
pnpm docs:build
```

Advanced tools remain available directly when their output is needed:

- `node scripts/agent-runner.mjs <role> --dry-run`: optional report scaffold;
  generated output is a template, not an autonomous specialist review.
- `node scripts/planning-evidence.mjs`: authenticated issue/HOC/dashboard snapshot.
- `node scripts/sla-checker.mjs --dry-run` and
  `node scripts/handoff-ledger.mjs --check --dry-run`: explicit evidence audits.
- `node scripts/report-retention.mjs`: preview only by default; reviewed cleanup
  requires explicit authorization and must preserve cited evidence.
- `node scripts/recovery-incident.mjs`: reconciles one failed workflow run into a
  canonical incident issue using its workflow+run key. No scheduled caller exists;
  run it only when triaging a named failure, and keep the cited triage records.
- `node scripts/git-push-retry.mjs`: bounded fetch/rebase/push helper for an
  explicitly authorized planning push. Never force-push and never call it from an
  unattended job.
- Evolution collectors are optional historical analysis tools, not scheduled jobs
  or required inputs for normal implementation. Do not fabricate D1–D6 metrics.

Prefer repository scripts and existing capabilities. Add a skill/MCP dependency
only for a missing capability; record source, version, reason and maintenance owner.
Use bounded checks for routine work and stronger reasoning for public contracts,
security, release or priority decisions. Model choice is never quality evidence.

## Emergency Boundary

Only a documented P0 user/production impact permits emergency mode. @orchestrator
records impact, owner, rollback, expiry and follow-up issue IDs in
`docs/alerts/critical-gaps.md`; @quality owns the conditional gate decision.
Schema, deterministic tests, resource policy and applicable smoke snapshots remain
mandatory. Never bypass schema/diagnostics/security or hide a failure. Convert
skipped visual/docs/release evidence into owned P0/P1 follow-ups. Emergency mode
expires on mitigation or after 48 hours, whichever comes first.
