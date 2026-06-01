# @gis-engine/ai

AI and MCP tools for GIS Engine. Seven tools expose engine capabilities to
LLMs with typed `inputSchema` and `outputSchema`.

## Quick Install

```bash
pnpm add @gis-engine/ai
```

## MCP Server

```typescript
import { createGisEngineMcpServer } from "@gis-engine/ai/mcp";

const server = createGisEngineMcpServer();

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Claude Desktop / Cursor Config

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

## MCP Tools

### validate_spec

Validate a MapSpec document.

```typescript
// Input
{ spec: MapSpec }

// Output
{ valid: boolean, diagnostics: Diagnostic[] }
```

### apply_commands

Edit a map through the command system.

```typescript
// Input
{ spec: MapSpec, commands: MapCommand[], dryRun?: boolean }

// Output
{ spec: MapSpec, results: CommandResult[], diagnostics: Diagnostic[] }
```

### export_spec

Export the current map state.

```typescript
// Input
{ spec: MapSpec, commands?: MapCommand[] }

// Output
{ spec: MapSpec }
```

### get_context_summary

Summarize engine capabilities for the current spec.

```typescript
// Input
{ spec: MapSpec, capabilities: CapabilityReport }

// Output
{ summary: ContextSummary }
```

### snapshot_spec

Take a deterministic snapshot of the map.

```typescript
// Input
{ spec: MapSpec }

// Output
{ snapshot: SnapshotResult }
```

### explain_spec

Get a human-readable explanation of a MapSpec.

```typescript
// Input
{ spec: MapSpec }

// Output
{ explanation: string, sections: ExplanationSection[] }
```

### export_example_app

Generate an example app manifest from a MapSpec.

```typescript
// Input
{ spec: MapSpec, manifest: ExampleAppManifest }

// Output
{ manifest: ExampleAppManifest, delivery: ExampleAppDeliverySummary }
```

## Tool Utilities

```typescript
import {
  listGisEngineTools,    // List all tool descriptors
  gisEngineTools,         // Tool name → handler map
  callGisEngineTool,      // Call a tool by name
} from "@gis-engine/ai/mcp";
```

## Generation Evidence

```typescript
import { createGenerationEvidenceBundle } from "@gis-engine/ai";

const bundle = await createGenerationEvidenceBundle({
  promptHash: "sha256:abc123...",
  skeleton: { /* command skeleton */ },
  planner: { plan, confidence },
});

// bundle.ok → boolean
// bundle.evidence → GenerationEvidenceBundle
```

## Workbench Provider

```typescript
import { normalizeWorkbenchProviderPlan } from "@gis-engine/ai";

const plan = normalizeWorkbenchProviderPlan(providerOutput);
// plan.ok → boolean
// plan.result → { provider, plan }
```
