import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Ajv } from "ajv/dist/ajv.js";
import {
  ApplyCommandsToolInputSchema,
  DiagnosticSchema,
  MapCommandSchema,
  MapSpecSchema
} from "../src/spec/schemas/index.js";

const outDir = resolve("dist/schema");
const schemas = [
  ["mapspec.v0.1.schema.json", MapSpecSchema],
  ["commands.v0.1.schema.json", MapCommandSchema],
  ["diagnostics.v0.1.schema.json", DiagnosticSchema],
  ["ai-tools.v0.1.schema.json", ApplyCommandsToolInputSchema]
] as const;

await mkdir(outDir, { recursive: true });

const ajv = new Ajv({ strict: false });

for (const [filename, schema] of schemas) {
  ajv.compile(schema);
  await writeFile(resolve(outDir, filename), `${JSON.stringify(schema, null, 2)}\n`);
}
