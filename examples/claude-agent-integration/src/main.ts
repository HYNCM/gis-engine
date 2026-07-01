/**
 * Claude Agent Integration — Mock Mode
 *
 * Demonstrates a complete AI agent workflow with GIS Engine MCP tools
 * without requiring a real Claude API key. The mock agent loop simulates
 * Claude's tool-calling behavior through a predefined conversation script.
 *
 * Run: npx tsx src/main.ts
 */

// When installed via npm: import { callGisEngineTool, listGisEngineTools } from "@gis-engine/ai";
// When running from monorepo:
import { callGisEngineTool, listGisEngineTools } from "../../../packages/ai/dist/index.js";
import type { MapCommand, MapSpec } from "../../../packages/engine/dist/src/index.js";

// ── Sample MapSpec: Earthquake map of Japan ────────────────────────────────

const initialSpec: MapSpec = {
  version: "0.1",
  id: "japan-earthquakes",
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
        "circle-radius": 10,
        "circle-color": "#ef4444",
        "circle-opacity": 0.7,
      },
    },
  ],
};

// ── Mock Agent Conversation Script ───────────────────────────────────────────

type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

type AgentStep = {
  role: "user" | "assistant";
  content?: string;
  toolCalls?: ToolCall[];
};

const conversation: AgentStep[] = [
  {
    role: "user",
    content: "Create a map showing earthquake data in Japan with magnitude-based sizing.",
  },
  {
    role: "assistant",
    content: "I'll start by validating the initial spec and understanding what capabilities are available.",
    toolCalls: [
      { name: "validate_spec", arguments: { spec: initialSpec } },
      { name: "get_context_summary", arguments: { spec: initialSpec } },
    ],
  },
  {
    role: "assistant",
    content: "Good — the base spec is valid. Now I'll add data-driven circle sizing by magnitude and a label layer.",
    toolCalls: [
      {
        name: "apply_commands",
        arguments: {
          spec: initialSpec,
          commands: [
            {
              id: "cmd-set-paint-01",
              version: "0.1",
              type: "setPaint",
              layerId: "earthquake-circles",
              paint: {
                "circle-radius": ["interpolate", ["linear"], ["get", "magnitude"], 5, 6, 7, 14, 9, 24],
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "magnitude"],
                  5,
                  "#fbbf24",
                  6,
                  "#f97316",
                  7,
                  "#ef4444",
                ],
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
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
                  "text-field": ["concat", ["get", "magnitude"], " — ", ["get", "location"]],
                  "text-size": 12,
                  "text-anchor": "top",
                  "text-offset": [0, 1.5],
                },
                paint: {
                  "text-color": "#1e293b",
                  "text-halo-color": "#ffffff",
                  "text-halo-width": 1,
                },
              },
            },
          ] satisfies MapCommand[],
        },
      },
    ],
  },
  {
    role: "assistant",
    content: "Commands applied. Let me snapshot the result and explain the final spec.",
    toolCalls: [
      {
        name: "snapshot_spec",
        arguments: {
          spec: initialSpec, // In a real agent, this would be the updated spec from apply_commands
        },
      },
      {
        name: "explain_spec",
        arguments: { spec: initialSpec },
      },
    ],
  },
  {
    role: "assistant",
    content:
      "The map is ready. It shows 3 earthquakes across Japan with magnitude-proportional circles and labels. Here is the validated bundle.",
  },
];

// ── Agent Loop Executor ──────────────────────────────────────────────────────

async function runMockAgentLoop(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  GIS Engine × Claude Agent Integration — Mock Mode         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Step 0: List available tools
  const { tools } = await listGisEngineTools();
  console.log(`📦 Available MCP tools: ${tools.map((t) => t.name).join(", ")}\n`);

  let turnIndex = 0;

  for (const step of conversation) {
    turnIndex++;
    const prefix = step.role === "user" ? "👤 User" : "🤖 Claude";

    console.log(`${"─".repeat(60)}`);
    console.log(`[${turnIndex}] ${prefix}:`);

    if (step.content) {
      console.log(`    ${step.content}\n`);
    }

    if (step.toolCalls) {
      for (const call of step.toolCalls) {
        console.log(`    🔧 Calling ${call.name}...`);

        const result = await callGisEngineTool({
          params: { name: call.name, arguments: call.arguments },
        });

        const text = result.content[0]?.text ?? "(empty)";
        const parsed = safeJsonParse(text);

        // Print a compact summary of each tool result
        console.log(`    ✅ ${call.name} → ${summarizeToolResult(call.name, parsed)}`);
        if (result.isError) {
          console.log(`    ⚠️  Error: ${text.slice(0, 200)}`);
        }
      }
      console.log();
    }
  }

  console.log(`${"─".repeat(60)}`);
  console.log("\n✅ Mock agent loop complete. No external API calls were made.\n");
  console.log("To use with a real Claude API key, see README.md → 'Real API Mode'.\n");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function summarizeToolResult(toolName: string, result: unknown): string {
  if (typeof result !== "object" || result === null) return String(result).slice(0, 80);

  const r = result as Record<string, unknown>;

  switch (toolName) {
    case "validate_spec":
      return `valid=${r.valid}, diagnostics=${Array.isArray(r.diagnostics) ? r.diagnostics.length : "?"}`;

    case "get_context_summary":
      return `sources=${Array.isArray(r.sources) ? r.sources.length : "?"}, layers=${Array.isArray(r.layers) ? r.layers.length : "?"}`;

    case "apply_commands":
      return `commands=${Array.isArray(r.results) ? r.results.length : "?"}, committed=${r.committed}`;

    case "snapshot_spec":
      return `passed=${r.passed}, renderer=${r.renderer}`;

    case "explain_spec":
      return `has summary=${!!r.summary}, has validation=${!!r.validation}`;

    case "export_spec":
      return `id=${r.id}, version=${r.version}`;

    case "export_example_app":
      return `exampleId=${r.exampleId}, files=${Array.isArray(r.files) ? r.files.length : "?"}`;

    default:
      return JSON.stringify(r).slice(0, 80);
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

runMockAgentLoop().catch((err) => {
  console.error("Agent loop failed:", err);
  process.exit(1);
});
