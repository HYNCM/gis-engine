import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import {
  ApplyCommandsToolInputSchema,
  DiagnosticCodes,
  DiagnosticSchema,
  MapCommandSchema,
  MapSpecSchema
} from "@gis-engine/engine";

describe("schema sync gate", () => {
  it("compiles all public schemas with Ajv", () => {
    const ajv = new Ajv({ strict: false });

    expect(() => ajv.compile(MapSpecSchema)).not.toThrow();
    expect(() => ajv.compile(MapCommandSchema)).not.toThrow();
    expect(() => ajv.compile(DiagnosticSchema)).not.toThrow();
    expect(() => ajv.compile(ApplyCommandsToolInputSchema)).not.toThrow();
  });

  it("keeps apply_commands tool schema aligned with ApplyOptions", () => {
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("spec");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("commands");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("dryRun");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("transaction");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("traceId");
  });

  it("locks diagnostic schema to registered diagnostic codes", () => {
    const diagnosticCodeSchema = DiagnosticSchema.properties.code;
    const schemaText = JSON.stringify(diagnosticCodeSchema);

    for (const code of Object.values(DiagnosticCodes)) {
      expect(schemaText).toContain(code);
    }
  });

  it("keeps public schema ids versioned", () => {
    expect(MapSpecSchema.$id).toBe("https://gis-engine.dev/schemas/mapspec.v0.1.schema.json");
    expect(MapCommandSchema.$id).toBe("https://gis-engine.dev/schemas/commands.v0.1.schema.json");
    expect(DiagnosticSchema.$id).toBe("https://gis-engine.dev/schemas/diagnostics.v0.1.schema.json");
    expect(ApplyCommandsToolInputSchema.$id).toBe("https://gis-engine.dev/schemas/ai-tools.v0.1.schema.json");
  });
});
