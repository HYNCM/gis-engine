---
title: Perf Trend Ledger
period: 2026-W24
generated_at: 2026-06-05T18:28:36.102Z
repo_revision: "948c7ad"
inputs:
  - tests/perf/perf-trend-ledger.test.ts
owner: "@builder @quality"
decision_level: info
---

# Perf Trend Ledger: 2026-W24

Evidence only. This report records local create/query/destroy measurements for inline GeoJSON fixtures.

| Scale | Features | Create (ms) | Query (ms) | Destroy (ms) | Budgets (ms) | Pass |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 1k | 1000 | 3.3 | 1.0 | 0.0 | 5000 / 2000 / 1000 | yes |
| 10k | 10000 | 22.5 | 3.7 | 0.0 | 15000 / 5000 / 2000 | yes |
| 100k | 100000 | 252.3 | 34.5 | 0.0 | 60000 / 30000 / 10000 | yes |

Passed scales: 3/3
Collected at: 2026-06-05T18:28:36.102Z
