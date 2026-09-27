---
agent: orchestrator
period: 2026-09-05
generated_at: 2026-09-05T00:00:00Z
repo_revision: "031129e3 (candidate; working tree under validation)"
inputs:
  - docs/intent/project-definition.md
  - docs/planning/feature-specs/gis-engine-workbench-v1.md
  - docs/reviews/workbench-v1-quality-decision-2026-08-19.md
  - https://github.com/HYNCM/gis-engine/issues/66
  - https://github.com/HYNCM/gis-engine/pull/67
owner: "@orchestrator"
decision_level: blocking
---

# Workbench v1 Acceptance Protocol

This protocol makes the Alpha and local-v1 product gates executable. Automated
tests are supporting evidence; they do not replace the human-study gates.

## Evidence Package

Each participant run is one directory named with a random run id. It contains
only metadata and hashes, never prompts, source data, MapSpec contents,
credentials, provider bodies, or absolute paths:

```text
run.json                 # run id, stage, participant role, timestamps
events.jsonl             # allow-listed milestone events and diagnostics codes
delivery.json             # generated project status and artifact manifest hash
commands.txt              # exact install/build/preflight/verify commands
leak-scan.json            # patterns checked, counts, and tool version
visual-gate.json          # viewport, snapshot id, pass/fail or explicit waiver
```

Required `run.json` fields are `runId`, `stage`, `participantIdHash`,
`startedAt`, `endedAt`, `outcome`, `failureCode`, `interventionCount`,
`exportArtifactManifestSha256`, `buildStatus`, `preflightStatus`,
`leakScanStatus`, and `visualGateStatus`. `participantIdHash` is a salted
one-way identifier held outside the repository. Hashes are evidence, not a
substitute for retaining the generated project locally for audit.

## Timing And Intervention Rules

- The timer starts when the participant receives a clean project directory and
  the task brief, and stops when a confirmed export passes build, preflight,
  manifest-hash verification, and the participant can reopen the project.
- The facilitator may explain a product term once, read a diagnostic aloud,
  or stop a run for safety. Any other click, command, prompt rewrite, or code
  edit is an intervention and increments `interventionCount`.
- Network access is disabled unless the task explicitly exercises a confirmed
  controlled URL. Credentials are injected through the documented local
  server environment and are never entered into the browser telemetry path.
- A run is excluded only for an infrastructure outage recorded with a stable
  code (`STUDY_INFRA_*`). User confusion, a blocking diagnostic, a failed
  export, or a timeout is a valid failure and cannot be excluded.

## Alpha Gate

Recruit five target WebGIS engineers who can read TypeScript and MapSpec. Give
each the same bounded fixture and requirement, with a fresh project directory.
Record:

1. Start and stop timestamps and all milestone events.
2. Whether the participant attached a real GeoJSON file or paste and whether
   the source is present after reopening.
3. Plan hash, base revision, preview result, apply result, and any diagnostic
   codes.
4. Export delivery status, generated-project build, preflight, and artifact
   manifest verification.
5. Leak scan over the generated project, logs, telemetry sink, and evidence
   package.

Alpha passes only when at least four of five non-excluded runs complete the
golden path within 30 minutes, every completed export builds and verifies, and
all leak scans are clean. Report the point estimate and Wilson 95% interval;
do not round a failed run into success.

## Local v1 Gate

Repeat the same protocol with at least ten target users across two clean
machines and two supported runtime versions. Add install, upgrade, rollback,
reopen, interrupted-commit recovery, stale-revision conflict, and provider
timeout scenarios. A run succeeds only if the user sees and resolves blocking
diagnostics rather than the system reporting success. Compute P90 from the
completed-run durations using the nearest-rank rule:

```text
rank = ceil(0.90 * n)
p90 = sortedDurations[rank - 1]
```

The local-v1 gate requires at least 80% success, `p90 <= 30 minutes`, stable
MapLibre 2D strict visual evidence, and passing delivery/leak evidence for
every successful run. Install and upgrade evidence must include the exact
Workbench version, Node and pnpm versions, package source, and rollback
artifact hash.

## Failure And Reporting

The following are always failures, never soft successes: a stale base revision
accepted, a command failure that changes canonical files, an unconfirmed
network access, an export outside the selected root, a credential/provider-body
leak, a missing artifact hash, or a blocking diagnostic reported as `ready`.

The study owner publishes an aggregate table with counts, exclusions and
reasons, median/P90 duration, intervention totals, build/preflight/hash rates,
and leak-scan results. Do not publish raw prompts, data, MapSpec, paths, or
credentials in the report.

