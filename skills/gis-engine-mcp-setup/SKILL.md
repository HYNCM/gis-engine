---
name: gis-engine-mcp-setup
description: >
  Install, configure, and use the GIS Engine MCP (Model Context Protocol) server
  for AI coding tools. Use when setting up GIS Engine AI tools in Claude Desktop,
  Cursor, Codex, or other MCP-compatible environments. Covers server installation,
  all 14 MCP tools across Core lifecycle, Authoring extensions, and Data intelligence,
  client configuration templates,
  and step-by-step usage examples.
metadata:
  author: gis-engine
  version: "1.0"
  package: "@gis-engine/ai"
---

# MCP Server Setup Guide

The GIS Engine MCP server exposes 14 tools that let AI agents validate, modify,
summarize, snapshot, export, compare, generate, inspect, query, style, and
transform MapSpec documents and inline GeoJSON using the Model Context Protocol.

## Installation

### Install Packages

```bash
npm install @gis-engine/engine @gis-engine/ai
```

Both packages are required. `@gis-engine/engine` provides the core runtime;
`@gis-engine/ai` provides the MCP server and tool implementations.

### Verify Installation

```bash
node -e "const { createGisEngineMcpServer } = require('@gis-engine/ai/mcp'); console.log('OK');"
```

## MCP Server Configuration

### Claude Desktop

Add to your `claude_desktop_config.json` (typically at `~/.config/claude/claude_desktop_config.json` on macOS/Linux or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "@gis-engine/ai", "mcp"],
      "env": {}
    }
  }
}
```

Or with a local installation:

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "node",
      "args": ["path/to/node_modules/@gis-engine/ai/dist/mcp/server.js"],
      "env": {}
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json` in the project root or global settings):

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "@gis-engine/ai", "mcp"]
    }
  }
}
```

### Codex / Other MCP Clients

Any MCP-compatible client can connect using the stdio transport:

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "@gis-engine/ai", "mcp"]
    }
  }
}
```

### Programmatic Usage (TypeScript)

Install `@modelcontextprotocol/sdk` as a direct dependency when your application
creates and connects the transport itself.

```typescript
import { createGisEngineMcpServer } from "@gis-engine/ai/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createGisEngineMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Available MCP Tools

The server exposes the canonical 14-tool inventory in this `tools/list` order:
`apply_commands`, `validate_spec`, `export_spec`, `get_context_summary`,
`snapshot_spec`, `explain_spec`, `export_example_app`, `diff_specs`,
`generate_spec`, `inspect_data`, `edit_spec`, `query_features`,
`style_recommend`, `transform_data`.

The server targets MCP `2025-11-25`; `inputSchema` and `outputSchema`
descriptors use the JSON Schema draft-07 dialect. Each tool accepts JSON input
and returns schema-conforming `structuredContent` plus a JSON text block.
Execution errors expose `{ diagnostics: [...] }` as structured content while
retaining the legacy diagnostics array in the text block.

Only the seven Core lifecycle tools are documented in detail below. The
additive Authoring tools are `diff_specs`, `generate_spec`, and `edit_spec`;
the Data intelligence tools are `inspect_data`, `query_features`,
`style_recommend`, and `transform_data`. See the
[MCP Tools Overview](../../docs/website/mcp/overview.md) for all 14 descriptor
summaries.

### 1. `validate_spec`

**Purpose**: Validate a MapSpec and return diagnostics.

**Input**:

```json
{
  "spec": {
    "version": "0.1",
    "view": { "center": [0, 0], "zoom": 2 },
    "sources": {},
    "layers": []
  }
}
```

**Output**:

```json
{
  "valid": true,
  "diagnostics": [],
  "stats": { "sourceCount": 0, "layerCount": 0, "visibleLayerCount": 0 }
}
```

**When to use**: After creating or editing a MapSpec, before rendering or exporting.

---

### 2. `apply_commands`

**Purpose**: Apply a series of MapCommands to modify a MapSpec.

**Input**:

```json
{
  "spec": { "version": "0.1", "view": {...}, "sources": {...}, "layers": [...] },
  "commands": [
    {
      "id": "cmd-001",
      "version": "0.1",
      "type": "addLayer",
      "layer": {
        "id": "parks",
        "type": "fill",
        "source": "parks-src",
        "paint": { "fill-color": "#22c55e", "fill-opacity": 0.5 }
      }
    }
  ],
  "dryRun": false,
  "transaction": "atomic"
}
```

**Output**: Returns the updated spec plus per-command results with patches and inverse patches.

**When to use**: To programmatically edit a map — add layers, change styles, update views.

---

### 3. `export_spec`

**Purpose**: Return a validated, optionally command-modified MapSpec. Combines
validation and command application in one call.

**Input**:

```json
{
  "spec": { "version": "0.1", "view": {...}, "sources": {...}, "layers": [...] },
  "commands": [],
  "dryRun": false,
  "traceId": "export-session-1"
}
```

**When to use**: When you want to apply commands and validate the result in a single step.

---

### 4. `get_context_summary`

**Purpose**: Return a compact MapSpec summary plus AI orchestration capability
boundaries. Designed for planning and review workflows.

**Input**:

```json
{
  "spec": { "version": "0.1", "view": {...}, "sources": {...}, "layers": [...] },
  "capabilities": {}
}
```

**Output**: Summary including source count/types, layer count/types, view info,
interaction state, diagnostics, source readiness, PMTiles load plans, cloud-native
source contracts, SceneView3D state, and MCP tool availability.

**When to use**: At the start of an AI session to understand the current spec state,
or before making decisions about edits.

---

### 5. `snapshot_spec`

**Purpose**: Validate a MapSpec and produce a headless snapshot result without
real WebGL. Uses mock or MapLibre adapter for snapshot generation.

**Input**:

```json
{
  "spec": { "version": "0.1", "view": {...}, "sources": {...}, "layers": [...] },
  "renderer": "mock",
  "snapshot": {
    "width": 800,
    "height": 600,
    "format": "png"
  }
}
```

**Output**: Snapshot result with `passed` status, diagnostics, and optional image data.

**When to use**: To verify a spec renders correctly without launching a browser,
or to generate preview images.

---

### 6. `explain_spec`

**Purpose**: Return a structured AI-facing summary, capability boundaries, and
full validation diagnostics. Combines context summary and validation.

**Input**:

```json
{
  "spec": { "version": "0.1", "view": {...}, "sources": {...}, "layers": [...] },
  "capabilities": {}
}
```

**Output**: Combined summary + validation report + diagnostics.

**When to use**: When an AI agent needs a comprehensive overview of a spec's state,
validity, and capability support in one call.

---

### 7. `export_example_app`

**Purpose**: Return a manifest and file list for a bundled example app without
writing files.

**Input**:

```json
{
  "exampleId": "basic-geojson"
}
```

Available example IDs: `basic-geojson`, `ai-map-edit`, `raster-basemap`,
`pmtiles-local`, `vector-tile-url`, `fill-extrusion-lite`.

**Output**: File manifest, delivery summary, generation evidence summary.

**When to use**: To scaffold a working example app or get a reference implementation
for a specific use case.

## Typical Workflow

### 1. Understand the Current Spec

```
Call: get_context_summary(spec)
→ Source types, layer types, view state, readiness, diagnostics
```

### 2. Plan Edits

Based on the summary, plan which commands to apply:

```
Add a new source → addSource command
Style a layer    → setPaint command
Change view      → setView command
```

### 3. Apply and Validate

```
Call: apply_commands(spec, commands)
→ Updated spec with patches

