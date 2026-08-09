# GIS Engine Workbench v1 Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Turn the existing private Studio Playground into the local-first GIS Engine Workbench with file-backed projects, reviewed AI plans, transactional apply, confirmed export, and a coherent engineering workspace.

**Architecture:** Keep the existing React/Vite and Node server as the product shell. Add a focused Workbench contract and service layer inside `apps/workbench`, use TypeBox/Ajv at public boundaries, keep `MapSpec` mutation in `applyCommands`, and persist canonical JSON plus immutable revision receipts. Reuse current CLI generation/preflight/manifest code through exported helpers instead of duplicating delivery logic.

**Tech Stack:** TypeScript, React, Vite, TypeBox, Ajv, Vitest, Playwright, MapLibre GL, Node.js, pnpm.

---

## Task 1: Product Boundary And Documentation Regression

**Files:**
- Modify: `docs/intent/project-definition.md`
- Create: `docs/planning/feature-specs/gis-engine-workbench-v1.md`
- Modify: `tests/docs/canonical-boundary-regression.test.ts`
- Modify: `tests/docs/public-docs-consistency.test.ts`

1. Add failing tests for the primary-product wording, 2D-only promise, independent Workbench version, file source of truth, and frozen MCP inventory.
2. Run the focused documentation tests and confirm failure.
3. Update canonical documents and remove conflicting current-boundary claims.
4. Run `pnpm test:docs` and confirm success.

## Task 2: Rename Studio To Workbench With Compatibility Entry Points

**Files:**
- Move: `apps/studio` to `apps/workbench`
- Move: `tests/studio` to `tests/workbench`
- Modify: `apps/workbench/package.json`
- Modify: `package.json`, `pnpm-lock.yaml`, `knip.ts`, `vercel.json`
- Modify: `scripts/gate-plan.mjs`, relevant framework tests and public docs

1. Add failing tests that require `@gis-engine/workbench`, `apps/workbench`, and `workbench:*` scripts while retaining compatibility aliases for `studio:*`.
2. Rename the app and tests, then update imports, paths, package metadata, user-agent strings, build configuration, and docs.
3. Keep legacy HTTP review-console paths only where they are public compatibility routes; stop presenting them as product names.
4. Verify the Workbench build and focused test suite.

## Task 3: Public Workbench Contracts

**Files:**
- Create: `apps/workbench/contracts/*.ts`
- Create: `tests/workbench/workbench-contracts.test.ts`

1. Write failing Ajv compilation and fixture tests for project, plan, apply, export, and telemetry schemas.
2. Implement strict TypeBox schemas, static types, validators, canonical hashing, and stable diagnostic constants.
3. Ensure plans store a prompt hash rather than raw prompts and telemetry rejects sensitive payload keys.
4. Verify focused tests and public build output.

## Task 4: File-Backed Project And Revision Service

**Files:**
- Create: `apps/workbench/server/project-store.mjs`
- Modify: `apps/workbench/server/store.mjs`
- Create: `tests/workbench/project-store.test.ts`

1. Write failing tests for create/open, canonical files, revision conflict, transactional failure invariance, restore/replay, and reopen.
2. Implement safe project-root resolution, atomic JSON writes, immutable revision receipts, and command-only apply through the engine.
3. Add read-only SQLite record export/migration without deleting or mutating the source database.
4. Verify focused state and migration tests.

## Task 5: Data Inspection, Plan Preview, And Apply API

**Files:**
- Create: `apps/workbench/server/workbench-service.mjs`
- Modify: `apps/workbench/server/index.mjs`
- Create: `tests/workbench/workbench-api.test.ts`

1. Write failing service/API tests for local GeoJSON, pasted data, existing specs, tile descriptors, URL confirmation, size limits, unsupported content, plan validation, isolated preview, plan/base revision conflict, and failed all-or-nothing apply.
2. Reuse resource-policy and AI command contracts; never store raw provider output as state.
3. Return schema-conforming results or `{ diagnostics }` with stable codes.
4. Verify focused API, resource, command, and AI tests.

## Task 6: Confirmed Export And Launcher CLI

**Files:**
- Create: `apps/workbench/bin/gis-engine-workbench.mjs`
- Create: `apps/workbench/server/export-service.mjs`
- Modify: `packages/cli` helpers only where export reuse requires it
- Create: `tests/workbench/workbench-cli.test.ts`
- Create: `tests/workbench/workbench-export.test.ts`

1. Write failing tests for `gis-engine-workbench [project-directory]`, export preview, collision reporting, confirmation receipt, root containment, secret/prompt exclusion, and artifact hash verification.
2. Implement the launcher and export service by reusing existing generation, preflight, manifest, and verification helpers.
3. Keep `create-gis-map` behavior unchanged.
4. Verify launcher, Workbench export, and existing CLI tests.

## Task 7: Minimal Opt-In Telemetry

**Files:**
- Create: `apps/workbench/server/telemetry.mjs`
- Create: `tests/workbench/workbench-telemetry.test.ts`

1. Write failing tests that telemetry is off by default, requires explicit project consent, and rejects prompt, data, spec, paths, credentials, and provider bodies.
2. Implement a local event sink with schema allow-listing and no network transport.
3. Verify focused privacy tests.

## Task 8: Engineering Workspace UI

**Files:**
- Modify: `apps/workbench/src/App.tsx`, `apps/workbench/src/index.css`
- Create/modify focused components under `apps/workbench/src/components`
- Create: `tests/workbench/workbench-e2e.spec.ts`

1. Add a failing bundle contract for the project/data/layer/history rail, map/spec/files center, plan/diff/diagnostics/export task rail, and progress track.
2. Split `App` into focused workspace components and connect the real local API.
3. Implement functional tabs, selection, plan preview/abandon/apply, history restore, export preview/confirm, loading, empty, error, and disabled states.
4. Add deterministic Mock-provider E2E for create, inspect, plan, preview, abandon/apply, export, and reopen.
5. Verify desktop and mobile browser rendering, keyboard focus, console health, map movement, and strict visual snapshots.

## Task 9: Release Gates And Planning Closure

**Files:**
- Modify: `package.json`, `scripts/gate-plan.mjs`, CI workflows as needed
- Modify: `CHANGELOG.md`, `README.md`, `CONTRIBUTING.md`, engineering docs
- Modify by `@orchestrator` only: planning snapshots, roadmap, digest, burndown, handoff ledger, dashboard

1. Add Workbench build, contract, security, E2E, delivery, and strict visual gates to path-aware validation.
2. Add release wording that separates Workbench maturity from engine semver and describes the GeoParquet break without claiming Workbench/3D/hosted promotion.
3. Create or update the Workbench v1 milestone and implementation issues, then refresh every planning snapshot in one serialized update.
4. Run `pnpm build:schema`, `pnpm check`, Workbench E2E, resources, strict visuals, docs build, and delivery verification.
5. Request final spec and code-quality reviews; resolve every blocking or important finding.
