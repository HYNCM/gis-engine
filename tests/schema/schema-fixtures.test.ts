import { describe, expect, it } from "vitest";
import invalidSpec from "../fixtures/specs/invalid/layer-source-missing.map.json";
import expectedInvalidCodes from "../fixtures/specs/invalid/layer-source-missing.diagnostics.json";
import validSpec from "../fixtures/specs/valid/basic-geojson.map.json";
import { validateSpec } from "@gis-engine/engine";

describe("MapSpec fixtures", () => {
  it("accepts valid fixtures", () => {
    const report = validateSpec(validSpec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports expected diagnostics for invalid fixtures", () => {
    const report = validateSpec(invalidSpec);
    expect(report.valid).toBe(false);
    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(expectedInvalidCodes);
  });
});
