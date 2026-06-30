# diagnostics-walkthrough

Demonstrates how GIS Engine produces structured, machine-readable diagnostics when a MapSpec fails validation — and how to inspect and act on them programmatically.

## What This Example Shows

1. **Validating a MapSpec** with `validateSpec()` and reading the diagnostic report.
2. **Intentional errors** — a MapSpec with a missing source reference and an unknown layer type — produce structured `Diagnostic` objects instead of plain error strings.
3. **Fixing errors** by reading the `code`, `path`, `severity`, and `fix` fields.

## Files

| File | Purpose |
|---|---|
| `map.json` | A valid MapSpec that passes all validation checks. |
| `data/invalid-examples.json` | Three intentionally broken MapSpecs showing common mistakes and their diagnostics. |
| `validate.ts` | Script that validates the valid spec and prints the report. |

## Key Concepts

Every diagnostic object has a stable structure:

```json
{
  "code": "LAYER.SOURCE_NOT_FOUND",
  "path": "/layers/0/source",
  "message": "Source 'missing-source' not found in spec.sources",
  "severity": "error",
  "fix": "Add a source named 'missing-source' or correct the layer's source reference"
}
```

- `code` — stable, machine-readable identifier (e.g. `SCHEMA.INVALID`, `LAYER.SOURCE_NOT_FOUND`)
- `path` — JSON Pointer to the offending field
- `severity` — `"error"` or `"warning"`
- `fix` — human-readable suggestion

## Quick Start

```bash
npm install
npm run dev
```

The runnable version renders the valid spec on the map and shows diagnostics for
the intentionally broken specs in a side panel. Open the browser console for
full diagnostic detail.

## Usage

```bash
npx tsx validate.ts
```

This prints the full validation report. Try modifying `map.json` to trigger different diagnostics.