Call: validate_spec(updated_spec)
→ Confirm valid
```

### 4. Export or Snapshot

```
Call: export_spec(spec, commands)
→ Validated final spec

Call: snapshot_spec(spec, renderer: "mock")
→ Preview image
```

## Tool Input/Output Schemas

All tools expose both `inputSchema` and `outputSchema` as required by the MCP
contract. The descriptors use the JSON Schema draft-07 dialect and are
validated with Ajv before execution.

Invalid public MCP input returns the structured error envelope plus the legacy
raw diagnostic array in the JSON text block:

```json
{
  "isError": true,
  "structuredContent": {
    "diagnostics": [
      {
        "severity": "error",
        "code": "SPEC.MISSING_FIELD",
        "message": "must have required property 'spec'",
        "path": "/"
      }
    ]
  },
  "content": [
    {
      "type": "text",
      "text": "[{\"severity\":\"error\",\"code\":\"SPEC.MISSING_FIELD\",\"message\":\"must have required property 'spec'\",\"path\":\"/\"}]"
    }
  ]
}
```

## Environment Variables

The MCP server does not require any environment variables for basic operation.
However, if you use it alongside the CLI generate pipeline, you may need:

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek provider for AI generation |
| `OPENAI_API_KEY` | OpenAI provider for AI generation |
| `GIS_ENGINE_API_KEY` | Provider-agnostic API key override |

## Troubleshooting

| Issue | Solution |
|---|---|
| Server not found | Ensure `@gis-engine/ai` is installed: `npm install @gis-engine/ai` |
| Tool returns schema error | Check that call against its descriptor: lifecycle, diff, and edit tools use MapSpec fields; data tools use `geojson`; `generate_spec` uses `intent`; `export_example_app` uses `exampleId`. |
| Snapshot blank canvas | Verify layers have visible data and non-transparent styles. |
| Version mismatch | Ensure `@gis-engine/engine` and `@gis-engine/ai` are the same major version. |
| MapLibre not found | Install the peer dependency: `npm install maplibre-gl` |

## Tips

- Use `get_context_summary` first in any AI session to understand the spec state.
- Prefer `apply_commands` over direct spec mutation for auditability.
- Use `validate_spec` after every edit before rendering.
- Use `snapshot_spec` with `renderer: "mock"` for fast CI validation.
- Use `export_example_app` to get working reference code for any supported pattern.
