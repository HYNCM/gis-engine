---
agent: quality
period: 2026-06-03
generated_at: 2026-06-03T07:30:00Z
repo_revision: "27d900a"
inputs:
  - https://github.com/maplibre/maplibre-gl-js/releases
  - command: npm view maplibre-gl version dist-tags time --json
  - https://github.com/maplibre/maplibre-gl-js/blob/main/CHANGELOG.md
  - command: npm view maplibre-gl@6.0.0-11 dependencies --json
  - packages/engine/package.json
  - packages/engine/src/renderer/maplibre/transformer.ts
  - docs/engineering/maplibre-version-drift-audit.md
owner: "@quality"
decision_level: advisory
---

# MapLibre v6 Upgrade Gate Evidence — 2026-06-03

## Decision

**Conditional prerelease audit.** MapLibre v6 (`6.0.0-11`) is still a prerelease
under the `next` dist-tag. Stable `latest` remains `5.24.0` (2026-04-23).
Per the SDK+CLI 首发产品化计划 (PLAN.md §1a), v0.2 GA keeps `maplibre-gl` at
`^5.24.0`; v6 enters a compatibility audit branch only. The GA publish decision
is **No-go** for v6 until a future task accepts stable v6 with strict visual
evidence.

## Official Package Evidence

| Signal | Value | Checked |
| --- | --- | --- |
| `latest` dist-tag | `5.24.0` | 2026-06-03 |
| `next` dist-tag | `6.0.0-11` | 2026-06-03 |
| v6 prerelease range | `6.0.0-0` through `6.0.0-11` (12 builds) | 2026-04-27 → 2026-05-21 |
| v5 latest publish date | 2026-04-23 | npm `time` |
| v6 style spec (`@maplibre/maplibre-gl-style-spec`) | `^24.8.5` (same as v5) | npm `dependencies` |
| v6 `@maplibre/mlt` | `^1.1.9` (new dependency) | npm `dependencies` |
| v6 `@maplibre/geojson-vt` | `^6.1.0` | npm `dependencies` |
| Source | `npm view maplibre-gl version dist-tags time --json` | 2026-06-03 |

## Audit Checklist Summary

### Upgrade Intake

- [x] Current installed: `^5.24.0` (root devDependencies + Studio direct dependency).
- [x] Candidate: `6.0.0-11` (prerelease, `next` tag).
- [x] Change type: major (v5 → v6 prerelease).
- [x] Audit scope: dependency compatibility + peerDependency declaration + transformer spot check.

### Transformer

- [x] `packages/engine/src/renderer/maplibre/transformer.ts` maps `geojson`,
  `raster`, `pmtiles`, `vector` sources — style spec `^24.8.5` is shared between
  v5 and v6, so transformer output is expected to remain valid.
- [x] Layer type mapping (`background`, `raster`, `fill`, `line`, `circle`,
  `symbol-lite`, `fill-extrusion-lite`) is style-spec-level, not runtime-version-specific.

### Source URL And Resource Policy

- [x] Resource policy (`packages/engine/src/spec/resource-policy.ts`) operates
  on `MapSpec` URLs before MapLibre loads them; no v6 runtime fetch change
  affects this boundary.

### Dependency And Package Boundary

- [x] `@gis-engine/engine` now declares `maplibre-gl` as an **optional
  `peerDependency`** (`^5.0.0 || ^6.0.0`). This means:
  - Engine does NOT bundle MapLibre — consumers provide it.
  - Studio keeps `maplibre-gl` as a direct dependency.
  - Root devDependencies keep `^5.24.0` for deterministic tests.
- [x] No renderer-specific types leak into public `MapSpec` or MCP tools.

### Smoke / Visual / Release

- [x] `pnpm build:schema` — passed.
- [x] `pnpm check` — passed (all 11 test suites + studio tests + smoke snapshots).
- [ ] `pnpm test:snapshot:visual` — not run for v6 prerelease (deferred to
  stable v6 or explicit beta/canary approval).
- [ ] `pnpm test:release:scene3d` — not affected (SceneView3D does not
  depend on MapLibre).

## PeerDependency Change

```json
{
  "peerDependencies": {
    "maplibre-gl": "^5.0.0 || ^6.0.0"
  },
  "peerDependenciesMeta": {
    "maplibre-gl": {
      "optional": true
    }
  }
}
```

This change:
- Makes the MapLibre dependency boundary explicit for SDK consumers.
- Allows future v6 consumers without requiring engine code changes.
- Keeps engine's npm install lightweight (no bundled renderer).
- Does not change any runtime behavior or test configuration.

## Rollback Decision

- **v0.2 GA**: stays on `^5.24.0`. No package movement.
- **v6 compat branch**: peerDependency range `^5.0.0 || ^6.0.0` allows future
  v6 consumers to test without engine source changes.
- **Next evidence required for stable v6 GA**: official stable release,
  changelog diff, lockfile diff, transformer spot check, adapter tests,
  smoke snapshot, visual snapshot, and release runner pass.

## Boundaries Preserved

- No MapLibre v6 runtime dependency introduced.
- No transformer, resource policy, or schema change.
- No new MCP tool alias or source loader.
- No SceneView3D or stable runtime promotion.
- Studio/Workbench behavior unchanged.

## Verification

- `pnpm build:schema` — passed.
- `pnpm check` — passed.
- `npm view maplibre-gl version dist-tags time --json` — passed.
- `npm view maplibre-gl@6.0.0-11 dependencies --json` — passed.
