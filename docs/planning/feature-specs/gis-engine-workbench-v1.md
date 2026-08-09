---
agent: orchestrator
period: 2026-08-09
generated_at: 2026-08-09T05:00:00Z
repo_revision: "ca106dae"
inputs:
  - docs/intent/project-definition.md
  - apps/workbench
  - packages/engine
  - packages/ai
  - packages/cli
owner: "@orchestrator"
decision_level: blocking
---

# GIS Engine Workbench v1 Specification

## Decision

Promote the local review surface into **GIS Engine Workbench**, the primary
user-facing product. Preserve the engine, AI, CLI, MCP, and generated-project
contracts as its foundation. Do not imply hosted, 3D, or autonomous-agent
readiness.

Evidence: `apps/workbench`, `packages/engine`, `packages/ai`, `packages/cli`, and
the repository gate suite at revision `ca106dae`.

Impact: WebGIS engineers receive one coherent product path instead of separate
SDK, MCP, CLI, Playground, and review-console narratives.

Action: `@builder` implements the contracts and local workflow; `@quality`
validates deterministic, security, visual, and delivery gates;
`@orchestrator` owns planning state.

Confidence: high.

## Product Contract

Workbench v1 promises MapLibre 2D authoring and preview only. 3D stays in an
adapter extension slot behind a separate, independent promotion gate. Workbench
uses an independent `0.x` version until its own product gates pass; engine semver
does not promote Workbench maturity. Hosted previews, cloud collaboration, and
enterprise governance remain post-v1 options subject to demonstrated user
demand.

| Surface | v1 commitment | Explicit boundary |
| --- | --- | --- |
| Workbench | Local-first open-source desktop-browser workspace | Independent `0.x` version until product gates pass |
| Rendering | MapLibre 2D authoring and preview | 3D stays behind its promotion gate |
| Data | GeoJSON file/paste, approved URL, vector/raster tiles, existing `MapSpec` | No cloud-native runtime breadth commitment |
| AI | Mock and one configurable BYOK provider | Server-held credential, preview before apply |
| State | Human-readable project files and append-only revision evidence | SQLite is cache/index/migration source only |
| Delivery | Confirmed export of a buildable TypeScript Web project | No implicit writes outside the selected root |
| MCP | Existing 14 tools in canonical order | No Workbench aliases |
| Telemetry | Minimal anonymous events after explicit opt-in | No prompt, data, spec, path, credential, or provider body |

Human-readable project files are the source of truth. The frozen 14-tool MCP
inventory remains, in `tools/list` order: `apply_commands`, `validate_spec`,
`export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`,
`export_example_app`, `diff_specs`, `generate_spec`, `inspect_data`,
`edit_spec`, `query_features`, `style_recommend`, `transform_data`. Workbench
does not add Workbench aliases or product-specific MCP tools.

## Canonical Files

Every project root contains:

- `gis-engine.project.json`: project identity, format version, current revision,
  relative paths, provider selection without secrets, and telemetry consent.
- `mapspec.json`: current validated `MapSpec`.
- `data/`: user-owned local data when copied into the project.
- `.gis-engine/revisions/`: immutable revision receipts sufficient for restore
  and replay without making SQLite authoritative.
- `exports/` only when the user selects it; export can also target another
  confirmed directory beneath the selected project root.

Existing SQLite records remain readable and exportable. Migration never
deletes the database or records automatically.

## Public Workbench Schemas

The Workbench package exports TypeBox schemas, static types, Ajv validators,
and stable diagnostic codes for:

- `WorkbenchProject`
- `WorkbenchPlan`
- `WorkbenchApplyRequest`
- `WorkbenchApplyResult`
- `WorkbenchExportPreview`
- `WorkbenchExportReceipt`
- `WorkbenchTelemetryEvent`

`WorkbenchPlan` contains the goal, commands, affected relative paths, resource
requests, unsupported intents, base revision, and prompt hash. It never stores
the raw prompt or provider body.

## Local API

| Method and route | Behavior |
| --- | --- |
| `POST /api/projects` | Create or open a project rooted at a user-selected directory |
| `GET /api/projects/:id` | Read canonical project, spec, data/source summary, and revision history |
| `POST /api/projects/:id/data/inspect` | Validate data shape, limits, and resource policy; URL access requires confirmation |
| `POST /api/projects/:id/plans` | Generate or accept a schema-valid `WorkbenchPlan` |
| `POST /api/projects/:id/plans/:hash/preview` | Apply commands to a copy of the base revision and return evidence without mutation |
| `POST /api/projects/:id/apply` | Compare base revision and plan hash, then commit all-or-nothing |
| `POST /api/projects/:id/revisions/:revision/restore` | Restore through a new audited revision |
| `POST /api/projects/:id/export/preview` | Produce destination, file manifest, preflight, and collision evidence |
| `POST /api/projects/:id/export/commit` | Revalidate preview receipt and write confirmed files |

Execution failures use `{ diagnostics: Diagnostic[] }`. Revision conflict,
unsafe path, unconfirmed network access, unsupported data, plan mismatch, and
transaction failure each have stable codes.

## State And Safety Invariants

1. A plan is data, not state. Preview always runs against an isolated copy.
2. Apply requires `planHash` and `baseRevision`; either mismatch blocks commit.
3. Validation and every command must succeed before files are atomically
   replaced. No partial write is allowed.
4. Restore creates a new revision; history is never rewritten.
5. URL inspection and remote resource use require an explicit confirmation
   recorded in the request and evidence.
6. Export preview is read-only. Commit may write only beneath the selected
   project root after canonical path containment checks.
7. Export excludes secrets, raw provider bodies, and prompts and includes
   `artifact-manifest.json`, preflight/delivery summaries, README,
   `.env.example`, and verification commands.
8. Telemetry is disabled by default and schema allow-listing prevents sensitive
   fields from being accepted.

## Interface

The primary screen is an engineering workspace:

- Left rail: projects, data sources, layers, and revision history.
- Center: map canvas with `MapSpec` and generated-file tabs.
- Right task rail: AI plan, diff, diagnostics, snapshots, rollback evidence, and
  export preview/confirmation.
- First use adds one lightweight progress rail for the golden path. It does not
  create a second wizard or hide the workspace.

The main path must work with the Mock provider in deterministic E2E tests and
with one OpenAI-compatible BYOK provider in manual/local acceptance.

## Release Boundaries

Workbench versioning is independent from engine releases. Any engine 2.0
release associated with the GeoParquet metadata shape must state that the
breaking change is engine-contract-only and does not promote Workbench, 3D, or
hosted capabilities.

Alpha and local-v1 user-study thresholds are product gates, not automated test
substitutes. Until recorded evidence meets them, release language must say
alpha or local preview as appropriate.

## Verification Matrix

| Risk | Required evidence |
| --- | --- |
| Schema drift | TypeBox/Ajv schema compilation and fixture tests |
| State corruption | revision conflict, failure invariance, restore/replay, reopen tests |
| Migration loss | SQLite read-only export test and original-database preservation |
| Network/resource policy | unconfirmed URL rejection, supported/limit diagnostics |
| Secret or data leakage | export and telemetry negative tests |
| UI workflow | Mock-provider E2E: create, inspect, plan, preview, abandon/apply, export, reopen |
| Rendering regression | MapLibre browser snapshot and strict visual gate |
| Delivery failure | generated project install, build, preflight, manifest hash verification |
| Product wording drift | canonical boundary regression tests |

Required commands:

```bash
pnpm build:schema
pnpm check
pnpm test:workbench
pnpm workbench:build
pnpm test:workbench:e2e
pnpm test:resources
GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual
pnpm test:docs
```
