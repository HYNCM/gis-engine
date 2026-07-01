/**
 * Claude Agent Integration — Real MCP Mode
 *
 * Connects Claude Agent SDK to the GIS Engine MCP server via stdio.
 * Requires a valid Claude API key or Claude Code authentication.
 *
 * Prerequisites:
 *   npm install @anthropic-ai/claude-agent-sdk
 *
 * Run:
 *   CLAUDE_API_KEY=your-key npx tsx src/agent-mcp.ts
 *
 * Note: This file requires @anthropic-ai/claude-agent-sdk which is NOT
 * included in the workspace dependencies to keep the example lightweight.
 * Install it manually: npm install @anthropic-ai/claude-agent-sdk
 */

// ─── Option A: Claude Agent SDK with MCP stdio ──────────────────────────────
//
// The Claude Agent SDK spawns a Claude Code subprocess and connects to
// MCP servers defined in the mcpServers option. The GIS Engine MCP server
// is started automatically as a child process.
//
// ```typescript
// import { query } from "@anthropic-ai/claude-agent-sdk";
//
// const GIS_ENGINE_SYSTEM_PROMPT = `You are a GIS mapping assistant powered by
// GIS Engine MCP tools. You help users create, validate, and modify map
// specifications using structured commands.
//
// Available tools:
// - validate_spec: Check a MapSpec for errors
// - apply_commands: Modify a map with commands (addLayer, setPaint, etc.)
// - export_spec: Export a validated MapSpec
// - get_context_summary: Understand current map state and capabilities
// - snapshot_spec: Take a headless snapshot for verification
// - explain_spec: Get a human-readable explanation
// - export_example_app: Generate example app manifests
//
// Workflow:
// 1. Always validate the spec first with validate_spec
// 2. Use get_context_summary to understand capabilities before planning
// 3. Apply changes via apply_commands with structured MapCommand objects
// 4. Verify results with snapshot_spec
// 5. Export the final spec with export_spec
//
// MapSpec structure: { version, id, view, sources, layers }
// MapCommand types: addLayer, removeLayer, setPaint, setLayout, addSource, etc.
// `;
//
// async function runWithMcp() {
//   for await (const message of query({
//     prompt: "Create a map showing earthquake data in Japan",
//     options: {
//       mcpServers: {
//         "gis-engine": {
//           type: "stdio",
//           command: "node",
//           args: ["node_modules/@gis-engine/ai/dist/mcp/server.js"],
//         },
//       },
//       systemPrompt: GIS_ENGINE_SYSTEM_PROMPT,
//       maxTurns: 15,
//       permissionMode: "bypassPermissions",
//       allowedTools: ["mcp__gis-engine__*"],
//     },
//   })) {
//     if (message.type === "assistant") {
//       console.log("Claude:", message.message?.content);
//     }
//     if (message.type === "tool_use") {
//       console.log(`Tool call: ${message.tool} →`, message.input);
//     }
//     if (message.type === "result") {
//       console.log("Final result:", message.result);
//     }
//   }
// }
//
// runWithMcp();
// ```

// ─── Option B: Programmatic tool calling (no Claude binary needed) ──────────
//
// If you cannot install the Claude Agent SDK binary, you can use the
// programmatic API directly with your own LLM calls:
//
// ```typescript
// When installed via npm: import { callGisEngineTool } from "@gis-engine/ai";
// import { callGisEngineTool } from "../../../packages/ai/dist/index.js";
// import Anthropic from "@anthropic-ai/sdk";
//
// const client = new Anthropic(); // needs ANTHROPIC_API_KEY
//
// // 1. Get tool definitions from GIS Engine
// const gisTools = [
//   { name: "validate_spec", description: "Validate a MapSpec", input_schema: ValidateSpecToolInputSchema },
//   // ... other tools
// ];
//
// // 2. Send to Claude with tool definitions
// const response = await client.messages.create({
//   model: "claude-sonnet-4-20250514",
//   max_tokens: 4096,
//   system: GIS_ENGINE_SYSTEM_PROMPT,
//   messages: [{ role: "user", content: "Create a map of Japan earthquakes" }],
//   tools: gisTools,
// });
//
// // 3. Execute tool calls and feed results back
// for (const block of response.content) {
//   if (block.type === "tool_use") {
//     const result = await callGisEngineTool({
//       params: { name: block.name, arguments: block.input },
//     });
//     // Feed result back to Claude...
//   }
// }
// ```

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  GIS Engine × Claude Agent — Real MCP Mode                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  This file shows how to connect Claude Agent SDK to the     ║
║  GIS Engine MCP server. See the source code comments for    ║
║  two integration patterns:                                  ║
║                                                              ║
║  A) Claude Agent SDK with MCP stdio (recommended)           ║
║     - Requires: @anthropic-ai/claude-agent-sdk              ║
║     - Auto-spawns GIS Engine MCP server                     ║
║     - Claude discovers and calls all 7+ tools               ║
║                                                              ║
║  B) Programmatic tool calling with Anthropic SDK            ║
║     - Requires: @anthropic-ai/sdk                           ║
║     - Manual tool call loop                                 ║
║     - Full control over conversation flow                   ║
║                                                              ║
║  For mock mode (no API key), run:                           ║
║    npx tsx src/main.ts                                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
