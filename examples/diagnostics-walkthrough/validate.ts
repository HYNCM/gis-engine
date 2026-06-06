import { type MapSpec, validateSpec } from "@gis-engine/engine";
import invalidExamples from "./data/invalid-examples.json" with { type: "json" };
import mapSpec from "./map.json" with { type: "json" };

// 1. Validate the correct MapSpec
console.log("=== Valid MapSpec ===");
const validReport = validateSpec(mapSpec);
console.log(`Valid: ${validReport.valid}`);
console.log(`Diagnostics: ${validReport.diagnostics.length}`);

// 2. Validate each intentionally broken MapSpec
console.log("\n=== Invalid MapSpec Examples ===");
for (const example of invalidExamples as Array<{ description: string; spec: unknown }>) {
  console.log(`\n--- ${example.description} ---`);
  const report = validateSpec(example.spec as MapSpec);
  console.log(`Valid: ${report.valid}`);
  for (const d of report.diagnostics) {
    console.log(`  [${d.severity}] ${d.code} at ${d.path}`);
    console.log(`    ${d.message}`);
    if (d.fix) console.log(`    Fix: ${d.fix}`);
  }
}
