# Core Concepts

GIS Engine is built around five core concepts. Understanding these will help you
design reliable, AI-friendly map applications.

## 1. MapSpec

`MapSpec` is the single source of truth for a map's state. It is a JSON document
that describes every source, layer, view, and extension:

```json
{
  "version": "0.1",
  "sources": { /* data sources */ },
  "layers": [ /* render layers */ ],
  "view": { "center": [120.15, 30.28], "zoom": 12 },
  "extensions": { /* optional extension data */ }
}
```

- **Schema-validated** — TypeBox schemas define every field
- **Versioned** — breaking changes bump the MapSpec version
- **Portable** — one JSON document contains the entire map

## 2. Commands

All state mutation goes through the command system. Direct property access is
not supported.

```typescript
const result = await applyCommands(map, [
  { type: "addLayer", layer: { /* ... */ } },
  { type: "setPaint", layerId: "my-layer", paint: { /* ... */ } },
]);
```

Each command is:
- **Dry-run capable** — preview with `dryRun: true`
- **Rollback-friendly** — apply inverse commands
- **Replayable** — deterministic results for the same input
- **Conflict-aware** — `baseRevision` checks

## 3. Diagnostics

Errors and warnings are structured, not prose:

```typescript
interface Diagnostic {
  code: string;       // e.g. "LAYER.SOURCE_NOT_FOUND"
  severity: "error" | "warning" | "info";
  path: string;       // JSON Pointer to the problematic field
  message: string;    // Human-readable explanation
  fix?: string;       // Suggested fix
}
```

AI agents can act on these directly—no need to parse error strings.

## 4. Renderer Adapters

The rendering backend is abstracted behind `RendererAdapter`:

```
MapSpec → [Transformer] → RendererAdapter → MapLibre GL / Mock / Future
```

- **MockAdapter** — deterministic, no browser needed (for testing)
- **MapLibreAdapter** — real MapLibre GL JS rendering
- **Future adapters** — swap in other renderers without changing your code

## 5. MCP Tools

Seven MCP tools expose engine capabilities to AI agents. Each tool has typed
`inputSchema` and `outputSchema` — LLMs can call them without hallucinations.

See [MCP Tools Overview](/mcp/overview) for details.
