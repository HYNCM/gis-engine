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
| `@gis-engine/engine` | 200 KiB blocking |
| `@gis-engine/cli` | 64 KiB blocking |

`config/package-size-budgets.json` is the only authority for these byte limits,
their baselines, and their rationale. `canonical-dist-gzip-v1` measures every
regular file in the complete `dist` tree with sorted relative paths,
path/length/content framing, and gzip level 9; timestamps and permissions do
not affect the result. The checked baseline is 193998 bytes for engine and
60730 bytes for CLI. A measurement more than 5% above its baseline is an
advisory; crossing a blocking budget fails `pnpm size:check`.

MapLibre GL JS remains an optional peer dependency and therefore is not present
in the engine `dist` tree measured by this policy.
