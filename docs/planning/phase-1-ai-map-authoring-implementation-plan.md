---
agent: orchestrator
period: 2026-W25
generated_at: 2026-06-14T00:00:00Z
repo_revision: "fa12c7b98ab43a92a39bfbf35d2b26aefa771752"
inputs:
  - docs/intent/project-definition.md
  - docs/spec/phase-1-ai-map-authoring.md
  - docs/planning/feature-specs/current-product-definition.md
  - docs/planning/feature-specs/natural-language-map-app-generation.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/planning/feature-specs/ai-map-workbench-promotion-scope.md
  - docs/spec/contracts-and-interfaces.md
  - docs/website/guide/what-is-gis-engine.md
  - examples/ai-map-workbench/README.md
  - examples/mcp-server-setup/README.md
owner: "@orchestrator"
decision_level: advisory
---

# Implementation Plan: Phase 1 AI Map Authoring

## Overview

Phase 1 turns the confirmed project intent into a practical delivery path:
developers can describe a 2D WebGIS task in natural language, an AI Agent can
generate or modify a `MapSpec`, and the result can be validated, replayed,
explained, exported, and snapshot-verified with structured evidence.

The implementation path is intentionally narrow. It uses the current
`examples/ai-map-workbench` flow as the end-to-end reference demo, keeps
`examples/mcp-server-setup` as the minimal MCP entrypoint sample, and leaves
`examples/consumer-handoff-minimal` as a downstream consumer reference.

## Architecture Decisions

- Keep `MapSpec` as the executable blueprint and the primary contract for AI
  authoring.
- Keep the MCP surface frozen to the existing snake_case tool names with
  `inputSchema` and `outputSchema`.
- Keep 2D stable first; treat 3D and digital-twin behavior as extension or
  adapter-local evidence until promoted separately.
- Use the workbench example as the user-visible verification path, not as a
  hosted product commitment.

## Task List

### Phase 1: Contract and Evidence Alignment

- [x] Task 1: Tighten the phase spec against existing contract docs.
  - Description: Resolve the remaining open questions in the phase spec and
    align it with the current contract and product-boundary docs.
  - Acceptance criteria:
    - [x] The phase spec names the primary demo, the minimum first-release
          workflow, and the visual-snapshot stance.
    - [x] The spec does not conflict with `docs/spec/contracts-and-interfaces.md`
          or the current product-definition docs.
    - [x] Open questions are reduced to only genuinely unresolved product
          decisions.
  - Verification:
    - [x] `pnpm test:docs`
    - [x] `node scripts/doc-generator.mjs links`
    - [x] `git diff --check`
  - Dependencies: None
  - Files likely touched:
    - `docs/spec/phase-1-ai-map-authoring.md`
    - `docs/intent/project-definition.md` if the intent needs a wording fix
  - Estimated scope: Small

- [x] Task 2: Produce a canonical Phase 1 evidence chain for the workbench demo.
  - Description: Make the workbench example the single end-to-end reference for
    the authoring loop and verify the evidence surface that supports it.
  - Acceptance criteria:
    - [x] The workbench example clearly demonstrates prompt -> plan ->
          command -> validation -> snapshot -> export evidence.
    - [x] The example copy does not overclaim hosted/product status.
    - [x] The example remains consistent with the public MCP tool set.
  - Verification:
    - [x] `pnpm exec vitest run tests/examples/ai-map-workbench.test.ts`
    - [x] `pnpm exec vitest run tests/ai/workbench-provider-plan.test.ts tests/ai/generation-evidence.test.ts`
    - [x] `pnpm exec biome check examples/ai-map-workbench/server.mjs tests/examples/ai-map-workbench.test.ts`
    - [x] Docs link audit stays green
    - [x] Visual proof remains scoped to mock snapshot evidence for this
          server/test slice; browser visual proof is deferred to Task 5.
  - Dependencies: Task 1
  - Files likely touched:
    - `examples/ai-map-workbench/README.md`
    - `tests/examples/ai-map-workbench.test.ts`
    - `docs/website/guide/what-is-gis-engine.md`
  - Estimated scope: M

### Checkpoint: Contract and Evidence Alignment

- [x] The phase spec is coherent and reviewable.
- [x] The workbench demo is the canonical Phase 1 reference path.
- [x] Docs and example wording match the confirmed project definition.

### Phase 2: MCP and Generation Flow Hardening

