---
agent: builder
period: 2026-07-21
generated_at: 2026-07-20T16:18:50Z
repo_revision: "8621336f4eb2593eb04300971c2c1c2d6fe67e23"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/30
  - docs/planning/next-step-plan.md
  - scripts/issues-snapshot.mjs
  - scripts/handoff-ledger.mjs
  - scripts/dashboard-generator.mjs
owner: "@builder"
decision_level: advisory
evidence_kind: specialist
---

# Builder Evidence: Fail-closed Agent Evidence

## Focus Area

`qa` and agent-framework automation for Task 4 / issue #30. This slice does
not change renderer, schema, MCP, resource-policy, or command behavior.

## Changed Surface

- Authenticated weekly/monthly workflows pass `GH_TOKEN` into one
  `planning-evidence.mjs` run that builds the issue snapshot, HOC ledger, and
  dashboard from one issue result and evidence run id.
- Issue fetch failure exits with code `2`, writes nothing, and preserves the
  existing snapshot. Successful snapshots record authenticated or fixture
  provenance and the newest issue update timestamp.
- Automation reports declare `evidence_kind: template`. Template markers take
  precedence over contradictory front matter and cannot satisfy HOC upstream,
  HOC consumption, dashboard freshness, or SLA freshness.
- Fixture-driven tests generate consistent issue counts and HOC states without
  GitHub credentials. Automation documentation records the bundled refresh and
  fail-closed policy.

## Test Evidence

| Evidence | Result | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| `pnpm test:agent-framework` | Pass: 6 files, 26 tests | Locks three-artifact CLI preservation, HOC-N1/HOC-N3 template rejection, specialist freshness, workflow permissions/token plumbing, and fixture consistency | @quality should use this as HOC-N2 implementation evidence | high |
| `pnpm test:docs` | Pass: 5 files, 34 tests | Confirms automation policy/template documentation stays consistent | Keep in the framework gate | high |
| `node scripts/issues-snapshot.mjs --dry-run` | Expected fail-closed exit `2`; local `gh` returned HTTP 401 and no planning file changed | Proves unavailable authentication cannot generate replacement evidence | Hosted workflows supply `GH_TOKEN`; preserve exit `2` locally when unavailable | high |
| Fixture issue snapshot and bundled dry-runs | Pass: exit `0`, 1 open / 1 closed / 2 total, HOC-N1 and HOC-N3 consumed | Proves deterministic agreement without live secrets | Keep `tests/fixtures/agent-framework/planning-evidence.json` as the workflow fixture | high |
| `pnpm check` | Pass, including builds, all deterministic suites, snapshots, and Studio tests | Confirms the Task 4 slice is compatible with the full repository gate | @quality may proceed with focused review | high |
| `node scripts/gate-plan.mjs --run` | Task 4 gates passed through docs, framework, schema, adapter, and browser E2E; the shared run then failed in concurrent Task 3's MapLibre `6.0.0-22` matrix because the example remained `loading` | Task 4 evidence is green; the shared branch still needs Task 3 matrix closure before a combined gate claim | Task 3 owner fixes/rechecks the v6 matrix; root reruns the combined plan after integration | high |

## Resource / MCP / Docs Impact

- Resource policy: no URL, tile, worker, renderer, or external asset behavior
  changed.
- MCP: no tool descriptor, schema, result, or transport behavior changed.
- Docs: `.github/agent-templates/README.md` and
  `docs/engineering/documentation-artifact-policy.md` now describe evidence
  provenance and the bundled refresh command.
- Planning state: no orchestrator-owned planning snapshot or JSON ledger was
  edited by this implementation. Generator verification used dry-run/fixture
  paths only.

## Known Limits

- Local GitHub authentication is unavailable, so the hosted authenticated path
  is verified by workflow token plumbing plus deterministic fixture coverage,
  not by a live local issue fetch.
- The combined path-aware run remains red only at the concurrent Task 3
  MapLibre v6 compatibility entry. This report does not claim that matrix is
  fixed or that the combined shared-tree gate is green.
- This work is uncommitted as requested. Remote CI has not run on this diff.

## Handoff (HOC-N2)

- Evidence: this report, the Task 4 diff, the 26-test agent-framework result,
  and the successful full `pnpm check` run.
- Impact: future planning runs fail closed on unavailable issue state and no
  longer mistake generated templates for specialist evidence.
- Action: `@quality` reviews Task 4 architecture and tests, then issues the
  HOC-N3 pass/block decision. `@orchestrator` remains the only writer that may
  accept regenerated planning state.
- Confidence: high.
