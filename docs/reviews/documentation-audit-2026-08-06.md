---
agent: docs
period: 2026-08-06
generated_at: 2026-08-05T16:17:22Z
repo_revision: "5fbd6d01263da06ef48a9178ce4399f2817f6245"
inputs:
  - git diff origin/main...HEAD
  - https://github.com/HYNCM/gis-engine/issues/38
  - https://github.com/HYNCM/gis-engine/issues/39
  - https://github.com/HYNCM/gis-engine/issues/40
  - https://github.com/HYNCM/gis-engine/issues/41
  - https://github.com/HYNCM/gis-engine/issues/42
  - https://github.com/HYNCM/gis-engine/issues/43
  - npm registry metadata for @gis-engine/engine, @gis-engine/ai, @gis-engine/cli, @gis-engine/scene3d, and @gis-engine/scene3d-three-adapter
  - docs/planning/issues-snapshot.md
  - docs/website/release-notes.md
  - docs/website/api/reference/engine/index.md
  - docs/engineering/maplibre-version-drift-audit.md
  - docs/migration/geoparquet-versioned-metadata.md
  - .changeset/geoparquet-versioned-metadata.md
  - config/package-size-budgets.json
  - docs/reviews/doc-link-audit.md
  - tests/docs/public-docs-consistency.test.ts
owner: "@docs"
decision_level: advisory
evidence_kind: specialist
---

# Documentation Integrity Audit: W32-W34 Completion

## Verdict

PASS for the bounded branch documentation. The previously important
GeoParquet release-labeling gap and the MapLibre declaration contradiction are
resolved in the shared worktree and protected by focused regression tests. The
canonical MCP inventory, release boundaries, GeoParquet runtime No-go, and
package-size authority remain aligned.

Two follow-ups remain outside this branch-documentation verdict. The issue
snapshot requires an authenticated post-merge refresh by `@orchestrator`, and
the seven-days versus seven-files retention mismatch is pre-existing policy
debt. GitHub Issues remain the task authority: issues #38 through #43 were all
still open when checked on 2026-08-05 at approximately 16:10 UTC.

## Findings

### Resolved: GeoParquet has an explicit unreleased release vehicle

- **Evidence:** `.changeset/geoparquet-versioned-metadata.md` records a major
  `@gis-engine/engine` release for the breaking metadata shape. The migration
  guide, website release notes, and generated engine API landing page now say
  that the contract is unreleased and not part of the published v1.5.0
  package. All three retain the runtime No-go. The docs regression requires
  those notices and the major changeset.
- **Impact:** Published v1.5.0 consumers are no longer directed to treat the
  incompatible main-branch metadata shape as installed behavior, while the
  future release vehicle remains machine-checkable.
- **Action:** Keep the unreleased notices until the changeset is consumed and
  the matching engine version is published; then move the entry into the
  versioned release record in the same release change.
- **Confidence:** high.

### Resolved: MapLibre declarations and resolved baseline are distinct

- **Evidence:** `docs/engineering/maplibre-version-drift-audit.md` now states
  that the root and engine manifests declare `^5.0.0 || ^6.0.0` while the
  lockfile resolves the release baseline to `5.24.0`. Its stable-v6 note keeps
  `6.1.0` compatibility separate from default adoption. The docs regression
  requires both statements and rejects the old `package.json` / `^5.24.0`
  claim.
- **Impact:** Reviewers can distinguish supported peer range, installed
  baseline, compatibility candidate, and adoption decision without inferring a
  dependency bump from #38.
- **Action:** Preserve the manifest-versus-resolution assertions whenever the
  MapLibre range or lockfile changes; require a separate quality-approved task
  for default v6 adoption.
- **Confidence:** high.

### Post-merge: Refresh the active W32-W34 issue snapshot

- **Evidence:** `docs/planning/issues-snapshot.md` was generated on 2026-08-03,
  but its `source_updated_at` is 2026-07-21. It reports four open issues and
  ends its active set at #35. A live authenticated GitHub query on 2026-08-05
  returned #38, #39, #40, #41, #42, and #43 as OPEN under milestone
  `2026 W32-W34 Compatibility and Evidence Integrity`.
- **Impact:** Readers of the committed planning snapshot cannot see the six
  implementation issues, and branch-complete HOC evidence can be mistaken for
  canonical issue closure or merged-main delivery.
- **Action:** After merged-main evidence exists, `@orchestrator` should refresh
  the authenticated planning snapshot and close or retain each issue from live
  GitHub evidence. This is a post-merge planning reconciliation, not an
  unresolved branch documentation defect. No planning state should be inferred
  or rewritten by this docs audit.
- **Confidence:** high.

