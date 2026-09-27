# Task 6 report — 零依赖单文件 verifier + §8 断言 7 守卫

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-27T05:30:00Z
repo_revision: "ade0933 + task 6 commits (branch codex/evidence-record-a)"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-6-brief.md
  - docs/superpowers/specs/2026-09-26-evidence-record-design.md (§6 决定 4, §8 断言 4/7, §9)
  - docs/superpowers/plans/2026-09-26-evidence-record.md (Task 6 block)
owner: "@builder (engine/qa focus)"
decision_level: info
```

## What I implemented

1. **`packages/engine/src/evidence/record.ts`** — appended the injectable CLI entry point exactly as
   the brief specifies, with no new value imports:
   - `EvidenceVerifierCliDependencies` (`readFile`, `log`) — raw-bytes contract.
   - `runEvidenceVerifierCli(argv, deps)` — usage string, `--root` parsing/normalisation, record read,
     verify, `--json` vs summary log, exit codes `0 = ok`, `2 = ≥1 failed assertion`,
     `1 = usage/IO error`.
   - `isInsideRoot(root, path)` — the brief's containment guard verbatim (backslash normalisation,
     absolute-path refusal, Windows drive-letter refusal, NUL refusal, `..`-segment refusal, and the
     root-itself-carries-`..` clause).
   - `resolveUnderRoot(root, path)` — see Deviation D2.
   - One message-text change inside `checkLineage` — see Deviation D1.
2. **`packages/engine/src/evidence/index.ts`** — re-exports `type EvidenceVerifierCliDependencies` and
   `runEvidenceVerifierCli` from the `@gis-engine/engine/evidence` subpath barrel. The root barrel
   `packages/engine/src/index.ts` is untouched (Task 5's ruling; the BFS `node:` guard would go red).
3. **`packages/engine/scripts/build-evidence-verifier.ts`** (new) — the declared-`BUNDLE` inliner:
   `canonical-stringify.js` then `record.js`, the mandated `MODULE_SPECIFIER` regex (static `from "…"`,
   bare `import "…"`, and dynamic `import("…")`), **fail-the-build** on any non-`node:`/non-BUNDLE
   dependency, line-level strip of intra-bundle specifiers only, then a footer that supplies the real
   `node:fs/promises` reader and `process.exitCode = await runEvidenceVerifierCli(...)`. Output:
   `packages/engine/dist/evidence-verifier.mjs`, mode `0o755`.
4. **`packages/engine/package.json`** — `build` and `build:schema` now chain
   `node dist/scripts/build-evidence-verifier.js`; `exports` gains
   `"./evidence-verifier.mjs"` and `"./package.json"` so Task 7's
   `createRequire(...).resolve("@gis-engine/engine/…")` form works.
5. **`tests/evidence/standalone-verifier.test.ts`** (new) — the brief's six tests verbatim, plus the
   containment test surface the brief mandates (three escapes with a read-counting spy + the legal
   `data/nested/map.json` case), plus one extra test for the guard's root-`..` clause (Deviation D4).

`.gitignore` needed no change: `dist/` is already ignored repo-wide (the brief's conditional step).

## What I tested and results

| Command | Result |
| --- | --- |
| `pnpm vitest run tests/evidence/standalone-verifier.test.ts` | 11 passed |
| `pnpm vitest run tests/evidence tests/schema-sync` | 99 passed (6 files) |
| `pnpm --filter @gis-engine/engine build` | exit 0, prints `built …/dist/evidence-verifier.mjs` |
| `pnpm build:schema` (root) | exit 0, no regenerated schema drift (`git status` clean apart from my files) |
| `pnpm test:agent-framework` | 74 passed (9 files) — coordination surfaces touched (`package.json` build hooks, `scripts/**`) |
| `pnpm check` | exit **0** (real exit code captured to a file; `tests/evidence/standalone-verifier.test.ts (11 tests)` passes inside it, and the log contains no `×`/`FAIL` line) |
| standalone run in an empty temp dir (no `node_modules` on the resolution path) | prints `usage: evidence-verifier <evidence.json> [--root <dir>] [--json]` |
| `createRequire` from `packages/cli` | resolves `@gis-engine/engine/evidence-verifier.mjs` → `packages/engine/dist/evidence-verifier.mjs`, `@gis-engine/engine/package.json` → the manifest |

Visual-snapshot waiver (AGENTS.md / plan constraint 9): this task touches no renderer adapter, layer/source
transformation, style, snapshot code, visual fixture, URL/tile/worker path, or resource policy. The
deterministic gates and smoke snapshots ran green inside `pnpm check`.

## TDD evidence

### RED (Step 2, before any implementation)

`pnpm vitest run tests/evidence/standalone-verifier.test.ts` → **10 failed | 1 passed (11)**

```
Error: Cannot find module '…/packages/engine/dist/evidence-verifier.mjs'   (execFileSync, test "agrees with …")
× emits a single file whose only runtime imports are node builtins
  → ENOENT: no such file or directory, open '…/packages/engine/dist/evidence-verifier.mjs'
× ships the compiled engine hashing modules verbatim inside the standalone file
  → ENOENT: … same path
× artifact path containment > refuses to read the escaping artifact path "../secret.txt"
TypeError: runEvidenceVerifierCli is not a function
Tests  10 failed | 1 passed (11)
```

Expected: the standalone artifact did not exist yet and `runEvidenceVerifierCli` was not exported.
The single pass is the `EvidenceIssueCode`/`DiagnosticCodes` sync test, which needs neither.

An intermediate RED also caught a defect in the brief's own snippet (Deviation D3):

```
scripts/build-evidence-verifier.ts(5,96): error TS2345: Argument of type '(...paths: string[]) => string'
  is not assignable to parameter of type '(value: string, index: number, array: string[]) => string'.
```

### GREEN (Step 6)

```
$ pnpm --filter @gis-engine/engine build
built /Users/…/packages/engine/dist/evidence-verifier.mjs

$ pnpm vitest run tests/evidence/standalone-verifier.test.ts
 ✓ tests/evidence/standalone-verifier.test.ts (11 tests) 190ms
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

`pnpm check` afterwards: exit 0 (all suites, including `test:evidence`, `test:schema-sync`,
`test:snapshot:smoke`, `test:agent-framework`, `test:studio`).

## Mutation proofs

### M1 — the build guard against a static value import (brief step ①)

Mutation: top of `record.ts`
`import { manualFix } from "../internal/shared.js";` + a module-level `const __mutationProbe = manualFix("task 6 mutation proof", "high");`
(so `tsc` could not call it unused).

```
$ pnpm --filter @gis-engine/engine build; echo EXIT=$?
evidence-verifier must stay dependency-free. Offending imports in
  /Users/…/packages/engine/dist/src/evidence/record.js:
  /Users/…/packages/engine/dist/src/internal/shared.js
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @gis-engine/engine@1.5.0 build: …
Exit status 1
EXIT=1
```

Red as required, and the error names the offending file **and** the resolved dependency. Restored.

### M2 — the same guard against a dynamic import (brief step ②)

Mutation: the static import replaced by

```ts
export async function __mutationProbe(): Promise<string> {
  const shared = await import("../internal/shared.js");
  return shared.manualFix("task 6 mutation proof", "high").kind;
}
```

```
$ pnpm --filter @gis-engine/engine build; echo EXIT=$?
evidence-verifier must stay dependency-free. Offending imports in …/dist/src/evidence/record.js:
  …/dist/src/internal/shared.js
EXIT=1
```

Compiled line 4 of that build was `const shared = await import("../internal/shared.js");`, and
`grep -cE '\bfrom\s+"' record.js` on the same file returned **2** (only `node:crypto` and
`./canonical-stringify.js`) — i.e. a `from`-only scanner would have shipped the leak, which is the
bypass the mandated regex closes. Restored; `grep -rn __mutationProbe` over `src`, `dist`, and `tests`
now returns nothing and `git status` shows only the five intended paths.

### M3 — the containment guard

Mutation: `if (!isInsideRoot(root, path))` → `if (false && !isInsideRoot(root, path))` (guard neutralised,
signatures untouched).

```
$ pnpm vitest run tests/evidence/standalone-verifier.test.ts -t "containment"
× refuses to read the escaping artifact path "../secret.txt"   → expected [ …(2) ] to deeply equal [ Array(1) ]
× refuses to read the escaping artifact path "/etc/passwd"     → expected [ …(2) ] to deeply equal [ Array(1) ]
× refuses to read the escaping artifact path "C:\\shares\\x"   → expected [ …(2) ] to deeply equal [ Array(1) ]
× refuses every artifact when the operator-supplied --root itself contains a .. segment
                                                                → expected +0 to be 2
Tests  4 failed | 1 passed | 6 skipped (11)
```

All four escape cases go red on the *spy* (a second read happened), and the root-`..` case flips to a
green `exit 0` verdict computed from bytes outside the audited directory — exactly the oracle the threat
model forbids. The legal nested case stays green. Restored.

### M4 — incidentally observed: the "verbatim inline" lock is load-bearing

While `dist/src/evidence/record.js` was a stale M2 build and `dist/evidence-verifier.mjs` was the last
good bundle, test 2 failed with `expected '#!/usr/bin/env node…' to contain 'import { createHash } from
"node:cryp…'`. So the verbatim-embedding assertion does detect verifier/compiled-source drift rather than
shrugging it off. Nothing to fix; recorded because it answers "would this test notice?".

## Files changed

- `packages/engine/src/evidence/record.ts` (CLI entry + guard + one diagnostic-message quote style)
- `packages/engine/src/evidence/index.ts` (two new subpath exports)
- `packages/engine/scripts/build-evidence-verifier.ts` (new)
- `packages/engine/package.json` (build hooks + two `exports` entries)
- `tests/evidence/standalone-verifier.test.ts` (new)

## Deliberate deviations from the brief

**D1 — `record.ts:633` message: double quotes → single quotes around the two revisions.**
`failed(\`project revision moved from "${baseRevision}" to "${revision}" …\`)` compiled to a line whose
text matches the mandated `MODULE_SPECIFIER` pattern (`from "` + `"${baseRevision}"` → specifier
`"${baseRevision}"`). Evidence, before any of my own edits:

```
evidence-verifier must stay dependency-free. Offending imports in …/dist/src/evidence/record.js:
  …/dist/src/evidence/…        ← the U+2026 of the ellipsis inside a comment
```
and, for the message, an identical false positive. With the brief's regex fixed I could have "fixed" the
scanner by weakening it — precisely what the brief forbids (a scanner with a blind spot is the Task 3
lesson). So the *input* becomes scanner-clean instead: the string keeps every word the pinned test
asserts (`tests/evidence/record-verify.test.ts:298` asserts only
`stringContaining("without any applied command")`) and a comment now records why the quotes are single.

**D2 — `resolveUnderRoot()` instead of the brief's `${root}${path}` concatenation.**
The brief's Step 1 tests pass an **absolute** record path together with `--root`, so the sketch's naive
prefix cannot satisfy them. Reproduced by reverting to the sketch verbatim (mutation, then restored):

```
$ node packages/engine/dist/evidence-verifier.mjs "$d/evidence.json" --root "$d" --json
Could not read /var/…/tmp.iEzarDd0ME//var/…/tmp.iEzarDd0ME/evidence.json:
  ENOENT: no such file or directory, open '…//var/…'
EXIT=1
```
and both brief tests (`agrees with the engine implementation`, `hashes raw bytes`) went red with
`Command failed: node …/evidence-verifier.mjs …`. The fix is the smallest one that keeps the data-plane
guard intact: an absolute component is honoured only for the operator-named record file, because
`isInsideRoot` has already refused every absolute `artifacts[].path` before any join happens
(`reads).toEqual([record])` in M3 is the proof). No `node:path` import was introduced.

**D3 — `.map((source) => resolve(source))` instead of `.map(resolve)`.**
The brief's line is a TS2345 under `strict` (`Array.map` passes an index into `resolve`'s rest
parameters), so `tsc` — not the guard — fails first, which would have made the mutation proofs
indistinguishable from a compile error. Comment added in place.

**D4 — one extra containment test (the guard's own root-`..` clause).**
The brief names four containment tests, none of which exercises the last line of `isInsideRoot`. An
untested guard clause is the plan defect Task 3 flagged, so I added the fifth case rather than ship the
clause blind; M3 shows it goes red when the guard is disabled. Nothing else was added: the brief's
`MODULE_SPECIFIER`, byte budget, assertion ids, exit codes, usage string, file names and export names are
verbatim.

## Self-review findings / concerns

1. **`MAX_EVIDENCE_RECORD_BYTES` is not enforced on the *read* side.** The builder rejects an oversized
   record; `runEvidenceVerifierCli` will happily `JSON.parse` a 500 MB `evidence.json`. That is outside
   this brief's scope (the budget is a producer contract) but it is the natural hole for Task 8, where
   the input is a stranger's file. Confidence high, no action taken — flagging for the controller.
2. **Package-size accounting regresses (route to @quality, not self-certified).** Spec §9 requires the
   verifier to count in the size policy. Measured with the policy's own
   `measureCanonicalDistGzip("packages/engine/dist")` after a clean engine build:
   - `config/package-size-budgets.json` engine budget: 204,800 bytes (semantics `blocking`), baseline 193,984 / 210 files.
   - clean engine dist **with** this task's verifier: 236,057 bytes / 2,296,205 raw / 237 files.
   - same dist with `evidence-verifier.mjs` removed: 226,159 bytes / 236 files.
   So the engine dist was **already ~21 KB over the blocking budget before Task 6**, and this task adds
   ~9.9 KB. Nothing in `pnpm check` measures the real dist (only `bundle-size.yml`, path-filtered, runs
   `pnpm size:check`), so no gate went red here. I did **not** touch the budget/baseline: rebaselining is
   @quality's call and the pre-existing 21 KB overrun is not mine to launder.
3. **`dist` staleness is now observable.** Tests 1/2 read compiled output, so editing `record.ts` without
   re-running a build makes the verbatim-embedding test fail (M4). That is the intended lock, but a
   contributor running only `pnpm test:evidence` sees a confusing diff. CI order (`build:schema` →
   `check`) is safe.
4. **Minor: `//# sourceMappingURL=record.js.map` lines are inlined** into `evidence-verifier.mjs` and
   point at nothing from `dist/`. Harmless for Node (no parse or resolution effect, and the brief's
   verbatim-embedding assertion actually requires them to stay), just noise if a devtools ever probes it.
5. **Guard behaviour is intentionally over-strict**: any `..` segment (even `sub/../file.json`) and any
   Windows-shaped path is refused rather than normalised, because the threat model says an out-of-root
   path is a *finding*, not a file to resolve. A legit record whose artifact used `./x/../y.json` would
   now fail with `ARTIFACT_MISMATCH`; Task 7's exporter writes clean relative paths, so nothing in-repo
   depends on it.
6. `runEvidenceVerifierCli` is exported from the `evidence` subpath only, per Task 5's ruling; the root
   barrel remains value-free of `node:crypto`, and the BFS guard passed inside `pnpm check`.
7. Biome: the new build script's two `console.*` calls are `noConsole` **warnings** (the root override
   only covers top-level `scripts/**`, not `packages/engine/scripts/**`); warnings do not fail
   `biome check` (verified: exit 0) and the brief mandates those lines, so I left them. All four new/
   changed source files are Biome-format clean.

## Plan text the controller must amend (I did not touch planning state)

`docs/superpowers/plans/2026-09-26-evidence-record.md` Task 6 block still differs from what shipped in
four places, each traceable to a deviation above:

| Plan location | Plan text | Shipped |
| --- | --- | --- |
| Step 3 `checkLineage` sketch (line ~1966 area of the Task 4 block, quoted again by Task 6's scanner assumption) | `from "${baseRevision}" to "${revision}"` | single quotes — a double-quoted word after `from` is a specifier to the mandated scanner |
| Step 3 sketch, `readFile(\`${root}${recordPath}\`)` and `readArtifact` line | unconditional prefix concatenation | `resolveUnderRoot()`, which honours an absolute record path (D2) |
| Step 4 `const BUNDLE = […].map(resolve)` | `.map(resolve)` | `.map((source) => resolve(source))` — strict-mode TS2345 (D3) |
| Step 1 "加四条" containment tests | four cases | five (the extra one covers the guard's root-`..` clause, D4) |
| Step 6 "Expected: PASS（6 passed）" | 6 | 11 |

## Done-criteria check against the brief

- [x] Step 1 failing test file, brief code verbatim + the mandated containment surface
- [x] Step 2 RED captured (`ENOENT … dist/evidence-verifier.mjs`)
- [x] Step 3 injectable CLI in `record.ts`, no fs import, containment guard as specified, exported from
      `evidence/index.ts` only (not the root barrel)
- [x] Step 4 build script with the fail-not-strip guard, both mutation proofs run and restored
- [x] Step 5 `build` / `build:schema` hooks + the two `exports` entries (both resolve from `packages/cli`)
- [x] Step 6 `pnpm check` exit 0; standalone run in a bare temp dir prints the usage line
- [x] Step 7 committed (`e4e42df`, `99a902a`)

