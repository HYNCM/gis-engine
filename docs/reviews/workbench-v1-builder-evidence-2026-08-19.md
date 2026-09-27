---
agent: builder
focus_area: qa
feature: gis-engine-workbench-v1
period: 2026-08-19
generated_at: 2026-08-19T14:44:10Z
repo_revision: "e5d6832c81c990ebd80a9890f5a95e1eba84b3f7"
inputs:
  - docs/planning/feature-specs/gis-engine-workbench-v1.md
  - docs/planning/implementation-plans/2026-08-19-workbench-v1.md
  - apps/workbench
  - tests/workbench
  - scripts/workbench-delivery-smoke.mjs
  - scripts/workbench-legacy-export.mjs
owner: "@builder"
decision_level: advisory
status: ready-for-review
evidence_kind: specialist
---

# Workbench v1 Builder Evidence

## Outcome

The `codex/workbench-v1` implementation candidate converges the former Studio
surface into `@gis-engine/workbench` and implements the local golden path:
create or reopen a file-backed project, inspect data, generate a structured
plan, preview on an isolated revision, explicitly apply, restore history, and
preview then confirm a standard TypeScript project export.

Project authority is held in `gis-engine.project.json`, `mapspec.json`, project
data, and revision/export evidence. Legacy SQLite is read-only migration input.
Mock and one server-held OpenAI-compatible profile are available, while raw
prompts, provider bodies, and credentials are not persisted in project or
export state. Telemetry is disabled by default and excludes prompt, data,
MapSpec, path, and credential content when enabled.

## Verification

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm build:schema` | PASS | engine, scene3d, and AI public schemas built |
| `pnpm check` | PASS | full workspace build, deterministic suites, and 106 Workbench tests |
| `pnpm test:workbench:security` | PASS | 3 files / 27 tests |
| `pnpm test:workbench:e2e` | PASS | 1 Mock-provider browser golden-path test |
| `pnpm test:workbench:delivery` | PASS | generated app installed, built, passed preflight, and verified 11 artifact hashes |
| `pnpm test:resources` | PASS | 4 files / 23 tests |
| `pnpm test:cli` | PASS | 8 files / 215 tests |
| `pnpm test:agent-framework` | PASS | 10 files / 76 tests |
| `pnpm test:docs` | PASS | 6 files / 50 tests |
| `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` | PASS | 5 real browser visual snapshots |
| `pnpm docs:build` | PASS | VitePress build completed; TypeDoc reported 0 errors and existing reference warnings |
| `git diff --check` + Biome focused check | PASS | no whitespace or formatting failures |
| clean-checkout launcher and E2E regressions | PASS after RED | PR #67 quality runs exposed eager server loading without CLI `dist` in `--help` and E2E; `5be1b14` defers launcher import and the follow-up makes `test:workbench:e2e` build CLI explicitly |

Manual browser inspection also covered desktop and 390x844 mobile layouts,
nonblank MapLibre canvas pixels, create/inspect/plan/abandon/replan/preview/apply,
confirmed export, reload, and a clean browser console.

## Contract Evidence

- Public TypeBox/Ajv contracts cover project, plan, apply request/result,
  export preview/receipt, and minimal telemetry events.
- Plan application binds the plan hash to a base revision and rejects stale or
  mismatched commits without partial writes.
- External data inspection requires explicit network confirmation and returns
  stable diagnostics for resource-policy, size, and format failures.
- Export writes only below the selected project root and reuses CLI generation,
  preflight, manifest, and hash verification.
- `gis-engine-workbench [project-directory]` is the new launcher;
  `create-gis-map` remains compatible.
- The MCP 2025-11-25 inventory remains the canonical ordered 14-tool contract;
  no Workbench aliases were introduced.

## Residual Evidence

The PR #67 quality runs supplied clean-checkout RED evidence: the first caught
eager server loading for `--help`, and the second caught the E2E server's
implicit CLI `dist` dependency. `5be1b14` defers the launcher import and the
explicit CLI build in `test:workbench:e2e` addresses both paths; these are
retained as RED/GREEN evidence.

The delivery smoke's `npm install` completed but npm reported two dependency
advisories: one moderate and one high. This did not invalidate the install,
build, preflight, or artifact verification result, but it requires package-level
triage before an Alpha or local-v1 release decision. The Workbench and generated
MapLibre bundles also retain the existing greater-than-500-KiB chunk warning.

## HOC-N2 Recommendation

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| All deterministic, security, E2E, delivery, resource, and strict visual gates pass | The implementation candidate is reviewable as one coherent local workflow | `@quality` should accept the bounded code candidate while keeping product promotion separate | high |
| User-study metrics have not been collected | Automated closure cannot prove the 30-minute product outcome | `@orchestrator` must keep Alpha and local-v1 success gates open | high |
| npm reported one high and one moderate advisory in the generated project | Release risk is not yet classified | `@builder` must capture package-level audit evidence and remediate or document an accepted exception before promotion | high |
