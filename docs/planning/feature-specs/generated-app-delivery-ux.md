---
agent: product-strategist
period: 2026-W22
generated_at: 2026-05-29T10:20:00Z
repo_revision: "d628fd1454a44859e57d8996343413684a541c30"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md
  - docs/spec/contracts-and-interfaces.md
  - packages/ai/README.md
owner: "@product-strategist"
decision_level: advisory
---

# Generated-App Delivery UX

## Product Goal

After a natural-language map request is converted into schema-first evidence,
the user should receive an inspectable generated-app handoff. The handoff must
show what is ready, what is blocked, what files are referenced, and which
follow-up tasks are needed before runtime or data claims become stronger.

This spec does not add a new MCP tool name, does not make `export_example_app`
write files, and does not enable stable `view.mode: "scene3d"`.

## User-Facing Contract

The generated-app delivery surface should organize evidence into five compact
sections:

| Section | User Question | Evidence Source | Must Not Do |
| --- | --- | --- | --- |
| Readiness | Can I treat this generated app as ready? | `GenerationEvidenceBundle.status`, diagnostic counts, planner confidence | Hide blocker diagnostics behind a successful schema validation |
| Files | Which files would I inspect or package? | `export_example_app.files`, file roles, media types, required flags | Return file contents or write files as a side effect |
| Map edits | What changed and can it replay? | command count, trace id, committed/rolled-back flags, changed paths | Mutate runtime state outside `apply_commands` |
| Data and analysis | What can be queried or must stay blocked? | spatial query cases, cloud-native source readiness, blocked operations | Claim buffer/overlay/routing/aggregation support without contracts |
| Scene browsing | Is this 3D runtime support? | `sceneBrowsing`, `extensions.scene3d` ids, blocker codes | Promote stable `view.mode: "scene3d"` or renderer evidence |

## Acceptance Criteria For The Next Implementation Batch

- Manifest output exposes readiness and blockers in a way that a UI can render
  without parsing natural-language diagnostics.
- Every generated-app handoff remains side-effect free until a future file
  writing tool is explicitly designed and approved.
- High-risk or external-resource actions have a confirmation boundary before
  network fetches, archive parsing, worker use, or file writes.
- Source readiness is displayed as supported, readiness-only, or blocked, using
  the NLQ-005 matrix as the current authority.
- Scene browsing copy clearly says extension-only and shows stable-runtime
  blocker codes when relevant.

## AIN-001 / AIN-002 Contract

The current implementation exposes these delivery fields through
`generationEvidence.delivery` in generated-app manifests and through the full
`GenerationEvidenceBundle.delivery` handoff:

| Field | Values | User-Facing Meaning |
| --- | --- | --- |
| `delivery.status` | `ready`, `blocked`, `needs-confirmation`, `follow-up-required` | Primary delivery state for the generated-app handoff. |
| `delivery.acceptance.state` | same as `delivery.status` | Schema-testable acceptance state for UI and QA assertions. |
| `delivery.sections[].id` | `readiness`, `files`, `map-edits`, `data-and-analysis`, `scene-browsing` | Direct mapping from product sections to evidence slices. |
| `delivery.confirmations[].reason` | `external-resource`, `network-fetch`, `archive-parsing`, `worker-use`, `file-write`, `stable-scene3d-runtime` | Explicit confirmation boundaries before future high-risk IO or runtime promotion. |
| `delivery.sourceReadiness[].state` | `supported`, `readiness-only`, `blocked` | Per-source status aligned to the cloud-native source readiness matrix. |
| `sceneBrowsing.state` | `not-requested`, `extension-only`, `blocked` | Scene browsing copy can say extension-only without implying stable 3D runtime support. |
| `sceneBrowsing.stableRuntimeBlocked` | `true` | Stable `view.mode: "scene3d"` is still blocked even when extension evidence exists. |

`ready` means the inspectable handoff is ready, not that files were written or
external resources were fetched. `needs-confirmation` is used when the spec
references resource, network, archive, worker, or file-write actions that must
remain behind an explicit future confirmation boundary. `follow-up-required`
keeps extension-only scene browsing and readiness-only sources visible as next
work instead of silently upgrading capability claims.

## Non-Goals

- No free-form prompt parser expansion in this spec.
- No GeoParquet, FlatGeobuf, GeoTIFF, or GeoZarr source implementation.
- No real SceneView3D renderer promotion.
- No changes to the frozen public MCP tool names.
