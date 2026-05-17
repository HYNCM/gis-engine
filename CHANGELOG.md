# Changelog

## 0.2.0-checkpoint - 2026-05-17

- Added generic `vector` source contracts, resource policy validation, MapLibre vector transformation, example fixtures, snapshot smoke coverage, and a real-browser visual snapshot scene backed by generated local MVT.
- Expanded the expression contract and validation coverage for `case`, `match`, `zoom`, `to-number`, and `to-string`.
- Hardened MCP tools with public input/output schemas, strict `CapabilityReportSchema` validation, and v0.2 vector/expression contract coverage.
- Added deterministic command/style behavior coverage for `setPaint`, `setLayout`, `reorderLayer`, rollback, dry-run, and missing `beforeLayerId` diagnostics.
- Defined the `fill-extrusion-lite` experimental 2.5D gate and the reserved `scene3d` unsupported boundary.
- Added v0.2 checkpoint audit and release note draft with `pnpm build:schema`, `pnpm check`, visual snapshot, and strict visual snapshot evidence.

## 0.1.0 - Unreleased

- Created the initial pnpm workspace with `@gis-engine/engine` and `@gis-engine/ai`.
- Added TypeBox schemas, runtime validation, diagnostics, command application, JSON Patch utilities, and renderer adapter contracts.
- Added initial schema, command, patch, runtime, adapter, and AI tool tests.
- Added architecture, engineering, competitive analysis, and review documentation.
