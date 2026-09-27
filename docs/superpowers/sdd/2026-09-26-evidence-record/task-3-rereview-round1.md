# Task 3 — scoped re-review, fix round 1 (commit `e2d0762`, review package `review-1587c33..e2d0762.diff`)

Verdict: **ADDRESSED** — ready to close Task 3. Both prior findings genuinely fixed; remaining items
Minor/advisory. (Report returned inline by the reviewer on 2026-09-27; transcribed here by the
controller, which applied Minor #1 itself in `e9c97af`.)

## A. node:crypto unreachable from the browser-facing graph — addressed
- Root barrel no longer re-exports hashing symbols; matrix comes straight from
  `packages/engine/src/index.ts:21-27`.
- `packages/engine/src/evidence/record.ts:1` is the only `node:` value import in all of
  `packages/engine/src`.
- Reviewer's own BFS re-run visited 48 modules from `index.ts`, 0 offenders.
- Studio builds with the `external` override gone (`apps/studio/package.json:9` = `tsc && vite build`,
  exit 0); `grep -c node:crypto apps/studio/dist/assets/*.js` → 0 in all three chunks, i.e. absent,
  not stubbed.

## B. Guard load-bearingness — partially
- Proven red on a static violation: appending `import { createHash } from "node:crypto";` to
  `packages/engine/src/index.ts` fails with `expected ['index.ts -> node:crypto'] to deeply equal []`;
  reverted, clean tree verified.
- Concrete bypass found: `await import("node:crypto")` passed green, because
  `tests/evidence/canonical-hash.test.ts:95-99` only scanned statements beginning with
  `import|export`. Dynamic import is an idiom alive in this repo
  (`packages/engine/src/renderer/maplibre/adapter.ts:328`).
- Controller action: dynamic imports now scanned too (`e9c97af`), mutation-proven.
- Noted as adequate-then-hardened rather than airtight: single-quoted specifiers still slip through;
  the repo's Biome config enforces double quotes, so that residual is theoretical.

## C. Subpath shape vs Tasks 4-6 — addressed, with caveats cleared
- The controller's premise that Task 4/5 `record.ts` would value-import `codes.js` is **wrong per the
  plan**: plan:19, plan:52, plan:987 keep `record.ts` value imports `node:`-only, and
  `EvidenceIssueCode` intentionally duplicates the `EVIDENCE.*` literals, pinned in sync (plan:1011-1013).
- Two-file closure is implementable; the strip regex matches tsc's single-line ESM output; the footer
  `import` hoisting claim is valid ESM.
- No consumer breaks from the additive `exports` map (only `.` existed before): no deep imports in
  `scripts/*`, cli, examples or docs/website; `apps/studio/Dockerfile:23` is a layer copy, not module
  resolution; `knip` is not on the CI `pnpm check` path (`.github/workflows/ci.yml:65`).

## D. New problems — none blocking
- `canonicalHash` had exactly one root-barrel consumer, migrated in the same commit
  (`packages/ai/src/tools/generationEvidence.ts:36`).
- Alias order works: `@gis-engine/engine` would swallow the subpath if listed first; `test:evidence`
  resolves through the subpath alias to `src` and passes.
- ai typecheck of the subpath needs engine `dist`; topological `pnpm -r build` guarantees it
  (`@gis-engine/engine: workspace:*` in ai deps) — proven by full `pnpm check` exit 0.
- Guard asserts something meaningful; no dead or duplicated exports.

## E. Important #2 comment correctness — addressed
`packages/engine/src/sources/pmtiles-query.ts:753-754` is factually right: `indexFixtureFeatures`
(`:572-607`) forces `key` via `String()` (`:602`), drops empty `sourceLayer` (`:579`) and nullish
`bbox` (`:590`), so no `undefined` reaches the hasher; the deleted stringifier did render raw
`undefined`.

## New findings
- Minor — dynamic-import bypass (fixed in `e9c97af`).
- Minor — Task 6's strip/offender regexes share a multiline-import blind spot; latent only if
  Biome/tsc ever emit multiline imports. Parked.
- Minor — plan:52 wording stale after the split (fixed in `e9c97af`).

## Gates reported by the reviewer (real exit codes, no pipe masking)
`pnpm test:evidence` 0 (14 passed) · `pnpm test:ai` 0 (305 passed) ·
`pnpm --filter @gis-engine/studio build` 0 · `pnpm check` 0.
