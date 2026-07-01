/**
 * OpenAI Agent Integration — Mock Mode
 *
 * Demonstrates a complete AI agent workflow with GIS Engine MCP tools
 * using OpenAI's function calling pattern. No API key required.
 *
 * This example:
 * 1. Converts GIS Engine MCP tool schemas to OpenAI function definitions
 * 2. Simulates GPT generating tool calls for a map authoring task
 * 3. Executes each tool call via callGisEngineTool
 * 4. Feeds results back into the conversation
 *
 * Run: npx tsx src/main.ts
 */

// When installed via npm: import { callGisEngineTool, listGisEngineTools } from "@gis-engine/ai";
// When running from monorepo:
import { callGisEngineTool, listGisEngineTools } from "../../../packages/ai/dist/index.js";
import type { MapCommand, MapSpec } from "../../../packages/engine/dist/src/index.js";

// ── OpenAI Function Definition Format ────────────────────────────────────────
//
// In real mode, these definitions are sent to GPT as the `tools` parameter.
// Each tool has a name, description, and JSON Schema for parameters.

interface OpenAIFunctionDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Convert GIS Engine MCP tool definitions to OpenAI function calling format.
 * In a real integration, you'd call listGisEngineTools() and transform each
 * tool's inputSchema. Here we define the 5 key tools used in this example.
 */
