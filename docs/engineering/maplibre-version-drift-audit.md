---
agent: docs
period: 2026-W23
generated_at: 2026-06-03T03:24:45Z
repo_revision: "c993ae105ed2022557491b8c19c342180d4f7e2b"
inputs:
  - package.json
  - packages/engine/src/renderer/maplibre/transformer.ts
  - packages/engine/src/renderer/maplibre/adapter.ts
  - packages/engine/src/spec/resource-policy.ts
  - tests/schema/schema-fixtures.test.ts
  - tests/schema/resource-policy.test.ts
  - tests/adapter/maplibre-transformer.test.ts
  - tests/adapter/maplibre-adapter.contract.test.ts
  - tests/snapshot/smoke
  - tests/snapshot/visual/maplibre-visual.spec.ts
  - docs/engineering/ci-test-strategy.md
  - docs/engineering/supported-feature-matrix.md
owner: "@docs"
decision_level: advisory
---

# MapLibre Version-Drift Audit Checklist

This checklist is a pre-upgrade audit for future `maplibre-gl` changes. It does
not claim that MapLibre has been upgraded, and it must not be used as release
evidence until the upgrade run records the proposed version, source URLs, checked
dates, package diff, test output, and reviewer decision.

Current package evidence: `package.json` declares `maplibre-gl` as `^5.24.0`.
Before changing that range or the lockfile, run this checklist against the exact
candidate version and keep the evidence with the PR or gate report.

2026-06-01 closure note: `MLD-002` through `MLD-004` closed the current drift
audit without package movement. PMTiles/vector delivery boundaries remain
readiness/evidence-only, `SourceLoader` remains contract-only, and package
movement is no-go until a future task refreshes official package/changelog
evidence and accepts strict visual evidence in the same dependency state.

Owner names below follow the current 5-agent model. Runtime or schema-level
waiver terminology may still use legacy `coordinator` wording until the
contract itself is migrated.

## Upgrade Intake

- [ ] Record the current installed version from the lockfile and the proposed
  candidate version.
- [ ] Record dated evidence from official MapLibre release notes, npm metadata,
  or upstream changelog. Do not summarize external behavior as current unless it
  was checked during the upgrade run.
- [ ] Identify whether the change is patch, minor, or major and whether the
  style spec, worker bundle, expression evaluation, source loading, or rendering
  behavior changed.
- [ ] Decide the audit scope before code changes: dependency-only, transformer
  compatibility, resource policy, visual behavior, release-runner behavior, or
  rollback.

Recommendation:

- Evidence: `package.json`, `pnpm-lock.yaml`, official MapLibre release or npm
  source URL with checked date.
- Impact: dependency drift can silently change style parsing, source loading,
  worker behavior, or browser rendering evidence.
- Action: `@builder` (engine focus) records the candidate version and source
  evidence; `@quality` decides whether the audit is PR-only or release-level.
- Confidence: high when official release/npm evidence and package diff are
  attached; low without dated upstream evidence.

## Transformer

Check `packages/engine/src/renderer/maplibre/transformer.ts` before upgrading:

- [ ] Confirm every supported source still maps to valid MapLibre style input:
  `geojson`, `raster`, `pmtiles`, and `vector`.
- [ ] Confirm every supported layer still maps to the intended MapLibre layer
  type: `background`, `raster`, `fill`, `line`, `circle`, `symbol-lite`, and
  gated `fill-extrusion-lite`.
- [ ] Confirm expression mappings remain inside the supported matrix and still
  return structured diagnostics for unsupported operators or layer types.
- [ ] Run adapter transformer tests and update expected output only when the
  candidate version requires an intentional contract change.

Recommendation:

- Evidence: `packages/engine/src/renderer/maplibre/transformer.ts`,
  `tests/adapter/maplibre-transformer.test.ts`,
  `docs/engineering/supported-feature-matrix.md`, command output from
  `pnpm test:adapter -- tests/adapter/maplibre-transformer.test.ts`.
