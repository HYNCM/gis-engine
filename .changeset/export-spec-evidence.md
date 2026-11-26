---
"@gis-engine/engine": minor
"@gis-engine/ai": minor
---

Close the AI-path evidence loop: `export_spec` accepts `includeEvidence: true`
and returns `{ spec, evidence }` with a recomputable EvidenceRecord for a
committed command transition, backed by the new
`buildCommandTransitionEvidence` producer on `@gis-engine/engine/evidence`.
The same producer lets MapRuntime consumers build records from `apply()`
history without pulling `node:crypto` into the browser-facing barrel. Adds the
`EVIDENCE.INPUT_INVALID` diagnostic for evidence requests without a command
batch, without a revision anchor, or combined with `dryRun`. Default
`export_spec` output is unchanged.