function getGisEngineFunctions(): OpenAIFunctionDef[] {
  return [
    {
      type: "function",
      function: {
        name: "validate_spec",
        description: "Validate a MapSpec and return diagnostics including source/layer counts.",
        parameters: {
          type: "object",
          properties: {
            spec: { type: "object", description: "The MapSpec to validate" },
          },
          required: ["spec"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "apply_commands",
        description:
          "Apply a series of MapCommands to modify a MapSpec. Commands include addLayer, removeLayer, setPaint, setLayout, addSource, removeSource, setView, setFilter, setInteractions, setCapabilities.",
        parameters: {
          type: "object",
          properties: {
            spec: { type: "object", description: "The base MapSpec" },
            commands: {
              type: "array",
              items: { type: "object" },
              description: "Array of MapCommand objects",
            },
          },
          required: ["spec", "commands"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_context_summary",
        description:
          "Return a compact MapSpec summary with AI orchestration capability boundaries, source readiness, and layer info.",
        parameters: {
          type: "object",
          properties: {
            spec: { type: "object", description: "The MapSpec to summarize" },
          },
          required: ["spec"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "snapshot_spec",
        description:
          "Validate a MapSpec and produce a headless snapshot result without real WebGL. Returns passed/failed status and diagnostics.",
        parameters: {
          type: "object",
          properties: {
            spec: { type: "object", description: "The MapSpec to snapshot" },
          },
          required: ["spec"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "export_spec",
        description: "Return a validated, optionally command-modified MapSpec for export.",
        parameters: {
          type: "object",
          properties: {
            spec: { type: "object", description: "The MapSpec to export" },
            commands: { type: "array", items: { type: "object" } },
            dryRun: { type: "boolean" },
          },
          required: ["spec"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "explain_spec",
        description: "Return a structured AI-facing summary, capability boundaries, and full validation diagnostics.",
        parameters: {
          type: "object",
          properties: {
            spec: { type: "object", description: "The MapSpec to explain" },
          },
          required: ["spec"],
        },
      },
    },
  ];
}

// ── Sample MapSpec ───────────────────────────────────────────────────────────

const baseSpec: MapSpec = {
  version: "0.1",
  id: "japan-earthquakes-openai",
  view: {
    mode: "map2d",
    center: [139.6917, 35.6895],
    zoom: 6,
  },
  sources: {
    earthquakes: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [140.9, 37.1] },
            properties: { magnitude: 7.1, depth: 50, location: "Off Miyagi" },
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [138.4, 35.3] },
            properties: { magnitude: 5.8, depth: 30, location: "Shizuoka" },
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [141.8, 39.0] },
            properties: { magnitude: 6.4, depth: 45, location: "Off Iwate" },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: "earthquake-circles",
      type: "circle",
      source: "earthquakes",
      paint: {
        "circle-radius": 8,
        "circle-color": "#ef4444",
        "circle-opacity": 0.6,
      },
    },
  ],
};

// ── Mock Agent Conversation ──────────────────────────────────────────────────

type MockToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

type MockMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: MockToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

/**
 * Simulates a GPT agent conversation for map authoring.
 * In real mode, GPT would generate the tool_calls based on the function
 * definitions and the user prompt.
 */
function buildMockConversation(): MockMessage[] {
  return [
    {
      role: "system",
      content: `You are a GIS mapping assistant. You create and modify map specifications
using GIS Engine tools. Always validate specs before and after modifications.
Use apply_commands for all mutations — never modify the spec directly.
Available tools: validate_spec, apply_commands, get_context_summary,
snapshot_spec, explain_spec, export_spec.`,
    },
    {
      role: "user",
      content: "Create a map showing earthquake data in Japan with magnitude-based circle sizing and labels.",
    },
    {
      role: "assistant",
      content: "I'll validate the base spec and check the current map state first.",
      tool_calls: [
        { id: "call_001", name: "validate_spec", arguments: { spec: baseSpec } },
        { id: "call_002", name: "get_context_summary", arguments: { spec: baseSpec } },
      ],
    },
    // tool results will be injected by the loop
  ];
}

// Second turn: GPT applies commands based on validation results
const secondTurnToolCalls: MockToolCall[] = [
  {
    id: "call_003",
    name: "apply_commands",
    arguments: {
      spec: baseSpec,
      commands: [
        {
          id: "cmd-set-paint-01",
          version: "0.1",
          type: "setPaint",
          layerId: "earthquake-circles",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["get", "magnitude"], 5, 5, 7, 12, 9, 22],
            "circle-color": ["interpolate", ["linear"], ["get", "magnitude"], 5, "#fbbf24", 6, "#f97316", 7, "#ef4444"],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.8,
          },
        },
        {
          id: "cmd-add-labels-01",
          version: "0.1",
          type: "addLayer",
          layer: {
            id: "earthquake-labels",
            type: "symbol-lite",
            source: "earthquakes",
            layout: {
              "text-field": ["concat", ["get", "location"], " (M", ["get", "magnitude"], ")"],
              "text-size": 11,
              "text-anchor": "top",
              "text-offset": [0, 1.2],
              "text-font": ["Open Sans Regular"],
            },
            paint: {
              "text-color": "#334155",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.5,
            },
          },
        },
      ] satisfies MapCommand[],
    },
  },
];

// Third turn: GPT verifies the result
const thirdTurnToolCalls: MockToolCall[] = [
  { id: "call_004", name: "snapshot_spec", arguments: { spec: baseSpec } },
  { id: "call_005", name: "explain_spec", arguments: { spec: baseSpec } },
  { id: "call_006", name: "export_spec", arguments: { spec: baseSpec } },
];

// ── Agent Loop ───────────────────────────────────────────────────────────────

async function executeToolCalls(calls: MockToolCall[]): Promise<MockMessage[]> {
  const results: MockMessage[] = [];

  for (const call of calls) {
    console.log(`    🔧 GPT calls ${call.name}...`);

    const response = await callGisEngineTool({
      params: { name: call.name, arguments: call.arguments },
    });

    const text = response.content[0]?.text ?? "{}";
    const summary = summarizeResult(call.name, text);

    console.log(`    ✅ ${call.name} → ${summary}`);
    if (response.isError) console.log(`    ⚠️  Error detected`);

    results.push({ role: "tool", tool_call_id: call.id, content: text });
  }

  return results;
}

async function runMockAgentLoop(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  GIS Engine × OpenAI Agent Integration — Mock Mode         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Show available tools
  const { tools } = await listGisEngineTools();
  console.log(`📦 GIS Engine MCP tools: ${tools.map((t) => t.name).join(", ")}`);

  // Show OpenAI function definitions
  const functions = getGisEngineFunctions();
  console.log(`📋 OpenAI function definitions: ${functions.map((f) => f.function.name).join(", ")}\n`);

  const conversation = buildMockConversation();

  // ── Turn 1: Validate + Context Summary ──
  console.log(`${"─".repeat(60)}`);
  console.log("[Turn 1] GPT decides to validate and understand the spec\n");

  const turn1Calls = conversation[2] as Extract<MockMessage, { role: "assistant" }>;
  if (turn1Calls.tool_calls) {
    await executeToolCalls(turn1Calls.tool_calls);
  }

  // ── Turn 2: Apply Commands ──
  console.log(`\n${"─".repeat(60)}`);
  console.log("[Turn 2] GPT applies data-driven styling commands\n");
  console.log('    🤖 "Adding magnitude-based circle sizing and earthquake labels..."');

  await executeToolCalls(secondTurnToolCalls);

  // ── Turn 3: Verify + Export ──
  console.log(`\n${"─".repeat(60)}`);
  console.log("[Turn 3] GPT verifies the result and exports\n");
  console.log('    🤖 "Verifying snapshot and generating final export..."');

  await executeToolCalls(thirdTurnToolCalls);

  // ── Final ──
  console.log(`\n${"─".repeat(60)}`);
  console.log('\n[Final] 🤖 "Map complete! The visualization shows 3 earthquakes across Japan');
  console.log('         with magnitude-proportional circles and location labels."\n');

  console.log("✅ Mock agent loop complete. No OpenAI API calls were made.\n");
  console.log("To use with a real OpenAI API key, see README.md → 'Real API Mode'.\n");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function summarizeResult(toolName: string, text: string): string {
  try {
    const r = JSON.parse(text) as Record<string, unknown>;

    switch (toolName) {
      case "validate_spec":
        return `valid=${r.valid}, sources=${(r.stats as Record<string, unknown>)?.sourceCount ?? "?"}, layers=${(r.stats as Record<string, unknown>)?.layerCount ?? "?"}`;
      case "get_context_summary":
        return `sources=${Array.isArray(r.sources) ? r.sources.length : "?"}, layers=${Array.isArray(r.layers) ? r.layers.length : "?"}`;
      case "apply_commands":
        return `results=${Array.isArray(r.results) ? r.results.length : "?"}, committed=${r.committed}`;
      case "snapshot_spec":
        return `passed=${r.passed}, renderer=${r.renderer}`;
      case "explain_spec":
        return `has_summary=${!!r.summary}, has_validation=${!!r.validation}`;
      case "export_spec":
        return `id=${r.id}, version=${r.version}`;
      default:
        return text.slice(0, 60);
    }
  } catch {
    return text.slice(0, 60);
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

runMockAgentLoop().catch((err) => {
  console.error("Agent loop failed:", err);
  process.exit(1);
});
