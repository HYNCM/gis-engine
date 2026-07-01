# diagnostic-error-fix

## Goal

Demonstrate the diagnostic-code-driven error fix workflow: intentionally create
invalid specs, capture structured diagnostics, display them in a visual panel,
and show how to fix errors based on diagnostic codes and paths.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map and diagnostic panel side by side.

## What It Shows

- **Invalid spec cases**: missing version, invalid layer type, dangling source
  reference, missing view field
- **Structured diagnostics**: each error includes `code`, `severity`, `path`,
  `message`, and optional `fix` suggestion
- **Visual diagnostic panel**: dark-themed panel showing all diagnostics with
  color-coded severity
- **Recovery flow**: a corrected spec is validated and rendered after the
  broken examples

## Expected Output

- Left side: diagnostic panel with 4 broken spec cases and their diagnostics
- Right side: a valid map rendered from the corrected spec
- Console: full diagnostic objects logged for inspection

## Limits And Follow-up

- Diagnostic content depends on the current validation engine. Some broken specs
  may produce fewer diagnostics if the validator accepts lenient inputs.
- For a deeper walkthrough see
  [`../diagnostics-walkthrough`](../diagnostics-walkthrough/README.md).
