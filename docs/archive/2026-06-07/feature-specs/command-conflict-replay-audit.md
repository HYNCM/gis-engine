---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-18T00:00:00Z
repo_revision: "3ae5daa"
inputs:
  - docs/planning/monthly-roadmap.md
  - docs/spec/contracts-and-interfaces.md
  - packages/engine/src/commands/applyCommands.ts
  - tests/fixtures/commands/replay/conflict-audit/commands.json
decision_level: implementation
---

# Command Conflict, Replay, and Audit

## Goal

Make AI-authored map edits explainable after replay. A caller must be able to
answer: who proposed the command, why it ran, which revision it expected, what
changed, and whether a conflict was rejected without mutating the map.

## Contract

Commands can carry provenance:

- `baseRevision`: optimistic concurrency guard.
- `author`: `human | agent | system` with optional id/name.
- `reason`: short intent visible to reviewers.
- `createdAt`: caller-provided timestamp used to derive deterministic trace
  timestamps.
- `sourcePromptHash`: hash only; never store the raw prompt.

`applyCommands(..., { collectTrace: true })` returns `traces` alongside normal
`results`. Each trace includes `traceId`, `commandId`, `sequenceId`, `status`,
deterministic `startedAt`/`endedAt`, optional command provenance, diagnostics,
and changed JSON Pointer paths.

## Conflict Semantics

- `baseRevision` mismatch returns `CONFLICT.BASE_REVISION`.
- Atomic mode returns the original spec and `rolledBack: true`.
- Best-effort mode keeps prior successful commands and records the conflict.
- The trace for a conflict has `status: "failed"`, empty `changedPaths`, the
  stale `baseRevision`, and the same diagnostic/fix payload as the command
  result.
- No automatic retry or three-way merge is performed in v0.1/v0.2 checkpoint.

## Evidence

| Artifact | Purpose |
| --- | --- |
| `tests/commands/apply-commands.test.ts` | Trace collection, conflict trace, replay fixture stability |
| `tests/fixtures/commands/replay/conflict-audit/` | Before spec, command batch, expected trace fixture |
| `tests/ai/apply-commands-tool.test.ts` | `collectTrace` through AI tool wrapper |
| `tests/ai/mcp-integration.test.ts` | MCP `apply_commands` returns audit traces |
| `examples/ai-map-edit/audit.commands.json` | User-facing audited command example |

## Non-goals

- No durable command queue.
- No automatic conflict rebase.
- No storage of raw user prompts.
- No renderer-private object exposure in audit records.
