---
agent: ai-agent
period: 2026-05-30
generated_at: 2026-05-30T04:47:43Z
repo_revision: "ff070cb923314fb9df7105e09ce75c3db90309cd"
inputs:
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/archive/2026-05-30/planning/sprint-2026-W22-ai-native-next-loop.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - packages/ai/src/tools/exportExampleApp.ts
  - packages/ai/src/tools/generationEvidence.ts
  - tests/ai/generation-evidence.test.ts
  - tests/ai/mcp-integration.test.ts
owner: "@ai-agent"
decision_level: advisory
---

# AIN-001 / AIN-002 Generated-App Delivery Acceptance

`TASK-2026W22-AIN-001` and `TASK-2026W22-AIN-002` now have an AI-contract
implementation slice. The generated-app handoff keeps using the existing
`export_example_app` tool and adds schema-testable delivery metadata inside the
compact `generationEvidence` summary.

## Evidence

| Requirement | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Delivery UX sections map to structured evidence | `ExampleAppDeliverySummarySchema` adds `sections` for readiness, files, map edits, data and analysis, and scene browsing. | A UI can render the handoff without parsing diagnostic prose. | Keep future UI work bound to `generationEvidence.delivery.sections`. | high |
| Acceptance states are schema-testable | `delivery.status` and `delivery.acceptance.state` enumerate `ready`, `blocked`, `needs-confirmation`, and `follow-up-required`. | Generated apps can distinguish usable, blocked, risky, and next-action states. | Reuse these states rather than adding MCP aliases. | high |
| Confirmation boundaries are explicit | `delivery.confirmations` records external resource, network fetch, archive parsing, worker use, and file write boundaries; PMTiles is marked `needs-confirmation` without being parsed. | High-risk actions stay visible before future fetch, archive, worker, or write behavior exists. | Future file-writing or loader tools must consume this boundary before mutation or IO. | high |
| Source readiness follows the NLQ-005 matrix | `delivery.sourceReadiness` emits `supported`, `readiness-only`, or `blocked` per current `MapSpec.sources`. | PMTiles and URL GeoJSON remain honest readiness-only handoffs; inline GeoJSON remains query-ready. | AIN-003 can split promotion candidates from this structured state. | medium |
| Scene browsing remains extension-only | `sceneBrowsing.state: "extension-only"` and `stableRuntimeBlocked: true` are present alongside stable blocker codes. | Delivery copy no longer has to infer the stable-runtime boundary from negative booleans. | AIN-005 should continue this wording without enabling stable `scene3d`. | high |

## Gate Output

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm build:schema` | pass | AI contract schemas compile and export with the new delivery summary shape. |
| `pnpm --filter @gis-engine/ai build` | pass | TypeScript contract compiles. |
| `pnpm test:ai` | pass | 41 AI tests pass, including delivery acceptance states and MCP manifest round-trip coverage. |
| `pnpm test:release:scene3d` | pass | SceneView3D release gate stays green while delivery copy remains extension-only. |
| `pnpm check` | pass | Full deterministic repo gate passes. |
| `git diff --check` | pass | No whitespace errors. |

## Residual Risk

- This slice does not add a file-writing tool and does not make
  `export_example_app` create artifacts. That is intentional.
- `delivery.sourceReadiness` summarizes only current `MapSpec.sources`.
  GeoParquet, FlatGeobuf, GeoTIFF, and GeoZarr remain blocked planning intents
  until future schemas exist.
- Scene browsing delivery is `follow-up-required` when extension-only evidence
  is present; it is not a stable runtime approval.
