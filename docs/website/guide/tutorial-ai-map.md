# AI-Assisted Map Creation

This tutorial shows how to use GIS Engine's AI tools to generate, validate,
and render maps from natural language descriptions — no manual MapSpec authoring
required.

## Prerequisites

- Node.js 22+ and npm/pnpm installed
- A working GIS Engine project (see [Quick Start](/guide/quick-start))
- `@gis-engine/ai` installed: `npm install @gis-engine/ai`

## Overview: The AI Generation Pipeline

```
Prompt → planMapGenerationRequest → generateSpecTool → validateSpec → createMap → exportSpec
```

Each stage is deterministic and auditable. The tools produce structured
diagnostics, not opaque errors.

## Step 1: Set Up the MCP Server (Optional)

If you want AI agents (Claude, Cursor, Copilot) to call these tools
automatically, set up the MCP server first. See [MCP Server Setup](/guide/mcp-server)
for full instructions.

Quick summary — add to your editor's MCP config:

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "node",
      "args": ["node_modules/@gis-engine/ai/dist/mcp/server.js"]
    }
  }
}
```

For this tutorial, we'll call the tools directly from TypeScript.

## Step 2: Generate a MapSpec from a Prompt

The `generateSpecTool` takes an intent object and returns a complete, validated
MapSpec:

```typescript
import { generateSpecTool } from "@gis-engine/ai";
import { createMap, validateSpec } from "@gis-engine/engine";

const response = generateSpecTool({
  intent: {
    description: "Show parks in Hangzhou with green fill and major roads as orange lines",
    dataType: "geojson",
    theme: "light",
    center: [120.15, 30.27],
    zoom: 12,
  },
});

if (!response.ok) {
  console.error("Generation failed:");
  for (const d of response.diagnostics) {
    console.error(`  [${d.severity}] ${d.code}: ${d.message}`);
  }
  throw new Error("Spec generation failed.");
}

const { spec, diagnostics, suggestions } = response.result;

console.log(`Generated spec: ${spec.id ?? "(auto)"}`);
console.log(`Sources: ${Object.keys(spec.sources).length}`);
console.log(`Layers: ${spec.layers.length}`);

for (const d of diagnostics) {
  console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
}

for (const s of suggestions) {
  console.log(`  Suggestion: ${s}`);
}
```

### Intent Options

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string` | **Required.** Natural language description of the map |
| `dataType` | `"geojson"` \| `"vector-tiles"` \| `"raster"` | Data source type |
| `center` | `[number, number]` | Map center as `[lng, lat]` |
| `zoom` | `number` | Initial zoom level |
| `theme` | `"dark"` \| `"light"` \| `"satellite"` \| `"ocean"` \| `"forest"` \| `"warm"` | Color theme |
| `dataProperty` | `string` | Feature property for data-driven styling |
| `multiLayer` | `boolean` | Generate multiple layers |

## Step 3: Validate the Generated Spec

Always validate before rendering. `validateSpec` runs the full TypeBox schema
check and returns structured diagnostics:

```typescript
const report = validateSpec(spec);

console.log(`Valid: ${report.valid}`);
console.log(`Sources: ${report.stats.sourceCount}, Layers: ${report.stats.layerCount}`);

if (!report.valid) {
  for (const d of report.diagnostics) {
    console.error(`  [${d.severity}] ${d.code}: ${d.message}`);
    if (d.fix) console.error(`  Fix: ${d.fix}`);
  }
  throw new Error("Cannot render an invalid spec.");
}
```

If validation fails, the `diagnostics` array contains `code`, `path`, and
optional `fix` fields that tell you exactly what to correct.

## Step 4: Render the Map

Once validated, render with `createMap()`:

```typescript
import "maplibre-gl/dist/maplibre-gl.css";

async function main(): Promise<void> {
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  const runtime = await createMap(container, spec, { renderer: "maplibre" });
  console.log("Map rendered successfully.");
}

void main().catch(console.error);
```

## Step 5: Edit the Map with AI

Use `editSpecTool` to make natural-language edits to an existing spec.
The tool returns the modified spec along with the commands it applied:

```typescript
import { editSpecTool } from "@gis-engine/ai";

const editResponse = editSpecTool({
  spec,
  instruction: "Change the park fill color to dark green and increase road line width to 5",
});

if (editResponse.ok) {
  const { spec: updatedSpec, commands, summary } = editResponse.result;

  console.log(`Edit summary: ${summary}`);
  console.log(`Commands applied: ${commands.length}`);

  // Re-render with the updated spec
  const runtime = await createMap(
    document.getElementById("map")!,
    updatedSpec,
    { renderer: "maplibre" }
  );
}
```

### Using `applyCommands` Directly

For precise control, use the command system directly:

```typescript
import { applyCommands } from "@gis-engine/engine";

const result = applyCommands(spec, [
  {
    type: "setPaint",
    layerId: "park-fill",
    paint: { "fill-color": "#166534", "fill-opacity": 0.6 },
  },
  {
    type: "setView",
    view: { center: [120.15, 30.27], zoom: 13 },
  },
]);

if (result.committed) {
  console.log("Changes applied. New revision:", result.spec.revision);
  // Use result.inverseCommands to rollback
}
```

## Step 6: Export the Final Result

After rendering, export the current spec for persistence or sharing:

```typescript
const exported = runtime.exportSpec();
console.log(JSON.stringify(exported, null, 2));
```

## Full Working Example

Putting it all together in a single file:

```typescript
import "maplibre-gl/dist/maplibre-gl.css";
import { generateSpecTool, editSpecTool } from "@gis-engine/ai";
import { createMap, validateSpec } from "@gis-engine/engine";

async function main(): Promise<void> {
  // 1. Generate
  const gen = generateSpecTool({
    intent: {
      description: "A map of Hangzhou West Lake area with parks and walking paths",
      dataType: "geojson",
      theme: "forest",
      center: [120.15, 30.25],
      zoom: 13,
    },
  });
  if (!gen.ok) throw new Error("Generation failed.");

  let { spec } = gen.result;

  // 2. Validate
  const report = validateSpec(spec);
  if (!report.valid) throw new Error("Invalid spec.");

  // 3. Render
  const container = document.getElementById("map")!;
  let runtime = await createMap(container, spec, { renderer: "maplibre" });

  // 4. Edit
  const edit = editSpecTool({
    spec,
    instruction: "Add labels showing park names",
  });
  if (edit.ok) {
    spec = edit.result.spec;
    runtime = await createMap(container, spec, { renderer: "maplibre" });
  }

  // 5. Export
  const finalSpec = runtime.exportSpec();
  console.log("Final spec:", JSON.stringify(finalSpec, null, 2));
}

void main().catch(console.error);
```

## What's Next

- [Build a Choropleth Map](/guide/tutorial-choropleth) — create data-driven styling maps
- [Interactive Map with Events](/guide/tutorial-interactive-map) — add click handlers and hover effects
- [MCP Tools Reference](/mcp/overview) — all 7 tools with input/output schemas
- [Natural Language Editing](/guide/nl-editing) — deeper dive into AI-driven editing
