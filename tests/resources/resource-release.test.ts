import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import { MapRuntime, MockAdapter, type MapCommand, type MapSpec } from "@gis-engine/engine";

describe("resource release smoke", () => {
  it("destroys runtime resources and reports repeated destroy calls", async () => {
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter: new MockAdapter(),
      container: {} as HTMLElement
    });

    const firstReport = await runtime.destroy();
    const secondReport = await runtime.destroy();

    expect(firstReport.destroyed).toBe(true);
    expect(firstReport.diagnostics).toEqual([]);
    expect(secondReport.destroyed).toBe(true);
    expect(secondReport.diagnostics[0]?.code).toBe("RENDER.DESTROYED");
  });

  it("keeps snapshot and query lifecycle paths bounded by destroy", async () => {
    const runtime = await MapRuntime.create(querySpec, {
      adapter: new MockAdapter(),
      container: {} as HTMLElement
    });

    await expect(runtime.snapshot({ targetLayers: ["places-circle"] })).resolves.toEqual(
      expect.objectContaining({ passed: true })
    );

    const queryResult = await runtime.queryFeatures({ point: [10, 10], layers: ["places-circle"] });
    expect(queryResult.diagnostics).toEqual([]);
    expect(queryResult.features).toHaveLength(1);

    const report = await runtime.destroy();
    expect(report.destroyed).toBe(true);
    expect(report.diagnostics).toEqual([]);

    expect(() => runtime.exportSpec()).toThrow("MapRuntime has been destroyed.");
    expect(() => runtime.validate()).toThrow("MapRuntime has been destroyed.");
    expect(() => runtime.snapshot()).toThrow("MapRuntime has been destroyed.");
    expect(() => runtime.queryFeatures({ point: [10, 10] })).toThrow("MapRuntime has been destroyed.");

    const command: MapCommand = {
      id: "cmd-after-destroy",
      version: "0.1",
      type: "setView",
      view: { zoom: 4 }
    };
    await expect(runtime.apply(command)).rejects.toThrow("MapRuntime has been destroyed.");
  });
});

const querySpec: MapSpec = {
  version: "0.1",
  id: "resource-query-lifecycle",
  revision: "1",
  view: {
    mode: "map2d",
    center: [10, 10],
    zoom: 4
  },
  sources: {
    inline: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { id: "point-a" },
            geometry: { type: "Point", coordinates: [10, 10] }
          }
        ]
      }
    }
  },
  layers: [{ id: "places-circle", type: "circle", source: "inline" }]
};
