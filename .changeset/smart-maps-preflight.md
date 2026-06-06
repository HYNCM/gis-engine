---
"@gis-engine/cli": minor
---

Add `create-gis-map --preflight <map.json> [--json]` for CI-friendly MapSpec
validation and PMTiles runtime load-plan checks without project scaffolding,
network fetches, file generation, or PMTiles archive parsing. Generated
`mapspec` and `app` template READMEs now include the preflight handoff command.
Preflight also accepts `--require-archive-metadata` and repeatable
`--pmtiles-metadata <source-id=path>` inputs so CI can enforce caller-supplied
PMTiles archive metadata without hidden fetches or parser claims.
