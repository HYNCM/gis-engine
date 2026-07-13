---
agent: orchestrator
period: 2026-W29
generated_at: 2026-07-13T16:06:22Z
repo_revision: "bdd71e24a6cacc88cef578211943685a23890e38"
inputs:
  - docs/research/competitor-updates-2026-W29.md
  - docs/research/capability-scorecard.md
  - docs/reviews/quality-gate-planning-input-2026-07-13.md
  - https://github.com/HYNCM/gis-engine/issues/27
  - https://github.com/HYNCM/gis-engine/issues/28
  - https://github.com/HYNCM/gis-engine/issues/29
  - https://github.com/HYNCM/gis-engine/issues/30
owner: "@orchestrator"
decision_level: advisory
---

# Next Stage Plan: Contract Convergence

## Outcome

From 2026-W29 through W30, close the gaps between public contracts, runtime
behavior, and product claims before adding another renderer, hosted surface, or
data-format badge. The stage milestone is
[2026 W29-W30 Contract Convergence](https://github.com/HYNCM/gis-engine/milestone/1),
due 2026-07-26.

The ordering consumes the W29 HOC-N1 product handoff and the 2026-07-13 HOC-N3
quality input. Quality found no P0 or release blocker that must interrupt
roadmap work, so the product priority formula controls the execution order.

## Decisions

| Rank | Direction | Score | Evidence | Impact | Action | Confidence |
| ---: | --- | ---: | --- | --- | --- | --- |
| 1 | MCP stable-spec and public-tool contract convergence | 8.60 | W29 research; runtime has 14 tools while the operating contract names seven; declared `outputSchema` results are text-only | Public AI interoperability and release correctness | Complete [#27](https://github.com/HYNCM/gis-engine/issues/27) before any MCP expansion or package-release claim | high |
| 2 | PMTiles capability-truth gate | 7.40 | Exported caller-supplied range-IO loader conflicts with the active runtime-query No-go | Product trust, resource security, and cloud-native workflow value | Complete [#28](https://github.com/HYNCM/gis-engine/issues/28) after #27 and issue an explicit Go/No-go per capability | high |
| 3 | MapLibre v5-v6 compatibility matrix | 6.50 | v6 prereleases change event/camera and missing-image APIs while the engine advertises a v5/v6 peer range | Primary renderer compatibility and TypeScript consumer stability | Complete [#29](https://github.com/HYNCM/gis-engine/issues/29) after #27; do not upgrade in the evidence task | high |
| infrastructure | Agent planning evidence integrity | reserved 20% | Green automation produced template-only evidence and an unauthenticated issue snapshot | Prevents stale task and gate state from steering future plans | Complete [#30](https://github.com/HYNCM/gis-engine/issues/30) within the stage capacity | high |

Hosted Workbench launch work (score 6.10) and real SceneView3D renderer evidence
(score 5.75) remain separately gated follow-ups. Neither is approved for hosted
GA or stable runtime promotion by this plan.

## Phase 1: Public AI Contract

### Task 1: MCP stable-spec convergence (#27)

**Description:** Freeze one supported public tool inventory and make every
declared output schema truthful under the stable MCP 2025-11-25 result contract.

**Acceptance criteria:**

- [ ] One approved inventory is enforced across AGENTS, the Phase 1 spec,
      descriptors, package docs, and tests; no undocumented aliases remain.
- [ ] Tools with `outputSchema` return schema-conforming `structuredContent`
      and a backwards-compatible JSON text block.
- [ ] Protocol and schema-conformance tests cover every approved tool without
      adding a mutation path or expanding tool scope.

**Verification:**

- [ ] `pnpm build:schema`
- [ ] `pnpm test:ai`
- [ ] `pnpm test:docs`
- [ ] `pnpm check`

**Dependencies:** None

**Files likely touched:**

- `packages/ai/src/mcp/server.ts`
- `tests/ai/mcp-integration.test.ts`
- `AGENTS.md`
- `docs/spec/phase-1-ai-map-authoring.md`
- `packages/ai/README.md`

**Estimated scope:** M, split implementation from public-contract documentation
if the diff grows beyond one reviewable change.

### Checkpoint: Contract Freeze

- [ ] @quality accepts the public inventory and structured-result conformance.
- [ ] No package release or new public MCP tool proceeds before this checkpoint.

## Phase 2: Capability Truth

### Task 2: PMTiles runtime capability decision (#28)

**Description:** Align loader behavior, resource-policy evidence, AI readiness
summaries, and public claims on one explicit PMTiles support level.

**Acceptance criteria:**

- [ ] Spec-correct fixtures cover archive metadata/directory lookup,
      cancellation, budgets, cache behavior, and deterministic negative paths.
- [ ] Package exports, docs, generated-app evidence, and AI summaries express
      the same accepted or blocked state without hidden IO.
- [ ] @quality records separate Go/No-go decisions for display, load, and
      feature-query claims; other cloud-native formats stay out of scope.

**Verification:**

- [ ] `pnpm test:schema`
- [ ] `pnpm test:resources`
- [ ] `pnpm test:runtime`
- [ ] `pnpm test:adapter`
- [ ] `pnpm test:ai`
- [ ] `pnpm check`

**Dependencies:** Task 1

**Files likely touched:**

- `packages/engine/src/sources/pmtiles-loader.ts`
- `packages/engine/src/sources/pmtiles-query.ts`
- `tests/resources/*pmtiles*`
- `tests/runtime/*pmtiles*`
- `docs/planning/feature-specs/pmtiles-runtime-query-promotion-boundary.md`

**Estimated scope:** M per slice; split fixtures/policy from any parser or query
promotion implementation.

### Task 3: MapLibre compatibility matrix (#29)

**Description:** Produce executable compatibility evidence for MapLibre 5.24
and the latest checked v6 prerelease without changing the release baseline.

**Acceptance criteria:**

- [ ] A repeatable matrix compiles and tests public adapter APIs against both
      versions and records exact checked versions plus event/type/ESM drift.
- [ ] Generated examples load in both entries and smoke/strict visual evidence
      records any divergence.
- [ ] @quality issues a separate keep/bump decision; this task does not upgrade
      the default dependency or public version claim.

**Verification:**

- [ ] `pnpm test:adapter`
- [ ] `pnpm test:e2e:browser`
- [ ] `pnpm test:snapshot:smoke`
- [ ] `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual`
- [ ] `pnpm check`

**Dependencies:** Task 1; may run in parallel with Task 2 after the checkpoint.

**Files likely touched:**

- `packages/engine/src/renderer/maplibre/adapter.ts`
- `packages/engine/src/renderer/maplibre/v6-audit.ts`
- `tests/adapter/*maplibre*`
- `tests/e2e/render-pipeline.spec.ts`
- `.github/workflows/ci.yml`

**Estimated scope:** M

### Checkpoint: Capability Claims

- [ ] PMTiles support wording matches accepted runtime evidence exactly.
- [ ] MapLibre v6 remains evidence-only unless a separate bump decision passes.
- [ ] `pnpm check` and all path-aware resource/visual gates pass.

## Phase 3: Planning Evidence Integrity

### Task 4: Fail-closed agent evidence (#30)

**Description:** Keep template generation, specialist decisions, HOC
consumption, and GitHub issue snapshots distinguishable and current.

**Acceptance criteria:**

- [ ] Authenticated issue state reaches snapshot generation, and unavailable
      state cannot overwrite a newer valid snapshot.
- [ ] Framework tests prove template-only artifacts cannot satisfy HOC-N1,
      HOC-N3, or specialist freshness.
- [ ] Dashboard, handoff ledger, and issue snapshot agree in a fixture-driven
      workflow test that does not require live secrets.

**Verification:**

- [ ] `pnpm test:agent-framework`
- [ ] `node scripts/issues-snapshot.mjs --dry-run`
- [ ] `node scripts/handoff-ledger.mjs`
- [ ] `node scripts/dashboard-generator.mjs --period 2026-07-13`
- [ ] `node scripts/doc-generator.mjs links`
- [ ] `pnpm check`

**Dependencies:** None; reserve 20% of stage capacity and do not delay Task 1
unless planning evidence becomes untrustworthy.

**Files likely touched:**

- `.github/workflows/agent-daily.yml`
- `.github/workflows/agent-weekly.yml`
- `scripts/issues-snapshot.mjs`
- `scripts/handoff-ledger.mjs`
- `scripts/dashboard-generator.mjs`
- `tests/framework/*`

**Estimated scope:** M, split workflow plumbing from fail-closed framework tests.

## Completion Gate

- [ ] #27 is closed with a current @quality pass before capability work claims
      the reconciled MCP behavior.
- [ ] #28 and #29 each have independent quality decisions and exact public
      wording; one cannot supply evidence for the other.
- [ ] #30 makes the next weekly run preserve current specialist evidence.
- [ ] `pnpm check` passes on the final code-bearing head, with strict visual and
      resource gates where required.
- [ ] Planning snapshots, HOC ledger, dashboard, and GitHub Issues agree.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Tool-inventory reconciliation becomes an accidental breaking removal | high | Decide and document the supported inventory first; require compatibility and package-doc evidence before changing exposure. |
| PMTiles fixture work is mistaken for runtime promotion | high | Require separate display/load/query decisions and preserve No-go wording until @quality accepts each claim. |
| A prerelease MapLibre matrix is treated as an upgrade approval | medium | Pin exact matrix versions and make the keep/bump decision a separate quality output. |
| Infrastructure work expands into a workflow rewrite | medium | Keep #30 to evidence preservation, authenticated snapshots, and fail-closed tests within the 20% allocation. |
| Hosted or 3D work bypasses higher-priority contract debt | high | Keep both outside this milestone and require fresh product/quality inputs before opening promotion issues. |
