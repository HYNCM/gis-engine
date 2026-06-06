---
agent: product-strategist
period: 2026-W21
generated_at: 2026-05-17T15:05:00Z
repo_revision: "acdf28e"
inputs:
  - docs/architecture/core-capabilities.md
  - packages/engine/src/spec/expression-validator.ts
  - packages/engine/src/renderer/maplibre/adapter.ts
  - tests/schema/expression-validator.test.ts
decision_level: advisory
---

# Expression v0.2 Contract

## Goal

v0.2 makes the expression matrix match the operators AI agents most often need
for thematic 2D maps, while still keeping validation deterministic and small.

## Supported Operators

| Operator | Status | Validation Rule |
| --- | --- | --- |
| `literal` | stable | exactly one literal value |
| `get` | stable | property name must be a string |
| `step` | stable | numeric stops and consistent output types |
| `interpolate` | stable | linear interpolation, numeric stops, number/color outputs |
| `case` | v0.2 | boolean conditions and consistent branch/fallback output types |
| `match` | v0.2 | literal labels and consistent branch/fallback output types |
| `zoom` | v0.2 | no arguments, returns number |
| `to-number` | v0.2 | one or more inputs, returns number |
| `to-string` | v0.2 | one input, returns string |

## Non-Goals

- Expression execution or feature-state evaluation.
- Full Mapbox expression compatibility.
- Collation, locale, rich formatting, or symbol text shaping.
- Runtime data schema inference beyond known-property warnings.

## Diagnostics

| Failure | Diagnostic |
| --- | --- |
| unknown operator | `EXPR.UNKNOWN_OPERATOR` |
| wrong argument count | `EXPR.INVALID_ARITY` |
| non-boolean `case` condition | `EXPR.TYPE_MISMATCH` |
| invalid `match` label | `EXPR.TYPE_MISMATCH` |
| inconsistent output types | `EXPR.TYPE_MISMATCH` |
| invalid color output for `interpolate` | `EXPR.INVALID_COLOR` |
| unknown feature property when a property set is available | `EXPR.PROPERTY_UNKNOWN` warning |

## Acceptance Criteria

- `validateSpec` accepts all supported operators in paint/layout expressions.
- Invalid arity, label, condition, and branch type cases return deterministic
  diagnostics with paths.
- `MapLibreAdapter.getCapabilities()` advertises the same supported operator
  list.
- `pnpm test:schema` and `pnpm check` pass.
