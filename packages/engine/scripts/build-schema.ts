import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Ajv } from "ajv/dist/ajv.js";
import {
  ApplyCommandsToolInputSchema,
  CapabilityReportSchema,
  DiagnosticSchema,
  MapCommandSchema,
  MapGenerationCommandSkeletonSchema,
  MapGenerationPromptPlannerInputSchema,
  MapGenerationPromptPlanSchema,
  MapGenerationRequestSchema,
  MapSpecSchema,
  SceneView3DExtensionSchema,
} from "../src/spec/schemas/index.js";

const outDir = resolve("dist/schema");
const schemas = [
  ["mapspec.v0.1.schema.json", MapSpecSchema],
  ["commands.v0.1.schema.json", MapCommandSchema],
  ["capabilities.v0.1.schema.json", CapabilityReportSchema],
  ["sceneview3d.v1.schema.json", SceneView3DExtensionSchema],
  ["diagnostics.v0.1.schema.json", DiagnosticSchema],
  ["map-generation-request.v0.1.schema.json", MapGenerationRequestSchema],
  ["map-generation-prompt-planner-input.v0.1.schema.json", MapGenerationPromptPlannerInputSchema],
  ["map-generation-prompt-plan.v0.1.schema.json", MapGenerationPromptPlanSchema],
  ["map-generation-command-skeleton.v0.1.schema.json", MapGenerationCommandSkeletonSchema],
  ["ai-tools.v0.1.schema.json", ApplyCommandsToolInputSchema],
] as const;

await mkdir(outDir, { recursive: true });

const ajv = new Ajv({ strict: false });

for (const [filename, schema] of schemas) {
  ajv.compile(schema);
  await writeFile(resolve(outDir, filename), `${JSON.stringify(schema, null, 2)}\n`);
}
