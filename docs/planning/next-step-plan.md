---
agent: orchestrator
period: 2026-W32-W34
generated_at: 2026-08-05T16:20:00Z
repo_revision: "5800a6d034898a17a94eb46a621ac52943d5919d"
inputs:
  - docs/research/competitor-updates-2026-W32.md
  - docs/research/capability-scorecard.md
  - docs/planning/issues-snapshot.md
  - docs/reviews/release-truth-quality-decision-2026-08-03.md
  - docs/reviews/evidence-integrity-quality-decision-2026-08-03.md
  - docs/reviews/mcp-2026-07-28-quality-decision-2026-08-03.md
  - docs/reviews/maplibre-6.1-quality-decision-2026-08-03.md
  - docs/reviews/geoparquet-version-boundary-quality-decision-2026-08-03.md
  - docs/reviews/package-size-budget-quality-decision-2026-08-05.md
  - docs/reviews/documentation-audit-2026-08-06.md
  - https://github.com/HYNCM/gis-engine/issues/38
  - https://github.com/HYNCM/gis-engine/issues/39
  - https://github.com/HYNCM/gis-engine/issues/40
  - https://github.com/HYNCM/gis-engine/issues/41
  - https://github.com/HYNCM/gis-engine/issues/42
  - https://github.com/HYNCM/gis-engine/issues/43
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Next Stage Plan: Compatibility And Evidence Integrity

## Outcome

Close milestone 2 by proving current compatibility and evidence boundaries
without silently promoting a new protocol, renderer default, data runtime, or
hosted product claim. The implementation branch is complete; remote delivery
and post-merge reconciliation remain the only stage-exit work.

## Execution Results

| Order | Issue | Implemented result | Quality | Remaining closure |
| ---: | --- | --- | --- | --- |
| 1 | #41 | v1.5 release truth and ordered 14-tool inventory aligned | PASS | final-head CI, merge, close issue |
| 2 | #43 | specialist freshness, fail-closed timestamps, incident deduplication, recovery reconciliation, and bounded push retry | PASS for code; current cadence blocked until merge | run recovery on merged main, reconcile #32-#35 |
| 3 | #40 | executable MCP 2026-07-28 matrix with default unchanged | PASS, adoption No-go | merge and close issue |
| 4 | #38 | real MapLibre 5.24.0/6.1.0 browser/query/worker/visual matrix | PASS, keep 5.24.0 | merge and close issue |
| 5 | #42 | TypeBox/policy parity for exact GeoParquet 1.1/2.0-RC metadata and diagnostics | PASS, runtime No-go | merge and close issue |
| 6 | #39 | reproducible clean-build gzip budgets from one structured policy | PASS | merge and close issue |

## Acceptance Evidence

### Public release truth (#41)

- [x] v1.5 release entry lists the exact 14 MCP tools in canonical order.
- [x] Hosted Workbench, stable SceneView3D, and PMTiles runtime query remain
      explicit No-go claims.
- [x] Node 22 release preflight passes with pnpm 11.9.0 and Chromium.

### Evidence integrity (#43)

- [x] Template artifacts cannot satisfy specialist SLA or HOC checks.
- [x] Missing, invalid, or future `generated_at` values fail closed.
- [x] Recovery identity is deterministic per workflow/failed-run marker and
      updates or reopens a canonical issue instead of creating duplicates.
- [x] Scheduled planning push uses bounded fetch/rebase/push retry without
      force push.
- [ ] Merged-main manual workflow run proves no new duplicate incident and
      permits #32-#35 reconciliation.

### MCP compatibility (#40)

- [x] Official stable 2026-07-28 lifecycle differences are represented in a
      checked fixture and live-server conformance test.
- [x] The canonical 14 descriptors still validate through the MCP SDK.
- [x] `GIS_ENGINE_MCP_PROTOCOL_VERSION` remains 2025-11-25; adoption is No-go.

### MapLibre compatibility (#38)

- [x] Exact 5.24.0 and 6.1.0 native installs build and run in Chromium.
- [x] Worker/resource paths, vector query identity, console health, pixels,
      and per-version artifacts are verified.
- [x] Strict aggregate fails closed and keeps 5.24.0 as the default.

### GeoParquet boundary (#42)

- [x] TypeBox and policy validation distinguish exact 1.1 and reviewed 2.0 RC
      metadata, including version-specific bbox widths.
- [x] Missing, unsupported, mismatched, ambiguous, or invalid evidence returns
      stable diagnostics.
- [x] Public types/docs/migration align, and a breaking changeset marks the
      contract unreleased from v1.5.0.
- [x] Fetch, parser, range IO, WASM execution, worker, display, and query remain
      blocked.

### Package budgets (#39)

- [x] One JSON policy owns build recipe, baseline provenance, measurement,
      budgets, and severity semantics.
- [x] Clean checkout reproduction passes at engine 200 KiB and CLI 64 KiB
      blocking gzip limits.
- [x] Local and CI use the same `pnpm size:check` entry point.

## Integrated Gate Evidence

- [x] `pnpm build:schema`
- [x] `pnpm check`
- [x] `pnpm test:compat:mcp`
- [x] `pnpm test:compat:maplibre`
- [x] `pnpm test:e2e:browser`
- [x] `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual`
- [x] `pnpm test:release:scene3d`
- [x] `pnpm size:check`
- [x] `pnpm test:docs`
- [x] Node 22 `scripts/release-preflight.mjs`
- [ ] Final-head GitHub Actions checks
- [ ] Authenticated post-merge planning evidence

`pnpm knip` correctly remains red on classified repository inventory debt; it
is not hidden or broadened into this milestone. [#44](https://github.com/HYNCM/gis-engine/issues/44)
owns its bounded resolution. [#45](https://github.com/HYNCM/gis-engine/issues/45)
owns the independent retention-policy mismatch.

## Stage Exit Sequence

1. Commit the synchronized specialist and planning evidence.
2. Push `codex/w32-w34-completion` and open one PR closing #38-#43.
3. Wait for every final-head GitHub Actions check and fix real failures without
   weakening gates.
4. Merge, then run Agent Failure Recovery manually on merged `main`.
5. Reconcile #32-#35 from the workflow evidence and close milestone 2 only at
   zero open milestone issues.
6. Generate one authenticated issue snapshot, HOC ledger, and dashboard, then
   publish the post-merge closeout through a small planning PR.

## Guardrails

- Compatibility is not adoption.
- Metadata readiness is not runtime support.
- Branch quality evidence is not merged-main or published-package evidence.
- A pending changeset is not authorization to publish a major release.
- #44 may not use broad ignore rules; #45 authorizes no deletion.
