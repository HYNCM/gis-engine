# MCP Setup Guides

Step-by-step configuration guides for connecting GIS Engine MCP tools to
popular AI-powered development environments.

## Prerequisites

- **Node.js** >= 22.13.0
- **pnpm** >= 11 (or npm from the supported Node.js release)
- Network access to download `@gis-engine/ai` from npm (or a local install)

## Quick Reference

| Item | Value |
|------|-------|
| npm package | `@gis-engine/ai` |
| Bin command | `gis-engine-mcp` |
| Transport | stdio |
| Tools | 14 (see [Available Tools](#available-tools)) |
| MCP protocol | `2025-11-25` |
| Descriptor dialect | JSON Schema draft-07 |

---

## Claude Desktop

Claude Desktop reads a JSON config file to discover MCP servers.

### 1. Locate the config file

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

### 2. Add the GIS Engine server

Open the config file and add the `gis-engine` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "gis-engine-mcp"]
    }
  }
}
```

> **Local project alternative:** If you have `@gis-engine/ai` installed in a
> project, point directly to the built server to avoid downloading on every
> launch:
>
> ```json
> {
>   "mcpServers": {
>     "gis-engine": {
>       "command": "node",
>       "args": ["/absolute/path/to/project/node_modules/@gis-engine/ai/dist/mcp/server.js"]
>     }
>   }
> }
> ```

### 3. Restart Claude Desktop

Quit Claude Desktop completely and reopen it. The GIS Engine tools should
appear in the tool picker when you start a new conversation.

---

## Cursor

Cursor supports MCP servers through its settings UI or a project-level config
file.

### Option A: Project-level config

Create or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "gis-engine-mcp"]
    }
  }
}
```

### Option B: Global settings

1. Open **Cursor → Settings → MCP** (or press `Cmd/Ctrl + Shift + P` and
   search for "MCP").
2. Click **Add new global MCP server config**.
3. Paste the same JSON block above.
4. Save and restart Cursor.

### Verify

Open a chat in Agent mode and ask:

> "Use the validate_spec tool to check this MapSpec: `{"version":"0.1","view":{"center":[0,0],"zoom":2},"sources":{},"layers":[]}`"

You should receive a structured validation report in the response.

---

## VS Code (GitHub Copilot)

VS Code supports MCP servers through the `settings.json` configuration when
using GitHub Copilot Chat with agent mode enabled.

### 1. Open settings

Press `Cmd/Ctrl + Shift + P` and select **Preferences: Open Settings (JSON)**.

### 2. Add the MCP server configuration

```json
{
  "mcp": {
    "servers": {
      "gis-engine": {
        "command": "npx",
        "args": ["-y", "gis-engine-mcp"]
      }
    }
  }
}
```

> You can also place this in a workspace-level `.vscode/settings.json` to scope
> the server to a specific project.

### 3. Restart VS Code

After saving the settings, restart VS Code. Open Copilot Chat in **Agent**
mode to use the GIS Engine tools.

---

## Claude Code (CLI)

Claude Code is Anthropic's command-line AI agent. It supports MCP servers via
the `claude mcp add` command.

### 1. Add the GIS Engine MCP server

```bash
claude mcp add gis-engine -- npx -y gis-engine-mcp
```

### 2. Verify

```bash
claude mcp list
```

You should see `gis-engine` in the output. Start a Claude Code session and
ask it to call any GIS Engine tool — the agent will discover all 14 tools
automatically.

### Scope

By default, `claude mcp add` registers the server for the current project. To
add it globally for all projects:

```bash
claude mcp add gis-engine -s user -- npx -y gis-engine-mcp
```

---

## Windsurf

Windsurf supports MCP servers through its Cascade settings.

### 1. Open MCP settings

Go to **Windsurf → Settings → MCP** or open the MCP configuration panel from
the Cascade sidebar.

### 2. Add the server

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "gis-engine-mcp"]
    }
  }
}
```

### 3. Restart Windsurf

Reload the editor to pick up the new server configuration.

---

## Verify Setup

Regardless of which AI tool you use, verify the connection with these steps:

### 1. Check the server starts

Run the command directly in a terminal:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx -y gis-engine-mcp
```

You should see a JSON response listing 14 tools.

### 2. Test validate_spec

Ask your AI tool to call `validate_spec` with a minimal MapSpec:

```json
{
  "version": "0.1",
  "view": { "center": [0, 0], "zoom": 2 },
  "sources": {},
  "layers": []
}
```

