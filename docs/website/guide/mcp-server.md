# MCP Server Setup

GIS Engine exposes a canonical inventory of 14 tools through a Model Context
Protocol (MCP) server. AI agents like Claude, Cursor, and Copilot can call
them directly. The first seven form the Core lifecycle; the remaining tools
cover authoring extensions and data intelligence.

## Quick Setup

### 1. Install

```bash
pnpm add @gis-engine/ai
```

### 2. Create the server

```typescript
import { createGisEngineMcpServer } from "@gis-engine/ai/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createGisEngineMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 3. Connect your AI agent

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "node",
      "args": ["./node_modules/@gis-engine/ai/dist/mcp/server.js"]
    }
  }
}
```

#### Copilot Chat (VS Code)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "gis-engine": {
      "command": "node",
      "args": ["${workspaceFolder}/node_modules/@gis-engine/ai/dist/mcp/server.js"]
    }
  }
}
```

## What Your AI Can Do

Once connected, your AI agent can:

```
"Validate this MapSpec and fix any errors."
  → validate_spec → diagnostics → apply_commands

"Add a red circle layer for all POIs near Hangzhou."
  → get_context_summary → apply_commands → snapshot_spec

"Export this map as a standalone HTML file."
  → export_spec → export_example_app

"Explain what this map shows."
  → explain_spec → natural language summary
```

## Security

All MCP tools respect:
- **Resource policy** — no unapproved URLs or network access
- **Command-only mutation** — no direct state access
- **Structured diagnostics** — errors are machine-actionable
- **Structured results** — successful calls expose schema-conforming
  `structuredContent` plus JSON text; failures expose `{ diagnostics: [...] }`
  and retain legacy diagnostics text
- **No raw prompt retention** — prompt hashes only in audit trails
- **SceneView3D blocked** — stable 3D requires explicit promotion
