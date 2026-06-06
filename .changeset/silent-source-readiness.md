---
"@gis-engine/engine": minor
"@gis-engine/cli": minor
---

Add an IO-free source-readiness report for MapSpec preflight. The engine now
exports `createSourceReadinessReport()`, and CLI preflight JSON/text output
includes `sourceReadiness` with supported, readiness-only, and blocked source
states without fetching resources, starting workers, or parsing archives.
