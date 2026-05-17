import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import { applyCommands, createMap, type MapCommand, type MapSpec } from "@gis-engine/engine";

describe("performance smoke", () => {
  it("replays a small command batch within the v0.1 smoke budget", () => {
    const commands: MapCommand[] = Array.from({ length: 50 }, (_, index) => ({
      id: `cmd-view-${index}`,
      version: "0.1",
      type: "setView",
      view: {
        zoom: 11 + index / 100
      }
    }));
    const startedAt = performance.now();

    const result = applyCommands(before as MapSpec, commands, { transaction: "best-effort" });

    expect(result.results.every((commandResult) => commandResult.status === "applied")).toBe(true);
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });

  it("runs create/query/snapshot/destroy within deterministic Node smoke budgets", async () => {
    const startedAt = performance.now();
    const runtime = await createMap({} as HTMLElement, perfSpec, { renderer: "mock" });
    const createMs = performance.now() - startedAt;

    const queryStartedAt = performance.now();
    const query = await runtime.queryFeatures({ point: [10, 10], layers: ["places-circle"] });
    const queryMs = performance.now() - queryStartedAt;

    const snapshotStartedAt = performance.now();
    const snapshot = await runtime.snapshot({ targetLayers: ["places-circle"] });
    const snapshotMs = performance.now() - snapshotStartedAt;

    const destroyStartedAt = performance.now();
    const resourceReport = await runtime.destroy();
    const destroyMs = performance.now() - destroyStartedAt;

    expect(query.diagnostics).toEqual([]);
    expect(query.features).toHaveLength(1);
    expect(snapshot.passed).toBe(true);
    expect(resourceReport.destroyed).toBe(true);

    expect(createMs).toBeLessThan(1_000);
    expect(queryMs).toBeLessThan(500);
    expect(snapshotMs).toBeLessThan(500);
    expect(destroyMs).toBeLessThan(500);
  });
});

const perfSpec: MapSpec = {
  version: "0.1",
  id: "perf-runtime-smoke",
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
