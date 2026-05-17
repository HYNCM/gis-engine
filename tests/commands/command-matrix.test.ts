import { describe, expect, it } from "vitest";
import { applyCommands, applyJsonPatch, type MapCommand, type MapSpec } from "@gis-engine/engine";

const inlineGeoJsonSource: MapSpec["sources"][string] = {
  type: "geojson",
  data: {
    type: "FeatureCollection",
    features: []
  }
};

const pointLayer: MapSpec["layers"][number] = {
  id: "points",
  type: "circle",
  source: "points",
  paint: {
    "circle-color": "#111827",
    "circle-radius": 4
  },
  layout: {
    visibility: "visible",
    "circle-sort-key": ["get", "rank"]
  }
};

interface CommandMatrixCase {
  name: string;
  spec: MapSpec;
  command: MapCommand;
  assertSpec: (spec: MapSpec) => void;
}

const cases: CommandMatrixCase[] = [
  {
    name: "addSource",
    spec: baseSpec(),
    command: {
      id: "cmd-add-source",
      version: "0.1",
      type: "addSource",
      baseRevision: "1",
      sourceId: "points",
      source: inlineGeoJsonSource
    },
    assertSpec: (spec) => {
      expect(spec.sources.points).toEqual(inlineGeoJsonSource);
    }
  },
  {
    name: "removeSource",
    spec: baseSpec({ sources: { unused: inlineGeoJsonSource } }),
    command: {
      id: "cmd-remove-source",
      version: "0.1",
      type: "removeSource",
      baseRevision: "1",
      sourceId: "unused"
    },
    assertSpec: (spec) => {
      expect(spec.sources).toEqual({});
    }
  },
  {
    name: "addLayer",
    spec: baseSpec({ sources: { points: inlineGeoJsonSource } }),
    command: {
      id: "cmd-add-layer",
      version: "0.1",
      type: "addLayer",
      baseRevision: "1",
      layer: pointLayer
    },
    assertSpec: (spec) => {
      expect(spec.layers.map((layer) => layer.id)).toEqual(["points"]);
    }
  },
  {
    name: "removeLayer",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [pointLayer]
    }),
    command: {
      id: "cmd-remove-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "1",
      layerId: "points"
    },
    assertSpec: (spec) => {
      expect(spec.layers).toEqual([]);
    }
  },
  {
    name: "setPaint",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [pointLayer]
    }),
    command: {
      id: "cmd-set-paint",
      version: "0.1",
      type: "setPaint",
      baseRevision: "1",
      layerId: "points",
      paint: {
        "circle-color": "#ef4444"
      }
    },
    assertSpec: (spec) => {
      expect(spec.layers[0]?.paint).toEqual({
        "circle-color": "#ef4444",
        "circle-radius": 4
      });
    }
  },
  {
    name: "setLayout",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [pointLayer]
    }),
    command: {
      id: "cmd-set-layout",
      version: "0.1",
      type: "setLayout",
      baseRevision: "1",
      layerId: "points",
      layout: {
        visibility: "none"
      }
    },
    assertSpec: (spec) => {
      expect(spec.layers[0]?.layout).toEqual({
        visibility: "none",
        "circle-sort-key": ["get", "rank"]
      });
    }
  },
  {
    name: "setView",
    spec: baseSpec({ view: { mode: "map2d", center: [0, 0], zoom: 2, pitch: 15 } }),
    command: {
      id: "cmd-set-view",
      version: "0.1",
      type: "setView",
      baseRevision: "1",
      view: {
        center: [120.1, 30.2],
        zoom: 12
      }
    },
    assertSpec: (spec) => {
      expect(spec.view).toEqual({
        mode: "map2d",
        center: [120.1, 30.2],
        zoom: 12,
        pitch: 15
      });
    }
  },
  {
    name: "fitBounds",
    spec: baseSpec({ view: { mode: "map2d", center: [0, 0], zoom: 2, bearing: 10, pitch: 20 } }),
    command: {
      id: "cmd-fit-bounds",
      version: "0.1",
      type: "fitBounds",
      baseRevision: "1",
      bounds: [100, 20, 120, 40]
    },
    assertSpec: (spec) => {
      expect(spec.view).toEqual({
        mode: "map2d",
        bearing: 10,
        pitch: 20,
        bounds: [100, 20, 120, 40]
      });
    }
  },
  {
    name: "reorderLayer",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [
        { id: "point-outline", type: "circle", source: "points" },
        { id: "points", type: "circle", source: "points" }
      ]
    }),
    command: {
      id: "cmd-reorder-layer",
      version: "0.1",
      type: "reorderLayer",
      baseRevision: "1",
      layerId: "point-outline"
    },
    assertSpec: (spec) => {
      expect(spec.layers.map((layer) => layer.id)).toEqual(["points", "point-outline"]);
    }
  }
];

describe("command matrix replay/dryRun/rollback", () => {
  it.each(cases)("covers $name", ({ spec, command, assertSpec }) => {
    const original = structuredClone(spec);

    const result = applyCommands(original, command);

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.status).toBe("applied");
    expect(result.results[0]?.patch?.length).toBeGreaterThan(0);
    expect(result.results[0]?.inversePatch?.length).toBeGreaterThan(0);
    expect(result.spec.revision).toBe("2");
    assertSpec(result.spec);

    const replayed = applyJsonPatch(original, result.results[0]?.patch ?? []);
    expect(replayed).toEqual(result.spec);

    const rolledBack = applyJsonPatch(result.spec, result.results[0]?.inversePatch ?? []);
    expect(rolledBack).toEqual(original);

    const dryRun = applyCommands(original, command, { dryRun: true });
    expect(dryRun.spec).toEqual(original);
    expect(dryRun.results[0]?.status).toBe("applied");
    expect(dryRun.results[0]?.patch).toEqual(result.results[0]?.patch);
    expect(dryRun.committed).toBe(false);
  });
});

function baseSpec(overrides: Partial<MapSpec> = {}): MapSpec {
  return {
    version: "0.1",
    id: "command-matrix",
    revision: "1",
    view: {
      mode: "map2d",
      center: [0, 0],
      zoom: 2
    },
    sources: {},
    layers: [],
    ...overrides
  };
}
