import { describe, expect, it } from "vitest";
import basicGeojson from "../../examples/basic-geojson/map.json";
import aiBefore from "../../examples/ai-map-edit/before.map.json";
import aiCommands from "../../examples/ai-map-edit/commands.json";
import { applyCommands, transformMapSpecToMapLibreStyle, validateSpec, type MapCommand, type MapSpec } from "@gis-engine/engine";

describe("examples gate", () => {
  it("validates the basic GeoJSON example and transforms it to MapLibre style", () => {
    const report = validateSpec(basicGeojson);
    const transform = transformMapSpecToMapLibreStyle(basicGeojson as MapSpec);

    expect(report.valid).toBe(true);
    expect(transform.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);
    expect(transform.style?.layers[0]?.id).toBe("poi-circles");
  });

  it("replays the AI map edit example and keeps it inside the MapLibre feature matrix", () => {
    const result = applyCommands(aiBefore as MapSpec, aiCommands as MapCommand[]);
    const transform = transformMapSpecToMapLibreStyle(result.spec);

    expect(result.committed).toBe(true);
    expect(result.spec.revision).toBe("2");
    expect(transform.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);
  });
});