Expected result: a validation report with `valid: true` and an empty
`diagnostics` array.

### 3. Test generate_spec

Ask your AI tool to call `generate_spec`:

```json
{
  "intent": {
    "description": "A world map showing country boundaries with a dark theme",
    "dataType": "vector-tiles",
    "zoom": 2,
    "theme": "dark"
  }
}
```

Expected result: a generated MapSpec skeleton with suggestions for improvement.

---

## Available Tools

Canonical `tools/list` order: `apply_commands`, `validate_spec`, `export_spec`,
`get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`,
`diff_specs`, `generate_spec`, `inspect_data`, `edit_spec`, `query_features`,
`style_recommend`, `transform_data`.

| Tool | Description |
|------|-------------|
| `apply_commands` | Apply MapCommands to modify a MapSpec (supports dry-run and transactions) |
| `validate_spec` | Validate a MapSpec against the schema and return diagnostics |
| `export_spec` | Export a validated, optionally command-modified MapSpec |
| `get_context_summary` | Return a compact summary with capability boundaries for planning |
| `snapshot_spec` | Produce a headless snapshot (mock or MapLibre renderer) |
| `explain_spec` | Return a structured explanation with capability boundaries and diagnostics |
| `export_example_app` | Return a manifest and file list for a bundled example app |
| `diff_specs` | Compare two MapSpecs and generate the commands to transform one into the other |
| `generate_spec` | Generate a MapSpec skeleton from a natural language description |
| `inspect_data` | Inspect GeoJSON data structure, properties, geometry types, and bounds |
| `edit_spec` | Edit a MapSpec using natural language instructions |
| `query_features` | Query inline GeoJSON by point or bounding box |
| `style_recommend` | Recommend data-driven styles from inline GeoJSON |
| `transform_data` | Filter, aggregate, select, sort, or rename inline GeoJSON |

Every tool exposes both `inputSchema` and `outputSchema` for schema-aware AI
clients. See the [MCP Tools Overview](./overview.md) for all 14 descriptors and
use the Core lifecycle tool pages for detailed parameter and response
documentation for the seven currently published reference pages.

---

## AI Agent Usage

GIS Engine MCP tools are designed for AI Agent consumption. Once configured,
your AI tool automatically discovers all 14 tools and calls them when
appropriate. This section shows common workflows and prompt patterns.

### How the AI Agent Sees Your Tools

After MCP is configured, the agent sees each tool with its name, description,
and JSON Schema for inputs and outputs. The agent decides which tool to call
based on your natural language request — you do not need to specify tool names
explicitly, though doing so can improve precision.

### Common Workflows

**1. Generate a map from description**

The agent calls `generate_spec`, then typically `validate_spec` to confirm the
result:

> "Generate a map showing world country boundaries with a dark theme, using
> vector tiles, centered at zoom level 2. Then validate the result and fix any
> issues."

**2. Inspect data, then build a visualization**

A two-step workflow where the agent first understands the data, then creates
the map:

> "Here is a GeoJSON of earthquake events from the past week. First inspect
> the data to understand its structure and bounds, then generate a heatmap
> layer configuration that highlights high-magnitude clusters."

The agent will call `inspect_data` first, then `generate_spec` or
`edit_spec` with the insights.

**3. Edit an existing map through conversation**

The agent uses `edit_spec` to apply changes described in natural language:

> "Take this MapSpec and make three changes: add a circle layer for the
> 'earthquakes' source with radius proportional to magnitude, change the base
> map style to dark, and zoom to center [−122.4, 37.8] at zoom 8."

**4. Compare two map versions**

The agent calls `diff_specs` to produce a structured diff and the commands
needed to transform one spec into another:

> "I have two versions of our dashboard map spec. Compare them and show me
> exactly what changed — new layers, removed sources, modified paint
> properties."

**5. Scaffold an example app**

The agent calls `export_example_app` to retrieve a runnable example manifest:

> "Give me the 'basic-geojson' example app so I can use it as a starting
> point."

### Prompt Template: Iterative Map Authoring

A recommended workflow for building maps from scratch:

```
Step 1 — Generate:  "Generate a MapSpec for [description]. Include [layers]."
Step 2 — Validate:  "Validate the spec and list any warnings or errors."
Step 3 — Inspect:   "Explain what this map will look like — layers, data
                      sources, and any capability limitations."
Step 4 — Refine:    "Edit the spec to [change]. Keep other layers unchanged."
Step 5 — Snapshot:  "Take a mock snapshot to verify the layout."
Step 6 — Export:    "Export the final MapSpec for deployment."
```

