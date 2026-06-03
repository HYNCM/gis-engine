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
| create (spec load + adapter init) | < 100ms |
| queryFeatures (point) | < 50ms p95 |
| snapshot (1024x768) | < 2s |
| destroy (resource cleanup) | < 100ms, no residual raf/listener/worker |

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
| `@gis-engine/engine` | < 100KB |
| `@gis-engine/cli` | < 30KB |

MapLibre GL JS is an optional peerDependency and is not included in the engine
bundle.
