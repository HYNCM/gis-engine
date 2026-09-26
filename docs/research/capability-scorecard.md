---
agent: product
period: 2026-W39
generated_at: 2026-09-26T11:01:30Z
repo_revision: "ca106daef645eb52c684c9ad619b9ada91d9a8ad"
inputs:
  - docs/research/competitor-updates-2026-W39.md
  - docs/planning/project-review-2026-09-24.md
  - packages/engine/src/commands/applyCommands.ts
  - packages/ai/src/mcp/server.ts
owner: "@product"
decision_level: advisory
evidence_kind: specialist
status: ready-for-planning
---

# Capability Scorecard

Checked 2026-09-26. This is a conservative 0–10 delivery-readiness assessment,
not a benchmark, market ranking or release gate. Compared with W32, the rubric
now discounts unmerged candidates, missing user evidence and metadata-only
capabilities. Scores are not directly comparable; no fabricated week-over-week
delta or whole-product competitor average is reported.

| Dimension | Score | Evidence and limit | Confidence |
| --- | ---: | --- | --- |
| AI operability | 7 | Canonical schema-described 14-tool contract and command tests exist; the September review found Studio reset evidence bypass and stale provider state risks. Strong contracts do not prove every application path obeys them. | medium |
| 2D performance readiness | 6 | MapLibre adapter, perf smoke and visual tests exist; no current cross-product throughput/latency benchmark was run. This scores evidence readiness, not rendering speed. | medium |
| 3D readiness | 3 | Experimental scene3d packages have adapter evidence; stable mode remains behind explicit promotion gates. No stable-product credit. | high |
| Developer experience | 5 | CLI and examples provide a buildable route; main/Workbench candidate split and missing target-user completion evidence limit confidence in end-to-end usability. | medium |
| Ecosystem/data readiness | 4 | Adapter boundaries and URL/display paths exist; GeoParquet metadata and PMTiles load plans are not accepted runtime decoding/query support. | high |

Current competitor facts and dated sources are in
[the W39 comparison](competitor-updates-2026-W39.md). It compares product boundaries
rather than pretending that hosted GIS, renderer libraries and this project's
contracts are interchangeable products. No competitor performance score is
assigned without a common workload.

Evidence → impact → action: the comparison shows broad AI map entry points are
already available; prioritize one verifiable local delivery route and reduce
coordination cost. @orchestrator owns scope, @builder implementation, @quality
technical gates and @product user validation. Confidence: high for narrowing
scope; medium for the proposed differentiation until five target users test it.
