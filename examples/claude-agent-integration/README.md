# Claude Agent Integration

Demonstrates how to integrate GIS Engine MCP tools with Claude Agent SDK
for AI-powered map authoring workflows.

## Quick Start (Mock Mode — No API Key Required)

```bash
npx tsx src/main.ts
```

This runs a simulated agent loop that exercises 5 GIS Engine MCP tools
(`validate_spec`, `apply_commands`, `get_context_summary`, `snapshot_spec`,
`explain_spec`) without calling any external API. The mock agent follows a
predefined conversation script showing a realistic tool-calling workflow.

## Real API Mode

### Option A: Claude Agent SDK with MCP (Recommended)

The Claude Agent SDK auto-discovers MCP tools and manages the full agent loop.

```bash
# Install the SDK (not included in workspace deps to keep examples lightweight)
npm install @anthropic-ai/claude-agent-sdk

# Run — requires Claude Code authentication or API key
npx tsx src/agent-mcp.ts
```

The SDK spawns the GIS Engine MCP server as a subprocess:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Create a map showing earthquake data in Japan",
  options: {
    mcpServers: {
      "gis-engine": {
        type: "stdio",
        command: "node",
        args: ["node_modules/@gis-engine/ai/dist/mcp/server.js"],
      },
    },
    systemPrompt: "You are a GIS mapping assistant...",
    maxTurns: 15,
  },
})) {
  console.log(message);
}
```

### Option B: Anthropic SDK with Manual Tool Loop

Use `callGisEngineTool` with the Anthropic Messages API for full control:

```typescript
import { callGisEngineTool } from "@gis-engine/ai";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // ANTHROPIC_API_KEY env var

const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  messages: [{ role: "user", content: "Create a map of Japan earthquakes" }],
  tools: gisEngineToolDefinitions, // from listGisEngineTools()
});

// Execute tool calls and feed results back
for (const block of response.content) {
  if (block.type === "tool_use") {
    const result = await callGisEngineTool({
      params: { name: block.name, arguments: block.input },
    });
    // Feed result back to Claude in next messages.create() call
  }
}
```

See `src/agent-mcp.ts` for complete commented examples of both patterns.

## Expected Workflow

```
User: "Create a map showing earthquake data in Japan"
  │
  ├─ Claude calls validate_spec → spec is valid
  ├─ Claude calls get_context_summary → understands capabilities
  ├─ Claude calls apply_commands → adds magnitude-based styling + labels
  ├─ Claude calls snapshot_spec → verifies rendering
  └─ Claude calls explain_spec → generates summary
  │
  └─ Output: Validated MapSpec with styled earthquake visualization
```

## MCP Server Configuration (Claude Desktop / Cursor)

Add to your MCP client configuration:

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

## Available Tools

| Tool | Purpose |
|------|---------|
| `validate_spec` | Check MapSpec for schema and semantic errors |
| `apply_commands` | Modify map with structured commands |
| `export_spec` | Export validated MapSpec |
| `get_context_summary` | Get map state and AI capability boundaries |
| `snapshot_spec` | Headless snapshot without WebGL |
| `explain_spec` | Human-readable explanation with diagnostics |
| `export_example_app` | Generate example app manifests |
