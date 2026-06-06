---
"@gis-engine/cli": minor
---

Keep the generated `app` template review details panel available for
scaffold-only projects by showing MapSpec validity, source/layer counts,
diagnostic counts, and full visible diagnostic entries without requiring
optional delivery artifacts. Missing optional `delivery-summary.json` and
`artifact-manifest.json` files served through HTML fallback responses are treated
as missing evidence instead of JSON errors, and scaffold-only starter `map.json`
imports stay build-clean when TypeScript infers coordinate arrays.
