#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const options = parseArgs(process.argv.slice(2));
const mapPath = resolve("map.json");
const preflightPath = resolve(options.preflightPath);
const outputPath = resolve(options.outputPath);

const spec = JSON.parse(readFileSync(mapPath, "utf8"));
const preflight = JSON.parse(readFileSync(preflightPath, "utf8"));

const report = [
  "# Consumer Review Handoff",
  "",
  `- MapSpec: \`${relativeDisplayPath(mapPath)}\``,
  `- Preflight: \`${relativeDisplayPath(preflightPath)}\``,
  `- Status: \`${preflight.status}\``,
  `- Validation: \`${preflight.validation.valid ? "valid" : "invalid"}\``,
  `- Sources: \`${preflight.validation.stats.sourceCount}\``,
  `- Layers: \`${preflight.validation.stats.layerCount}\``,
  `- Diagnostics: \`${preflight.diagnostics.length}\``,
  "",
  "## Reviewer Files",
  "",
  "- `map.json` — source of truth for the consumer-facing MapSpec.",
  "- `handoff/preflight.json` — machine-readable validation, source-readiness, and PMTiles preflight output.",
  "- `handoff/consumer-review.md` — concise human handoff generated in CI.",
  "",
  "## Reproduce",
  "",
  "```bash",
  "npm install",
  "npm run build",
  "npm run handoff",
  "```",
  "",
  "## Notes",
  "",
  `- This sample keeps the integration surface minimal: one inline GeoJSON source, one circle layer, and \`createMap()\` through the published SDK.`,
  `- CI handoff uses \`create-gis-map --preflight\` instead of a generated-app artifact manifest because this sample models a hand-authored consumer repo, not a generated app.`,
  `- PMTiles, cloud-native runtime loaders, and stable SceneView3D runtime remain outside this sample's runtime claims.`,
  "",
  "## Current Spec Summary",
  "",
  `- Map id: \`${spec.id ?? "unknown"}\``,
  `- First layer: \`${spec.layers?.[0]?.id ?? "unknown"}\``,
  `- View mode: \`${spec.view?.mode ?? "map2d"}\``
].join("\n");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${report}\n`, "utf8");
console.log(`Consumer handoff report written: ${relativeDisplayPath(outputPath)}`);

function parseArgs(argv) {
  const parsed = {
    preflightPath: "handoff/preflight.json",
    outputPath: "handoff/consumer-review.md",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--preflight") {
      parsed.preflightPath = requireValue(argv[index + 1], "--preflight");
      index += 1;
      continue;
    }
    if (arg.startsWith("--preflight=")) {
      parsed.preflightPath = requireValue(arg.slice("--preflight=".length), "--preflight");
      continue;
    }
    if (arg === "--output") {
      parsed.outputPath = requireValue(argv[index + 1], "--output");
      index += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      parsed.outputPath = requireValue(arg.slice("--output=".length), "--output");
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return parsed;
}

function requireValue(value, flag) {
  if (!value) throw new Error(`${flag} requires a value.`);
  return value;
}

function relativeDisplayPath(path) {
  return path.replace(`${process.cwd()}/`, "");
}

function printHelp() {
  console.log(`
Usage: node ci-handoff.mjs [options]

Options:
  --preflight <path>  Preflight JSON path (default: handoff/preflight.json)
  --output <path>     Markdown handoff path (default: handoff/consumer-review.md)
  --help, -h          Show this help message
`);
}
