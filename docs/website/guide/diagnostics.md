# Diagnostics

Every error and warning in GIS Engine is a **structured diagnostic** —
machine-readable codes with paths and fix suggestions. No string parsing needed.

## Structure

```typescript
interface Diagnostic {
  code: string;        // e.g. "LAYER.SOURCE_NOT_FOUND"
  severity: "error" | "warning" | "info";
  path: string;        // JSON Pointer to the problematic field
  message: string;     // Human-readable explanation
  fix?: string;        // Suggested fix, actionable by AI
}
```

## Why Structured?

| Traditional | GIS Engine |
|-------------|------------|
| `"Source not found"` | `{ code: "SOURCE.NOT_FOUND", path: "/layers/0/source", fix: "Add source 'x' or correct reference" }` |
| AI must parse prose | AI reads `code` and acts |
| No localization path | Codes are i18n keys |
| Inconsistent format | Always the same shape |

## Common Diagnostic Codes

### Schema

| Code | Meaning |
|------|---------|
| `SCHEMA.TYPE_MISMATCH` | Field has wrong type |
| `SCHEMA.REQUIRED_MISSING` | Required field is absent |
| `SCHEMA.ADDITIONAL_PROPERTIES` | Unknown field present |

### Sources & Layers

| Code | Meaning |
|------|---------|
| `LAYER.SOURCE_NOT_FOUND` | Layer references a source that doesn't exist |
| `SOURCE.UNSUPPORTED_TYPE` | Source type not in capability matrix |
| `LAYER.UNSUPPORTED_TYPE` | Layer type not supported by adapter |

### Expressions

| Code | Meaning |
|------|---------|
| `EXPRESSION.TYPE_MISMATCH` | Expression output type doesn't match property |
| `EXPRESSION.PROPERTY_NOT_FOUND` | `get("x")` references non-existent property |
| `EXPRESSION.INVALID_INTERPOLATION` | Interpolation stops not sorted or wrong type |

### Resource Policy

| Code | Meaning |
|------|---------|
| `RESOURCE.URL_BLOCKED` | URL doesn't pass resource policy |
| `RESOURCE.SCHEME_BLOCKED` | URL scheme not in allowlist |

### Commands

| Code | Meaning |
|------|---------|
| `COMMAND.INVALID_TYPE` | Unknown command type |
| `COMMAND.LAYER_NOT_FOUND` | Target layer doesn't exist |
| `COMMAND.CONFLICT` | `baseRevision` mismatch |

## Using Diagnostics in AI Agents

```typescript
const result = validateSpec(userInput);

for (const diag of result.diagnostics) {
  if (diag.severity === "error") {
    // AI can use diag.code + diag.fix to auto-correct
    console.log(`[${diag.code}] ${diag.path}: ${diag.fix || diag.message}`);
  }
}
```

## DiagnosticCodes Registry

```typescript
import { DiagnosticCodes } from "@gis-engine/engine";

// All registered diagnostic codes with descriptions
console.log(DiagnosticCodes);
```
