---
agent: coordinator
period: 2026-05-31
generated_at: 2026-05-31T05:30:00Z
repo_revision: "179a563e9bc8933690fe6eb90769f2901606ea13"
inputs:
  - package.json (maplibre-gl: ^5.24.0, installed: 5.24.0)
  - pnpm-lock.yaml
  - packages/engine/src/renderer/maplibre/transformer.ts
  - packages/engine/src/renderer/maplibre/adapter.ts
  - tests/snapshot/visual/maplibre-visual.spec.ts
  - examples/ai-map-workbench/public/
  - Official MapLibre GL JS CHANGELOG.md (fetched 2026-05-31)
  - npm view maplibre-gl versions (5.24.0 latest stable, 6.0.0-11 latest prerelease)
owner: "@coordinator"
decision_level: advisory
---

# MLD-002: MapLibre Source Drift Audit

## Audit Scope

This audit covers the impact of upgrading `maplibre-gl` from the current
**5.24.0** (latest stable) to the **6.0.0** prerelease line (6.0.0-11 as of
2026-05-31). It identifies breaking changes and assesses impact on GIS Engine's:

- Transformer (`MapSpec → MapLibreStyle`)
- Adapter (MapLibreAdapter)
- Visual snapshot tests (Playwright + real MapLibre GL)
- Examples (ai-map-workbench)
- Resource policy
- Style spec compatibility (currently MapLibre Style Spec v8)

## Key Finding: GIS Engine Architecture Is Well-Isolated

GIS Engine's `@gis-engine/engine` package **never directly imports `maplibre-gl`**.
The adapter only transforms `MapSpec → MapLibreStyle` (a JSON object matching the
MapLibre Style Spec v8). The actual `maplibre-gl` runtime is used only in:

1. **Visual snapshot tests** (`tests/snapshot/visual/maplibre-visual.spec.ts`) —
   loads the UMD bundle via Playwright
2. **Example workbench** (`examples/ai-map-workbench/public/`) —
   loads the UMD bundle via `<script>` tag

This isolation means **core engine runtime is unaffected by any MapLibre v6 change**.

## v6 Breaking Changes: Impact Analysis

| # | v6 Change | Engine Core | Transformer | Visual Tests | Examples | Severity |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **ESM-only distribution** (6.0.0-5): UMD `maplibre-gl.js` removed | ✅ N/A | ✅ N/A | 🔴 **BREAKS**: `resolveMapLibreBundle()` resolves `dist/maplibre-gl.js` | 🔴 **BREAKS**: expects `/vendor/maplibre-gl.js` | **P0** |
| 2 | **WebGL2 required** (6.0.0-2): WebGL v1 removed | ✅ N/A | ✅ N/A | 🟡 **NEEDS CHECK**: Playwright Chromium must support WebGL2 | ✅ N/A (browsers have WebGL2) | **P1** |
| 3 | **GeoJSON nested objects** (6.0.0-1): behavior change | ✅ N/A | ✅ N/A | 🟡 LOW: GeoJSON fixtures are flat, no nesting | ✅ N/A | **P2** |
| 4 | **TypeScript target ES2022** (6.0.0-3) | ✅ N/A | ✅ N/A | ✅ N/A | ✅ N/A | None |
| 5 | **zoomLevelsToOverscale default** (6.0.0-4): 2→4 | ✅ N/A | ✅ N/A | 🟡 LOW: may shift visual baselines slightly | ✅ N/A | **P2** |
| 6 | **ESM import style** (6.0.0-5): `import * as` required | ✅ N/A | ✅ N/A | ✅ N/A (UMD→global, not ESM import) | ✅ N/A | None |
| 7 | **GeoJSONSource.setData API** (6.0.0-3) | ✅ N/A | ✅ N/A | ✅ N/A | ✅ N/A | None |

### Severity Legend
- 🔴 P0: Blocking — must fix before upgrade
- 🟡 P1: Needs verification — must check before upgrade
- 🟢 P2: Low risk — cosmetic or edge-case
- ✅ None: No impact

