---
agent: product-strategist
period: 2026-W23
generated_at: 2026-05-29T06:07:24Z
repo_revision: "60d5d52301016a446f49fe12bd42256e3f87ca4d"
inputs:
  - docs/planning/feature-specs/natural-language-map-app-generation.md
  - docs/reviews/ai-orchestration-capability-summary-2026-05-27.md
  - docs/spec/contracts-and-interfaces.md
owner: "@product-strategist"
decision_level: advisory
---

# Spatial Analysis Readiness

## Scope

Spatial analysis is part of the natural-language map app generation story, but
the current safe boundary is readiness and query evidence, not full
geoprocessing. This spec defines the product line GIS Engine can claim now and
the gates required before adding richer analysis operations.

## Current Boundary

- Evidence: `capabilitySummary` already reports `spatial-analysis` as
  experimental through capability metadata and point/bbox query readiness.
- Impact: AI prompts such as "find features near this area" can be routed to
  existing query readiness or rejected with stable diagnostics.
- Action: define a read-only analysis contract before adding any public MCP
  analysis tool.
- Confidence: high.

## Supported Now

| Capability | Claim | Evidence Required |
| --- | --- | --- |
| Point query readiness | AI can plan against deterministic point query behavior where adapters expose it. | query result shape, stable layer/source ids, diagnostics for hidden or missing layers |
| Bbox query readiness | AI can plan against bounded extent queries where fixtures and adapters support them. | deterministic result ordering or documented sort, extent validation, diagnostics |
| Capability explanation | AI can explain which analysis requests are supported, experimental, or blocked. | `capabilitySummary`, `explain_spec`, and output schema coverage |

## Explicitly Blocked Until Designed

- buffer;
- intersection;
- overlay;
- routing;
- nearest-neighbor search with distance guarantees;
- aggregation and clustering as analysis outputs;
- server-side processing;
- hidden network access or external dataset fetches.

## Future Contract Requirements

Before any blocked operation becomes public, the owning slice must add:

- TypeBox input and output schemas;
- deterministic semantics for read-only operations or command semantics for
  stateful outputs;
- structured diagnostic codes and paths;
- resource-policy checks for any URL, worker, external asset, or remote service;
- focused tests for valid, invalid, empty, hidden-layer, missing-source, and
  large-result cases;
- MCP `inputSchema` and `outputSchema` updates when exposed to AI tools;
- documentation and runnable example evidence when user-facing.

## Product Recommendation

For W23, keep spatial analysis as an experimental readiness domain inside the
natural-language generation flow. Let AI classify analysis prompts, explain the
current boundary, and generate only the supported query/readiness evidence. The
first implementation task should design an analysis result evidence bundle
before adding new operations.
