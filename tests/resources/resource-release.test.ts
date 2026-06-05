import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import { MapRuntime, MockAdapter, MapLibreAdapter, type MapCommand, type MapSpec } from "@gis-engine/engine";

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

  it("RESOURCE-003: removes adapter listeners and reports count in ResourceReport", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement
    });

    const unsub1 = adapter.on("error", () => {});
    const unsub2 = adapter.on("error", () => {});
    const unsub3 = adapter.on("stats", () => {});

    const report = await runtime.destroy();

    expect(report.destroyed).toBe(true);
    expect(report.resources).toBeDefined();
    expect(report.resources!.listenersRemoved).toBe(3);

    unsub1();
    unsub2();
    unsub3();
  });

  it("RESOURCE-003: reports zero listenersRemoved when none were registered", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement
    });

    const report = await runtime.destroy();

    expect(report.destroyed).toBe(true);
    expect(report.resources).toBeDefined();
    expect(report.resources!.listenersRemoved).toBe(0);
  });

  it("RESOURCE-003: MapLibreAdapter removes listeners and reports count", async () => {
    const adapter = new MapLibreAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement
    });

    adapter.on("error", () => {});
    adapter.on("warning", () => {});

    const report = await runtime.destroy();

    expect(report.destroyed).toBe(true);
    expect(report.resources).toBeDefined();
    expect(report.resources!.listenersRemoved).toBe(2);
  });

  it("RESOURCE-004: MockAdapter reports verifiable: true in ResourceReport", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement
    });

    const report = await runtime.destroy();

    expect(report.resources).toBeDefined();
    expect(report.resources!.verifiable).toBe(true);
  });

  it("RESOURCE-004: MapLibreAdapter reports verifiable: true in ResourceReport", async () => {
    const adapter = new MapLibreAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement
    });

    const report = await runtime.destroy();

    expect(report.resources).toBeDefined();
    expect(report.resources!.verifiable).toBe(true);
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
