---
agent: orchestrator
period: 2026-W32
generated_at: 2026-08-05T16:20:00Z
repo_revision: "5800a6d034898a17a94eb46a621ac52943d5919d"
inputs:
  - docs/research/competitor-updates-2026-W32.md
  - docs/research/capability-scorecard.md
  - docs/reviews/maplibre-6.1-quality-decision-2026-08-03.md
  - docs/reviews/mcp-2026-07-28-quality-decision-2026-08-03.md
  - docs/reviews/geoparquet-version-boundary-quality-decision-2026-08-03.md
  - docs/reviews/package-size-budget-quality-decision-2026-08-05.md
  - docs/reviews/evidence-integrity-quality-decision-2026-08-03.md
  - docs/reviews/release-truth-quality-decision-2026-08-03.md
  - docs/reviews/documentation-audit-2026-08-06.md
  - docs/planning/issues-snapshot.md
  - docs/planning/next-step-plan.md
  - https://github.com/HYNCM/gis-engine/milestone/2
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Weekly Digest

## W32-W34 Gate Decision

Implementation for issues #38 through #43 is complete on
`codex/w32-w34-completion`. Each issue has bounded builder evidence, an
independent quality PASS, and the required local deterministic or browser
gate. This is a **pre-merge decision**: the issues and milestone remain open
until the final branch head passes GitHub Actions and lands on `main`.

| Issue | Accepted branch outcome | Promotion decision |
| --- | --- | --- |
| #38 | Exact MapLibre 5.24.0/6.1.0 native install, type, worker/resource, query, browser, and strict visual matrix passes | Keep 5.24.0 as default; 6.1.0 adoption remains No-go |
| #39 | One structured source owns clean-build package baselines, 200 KiB engine and 64 KiB CLI blocking limits, and CI/local semantics | Package-size gate PASS |
| #40 | MCP 2026-07-28 compatibility matrix covers the new lifecycle and fails closed | Keep MCP 2025-11-25 as default; v2 migration remains No-go |
| #41 | Public v1.5 release notes expose the ordered 14-tool contract and explicit hosted/3D/PMTiles exclusions | Release-truth gate PASS |
| #42 | GeoParquet 1.1 and reviewed 2.0 RC metadata are version-discriminated with stable diagnostics | Metadata gate PASS; fetch/parse/WASM/display/query remain No-go |
| #43 | Specialist evidence, HOC freshness, incident identity, recovery deduplication, and bounded push retry are fail closed | Merge-ready; scheduled recovery proof is required on merged `main` |

## Current External Signals

Official sources were checked on 2026-08-06 in
[competitor-updates-2026-W32.md](../research/competitor-updates-2026-W32.md).
MapLibre 6.1.0 and MCP 2026-07-28 are now stable upstream releases, but both
require separate adoption programs. GeoParquet has no final 2.0 tag, and the
PMTiles v3 archive/query obligations are unchanged.

The product priority formula ranks MCP v2 conformance research first at 7.75,
followed by GeoParquet final-watch at 6.50, PMTiles runtime promotion at 6.40,
and MapLibre default adoption at 6.00. None of these advisory scores overrides
the explicit No-go boundaries above.

## Residual Work

- [#44](https://github.com/HYNCM/gis-engine/issues/44) owns the real `knip`
  inventory debt: 56 file findings, two unlisted MapLibre test dependencies,
  unused exports/types/dependencies, one duplicate export, and config hints.
- [#45](https://github.com/HYNCM/gis-engine/issues/45) owns the pre-existing
  seven-days versus seven-files report-retention mismatch. It authorizes no
  deletion.
- Issues #32-#35 remain open historical recovery duplicates until the repaired
  workflow is manually exercised on merged `main` and proves one canonical
  incident identity.

## Next Checkpoint

Publish the implementation PR, require final-head remote checks, merge, run the
manual recovery workflow, reconcile #32-#35, close #38-#43 and milestone 2,
then generate one authenticated post-merge planning evidence run. Until those
steps complete, branch evidence must not be described as main-branch delivery.
