# Quick Start

Get a map rendered with GIS Engine in 5 minutes.

## 1. Install

::: code-group

```bash [npm]
npm install @gis-engine/engine @gis-engine/ai
```

```bash [pnpm]
pnpm add @gis-engine/engine @gis-engine/ai
```

```bash [CDN]
<script type="module">
  import { createMap } from "https://unpkg.com/@gis-engine/engine";
</script>
```

:::

## 2. Create Your First Map

```typescript
import { createMap, applyCommands } from "@gis-engine/engine";

const map = createMap({
  container: "map",
  spec: {
    version: "0.1",
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.15, 30.28] },
              properties: { name: "Hangzhou" },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "points-layer",
        type: "circle",
        source: "points",
        paint: { "circle-radius": 8, "circle-color": "#3b82f6" },
      },
    ],
    view: { center: [120.15, 30.28], zoom: 12 },
  },
});
```

## 3. Edit with Commands

```typescript
const result = await applyCommands(map, [
  {
    type: "setPaint",
    layerId: "points-layer",
    paint: { "circle-color": "#ef4444" },
  },
]);

console.log(result.status); // "applied"
console.log(result.revision); // "1"
```

## 4. Use AI (MCP)

```typescript
import { createGisEngineMcpServer } from "@gis-engine/ai/mcp";

const server = createGisEngineMcpServer();

// AI agents can now call:
// - validate_spec  → Validate a MapSpec document
// - apply_commands → Edit a map through commands
// - snapshot_spec  → Take a deterministic snapshot
// - export_spec    → Export the current map state
// - explain_spec   → Get a human-readable explanation
// - get_context_summary → Summarize capabilities
// - export_example_app  → Generate an example app manifest
```

## Next Steps

- [Core Concepts](/guide/core-concepts) — understand the architecture
- [Schema-First Design](/guide/schema-first) — learn the schema system
- [MCP Tools](/mcp/overview) — explore all AI tools
