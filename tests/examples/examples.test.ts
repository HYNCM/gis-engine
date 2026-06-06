import {
  applyCommands,
  type MapCommand,
  type MapSpec,
  transformMapSpecToMapLibreStyle,
  validateSpec,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import aiAuditCommands from "../../examples/ai-map-edit/audit.commands.json";
import aiBefore from "../../examples/ai-map-edit/before.map.json";
import aiCommands from "../../examples/ai-map-edit/commands.json";
import { createInitialSpec as createAiMapWorkbenchSpec } from "../../examples/ai-map-workbench/initial-map.mjs";
import basicGeojson from "../../examples/basic-geojson/map.json";
import fillExtrusionLite from "../../examples/fill-extrusion-lite/map.json";
import pmtilesLocal from "../../examples/pmtiles-local/map.json";
import rasterBasemap from "../../examples/raster-basemap/map.json";
import vectorTileUrl from "../../examples/vector-tile-url/map.json";

describe("examples gate", () => {
  const examples: Array<{
    id: string;
    spec: () => MapSpec;
    firstLayerId: string;
    expectedRevision?: string;
    assertTransform?: (style: NonNullable<ReturnType<typeof transformMapSpecToMapLibreStyle>["style"]>) => void;
  }> = [
    {
      id: "basic-geojson",
      spec: () => basicGeojson as MapSpec,
      firstLayerId: "poi-circles",
    },
    {
      id: "ai-map-edit",
      spec: () => applyCommands(aiBefore as MapSpec, aiCommands as MapCommand[]).spec,
      firstLayerId: "poi-circles",
      expectedRevision: "2",
    },
    {
      id: "ai-map-workbench",
      spec: () => createAiMapWorkbenchSpec() as MapSpec,
      firstLayerId: "background",
      expectedRevision: "1",
    },
    {
      id: "raster-basemap",
      spec: () => rasterBasemap as MapSpec,
      firstLayerId: "basemap-raster",
      assertTransform: (style) => {
        expect(style.sources["local-raster"]).toMatchObject({
          type: "raster",
          tiles: ["./tiles/{z}/{x}/{y}.png"],
          tileSize: 256,
        });
      },
    },
    {
      id: "pmtiles-local",
      spec: () => pmtilesLocal as MapSpec,
      firstLayerId: "parcel-fill",
      assertTransform: (style) => {
        expect(style.sources["local-parcels"]).toMatchObject({
          type: "vector",
          url: "./data/parcels.pmtiles",
        });
        expect(style.layers[0]).toMatchObject({
          id: "parcel-fill",
          "source-layer": "parcels",
        });
      },
    },
    {
      id: "vector-tile-url",
      spec: () => vectorTileUrl as MapSpec,
      firstLayerId: "parcel-fill",
      assertTransform: (style) => {
        expect(style.sources["local-parcels"]).toMatchObject({
          type: "vector",
          tiles: ["./tiles/{z}/{x}/{y}.pbf"],
          minzoom: 0,
          maxzoom: 14,
        });
        expect(style.layers[0]).toMatchObject({
          id: "parcel-fill",
          "source-layer": "parcels",
        });
        expect(style.layers[1]?.paint?.["line-width"]).toEqual([
          "step",
          ["zoom"],
          0.5,
          12,
          ["to-number", ["get", "stroke_width"], 1],
          14,
          2,
        ]);
      },
    },
    {
      id: "fill-extrusion-lite",
      spec: () => fillExtrusionLite as MapSpec,
      firstLayerId: "district-extrusion",
      assertTransform: (style) => {
        expect(style.layers[0]).toMatchObject({
          id: "district-extrusion",
          type: "fill-extrusion",
        });
      },
    },
  ];

  it("covers the bundled examples", () => {
    expect(examples.map((example) => example.id)).toEqual([
      "basic-geojson",
      "ai-map-edit",
      "ai-map-workbench",
      "raster-basemap",
      "pmtiles-local",
      "vector-tile-url",
      "fill-extrusion-lite",
    ]);
  });

  it.each(examples)("validates and transforms $id", (example) => {
    const spec = example.spec();
    const report = validateSpec(spec);
    const transform = transformMapSpecToMapLibreStyle(spec);

    expect(report.valid).toBe(true);
    if (example.expectedRevision) expect(spec.revision).toBe(example.expectedRevision);
    expect(transform.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);
    expect(transform.style?.layers[0]?.id).toBe(example.firstLayerId);
    if (transform.style && example.assertTransform) example.assertTransform(transform.style);
  });

  it("keeps PMTiles coverage to URL path validation and transformation", () => {
    const report = validateSpec(pmtilesLocal);
    const transform = transformMapSpecToMapLibreStyle(pmtilesLocal as MapSpec);

    expect(report.valid).toBe(true);
    expect(pmtilesLocal.sources["local-parcels"].url).toBe("./data/parcels.pmtiles");
    expect(transform.style?.sources["local-parcels"]).toMatchObject({
      type: "vector",
      url: "./data/parcels.pmtiles",
    });
    expect(transform.diagnostics).toContainEqual(
      expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", severity: "warning" }),
    );
  });

  it("keeps the AI map edit audit command example replayable with traces", () => {
    const result = applyCommands(aiBefore as MapSpec, aiAuditCommands as MapCommand[], {
      collectTrace: true,
      traceId: "example-ai-map-edit-audit",
    });

    expect(result.spec.revision).toBe("2");
    expect(result.traces?.[0]).toMatchObject({
      traceId: "example-ai-map-edit-audit",
      commandId: "cmd-highlight-pois-audited",
      status: "applied",
      author: {
        type: "agent",
        id: "agent-example",
        name: "example-agent",
      },
      reason: "Show an auditable AI edit with provenance fields.",
      sourcePromptHash: "sha256:ai-map-edit-audited",
    });
  });
});
