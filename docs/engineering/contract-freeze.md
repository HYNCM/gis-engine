# Contract Freeze Checklist

This file records the v0.1 public API freeze boundary. Changes to these areas require an explicit breaking/non-breaking note in the PR summary.

## Frozen Boundary

- `packages/engine/src/types.ts`
- `packages/engine/src/spec/schemas/*.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/tools/*`
- MCP tool names, input schema, and JSON result shape

## Current v0.1 Contract Additions

- `ApplyOptions.traceId`
- `ApplyCommandsResult.transaction`
- `ApplyCommandsResult.dryRun`
- `ApplyCommandsResult.committed`
- `ApplyCommandsResult.rolledBack`
- `ApplyCommandsResult.traceId`
- `CommandResult.sequenceId`
- `get_context_summary` MCP tool

## Review Gate

- Run `pnpm check`.
- Run `pnpm build:schema` when schema files change.
- Update README/docs when implementation status or supported features change.
- Public schema field changes must include a changelog or version-policy note.