Each step builds on the previous output. The agent threads the MapSpec through
each tool call automatically.

### Prompt Template: Data-Driven Styling

When working with real datasets:

```
"I have a GeoJSON dataset at [URL / pasted below].
 1. Use inspect_data to analyze its structure, property types, and bounds.
 2. Based on the analysis, generate a MapSpec with appropriate layers.
 3. Apply data-driven styling: color features by the '[property]' field
    using a [ramp/categorical] scale.
 4. Validate the result and fix any schema errors."
```

### Prompt Template: Map Comparison and Migration

When upgrading or comparing map configurations:

```
"Here are two MapSpecs — our current production map and a proposed new version.
 1. Use diff_specs to compare them.
 2. Summarize: what layers were added, removed, or modified?
 3. Generate the apply_commands payload to migrate from current to proposed.
 4. Do a dry-run to verify the migration won't break anything."
```

### Tips for Better AI Agent Results

- **Be specific about layers and sources.** Instead of "make a nice map",
  describe the data source type (GeoJSON, vector tiles, raster) and the layer
  types you want (circle, fill, line, heatmap).
- **Reference tool names when precision matters.** Saying "use `edit_spec` to
  add a filter" is more reliable than "change the map" when multiple edit
  paths exist.
- **Ask for dry-run first.** When using `apply_commands`, add "do a dry-run
  first" to preview changes before committing.
- **Iterate in small steps.** Break complex map edits into 2–3 focused
  instructions rather than one large paragraph.
- **Use `get_context_summary` before editing.** When working with a large
  existing MapSpec, ask the agent to summarize it first so it understands the
  current state before making changes.

---

## Security Notes

The MCP server runs **entirely in-process** via stdio — no network server is
started and no data leaves your machine.

| Concern | Detail |
|---------|--------|
| Filesystem access | None. Tools operate on in-memory MapSpec objects only. |
| Network requests | None by default. The server does not fetch remote URLs. |
| Code execution | None. `export_example_app` returns a manifest, not executable code. |
| Data sent to third parties | None. All processing is local. |
| Resource policy | When a MapSpec references external URLs (tile servers, PMTiles), the engine validates them against `resource-policy.ts`. Untrusted domains are blocked. |

The MCP server is safe to enable globally in your AI tool configuration.

---

## Troubleshooting

### "Command not found: gis-engine-mcp"

- Ensure **Node.js >= 20** is installed: `node --version`
- Ensure **npm >= 7** is installed: `npm --version`
- Try clearing the npx cache: `npx clear-npx-cache` or delete
  `~/.npm/_npx/`
- If using a custom Node.js version manager (nvm, fnm, volta), make sure the
  active version is set in your shell profile so the AI tool's subprocess
  inherits it.

### "Tools not showing up"

- **Restart** the AI tool completely after editing the config.
- Check that the `mcpServers` key is at the correct nesting level in your
  config file (see the examples above — each tool has slightly different
  structure).
- In Claude Desktop, the MCP server must be configured in
  `claude_desktop_config.json`, not in a project-level file.

### "Permission denied" or EACCES errors

- The npx cache directory may have restricted permissions. Fix with:
  ```bash
  chmod -R 755 ~/.npm/_npx
  ```
- On macOS, ensure your terminal or AI tool has permission to run executables
  from the npm cache.

### Server starts but returns errors

- Verify the `@gis-engine/ai` package downloaded correctly:
  ```bash
  npx -y gis-engine-mcp --version 2>/dev/null || echo "bin check failed"
  ```
- Check for peer dependency issues — `@gis-engine/ai` depends on
  `@gis-engine/engine`, which is bundled in the published package.

### Network or proxy issues

- If you're behind a corporate proxy, configure npm:
  ```bash
  npm config set proxy http://your-proxy:port
  npm config set https-proxy http://your-proxy:port
  ```
- Alternatively, install the package locally and use the direct `node` path
  shown in the [Claude Desktop local project alternative](#2-add-the-gis-engine-server).

---

## Programmatic Usage

If you need to embed the MCP server in your own application instead of using
an AI tool's built-in MCP client:

```typescript
import { createGisEngineMcpServer } from "@gis-engine/ai/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createGisEngineMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

See the [mcp-server-setup example](https://github.com/HYNCM/gis-engine/tree/main/examples/mcp-server-setup)
for a complete working project.
