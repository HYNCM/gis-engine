# Snapshot Testing

GIS Engine supports two levels of snapshot testing: **smoke** (deterministic, headless) and **visual** (browser-based, pixel-level).

## Smoke Snapshots

Deterministic, no browser required. Run in Node/Vitest.

```bash
pnpm test:snapshot:smoke
```

```typescript
import { snapshotSpec } from "@gis-engine/ai/mcp";

const result = await callGisEngineTool("snapshot_spec", { spec });
// result.snapshot.hash → deterministic hash
// result.snapshot.metadata → layer count, feature count, etc.
```

## Visual Snapshots

Browser-based, pixel-level. Uses Playwright + MapLibre GL.

```bash
pnpm test:snapshot:visual
```

```bash
# Update baselines (rewrites pixel references and requires the visual suite)
pnpm test:snapshot:update

# Strict mode (CI)
GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual
```

Each visual scene is additionally compared against a committed pixel baseline under
`tests/__snapshots__/`: `maplibre-geojson`, `maplibre-vector-tile`, `maplibre-fill-extrusion`,
`maplibre-data-driven`, and `scene3d-frame`. Baselines exist for macOS runners only, so a runner on
another platform reports a missing baseline rather than a rendering regression — it never produced
the reference frame.

## When to Use Each

| Scenario | Smoke | Visual |
|----------|-------|--------|
| Schema changes | ✅ Required | Optional |
| Layer/rendering changes | ✅ Required | ✅ Required |
| Docs-only changes | ✅ Required | Skip |
| Type-only changes | ✅ Required | Skip |
| Release candidate | ✅ Required | ✅ Required |

## CI Integration

```yaml
- run: pnpm test:snapshot:smoke           # Always
- run: pnpm test:snapshot:visual          # Conditional (needs browser)
- run: GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual  # Release
```
