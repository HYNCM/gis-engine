---
agent: product-strategist
period: 2026-W21
generated_at: 2026-05-17T15:20:00Z
repo_revision: "93daf6c"
inputs:
  - docs/planning/sprint-2026-W21.md
  - docs/spec/contracts-and-interfaces.md
  - packages/engine/src/commands/buildPatch.ts
  - tests/commands/build-patch.test.ts
decision_level: advisory
---

# Style Diff and Layer Order Contract

## Goal

Layer ordering and style edits must be deterministic enough for AI agents to
plan, replay, audit, and explain map changes. Silent fallback is not allowed
when a command references a missing ordering anchor.

## Command Semantics

| Command | Contract |
| --- | --- |
| `setPaint` | merge only the provided paint keys into the target layer |
| `setLayout` | merge only the provided layout keys into the target layer |
| `addLayer.beforeLayerId` | insert before an existing layer id; missing anchors return `LAYER.NOT_FOUND` |
| `reorderLayer.beforeLayerId` | move before an existing layer id; missing anchors return `LAYER.NOT_FOUND` |
| `reorderLayer` without `beforeLayerId` | move the layer to the end |
| no-op reorder | return `skipped` and do not advance revision |

## Diagnostics

| Failure | Diagnostic | Path |
| --- | --- | --- |
| target layer missing | `LAYER.NOT_FOUND` | `/layerId` |
| `beforeLayerId` missing | `LAYER.NOT_FOUND` | `/beforeLayerId` |
| unsupported command type | `COMMAND.UNSUPPORTED` | `/type` |

## Patch Rules

- `setPaint` and `setLayout` must emit stable `add` / `replace` operations for
  changed keys and preserve untouched keys.
- `reorderLayer` must emit a `remove` followed by an `add` for real moves.
- `changedPaths` must stay stable and include `/revision` only for committed
  changes.
- Dry-run uses the same patch as commit mode but returns the original spec.

## Acceptance Criteria

- Missing layer anchors never silently append.
- Reordering before the next layer, before itself, or to an already-final
  position is idempotent and skipped.
- Command replay, dry-run, rollback, and JSON Patch replay remain deterministic.