### Pre-existing advisory: Retention documentation says days while automation keeps files

- **Evidence:** `docs/README.md` says rolling reports are kept for the latest
  seven active days. `scripts/report-retention.mjs` sorts each report class by
  `generated_at` and keeps the first seven files, independent of calendar-day
  coverage.
- **Impact:** Applying retention can delete or retain a different evidence set
  than the documented policy, so age alone is not reliable deletion evidence.
- **Action:** `@docs` and `@orchestrator` should choose seven files or seven
  active days, align policy and implementation, and add boundary tests before
  broader cleanup. This audit authorizes no deletion.
- **Confidence:** high.

## Issue And Public-Surface Reconciliation

| Issue | Documentation result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| #38 MapLibre 6.1 | Aligned and regression-protected. `5.24.0` remains the resolved/default baseline; `^5.0.0 || ^6.0.0` is the manifest range; `6.1.0` is compatibility evidence only and `candidateDecision` remains `keep-baseline`. | Package manifests, lockfile, compatibility HOC-N2/HOC-N3 reports, corrected version-drift checklist, docs regression | Runtime compatibility cannot become an implicit dependency adoption | Keep the No-go/default boundary and manifest-versus-resolution regression | high |
| #39 package size | Aligned. `config/package-size-budgets.json` is the single authority; engine is 200 KiB blocking, CLI is 64 KiB blocking, and more than 5% baseline growth is advisory below the hard limit. | JSON policy, checker/workflow, engineering and website performance docs, HOC-N2/HOC-N3 reports | Local, CI, and public guidance use the same artifact recipe and thresholds | Keep numeric limits sourced from JSON and do not reintroduce workflow literals | high |
| #40 MCP compatibility | Aligned. MCP `2025-11-25` remains the runtime default; `2026-07-28` is No-go pending v2 migration evidence. | Compatibility feature spec, live server descriptors, focused compatibility tests | Candidate protocol research does not rewrite the released MCP server contract | Preserve the protocol No-go until the documented promotion gates pass | high |
| #41 release truth | Aligned with current registry state. npm reports engine/AI/CLI `latest: 1.5.0`; release notes list the exact 14-tool order and retain Hosted Workbench, stable SceneView3D, and PMTiles runtime-query No-go wording. | npm registry, release notes, public docs consistency gate | Current public release claims are independently verifiable | Keep registry verification in future release audits | high |
| #42 GeoParquet | Aligned and regression-protected: exact 1.1 / reviewed 2.0 RC metadata only, stable diagnostics, no parser/fetch/decode/WASM/worker/display/query promotion, plus a major changeset and unreleased notices distinct from published v1.5.0. | Changeset, migration guide, release notes, API landing, source-readiness matrix, schema/policy code, HOC-N2/HOC-N3 reports, docs regression | Metadata evidence cannot be mistaken for runtime support or already-published v1.5 behavior | Keep unreleased notices until the matching major engine release is published | high |
| #43 evidence integrity | Branch evidence describes the implementation and its remaining cadence block, while live GitHub still records #43 open. | Recovery/evidence quality reports, workflows/scripts, live issue state | A branch pass cannot be reported as issue closure or current scheduled-cadence success | Let `@orchestrator` reconcile issue state only after merged-main and cadence evidence | high |

## Canonical MCP Inventory

The implementation and active public contracts agree on this exact
`tools/list` order:

`apply_commands`, `validate_spec`, `export_spec`, `get_context_summary`,
`snapshot_spec`, `explain_spec`, `export_example_app`, `diff_specs`,
`generate_spec`, `inspect_data`, `edit_spec`, `query_features`,
`style_recommend`, `transform_data`.

All live server descriptors retain `inputSchema` and `outputSchema`; the stable
default remains MCP `2025-11-25` with draft-07 public schemas,
schema-conforming `structuredContent` on success, and the structured diagnostic
envelope plus legacy JSON text on execution failure.

## Verification

| Check | Result |
| --- | --- |
| `pnpm test:docs` | PASS: 5 test files / 40 tests; Vitest duration 411 ms |
| Active link audit | PASS from the existing generated working-tree artifact dated 2026-08-05: all active documentation links are intact; five archived historical links are ignored by policy. The generator was not rerun because it overwrites `docs/reviews/doc-link-audit.md`, which already contains another owner's modification. |
| Live GitHub issues | #38-#43 all OPEN; no issue mutation performed |
| Live npm metadata | engine/AI/CLI `latest: 1.5.0`; scene3d `latest: 1.0.0`, `next: 1.5.0`; scene3d-three-adapter returned npm E404, consistent with the documented unpublished boundary |

This report changes no planning state, generated link report, code, or public
documentation surface.
