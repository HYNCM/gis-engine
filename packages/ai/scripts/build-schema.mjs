import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv } from "ajv/dist/ajv.js";
import {
  ExplainSpecToolInputSchema,
  ExportExampleAppToolInputSchema,
  SnapshotSpecToolInputSchema,
  gisEngineTools
} from "../dist/index.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(scriptDir, "../dist/schema");
const outFile = resolve(outDir, "ai-tools.v0.1.schema.json");

const toolSchemas = Object.fromEntries(gisEngineTools.map((tool) => [tool.name, stripNestedIds(tool.inputSchema)]));
const schema = {
  $id: "https://gis-engine.dev/schemas/ai-tools.v0.1.schema.json",
  title: "GIS Engine AI tool input schema bundle",
  type: "object",
  properties: toolSchemas,
  required: Object.keys(toolSchemas),
  additionalProperties: false
};

for (const toolSchema of [
  SnapshotSpecToolInputSchema,
  ExplainSpecToolInputSchema,
  ExportExampleAppToolInputSchema,
  ...Object.values(toolSchemas)
]) {
  new Ajv({ strict: false }).compile(toolSchema);
}

await mkdir(outDir, { recursive: true });
await writeFile(outFile, `${JSON.stringify(schema, null, 2)}\n`);

function stripNestedIds(value) {
  if (Array.isArray(value)) return value.map(stripNestedIds);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "$id").map(([key, entry]) => [key, stripNestedIds(entry)]));
}
