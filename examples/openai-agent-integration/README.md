# OpenAI Agent Integration

Demonstrates how to integrate GIS Engine MCP tools with OpenAI models
for AI-powered map authoring using function calling and the Agents SDK.

## Quick Start (Mock Mode — No API Key Required)

```bash
npx tsx src/main.ts
```

Runs a simulated agent loop that exercises 6 GIS Engine MCP tools
(`validate_spec`, `apply_commands`, `get_context_summary`, `snapshot_spec`,
`explain_spec`, `export_spec`) using OpenAI's function calling pattern —
without any external API calls.

## Real API Mode

### Pattern 1: OpenAI Responses API + Function Calling (TypeScript)

Convert GIS Engine tool schemas to OpenAI function definitions and run
a standard tool-calling loop:

```bash
npm install openai
OPENAI_API_KEY=sk-... npx tsx src/agent-mcp.ts
```

```typescript
import OpenAI from "openai";
import { callGisEngineTool, listGisEngineTools } from "@gis-engine/ai";

const client = new OpenAI();
const { tools } = await listGisEngineTools();

// Convert MCP schemas → OpenAI function format
const openaiTools = tools.map((t) => ({
  type: "function" as const,
  function: { name: t.name, description: t.description, parameters: t.inputSchema },
}));

// Agent loop
let response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Create a map of Japan earthquakes" }],
  tools: openaiTools,
});

while (response.choices[0]?.message?.tool_calls) {
  // Execute each tool call via callGisEngineTool, feed results back
}
```

See `src/agent-mcp.ts` for the complete implementation.

### Pattern 2: OpenAI Agents SDK + MCP (Python, Recommended)

The Python Agents SDK has first-class MCP support. The GIS Engine MCP server
runs as a subprocess and tools are auto-discovered:

```bash
pip install openai-agents
```

```python
from agents import Agent, Runner
from agents.mcp import MCPServerStdio

async with MCPServerStdio(
    name="GIS Engine",
    params={
        "command": "node",
        "args": ["node_modules/@gis-engine/ai/dist/mcp/server.js"],
    },
    cache_tools_list=True,
) as server:
    agent = Agent(
        name="GIS Assistant",
        instructions="You are a GIS mapping assistant...",
        mcp_servers=[server],
    )
    result = await Runner.run(agent, "Create a map of Japan earthquakes")
```

### Pattern 3: OpenAI Agents SDK TypeScript (Coming Soon)

The TypeScript Agents SDK (announced June 2026) will provide parity with
the Python version including MCP support.

## Expected Workflow

```
User: "Create a map showing earthquake data in Japan"
  │
  ├─ GPT calls validate_spec → spec is valid
  ├─ GPT calls get_context_summary → understands capabilities
  ├─ GPT calls apply_commands → magnitude-based styling + labels
  ├─ GPT calls snapshot_spec → verifies rendering
  ├─ GPT calls explain_spec → generates summary
  └─ GPT calls export_spec → exports final MapSpec
  │
  └─ Output: Validated MapSpec with data-driven earthquake visualization
```

## Key Differences from Claude Integration

| Aspect | Claude Agent SDK | OpenAI |
|--------|-----------------|--------|
| MCP Support | Native via `mcpServers` option | Python SDK: `MCPServerStdio`; TS: function calling |
| Tool Schema | MCP `inputSchema` (JSON Schema) | OpenAI function definitions (JSON Schema) |
| Agent Loop | Managed by SDK (`query()`) | Manual loop or `Runner.run()` (Python) |
| Tool Execution | Automatic | Manual via `callGisEngineTool()` |

## MCP Server Configuration

For direct MCP client use (Cursor, VS Code Copilot, etc.):

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