- Impact: transformer drift can make AI-generated `MapSpec` documents validate
  but render differently or fail only in browser snapshots.
- Action: `@builder` (engine focus) keeps the MapSpec-to-style boundary narrow
  and updates schema, diagnostics, or feature-matrix docs only for intentional
  support changes.
- Confidence: high if transformer tests and supported matrix agree; medium if
  only visual evidence exists.

## Source URL And Resource Policy

Check resource behavior before any dependency upgrade is accepted:

- [ ] Confirm URL-like sources still pass through GIS Engine resource policy
  before MapLibre can load them.
- [ ] Recheck `raster.tiles[]`, `vector.tiles[]`, `vector.url`, and PMTiles URL
  mappings against `packages/engine/src/spec/resource-policy.ts`.
- [ ] Confirm worker, tile, external asset, and example URL changes are explicit
  and covered by tests.
- [ ] Confirm no dependency upgrade introduces a hidden network fetch in tests,
  examples, or browser snapshots.

Recommendation:

- Evidence: `packages/engine/src/spec/resource-policy.ts`,
  `tests/schema/resource-policy.test.ts`, `tests/resources`, package diff, and
  command output from `pnpm test:resources` plus
  `pnpm test:schema -- tests/schema/resource-policy.test.ts` when policy changes.
- Impact: URL drift is a security and reproducibility risk because visual or
  example tests may begin depending on external services.
- Action: `@builder` (engine focus) updates policy tests for any new
  source/asset behavior; `@docs` keeps human-facing policy text aligned when
  docs change.
- Confidence: high when local fixtures and policy tests cover every changed URL
  path; low if the evidence depends on live public tiles.

## Schema Fixtures

Check schema and fixtures before relying on upgraded rendering behavior:

- [ ] Run schema fixtures for supported and unsupported source/layer cases.
- [ ] Confirm unsupported MapLibre capabilities remain explicit diagnostics
  rather than silently accepted MapSpec fields.
- [ ] Add or update fixtures only when the public `MapSpec` contract changes.
- [ ] Run schema sync when TypeBox schemas or generated schemas change.

Recommendation:

- Evidence: `tests/schema/schema-fixtures.test.ts`, fixture JSON under
  `tests/fixtures`, generated schema diff, command output from
  `pnpm build:schema` and `pnpm test:schema`.
- Impact: schema drift can let AI tools emit specs that the adapter cannot
  transform deterministically.
- Action: `@builder` (engine focus) owns schema and diagnostic updates;
  `@builder` (ai focus) checks MCP tool schemas if public behavior changes.
- Confidence: high when schema sync and invalid-fixture diagnostics pass.

## Smoke Snapshot

Run deterministic smoke evidence before visual evidence:

- [ ] Run `pnpm test:snapshot:smoke`.
- [ ] Confirm MapLibre adapter smoke snapshots still return structured reports
  and stable data URLs where expected.
- [ ] Confirm adapter failures use structured diagnostics and do not leave
  runtime state divergent from exported spec.
- [ ] Treat smoke failures as blockers before browser-only investigation.

Recommendation:

- Evidence: `tests/snapshot/smoke`, `tests/adapter/maplibre-adapter.contract.test.ts`,
  command output from `pnpm test:snapshot:smoke`.
- Impact: smoke drift breaks deterministic AI validation even when browser
  rendering appears healthy.
- Action: `@builder` (engine focus) fixes contract or diagnostics regressions
  before `@builder` (qa focus) updates browser visual evidence.
- Confidence: high when smoke snapshots and adapter contract tests both pass.

## Visual Snapshot

Run browser visual evidence for rendering-affecting upgrades:

- [ ] Run `pnpm test:snapshot:visual` in a WebGL-capable browser environment.
- [ ] For release-capable checks, run
  `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual`.
