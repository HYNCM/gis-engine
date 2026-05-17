---
agent: quality-guardian
period: 2026-05-18
generated_at: 2026-05-18T01:26:00Z
repo_revision: "7c1f2dd"
inputs:
  - package.json
  - tests/nightly-perf/perf-nightly.test.ts
  - docs/planning/resource-perf-gap-plan.md
decision_level: release-evidence
---

# Performance Nightly Evidence: 2026-05-18

## Command

```bash
pnpm -s test:perf:nightly
```

## Result

Passed with 3 synthetic inline GeoJSON scales:

- 1,000 features.
- 10,000 features.
- 100,000 features.

The 100,000 feature case completed create/query/snapshot/destroy under the
nightly Node/mock budgets, and the full file reported:

```txt
tests/nightly-perf/perf-nightly.test.ts (3 tests) passed
```

## Scope

This is a nightly/release evidence script, not part of `pnpm check`. The default
PR gate remains deterministic and lightweight through `pnpm test:perf:smoke`.

The synthetic test intentionally uses inline GeoJSON with the mock renderer so
it measures runtime cloning, validation, query, snapshot, and destroy lifecycle
cost without remote tile, browser, GPU, or network noise.
