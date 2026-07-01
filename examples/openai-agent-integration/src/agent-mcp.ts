/**
 * OpenAI Agent Integration — Real API Mode
 *
 * Two integration patterns for connecting OpenAI models to GIS Engine tools:
 *
 * 1. OpenAI Agents SDK with MCP (Python — recommended for production)
 * 2. OpenAI Responses API with function calling (TypeScript)
 *
 * Prerequisites:
 *   npm install openai              # TypeScript SDK
 *   # or: pip install openai-agents # Python SDK
 *
 * Environment:
 *   OPENAI_API_KEY=sk-...
 *
 * Run:
 *   npx tsx src/agent-mcp.ts
 */

// When installed via npm: import { callGisEngineTool, listGisEngineTools } from "@gis-engine/ai";
// When running from monorepo:
import { listGisEngineTools } from "../../../packages/ai/dist/index.js";

// ─── Pattern 1: OpenAI Responses API with Function Calling (TypeScript) ─────
//
// Convert GIS Engine MCP tool schemas to OpenAI function definitions,
// then run a standard tool-calling loop.
//
// ```typescript
// import OpenAI from "openai";
//
// const client = new OpenAI(); // OPENAI_API_KEY env var
//
// // 1. Convert GIS Engine tools to OpenAI function format
// const { tools } = await listGisEngineTools();
// const openaiTools = tools.map((tool) => ({
//   type: "function" as const,
//   function: {
//     name: tool.name,
//     description: tool.description,
//     parameters: tool.inputSchema,
//   },
// }));
//
// // 2. Initial request with tools
// const messages = [
//   {
//     role: "system",
//     content: `You are a GIS mapping assistant. Create and modify map
// specifications using GIS Engine tools. Always validate before and after
// changes. Use apply_commands for mutations.`,
//   },
//   {
//     role: "user",
//     content: "Create a map showing earthquake data in Japan",
//   },
// ];
//
// let response = await client.chat.completions.create({
//   model: "gpt-4o",
//   messages,
//   tools: openaiTools,
// });
//
// // 3. Agent loop: execute tool calls, feed results back
// while (response.choices[0]?.message?.tool_calls) {
//   const assistantMessage = response.choices[0].message;
//   messages.push(assistantMessage);
//
//   for (const toolCall of assistantMessage.tool_calls) {
//     const args = JSON.parse(toolCall.function.arguments);
//     const result = await callGisEngineTool({
//       params: { name: toolCall.function.name, arguments: args },
//     });
//
//     messages.push({
//       role: "tool",
//       tool_call_id: toolCall.id,
//       content: result.content[0]?.text ?? "{}",
//     });
//   }
//
//   response = await client.chat.completions.create({
//     model: "gpt-4o",
//     messages,
//     tools: openaiTools,
//   });
// }
//
// console.log("Final response:", response.choices[0].message.content);
// ```

// ─── Pattern 2: OpenAI Agents SDK with MCP (Python) ─────────────────────────
//
// The Python Agents SDK has first-class MCP support via MCPServerStdio.
// It auto-discovers tools from the GIS Engine MCP server.
//
// ```python
// import asyncio
// from agents import Agent, Runner
// from agents.mcp import MCPServerStdio
//
// async def main():
//     async with MCPServerStdio(
//         name="GIS Engine",
//         params={
//             "command": "node",
//             "args": ["node_modules/@gis-engine/ai/dist/mcp/server.js"],
//         },
//         cache_tools_list=True,
//     ) as server:
//         agent = Agent(
//             name="GIS Assistant",
//             instructions="""You are a GIS mapping assistant. Use GIS Engine
//             MCP tools to create, validate, and modify map specifications.
//             Always validate specs before and after modifications.
//             Use apply_commands for all map mutations.""",
//             mcp_servers=[server],
//         )
//
//         result = await Runner.run(
//             agent,
//             "Create a map showing earthquake data in Japan "
//             "with magnitude-based circle sizing and labels.",
//         )
//         print(result.final_output)
//
// asyncio.run(main())
// ```

// ─── Pattern 3: OpenAI Agents SDK TypeScript (coming soon) ──────────────────
//
// The TypeScript Agents SDK (announced June 2026) will have parity with
// the Python SDK including MCP support. When available:
//
// ```typescript
// import { Agent, Runner } from "openai-agents";
// import { MCPServerStdio } from "openai-agents/mcp";
//
// const server = new MCPServerStdio({
//   name: "GIS Engine",
//   command: "node",
//   args: ["node_modules/@gis-engine/ai/dist/mcp/server.js"],
// });
//
// const agent = new Agent({
//   name: "GIS Assistant",
//   instructions: "You are a GIS mapping assistant...",
//   mcpServers: [server],
// });
//
// const result = await Runner.run(agent, "Create a map of Japan earthquakes");
// console.log(result.finalOutput);
// ```

// ── Demo: Show available tools and their OpenAI-compatible schemas ───────────

async function demo(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  GIS Engine × OpenAI Agent — Integration Patterns          ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║                                                              ║");
  console.log("║  This file documents 3 integration patterns:                ║");
  console.log("║                                                              ║");
  console.log("║  1. OpenAI Responses API + function calling (TypeScript)    ║");
  console.log("║     - Convert MCP tool schemas → OpenAI function defs      ║");
  console.log("║     - Manual agent loop with callGisEngineTool             ║");
  console.log("║     - Requires: npm install openai                         ║");
  console.log("║                                                              ║");
  console.log("║  2. OpenAI Agents SDK + MCP stdio (Python, recommended)     ║");
  console.log("║     - MCPServerStdio auto-discovers all tools              ║");
  console.log("║     - Managed agent loop via Runner.run()                  ║");
  console.log("║     - Requires: pip install openai-agents                  ║");
  console.log("║                                                              ║");
  console.log("║  3. OpenAI Agents SDK TypeScript (coming soon)             ║");
  console.log("║     - Same API as Python version                           ║");
  console.log("║     - Requires: npm install openai-agents                  ║");
  console.log("║                                                              ║");
  console.log("║  For mock mode (no API key), run:                          ║");
  console.log("║    npx tsx src/main.ts                                      ║");
  console.log("║                                                              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const { tools } = await listGisEngineTools();
  console.log("Available GIS Engine tools for OpenAI function calling:\n");

  for (const tool of tools) {
    console.log(`  📋 ${tool.name}`);
    console.log(`     ${tool.description}`);
    console.log();
  }
}

demo().catch(console.error);