## Detailed Impact Analysis

### 1. UMD Bundle Removal (P0 — MUST FIX)

**Evidence**: MapLibre v6.0.0-5 changelog states:
> Switch to an ESM-only distribution (`maplibre-gl.mjs`). The UMD bundles
> (`maplibre-gl.js`, `maplibre-gl-csp.js`) are no longer published.

**Affected code**:

- `tests/snapshot/visual/maplibre-visual.spec.ts:582-600`:
  `resolveMapLibreBundle()` tries `require.resolve("maplibre-gl/dist/maplibre-gl.js")`
- `examples/ai-map-workbench/public/index.html:104`:
  `<script src="/vendor/maplibre-gl.js"></script>`

**Fix strategy**:
1. Update `resolveMapLibreBundle()` to try `maplibre-gl.mjs` (ESM) first,
   fall back to `maplibre-gl.js` (UMD) for v5 compatibility
2. For examples, switch to ESM import (`<script type="module">`) or serve the
   ESM bundle
3. The ESM bundle cannot be loaded via `<script src>` — it requires
   `import` or `<script type="module">`. For Playwright tests, use
   `page.addScriptTag({ type: 'module' })` or inject inline module import.

### 2. WebGL2 Requirement (P1 — NEEDS CHECK)

**Evidence**: MapLibre v6.0.0-2 changelog states:
> WebGL (v1) support has been removed; WebGL2 is now required.

**Assessment**: Playwright Chromium has supported WebGL2 since ~2019. Our CI
uses Chromium for visual tests. However, some headless environments may not
provide WebGL2. The existing WebGL probe in visual tests already handles the
unavailable case (skips with reason). We should add a specific check for
WebGL2 vs WebGL1.

### 3. Style Spec Compatibility

MapLibre v6 still uses the MapLibre Style Spec (currently v24.x for the spec
package). The GIS Engine transformer produces **Style Spec v8** JSON which is
the MapLibre GL JS style format — this is backward-compatible with v6.
No changes needed to the transformer.

### 4. Resource Policy

No changes in network/resource loading behavior that affect GIS Engine's
resource policy (URL validation, tile sources, PMTiles). v6 does not
introduce new resource types.

## Dependency Chain Check

```
@gis-engine/engine (no direct maplibre-gl dep)
  └── tests/snapshot/visual (dev: maplibre-gl via pnpm)
        └── resolveMapLibreBundle() → dist/maplibre-gl.js
  └── examples/ai-map-workbench (dev: copies from node_modules)
        └── /vendor/maplibre-gl.js
```

The root `package.json` has `maplibre-gl: ^5.24.0` as a **devDependency**.
This is correct — maplibre-gl is only needed for testing and examples.

## Recommended Upgrade Path

### Phase 1: v5 Compatibility Stay (current)
- Stay on `maplibre-gl@^5.24.0` for now
- Apply the forward-compatible fix to `resolveMapLibreBundle()` so it can
  resolve both UMD (v5) and ESM (v6) bundles
- Update example workbench to use ESM-compatible loading

### Phase 2: v6 Upgrade (future, when v6 stable is released)
- Bump `maplibre-gl` to `^6.0.0` in devDependencies
- Remove v5 UMD fallback path (after confirming all environments)
- Run full visual snapshot suite with `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1`
- Update visual baselines if zoomLevelsToOverscale shift is detected
- Test GeoJSON nested-object behavior with project fixtures

### Non-Breaking: Stay on v5 Indefinitely
GIS Engine's architecture allows staying on v5.x indefinitely since:
- The engine core never imports maplibre-gl
- The transformer produces standard Style Spec JSON
- Only visual tests and examples need the runtime bundle
- v5.24.0 is a mature, stable release

## Conclusion

**Decision**: Apply forward-compatible fix now (resolveMapLibreBundle), defer
version bump until v6 stable is released.

**Confidence**: HIGH. All breaking changes are isolated to visual test harness
and example loading code. The core engine, transformer, and adapter are
unaffected.