- [x] Task 3: Keep generation evidence and planner boundaries explicit.
  - Description: Ensure the prompt-planner and generation-evidence chain stays
    schema-driven, replayable, and free of raw-prompt retention.
  - Acceptance criteria:
    - [x] Prompt planner inputs and outputs remain structured and schema-bound.
    - [x] Generation evidence shows accepted vs unsupported intent clearly.
    - [x] The evidence chain can still be consumed through current MCP tools.
  - Verification:
    - [x] `pnpm test:ai`
    - [x] `pnpm test:schema-sync`
    - [x] `pnpm build:schema`
  - Dependencies: Task 1
  - Files likely touched:
    - `packages/engine/src/generation/*`
    - `packages/ai/src/*`
    - `tests/ai/generation-evidence.test.ts`
  - Estimated scope: M

- [x] Task 4: Keep the generated-app handoff inspectable and side-effect free.
  - Description: Make sure the export and delivery evidence path stays readable
    for the generated-app review story without adding file-write behavior.
  - Acceptance criteria:
    - [x] Delivery evidence explains readiness, blockers, and follow-up needs.
    - [x] Export remains manifest-oriented and side-effect free.
    - [x] The handoff remains machine-checkable in docs and tests.
  - Verification:
    - [x] `pnpm test:cli`
    - [x] `pnpm test:docs`
    - [x] `node scripts/doc-generator.mjs links`
  - Dependencies: Task 3
  - Files likely touched:
    - `docs/planning/feature-specs/generated-app-delivery-ux.md`
    - `tests/cli/cli.test.ts`
    - `tests/ai/generation-evidence.test.ts`
  - Estimated scope: M

### Checkpoint: MCP and Evidence

- [x] Prompt and generation evidence remain schema-driven and auditable.
- [x] Export and delivery remain inspectable without side effects.
- [x] The Phase 1 user story still fits the current public MCP surface.

### Phase 3: Example and CI Proof

- [ ] Task 5: Verify the workbench example as the 2D end-to-end proof.
  - Description: Use the workbench example to prove the natural-language flow
    in a browser-visible path with the current command and snapshot gates.
  - Acceptance criteria:
    - [x] A developer can run the workbench example locally.
    - [x] The example demonstrates a valid AI-driven `MapSpec` change.
    - [ ] Snapshot evidence and diagnostics are visible in the browser example
          flow.
  - Verification:
    - [x] `pnpm example:ai-map-workbench`
    - [x] `curl` against `/api/chat` with `make points red` returned
          `status: "applied"` plus `snapshot`, `export`, and
          `export_example_app` evidence.
    - [x] `pnpm test:examples`
    - [x] `pnpm test:snapshot:smoke`
    - [ ] Browser visual inspection of `http://127.0.0.1:4322` is still
          pending; the current in-app Browser session crashed and Browser Use
          URL policy blocked further page inspection in this environment.
  - Dependencies: Task 2, Task 4
  - Files likely touched:
    - `examples/ai-map-workbench/*`
    - `tests/examples/ai-map-workbench-node-harness.ts`
    - `tests/examples/workbench-hardening.test.ts`
  - Estimated scope: M

- [ ] Task 6: Lock the CI gates around the Phase 1 claim.
  - Description: Make sure schema, command replay, diagnostics, resource
    policy, and snapshot checks are the acceptance backbone for the claim.
  - Acceptance criteria:
    - [x] The documented gates match the actual repo scripts.
    - [ ] Visual-snapshot expectations are explicit.
    - [x] The plan names the exact commands that prove Phase 1.
  - Verification:
    - [x] `pnpm gate:plan`
    - [x] `pnpm check`
    - [x] `pnpm test:resources`
  - Dependencies: Task 1, Task 3, Task 5
  - Files likely touched:
    - `docs/planning/phase-1-ai-map-authoring-implementation-plan.md`
    - `docs/engineering/ci-test-strategy.md`
    - `docs/engineering/supported-feature-matrix.md`
  - Estimated scope: M

### Checkpoint: Phase 1 Proof

- [ ] The workbench example proves the loop end to end.
- [ ] CI gates match the Phase 1 acceptance claim.
- [ ] No new public contract drift has been introduced.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Plan drifts into hosted product scope | High | Keep the workbench/example boundary explicit and avoid product-route language. |
| Phase 1 success criteria stay too broad | Medium | Keep the canonical demo and minimum workflow fixed before implementation. |
| Snapshot expectations become ambiguous | Medium | Decide now whether visual snapshots are required or waiver-eligible for docs/example-only changes. |
| Task sizes grow beyond one session | Medium | Split any task that touches more than ~5 files into a follow-up slice. |

## Open Questions

- Task 5 still needs a successful browser visual inspection of the local
  workbench evidence flow; service/API, example, and smoke-snapshot evidence
  already passed.
- Browser visual proof should remain scoped to the local workbench example and
  must not be used to imply hosted-product or stable 3D runtime readiness.
