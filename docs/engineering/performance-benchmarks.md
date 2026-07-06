# Performance Benchmarks

Two tiers: smoke (PR-level, deterministic) and nightly (large-scale lifecycle).
Neither is a long-term performance commitment; they prevent regressions against
the current release surface.

## Smoke Tests

Run on every PR via `pnpm check`:

```bash
pnpm test:perf:smoke
```

| Case | Budget |
|---|---|
| create (spec load + adapter init) | < 500ms |
| queryFeatures (point) | < 200ms p95 |
| snapshot (1024x768) | < 200ms |
| destroy (resource cleanup) | < 200ms, no residual raf/listener/worker |
| 50-command batch replay | < 1000ms |

## Nightly Tests

Run on main-nightly and release runners:

```bash
pnpm test:perf:nightly
```

| Case | Budget |
|---|---|
| 1k inline GeoJSON features | create + render < 1s |
| 10k inline GeoJSON features | create + render < 3s |
| 100k inline GeoJSON features | no crash; warnings allowed |
| pan/zoom 5s sustained | no long task > 500ms |

## Bundle Size Budgets

| Package | Budget (gzipped) |
|---|---|
| `@gis-engine/engine` | < 130KB |
| `@gis-engine/cli` | < 35KB |

MapLibre GL JS is an optional peerDependency and is not included in the engine
bundle.
