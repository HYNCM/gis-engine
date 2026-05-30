---
agent: qa-agent
period: 2026-05-30
generated_at: 2026-05-30T14:40:00Z
repo_revision: "6052d6f19d5f14c45ac5b5a5a6c837d8fba3e64b"
inputs:
  - docs/planning/feature-specs/generated-app-review-console.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - docs/planning/feature-specs/spatial-analysis-promotion-criteria.md
  - packages/ai/src/tools/generationEvidence.ts
  - tests/ai/generation-evidence.test.ts
owner: "@qa-agent"
decision_level: advisory
---

# GIR-004 Spatial-Analysis Review-Section Mapping

`TASK-2026W22-GIR-004` is already represented in the current evidence spine.
The review-console contract exposes a `data-and-analysis` section, and the AI
handoff code now derives that section from spatial-analysis evidence and source
readiness instead of treating it as a prose-only label.

## Evidence

| Requirement | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Review-console spec names the spatial-analysis section | `docs/planning/feature-specs/generated-app-review-console.md` defines the `Spatial analysis` row with `analysisEvidence`, `spatialQueryEvidence`, blocked-operation diagnostics, and explicit ready/blocked semantics. | The product contract already exposes spatial readiness as a first-class review section. | Keep the section wording aligned with the delivery UX and source-readiness matrices. | high |
| Delivery UX maps the section into a renderable handoff | `docs/planning/feature-specs/generated-app-delivery-ux.md` includes `delivery.sections[].id = data-and-analysis` and ties it to source readiness plus analysis evidence. | A UI can render the section without parsing prose or adding new tool names. | Reuse the current `generationEvidence.delivery.sections` shape. | high |
| Runtime evidence uses spatialQueryEvidence and source readiness | `packages/ai/src/tools/generationEvidence.ts` builds the `data-and-analysis` section from `spatialQueryEvidence.diagnosticCounts.error`, `sourceReadiness`, and follow-up counts. | Spatial readiness already drives ready / needs-confirmation / follow-up-required decisions. | No additional MCP tool or runtime loader is needed for this mapping. | high |
| Tests already cover the section states | `tests/ai/generation-evidence.test.ts` asserts `data-and-analysis` is `ready` for inline GeoJSON and `needs-confirmation` when source readiness requires it. | The current contract is regression-tested. | Keep future spatial-analysis changes aligned with these section assertions. | high |
| Source readiness and blocked geoprocessing stay separated | `docs/planning/feature-specs/cloud-native-source-readiness.md` and `docs/planning/feature-specs/spatial-analysis-promotion-criteria.md` keep blocked formats and blocked operations in planning-only states. | The review console stays honest about what is supported now versus queued for future promotion. | Preserve the current blocked-operation and readiness-only boundaries. | high |

## Gate Output

| Command | Result | Notes |
| --- | --- | --- |
| `git diff --check` | pass | No whitespace issues in the current docs state. |
| `pnpm check` | pass | Full deterministic gate passed in the release-capable shell after the docs archive work. |

## Decision

`TASK-2026W22-GIR-004` is complete from a review-console contract perspective.
The remaining queue should advance to `GIR-005`.