- [ ] Compare GeoJSON, generated local MVT, and gated `fill-extrusion-lite`
  scenarios for nonblank pixels, target-layer health, console errors, and
  optional baseline diff.
- [ ] Do not update baselines unless the visual difference is understood,
  reviewed, and run through `pnpm test:snapshot:update`.

Recommendation:

- Evidence: `tests/snapshot/visual/maplibre-visual.spec.ts`,
  `test-results/snapshots`, browser console logs, command output from
  `pnpm test:snapshot:visual` or the strict visual command.
- Impact: MapLibre renderer drift can change pixels, layer ordering, expression
  output, or WebGL behavior without changing TypeScript contracts.
- Action: `@builder` (qa focus) records visual metrics and artifacts;
  `@quality` decides whether baseline changes are acceptable.
- Confidence: high in a release-capable runner with strict visual snapshots;
  medium if the local environment can only produce a skipped report.

## Release Runner

Check release gates after dependency and visual evidence:

- [ ] Run `pnpm check` for deterministic PR readiness.
- [ ] Run `pnpm test:release:rc` when preparing a release candidate.
- [ ] Run `pnpm test:release:strict` when strict visual evidence is required.
- [ ] If SceneView3D or shared snapshot infrastructure is touched, also run
  `pnpm test:release:scene3d` and keep any waiver explicitly scoped.

Recommendation:

- Evidence: `package.json` scripts, `docs/engineering/ci-test-strategy.md`,
  command output from `pnpm check`, `pnpm test:release:rc`, or
  `pnpm test:release:strict`.
- Impact: package upgrades can pass focused tests but still break schema sync,
  examples, AI tools, resources, or snapshot gates.
- Action: `@quality` records pass/block/waiver status before merge or release
  claims.
- Confidence: high when deterministic and release-level gates pass in the same
  dependency state.

## Dependency And Package Boundary

Keep MapLibre as an adapter/runtime dependency boundary:

- [ ] Confirm `maplibre-gl` remains out of packages that should only depend on
  schemas, commands, diagnostics, or AI tool contracts.
- [ ] Confirm no renderer-specific types leak into public `MapSpec`, MCP tool
  descriptors, or core command APIs.
- [ ] Check package manifests and lockfile diff for transitive dependency
  changes that affect browser bundles, workers, tiles, or build output.
- [ ] Keep full MapLibre parity out of scope unless a separate approved feature
  spec changes the supported surface.

Recommendation:

- Evidence: `package.json`, workspace package manifests, `pnpm-lock.yaml`,
  `packages/engine/src/renderer/maplibre/*`,
  `docs/engineering/supported-feature-matrix.md`.
- Impact: boundary drift can make AI/core packages depend on renderer behavior
  and weaken deterministic validation.
- Action: `@builder` (engine focus) keeps renderer-specific behavior behind
  `RendererAdapter`; `@docs` updates feature-boundary docs for approved scope
  changes only.
- Confidence: high when the package diff is dependency-only or adapter-local and
  public schemas remain unchanged.

## Rollback Or Upgrade Decision

End every MapLibre version-drift audit with one explicit decision:

- [ ] `Go`: upgrade is accepted; evidence includes source date, package diff,
  schema/resource/adapter/smoke/visual/release outputs, and no unresolved
  blocking diagnostics.
- [ ] `Conditional go`: upgrade is accepted with named follow-up tasks,
  non-rendering waiver, or environment-specific visual limitation.
- [ ] `No-go`: upgrade is blocked; record blocker, owner, rollback command or
  lockfile restore path, and the next evidence artifact required.

Recommendation:

- Evidence: PR diff, gate output, visual artifacts, release runner output, and
  reviewer decision.
- Impact: an implicit upgrade decision can leave the repo in a partially audited
  dependency state.
- Action: `@quality` owns the merge decision; `@orchestrator` records
  follow-up planning state only after evidence exists.
- Confidence: high when the decision references all required evidence; low when
  visual or release-runner evidence is missing for a rendering-affecting change.
