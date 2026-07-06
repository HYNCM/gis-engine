---
agent: orchestrator
period: 2026-W25
generated_at: 2026-07-06T15:48:06Z
repo_revision: "8cc3a74"
inputs:
  - docs/intent/project-definition.md
  - docs/design/design-limits-and-generalization-boundaries.md
  - docs/architecture/core-framework.md
  - docs/spec/contracts-and-interfaces.md
  - docs/README.md
  - README.md
  - AGENTS.md
  - docs/architecture/core-extension-boundary-matrix.json
  - docs/planning/issues-snapshot.md
owner: "@orchestrator"
decision_level: info
---

# Next Stage Plan: Boundary Enforcement

## Goal

Turn the current core + extensions boundary into regression-checked project
guidance so future implementation work cannot drift back to a 2D-only or
single-workflow interpretation.

## Phase 1: Guardrails

- [x] Task 1: Add a docs regression that asserts the canonical boundary
      wording and rejects drift.
  - Description: Make the core + extensions boundary testable in the docs
    layer so README, AGENTS, architecture, and contract wording stay aligned.
  - Acceptance criteria:
    - [x] README, AGENTS, and the design / architecture / spec docs all
          describe `MapSpec` as core + extensions.
    - [x] The reference implementation boundary and minimum closed-loop
          language remain present.
    - [x] The test fails if new copy reintroduces "2D-only", "workflow-only",
          or product-shape phrasing.
  - Verification:
    - [x] `pnpm test:docs`
    - [x] `node scripts/doc-generator.mjs links`
  - Dependencies: None
  - Files likely touched:
    - `tests/docs/public-docs-consistency.test.ts`
    - `README.md`
    - `AGENTS.md`
    - `docs/architecture/core-framework.md`
    - `docs/spec/contracts-and-interfaces.md`
    - `docs/design/design-limits-and-generalization-boundaries.md`
  - Estimated scope: M

- [x] Task 2: Create a structured core-vs-extension contract matrix in the
      architecture and spec docs.
  - Description: Make the stable core fields and extension-only fields obvious
    in one place so scene, 3D, and vertical-domain capability stays out of the
    stable core until it is explicitly promoted.
  - Acceptance criteria:
    - [x] Core fields and extension-only fields are explicitly separated.
    - [x] 3D / scene / vertical capabilities remain extension- or
          adapter-local.
    - [x] `validate -> apply -> snapshot -> export` is documented as a
          composable minimum closed loop, not a mandatory global order.
  - Verification:
    - [x] `pnpm test:docs`
    - [x] `node scripts/doc-generator.mjs links`
  - Dependencies: Task 1
  - Files likely touched:
    - `docs/architecture/core-framework.md`
    - `docs/spec/contracts-and-interfaces.md`
  - Estimated scope: S

### Checkpoint: Boundary Guardrails

- [x] Boundary wording is enforced by test and reflected in the main docs.
- [x] Core vs extension responsibilities are readable in one place.

## Phase 2: Extension Evidence

- [ ] Task 3: Add one small extension-only evidence slice that proves
      extension payloads stay out of the stable core.
  - Description: Add a narrow example or test that demonstrates extension-only
    behavior without promoting stable 3D or a new product workflow.
  - Acceptance criteria:
    - [ ] An existing test or example demonstrates extension-only behavior.
    - [ ] The evidence is machine-checkable and does not write files as a side
          effect.
    - [ ] Public docs keep the example framed as reference/evidence only.
  - Verification:
    - [ ] `pnpm test:ai`
    - [ ] `pnpm test:examples`
    - [ ] `pnpm test:docs`
  - Dependencies: Task 2
  - Files likely touched:
    - `tests/ai/generation-evidence.test.ts`
    - `tests/examples/*`
    - `examples/ai-map-workbench/README.md`
  - Estimated scope: M

### Checkpoint: Extension Evidence

- [ ] Extension-only evidence exists without narrowing the core.
- [ ] Reference implementation remains reference-only.

## Phase 3: Queue Refresh

- [x] Task 4: Refresh planning snapshots for the next implementation slice.
  - Description: Update the planning snapshots so the next accepted issue points
    at boundary enforcement or extension evidence rather than old adoption
    cleanup language.
  - Acceptance criteria:
    - [x] `docs/planning/issues-snapshot.md` and roadmap / digest artifacts
          reflect the next guardrail-oriented issue.
    - [x] The next implementation issue has a single owner and a narrow
          verification gate.
    - [x] No planning doc reverts to SDK+CLI adoption cleanup language as the
          active priority.
  - Verification:
    - [x] `node scripts/issues-snapshot.mjs`
    - [x] `pnpm test:docs`
  - Dependencies: Task 1
  - Files likely touched:
    - `docs/planning/issues-snapshot.md`
    - `docs/planning/monthly-roadmap.md`
    - `docs/planning/weekly-digest.md`
  - Estimated scope: S

### Checkpoint: Ready for Execution

- [x] The next stage has a guardrailed implementation target.
- [x] Future tasks point at extension evidence, not protocol lock-in.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Boundary language stays only in docs and never gets enforced | Medium | Add a docs regression and keep the wording in multiple entry points. |
| Extension evidence becomes a stealth product promise | High | Keep the workbench / example / reference wording explicit and avoid stable-runtime claims. |
| The next stage is too broad | Medium | Keep tasks to docs, tests, and issue snapshots; defer runtime feature work. |

## Open Questions

- Which extension slice should be promoted next: scene-only evidence, a domain
  proof, or more general extension-registry guidance?
- Resolved: the boundary matrix is generated from
  `docs/architecture/core-extension-boundary-matrix.json` by
  `pnpm docs:boundary`; docs regression tests enforce the rendered blocks.
