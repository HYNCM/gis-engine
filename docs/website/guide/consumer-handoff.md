# Minimal Consumer Handoff

This guide shows the smallest realistic consumer-repo pattern we recommend for
GIS Engine v1.0.0:

1. a hand-authored `map.json`
2. a minimal Vite app that renders it with the published SDK
3. a CI handoff that uploads machine-readable preflight output plus a compact
   review markdown file

## Sample Repo

Use the checked-in sample:

- [`examples/consumer-handoff-minimal/README.md`](https://github.com/HYNCM/gis-engine/blob/main/examples/consumer-handoff-minimal/README.md)
- [`examples/consumer-handoff-minimal/.github/workflows/consumer-review-handoff.yml`](https://github.com/HYNCM/gis-engine/blob/main/examples/consumer-handoff-minimal/.github/workflows/consumer-review-handoff.yml)
- [`examples/consumer-handoff-minimal/ci-handoff.mjs`](https://github.com/HYNCM/gis-engine/blob/main/examples/consumer-handoff-minimal/ci-handoff.mjs)

## Why This Shape

- It uses published consumer dependencies instead of workspace-only shortcuts.
- It proves the consumer app builds before handoff.
- It keeps reviewer artifacts compact: `map.json`, `preflight.json`, and a
  markdown summary.
- It does not pretend a hand-authored consumer repo is a generated app with
  `artifact-manifest.json`.

## Commands

```bash
npm install
npm run build
npm run handoff
```

## Output Files

- `handoff/preflight.json`
- `handoff/consumer-review.md`

## Boundary Notes

- For generated apps, keep using `delivery-summary.json`, `REVIEW.md`, and
  `artifact-manifest.json`.
- For hand-authored consumer repos, use preflight + compact handoff markdown.
- PMTiles runtime promotion, cloud-native runtime loading, and stable
  SceneView3D runtime remain outside this sample's runtime claims.
