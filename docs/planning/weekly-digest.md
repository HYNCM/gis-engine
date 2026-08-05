---
agent: orchestrator
period: 2026-W32
generated_at: 2026-08-05T17:13:00Z
repo_revision: "23472d8050cad0178c49f85f045f488bd5aaaf41"
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
  - https://github.com/HYNCM/gis-engine/pull/46
  - https://github.com/HYNCM/gis-engine/actions/runs/31028265187
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Weekly Digest

## W32-W34 Gate Decision

**FINAL PASS.** PR #46 merged the exact reviewed head to `main` as
`23472d8050cad0178c49f85f045f488bd5aaaf41`. All final-head PR checks passed,
the merged-main CI, docs, bundle-size, daily cadence, Release rerun, and manual
recovery workflows succeeded, issues #38-#43 closed, and milestone 2 closed at
zero open issues.

| Issue | Accepted outcome | Final state / promotion decision |
| --- | --- | --- |
| #38 | Exact MapLibre 5.24.0/6.1.0 native install, type, worker/resource, query, browser, and strict visual matrix passes | CLOSED; keep 5.24.0 as default, 6.1.0 adoption remains No-go |
| #39 | One structured source owns clean-build package baselines, 200 KiB engine and 64 KiB CLI blocking limits, and CI/local semantics | CLOSED; package-size gate PASS |
| #40 | MCP 2026-07-28 compatibility matrix covers the new lifecycle and fails closed | CLOSED; keep MCP 2025-11-25 as default, v2 migration remains No-go |
| #41 | Public v1.5 release notes expose the ordered 14-tool contract and explicit hosted/3D/PMTiles exclusions | CLOSED; release-truth gate PASS |
| #42 | GeoParquet 1.1 and reviewed 2.0 RC metadata are version-discriminated with stable diagnostics | CLOSED; metadata PASS, fetch/parse/WASM/display/query remain No-go |
| #43 | Specialist evidence, HOC freshness, incident identity, recovery deduplication, and bounded push retry are fail closed | CLOSED; merged-main recovery run 31028265187 PASS |

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
- Historical recovery #32 closed as the canonical resolved incident; #33-#35
  closed as duplicate records after merged-main run 31028265187 created no new
  escalation issue.
- [Version Packages PR #47](https://github.com/HYNCM/gis-engine/pull/47) is the
  pending major-release vehicle. It is not release authorization and remains
  unmerged.
- [#48](https://github.com/HYNCM/gis-engine/issues/48) owns the advisory
  Release workflow Actions v4/Node 20 deprecation cleanup.

## Next Checkpoint

Begin W35 with #44, then #45 and #48. Preserve the explicit protocol,
renderer, data-runtime, hosted-product, and package-publication No-go
boundaries until separate issues and quality gates authorize a change.
