import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv } from "ajv/dist/ajv.js";
import {
  ExplainSpecToolInputSchema,
  ExportExampleAppToolInputSchema,
  GenerationEvidenceBundleInputSchema,
  GenerationEvidenceBundleSchema,
  gisEngineTools,
  SnapshotSpecToolInputSchema,
} from "../dist/index.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(scriptDir, "../dist/schema");
const inputOutFile = resolve(outDir, "ai-tools.v0.1.schema.json");
const contractOutFile = resolve(outDir, "ai-tool-contracts.v0.2.schema.json");
const generationEvidenceOutFile = resolve(outDir, "generation-evidence-bundle.v0.1.schema.json");

const toolInputSchemas = Object.fromEntries(
  gisEngineTools.map((tool) => [tool.name, stripNestedIds(tool.inputSchema)]),
);
const toolOutputSchemas = Object.fromEntries(
  gisEngineTools.map((tool) => [tool.name, stripNestedIds(tool.outputSchema)]),
);
const inputSchema = {
  $id: "https://gis-engine.dev/schemas/ai-tools.v0.1.schema.json",
  title: "GIS Engine AI tool input schema bundle",
  type: "object",
  properties: toolInputSchemas,
  required: Object.keys(toolInputSchemas),
  additionalProperties: false,
};
const contractSchema = {
  $id: "https://gis-engine.dev/schemas/ai-tool-contracts.v0.2.schema.json",
  title: "GIS Engine AI tool input and output contract bundle",
  type: "object",
  properties: {
    inputs: {
      type: "object",
      properties: toolInputSchemas,
      required: Object.keys(toolInputSchemas),
      additionalProperties: false,
    },
    outputs: {
      type: "object",
      properties: toolOutputSchemas,
      required: Object.keys(toolOutputSchemas),
      additionalProperties: false,
    },
  },
  required: ["inputs", "outputs"],
  additionalProperties: false,
};

for (const toolSchema of [
  SnapshotSpecToolInputSchema,
  ExplainSpecToolInputSchema,
  ExportExampleAppToolInputSchema,
  GenerationEvidenceBundleInputSchema,
  GenerationEvidenceBundleSchema,
  ...Object.values(toolInputSchemas),
  ...Object.values(toolOutputSchemas),
]) {
  new Ajv({ strict: false }).compile(toolSchema);
}

await mkdir(outDir, { recursive: true });
await writeFile(inputOutFile, `${JSON.stringify(inputSchema, null, 2)}\n`);
await writeFile(contractOutFile, `${JSON.stringify(contractSchema, null, 2)}\n`);
await writeFile(generationEvidenceOutFile, `${JSON.stringify(GenerationEvidenceBundleSchema, null, 2)}\n`);

function stripNestedIds(value) {
  if (Array.isArray(value)) return value.map(stripNestedIds);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "$id")
      .map(([key, entry]) => [key, stripNestedIds(entry)]),
  );
}
