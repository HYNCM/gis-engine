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

## RFC-QC Fast Track

Use an `RFC-QC-*` note for contract-quality-control changes that are narrow, urgent, and easy to review without reopening the full architecture process.

Eligible changes:

- Clarify ambiguous public contract text without changing runtime behavior.
- Add diagnostics, metadata, or examples that do not require existing callers to change.
- Tighten validation for states that were already invalid or unsupported.
- Document known limitations, operational requirements, or migration notes.

Not eligible for fast track:

- Remove, rename, or retype a public field, command, schema, or MCP result property.
- Change default runtime behavior in a way existing callers can observe.
- Introduce a new required field or new required caller workflow.
- Expand the frozen boundary without an owner-approved freeze note.

## Approval SLA

- `RFC-QC-*` fast-track review target: 1 business day from PR ready-for-review.
- Standard non-breaking contract review target: 2 business days.
- Breaking contract review target: 3 business days and requires an explicit migration note.
- If the SLA expires without review, the author must refresh the PR summary with current risk, test evidence, and whether the change is still time-sensitive before merging.

## Breaking vs Non-Breaking Rules

Breaking changes include:

- Removing, renaming, or changing the type or meaning of a public schema field.
- Changing command, patch, transaction, diagnostic, or MCP result shapes in a way that can break existing integrations.
- Making an optional public field required.
- Changing error codes, trace semantics, revision conflict behavior, or export shape without backward compatibility.

Non-breaking changes include:

- Adding optional fields with documented defaults or absence semantics.
- Adding new diagnostic codes while preserving existing codes and result shape.
- Clarifying docs, examples, or supported-feature notes.
- Tightening validation only for inputs already documented as invalid or unsupported.

When in doubt, treat the change as breaking until the reviewer explicitly records why it is compatible.

## Review Gate

- Run `pnpm check`.
- Run `pnpm build:schema` when schema files change.
- Update README/docs when implementation status or supported features change.
- Public schema field changes must include a changelog or version-policy note.
