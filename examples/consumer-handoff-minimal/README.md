# consumer-handoff-minimal

## Goal

Provide a real consumer-repo minimum: a published-SDK Vite app plus a CI
handoff flow that produces reviewer-friendly artifacts from a hand-authored
`map.json`.

## Prerequisites

- Node.js 20+
- npm 9+
- `maplibre-gl` peer compatibility through the published dependency range

## Run

```bash
npm install
npm run dev
```

For a CI-style handoff run:

```bash
npm run build
npm run handoff
```

## Expected Output

- A visible map rendered from `map.json` through `createMap()`
- `handoff/preflight.json` with machine-readable validation and source-readiness output
- `handoff/consumer-review.md` with a concise reviewer handoff summary

## Limits And Follow-up

- This example models a hand-authored consumer repo, so it uses `--preflight`
  handoff rather than generated-app `artifact-manifest.json` verification.
- It intentionally keeps the runtime surface small: one GeoJSON source, one
  circle layer, one Vite entrypoint.
- PMTiles runtime promotion, cloud-native runtime loading, and stable
  SceneView3D runtime remain out of scope.

## CI Handoff Sample

Copy [`./.github/workflows/consumer-review-handoff.yml`](./.github/workflows/consumer-review-handoff.yml)
into a consumer repo when you want a minimal verification path:

- install dependencies
- build the consumer app
- run `create-gis-map --preflight ./map.json --json`
- generate `handoff/consumer-review.md`
- upload `map.json`, `handoff/preflight.json`, and `handoff/consumer-review.md`

This keeps the review package small and inspectable without pretending the repo
is a generated app.
