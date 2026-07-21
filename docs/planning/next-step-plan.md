---
agent: orchestrator
period: 2026-W29
generated_at: 2026-07-20T17:03:46Z
repo_revision: "282c4a3136fa93a761c49ef9e05c4aedccc3d9b7"
inputs:
  - docs/research/competitor-updates-2026-W29.md
  - docs/research/capability-scorecard.md
  - docs/reviews/quality-gate-planning-input-2026-07-13.md
  - https://github.com/HYNCM/gis-engine/issues/27
  - https://github.com/HYNCM/gis-engine/issues/28
  - https://github.com/HYNCM/gis-engine/issues/29
  - https://github.com/HYNCM/gis-engine/issues/30
  - docs/reviews/pmtiles-capability-truth-quality-decision-2026-07-20.md
  - docs/reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md
  - docs/reviews/fail-closed-agent-evidence-quality-decision-2026-07-21.md
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
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

Implementation closure was recorded on 2026-07-20/21. All four bounded tasks
now have code, focused verification, and independent quality decisions on
`codex/mcp-contract-convergence`. GitHub issues remain open until the branch is
merged; this document does not treat local completion as main-branch delivery.

## Execution Closure

| Issue | Branch result | Quality decision | Merge state |
| --- | --- | --- | --- |
| #27 | Canonical 14-tool MCP 2025-11-25 contract and structured results implemented | PASS | open pending PR merge |
| #28 | PMTiles display/load-plan Go; runtime archive load/query No-go and fail closed | PASS | open pending PR merge |
| #29 | Exact 5.24.0/6.0.0-22 matrix passed; keep 5.24.0 and do not bump prerelease | PASS | open pending PR merge |
| #30 | Auth failure preserves planning artifacts; template evidence cannot satisfy HOC/freshness | PASS | open pending PR merge |

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

- [x] One approved inventory is enforced across AGENTS, the Phase 1 spec,
      descriptors, package docs, and tests; no undocumented aliases remain.
- [x] Tools with `outputSchema` return schema-conforming `structuredContent`
      and a backwards-compatible JSON text block.
- [x] Protocol and schema-conformance tests cover every approved tool without
      adding a mutation path or expanding tool scope.

**Verification:**

- [x] `pnpm build:schema`
- [x] `pnpm test:ai`
- [x] `pnpm test:docs`
- [x] `pnpm check`

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

- [x] @quality accepts the public inventory and structured-result conformance.
- [x] No package release or new public MCP tool proceeds before this checkpoint.

## Phase 2: Capability Truth

### Task 2: PMTiles runtime capability decision (#28)

**Description:** Align loader behavior, resource-policy evidence, AI readiness
summaries, and public claims on one explicit PMTiles support level.

**Acceptance criteria:**

- [x] The accepted No-go decision records archive metadata/directory lookup,
      cancellation, budgets, cache behavior, and deterministic negative paths.
- [x] Package exports, docs, generated-app evidence, and AI summaries express
      the same accepted or blocked state without hidden IO.
- [x] @quality records separate Go/No-go decisions for display, load, and
      feature-query claims; other cloud-native formats stay out of scope.

**Verification:**

- [x] `pnpm test:schema`
- [x] `pnpm test:resources`
- [x] `pnpm test:runtime`
- [x] `pnpm test:adapter`
- [x] `pnpm test:ai`
- [x] `pnpm check`

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

- [x] A repeatable matrix compiles and tests public adapter APIs against both
      versions and records exact checked versions plus event/type/ESM drift.
- [x] Generated examples load in both entries and smoke/strict visual evidence
      records any divergence.
- [x] @quality issues a separate keep/bump decision; this task does not upgrade
      the default dependency or public version claim.

**Verification:**

- [x] `pnpm test:adapter`
- [x] `pnpm test:e2e:browser`
- [x] `pnpm test:snapshot:smoke`
- [x] `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual`
- [x] `pnpm check`

**Dependencies:** Task 1; may run in parallel with Task 2 after the checkpoint.

**Files likely touched:**

- `packages/engine/src/renderer/maplibre/adapter.ts`
- `packages/engine/src/renderer/maplibre/v6-audit.ts`
- `tests/adapter/*maplibre*`
- `tests/e2e/render-pipeline.spec.ts`
- `.github/workflows/ci.yml`

**Estimated scope:** M

### Checkpoint: Capability Claims

- [x] PMTiles support wording matches accepted runtime evidence exactly.
- [x] MapLibre v6 remains evidence-only unless a separate bump decision passes.
- [x] `pnpm check` and all path-aware resource/visual gates pass.

## Phase 3: Planning Evidence Integrity

### Task 4: Fail-closed agent evidence (#30)

**Description:** Keep template generation, specialist decisions, HOC
consumption, and GitHub issue snapshots distinguishable and current.

**Acceptance criteria:**

- [x] Authenticated issue state reaches snapshot generation, and unavailable
      state cannot overwrite a newer valid snapshot.
- [x] Framework tests prove template-only artifacts cannot satisfy HOC-N1,
      HOC-N3, or specialist freshness.
- [x] Dashboard, handoff ledger, and issue snapshot agree in a fixture-driven
      workflow test that does not require live secrets.

**Verification:**

- [x] `pnpm test:agent-framework`
- [x] `node scripts/issues-snapshot.mjs --dry-run` (expected fail-closed exit 2 locally; snapshot preserved)
- [x] `node scripts/handoff-ledger.mjs --dry-run`
- [x] `node scripts/dashboard-generator.mjs --dry-run --period 2026-07-21`
- [x] `node scripts/doc-generator.mjs links`
- [x] `pnpm check`

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
- [x] #28 and #29 each have independent quality decisions and exact public
      wording; one cannot supply evidence for the other.
- [x] #30 makes the next weekly run preserve current specialist evidence.
- [x] `pnpm check` passes on the final code-bearing head, with strict visual and
      resource gates where required.
- [x] Planning snapshots, HOC ledger, dashboard, and GitHub Issues agree on the
      current pre-merge state; the last authenticated issue snapshot was
      preserved because local GitHub authentication is unavailable.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Tool-inventory reconciliation becomes an accidental breaking removal | high | Decide and document the supported inventory first; require compatibility and package-doc evidence before changing exposure. |
| PMTiles fixture work is mistaken for runtime promotion | high | Require separate display/load/query decisions and preserve No-go wording until @quality accepts each claim. |
| A prerelease MapLibre matrix is treated as an upgrade approval | medium | Pin exact matrix versions and make the keep/bump decision a separate quality output. |
| Infrastructure work expands into a workflow rewrite | medium | Keep #30 to evidence preservation, authenticated snapshots, and fail-closed tests within the 20% allocation. |
| Hosted or 3D work bypasses higher-priority contract debt | high | Keep both outside this milestone and require fresh product/quality inputs before opening promotion issues. |
