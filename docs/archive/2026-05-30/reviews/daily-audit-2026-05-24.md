---
agent: code-reviewer
period: 2026-05-24
generated_at: 2026-05-24T09:59:55Z
repo_revision: "b437d5e"
inputs:
  - AGENTS.md
  - .github/workflows/agent-daily.yml
  - .github/workflows/agent-weekly.yml
  - .github/workflows/agent-monthly.yml
  - .github/workflows/auto-fix.yml
  - .github/workflows/emergency-response.yml
  - scripts/agent-runner.mjs
  - scripts/doc-generator.mjs
  - scripts/pre-push-check.sh
  - packages/engine/src/runtime/MapRuntime.ts
  - tests/runtime/map-runtime.test.ts
  - package.json
owner: "@code-reviewer"
decision_level: blocking
---

# Daily Diff Audit: 2026-05-24

## Scope

Reviewed `b437d5e` (`feat: add agent automation framework`) on top of
`15505d1`. The change adds the agent automation workflows, local runner,
documentation generator, pre-push helper, and a small `MapRuntime` queue
recovery hardening test/change.

## Findings

### [P1] CI agent reports are generated as templates, not substantive audits

- Evidence: `.github/workflows/agent-daily.yml:61` writes a daily audit with
  build status only; `.github/workflows/agent-weekly.yml:46`,
  `.github/workflows/agent-weekly.yml:116`, and
  `.github/workflows/agent-weekly.yml:147` write placeholder reports that say
  an agent must fill substantive content later; `scripts/agent-runner.mjs:227`
  does the same for local runs.
- Impact: planning and gate documents can look current while containing no real
  code-review, competitor, roadmap, or quality decision. That weakens the
  evidence-before-claim rule in `AGENTS.md`.
- Required fix: either label generated files as `decision_level: info` until a
  human/agent fills the body, or make the runner/workflows emit a machine
  evidence report that cannot be mistaken for a completed specialist review.
- Owner: `@engine-agent` for runner contract, `@docs-agent` for template
  wording, `@quality-guardian` for gate semantics.

### [P1] Scheduled workflows use multiple auto-commit writers against the same branch

- Evidence: `.github/workflows/agent-weekly.yml:82`,
  `.github/workflows/agent-weekly.yml:131`, `.github/workflows/agent-weekly.yml:166`,
  and `.github/workflows/agent-weekly.yml:188` each auto-commit from separate
  jobs; `.github/workflows/agent-daily.yml:87` also auto-commits the daily audit
  independently.
- Impact: independent checkouts can race or push based on stale refs. More
  importantly, this conflicts with the single-writer planning-state rule in
  `AGENTS.md`; weekly planning artifacts should be serialized through
  coordinator/task-distributor rather than committed by several jobs.
- Required fix: consolidate scheduled artifact writes into one final commit job
  that downloads artifacts from prior jobs, or change jobs to upload artifacts
  and require coordinator serialization before committing planning state.
- Owner: `@coordinator` and `@task-distributor`.

### [P2] Local daily runner and GitHub daily cadence disagree on docs-agent scope

- Evidence: `package.json:32` maps `agent:daily` to
  `node scripts/agent-runner.mjs all --daily`, but
  `scripts/agent-runner.mjs:83` registers `docs-agent` as `weekly`; meanwhile
  `.github/workflows/agent-daily.yml:146` runs docs-agent as part of the daily
  cadence.
- Impact: local and CI daily runs do not produce the same artifact set, making
  it harder to reproduce CI evidence locally.
- Required fix: either make `docs-agent` daily in the runner registry, or rename
  the workflow/docs script split so daily local and CI behavior are explicitly
  different.
- Owner: `@docs-agent`.

### [P2] Emergency alert workflow writes literal shell variables into the artifact

- Evidence: `.github/workflows/emergency-response.yml:46` uses a single-quoted
  heredoc delimiter, so shell variables such as `${DATE}` in lines 50 and 59
  are not expanded.
- Impact: emergency artifacts may miss the actual generated timestamp in the
  front matter and body, reducing incident traceability when the emergency gate
  is used.
- Required fix: use an unquoted heredoc for trusted local shell variables while
  preserving safe interpolation for GitHub inputs, or emit the YAML/body with a
  small checked-in Node script.
- Owner: `@coordinator`.

## Non-Blocking Notes

- `MapRuntime.apply` now keeps the apply queue usable when adapter reload fails
  after an adapter error. The added runtime test covers the recovery path and
  preserves the last committed spec contract.
- `vitest.config.ts` adds aliases for `@gis-engine/scene3d` and
  `@gis-engine/scene3d-three-adapter`, matching the existing workspace package
  boundaries.

## Downstream Handoff

- `@quality-guardian` should rerun current-HEAD gates and issue a gate report
  against `b437d5e`.
- `@task-distributor` should create a focused follow-up slice for automation
  report semantics and serialized scheduled writes before relying on scheduled
  agent reports as blocking evidence.
