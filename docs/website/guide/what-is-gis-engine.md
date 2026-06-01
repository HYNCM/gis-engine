# What is GIS Engine?

GIS Engine is an **AI-native map engine** designed from the ground up for
deterministic, auditable, and replayable map operations.

## Why Another Map Engine?

Existing map libraries (MapLibre, Mapbox, Leaflet) are designed for human
developers. GIS Engine is designed for **both humans and AI agents**.

| Capability | Traditional Engine | GIS Engine |
|---|---|---|
| State mutation | Direct API calls | Command system with dry-run/rollback |
| Error handling | Console logs, exceptions | Structured diagnostic codes with paths |
| AI integration | Ad-hoc wrappers | MCP tools with input/output schemas |
| Validation | Runtime crashes | Schema-first, validated at boundaries |
| Auditing | Manual | Deterministic command replay + snapshots |
| Renderer coupling | Tightly bound | Adapter contracts, swappable backends |

## Key Principles

### Schema-First

Every public input is described by a [TypeBox](https://github.com/sinclairzx81/typebox) schema. JSON Schema and TypeScript types are generated and kept in sync automatically.

```typescript
// The MapSpec schema is the single source of truth
import { MapSpec } from "@gis-engine/engine";

const spec: MapSpec = { /* ... */ };
```

### Command-Only Mutation

All map state changes go through `applyCommands`. Each command is:
- **Dry-run capable** — preview before committing
- **Rollback-friendly** — revert to any revision
- **Replayable** — deterministic audit trails
- **Conflict-aware** — `baseRevision` checks prevent race conditions

### Structured Diagnostics

Errors are not strings. They are typed codes with paths and fix suggestions:

```json
{
  "code": "LAYER.SOURCE_NOT_FOUND",
  "path": "/layers/0/source",
  "message": "Source 'missing-source' not found",
  "severity": "error",
  "fix": "Add a source named 'missing-source' or correct the layer reference"
}
```

### Adapter Boundary

Renderer-specific code stays behind `RendererAdapter` contracts. Today the
primary adapter is MapLibre GL JS. Future adapters can support other renderers
without changing the core engine API.

### AI-Native MCP Tools

Seven MCP tools expose every engine capability to AI agents with typed
input/output schemas—no guesswork, no natural-language-only interfaces.

## Package Structure

```
@gis-engine/engine     Core: MapSpec, commands, diagnostics, adapters
@gis-engine/ai         MCP server, AI tools, context summaries
@gis-engine/scene3d    SceneView3D extension boundary (experimental)
```

## When to Use GIS Engine

- ✅ Building AI agents that need to create/edit maps
- ✅ Apps requiring deterministic, auditable map state
- ✅ Products that need multi-renderer support via adapters
- ✅ Map generation pipelines with structured validation

## When Not to Use

- ❌ Simple static maps (use Leaflet)
- ❌ Full GIS analysis platforms (use QGIS/ArcGIS)
- ❌ Real-time collaborative editing (planned for v1+)
