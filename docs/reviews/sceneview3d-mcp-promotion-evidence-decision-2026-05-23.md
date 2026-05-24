---
agent: ai-agent
period: 2026-W23
generated_at: 2026-05-23T13:05:10Z
repo_revision: "cef340d"
inputs:
  - docs/planning/sprint-2026-W23-scene3d-promotion-readiness.md
  - docs/planning/feature-specs/sceneview3d-promotion-readiness.md
  - docs/spec/contracts-and-interfaces.md
  - packages/ai/src/tools/contextSummary.ts
  - tests/ai/mcp-integration.test.ts
owner: "@ai-agent"
decision_level: advisory
---

# SceneView3D MCP Promotion Evidence Decision

## Decision

Promotion evidence summaries stay out of public MCP context for W23. The
`scene3d` context remains extension-only and may summarize sources, layers,
resource caps, mock snapshot/query, and capabilities, but it must not expose
renderer evidence or adapter promotion summaries as AI-facing runtime support.

## Evidence

| Evidence | Meaning |
| --- | --- |
| `docs/spec/contracts-and-interfaces.md` | MCP contract explicitly keeps renderer and promotion evidence summaries out of context |
| `tests/ai/mcp-integration.test.ts` | `get_context_summary` asserts no `rendererEvidence` or `promotionEvidence` field is exposed |
| `packages/ai/src/tools/contextSummary.ts` | Current context summary is extension-only and does not import adapter promotion APIs |

## Impact

- AI safety: public tools cannot overstate SceneView3D runtime readiness.
- Architecture: adapter promotion evidence remains in release-gate and adapter
  artifacts instead of leaking into MCP before a product use case is approved.
- Product: W23 promotion readiness can proceed without changing public AI tool
  schemas.

## Action

- `@ai-agent`: keep MCP schemas unchanged for W23.
- `@docs-agent`: reference this decision when updating public roadmap and
  release notes.
- `@quality-guardian`: treat any future MCP exposure of promotion summaries as
  a public contract change that requires schema, output-schema, and MCP tests.

## Confidence

High. The current code and tests already keep SceneView3D context
extension-only, and the updated test asserts the promotion summary is not
exposed.
