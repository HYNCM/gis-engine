# Performance

GIS Engine tracks two performance tiers — **smoke** tests on every PR and
**nightly** benchmarks on main — to catch regressions before they ship. Neither
tier is a long-term SLA; they guard the current release surface.

## Smoke Tests

Run on every PR via `pnpm check`:

```bash
pnpm test:perf:smoke
```

Smoke tests use the `MockAdapter` with small inline GeoJSON specs to keep
results deterministic across CI environments.

| Operation | Budget | Notes |
|---|---|---|
| `createMap` (spec load + adapter init) | < 1,000ms | Single-feature inline GeoJSON |
| `queryFeatures` (point query) | < 500ms | One layer, one matching feature |
| `snapshot` (target layer) | < 500ms | Mock adapter data-URL output |
| `destroy` (resource cleanup) | < 500ms | Must return `destroyed: true` |

A separate command replay test applies 50 `setView` commands and asserts the
batch completes under 2,000ms.

## Nightly Tests

Run on main-nightly and release runners:

```bash
pnpm test:perf:nightly
```

Nightly tests scale inline GeoJSON feature counts to exercise the full
`createMap` / `queryFeatures` / `snapshot` / `destroy` lifecycle at realistic
data volumes.

| Feature Count | Create Budget | Query Budget | Snapshot Budget | Destroy Budget |
|---|---|---|---|---|
| 1,000 | < 1,500ms | < 1,000ms | < 500ms | < 500ms |
| 10,000 | < 3,000ms | < 1,500ms | < 500ms | < 500ms |
| 100,000 | < 10,000ms | < 5,000ms | < 500ms | < 500ms |

All nightly tests use `renderer: "mock"` to stay deterministic and avoid
MapLibre WebGL dependencies in CI.

## Bundle Size Budgets

| Package | Budget (gzipped) |
|---|---|
| `@gis-engine/engine` | < 130 KB |
| `@gis-engine/cli` | < 35 KB |

MapLibre GL JS is an optional `peerDependency` and is **not** included in the
engine bundle size budget.

## Running Performance Tests Locally

```bash
# Smoke tests only
pnpm test:perf:smoke

# Nightly tests only (slower, larger datasets)
pnpm test:perf:nightly

# Both together
pnpm test:perf:smoke && pnpm test:perf:nightly
```

Both test suites are standard Vitest files:

| Suite | Path |
|---|---|
| Smoke | `tests/perf/perf-smoke.test.ts` |
| Nightly | `tests/nightly-perf/perf-nightly.test.ts` |

## Tips for Performance Optimization

- **Prefer `MockAdapter` for CI** — it avoids WebGL context creation and is
  fully deterministic.
- **Inline GeoJSON for queries** — URL-based sources cannot be queried in
  headless mode without a future loader contract. Keep test data inline.
- **Layer targeting** — pass `layers` to `queryFeatures` to avoid scanning
  every layer in the spec.
- **Transaction mode** — use `{ transaction: "best-effort" }` in
  `applyCommands` when you do not need per-command rollback semantics.
- **Batch commands** — a single `applyCommands` call with 50 commands is faster
  than 50 individual calls.

## Hardware and Environment Notes

Actual benchmark numbers depend on CPU, memory, Node.js version, and CI
runner characteristics. The budgets above are **upper bounds**, not targets.
Typical local runs on modern hardware complete well under budget:

| Operation | Typical Local (Apple M-series) | Budget |
|---|---|---|
| `createMap` (1 feature) | ~5ms | < 1,000ms |
| `queryFeatures` (point) | ~2ms | < 500ms |
| `snapshot` (mock) | ~1ms | < 500ms |
| `destroy` | ~1ms | < 500ms |

### Latest Measured Results (2026-06-04)

| Suite | Result | Duration |
|---|---|---|
| Smoke: command replay (50 setView) | pass | < 100ms |
| Smoke: create/query/snapshot/destroy | pass | < 50ms total |
| Nightly: 100,000 features lifecycle | pass | 362ms total |

All tests ran on Node.js with MockAdapter. The 100k-feature nightly test
(create + query + snapshot + destroy) completed in 362ms — well under the
combined budget of 16,500ms.

If your CI consistently approaches budget limits, investigate runner
configuration before optimizing engine code.

## Related

- [Custom Adapters](/guide/custom-adapters) — building adapters for specialized benchmarks
- [Snapshot Testing](/guide/snapshot-testing) — deterministic rendering assertions
