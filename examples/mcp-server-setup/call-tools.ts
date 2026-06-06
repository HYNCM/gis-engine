import { callGisEngineTool } from "@gis-engine/ai";
import mapSpec from "./map.json" with { type: "json" };

// 1. Validate the spec
console.log("=== validate_spec ===");
const validation = await callGisEngineTool({
  params: { name: "validate_spec", arguments: { spec: mapSpec } },
});
console.log(JSON.stringify(validation, null, 2));

// 2. Get a context summary
console.log("\n=== get_context_summary ===");
const summary = await callGisEngineTool({
  params: { name: "get_context_summary", arguments: { spec: mapSpec } },
});
console.log(JSON.stringify(summary, null, 2));

// 3. Explain the spec
console.log("\n=== explain_spec ===");
const explanation = await callGisEngineTool({
  params: { name: "explain_spec", arguments: { spec: mapSpec } },
});
console.log(JSON.stringify(explanation, null, 2));
