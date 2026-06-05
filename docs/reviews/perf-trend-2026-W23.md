---
title: Perf Trend Ledger
period: 2026-W23
generated_at: 2026-06-05T19:58:32.234Z
repo_revision: "b4116de"
inputs:
  - tests/perf/perf-trend-ledger.test.ts
owner: "@builder @quality"
decision_level: info
---

# Perf Trend Ledger: 2026-W23

Evidence only. This report records local create/query/destroy measurements for inline GeoJSON fixtures.

| Scale | Features | Create (ms) | Query (ms) | Destroy (ms) | Budgets (ms) | Pass |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 1k | 1000 | 3.3 | 0.9 | 0.0 | 5000 / 2000 / 1000 | yes |
| 10k | 10000 | 22.3 | 3.6 | 0.0 | 15000 / 5000 / 2000 | yes |
| 100k | 100000 | 255.3 | 35.0 | 0.0 | 60000 / 30000 / 10000 | yes |

Passed scales: 3/3
Collected at: 2026-06-05T19:58:32.234Z

## Trend Comparison
Compared with perf-trend-2026-W24.md (2026-W24)

| Scale | Create Delta (ms) | Query Delta (ms) | Destroy Delta (ms) |
| --- | ---: | ---: | ---: |
| 1k | -0.0 | -0.1 | +0.0 |
| 10k | -0.2 | -0.1 | +0.0 |
| 100k | +3.0 | +0.5 | +0.0 |
