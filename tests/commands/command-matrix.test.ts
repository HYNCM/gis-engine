import { applyCommands, applyJsonPatch, type MapCommand, type MapSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

const inlineGeoJsonSource: MapSpec["sources"][string] = {
  type: "geojson",
  data: {
    type: "FeatureCollection",
    features: [],
  },
};

const pointLayer: MapSpec["layers"][number] = {
  id: "points",
  type: "circle",
  source: "points",
  paint: {
    "circle-color": "#111827",
    "circle-radius": 4,
  },
  layout: {
    visibility: "visible",
    "circle-sort-key": ["get", "rank"],
  },
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
      source: inlineGeoJsonSource,
    },
    assertSpec: (spec) => {
      expect(spec.sources.points).toEqual(inlineGeoJsonSource);
    },
  },
  {
    name: "removeSource",
    spec: baseSpec({ sources: { unused: inlineGeoJsonSource } }),
    command: {
      id: "cmd-remove-source",
      version: "0.1",
      type: "removeSource",
      baseRevision: "1",
      sourceId: "unused",
    },
    assertSpec: (spec) => {
      expect(spec.sources).toEqual({});
    },
  },
  {
    name: "addLayer",
    spec: baseSpec({ sources: { points: inlineGeoJsonSource } }),
    command: {
      id: "cmd-add-layer",
      version: "0.1",
      type: "addLayer",
      baseRevision: "1",
      layer: pointLayer,
    },
    assertSpec: (spec) => {
      expect(spec.layers.map((layer) => layer.id)).toEqual(["points"]);
    },
  },
  {
    name: "removeLayer",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [pointLayer],
    }),
    command: {
      id: "cmd-remove-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "1",
      layerId: "points",
    },
    assertSpec: (spec) => {
      expect(spec.layers).toEqual([]);
    },
  },
  {
    name: "setPaint",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [pointLayer],
    }),
    command: {
      id: "cmd-set-paint",
      version: "0.1",
      type: "setPaint",
      baseRevision: "1",
      layerId: "points",
      paint: {
        "circle-color": "#ef4444",
      },
    },
    assertSpec: (spec) => {
      expect(spec.layers[0]?.paint).toEqual({
        "circle-color": "#ef4444",
        "circle-radius": 4,
      });
    },
  },
  {
    name: "setLayout",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [pointLayer],
    }),
    command: {
      id: "cmd-set-layout",
      version: "0.1",
      type: "setLayout",
      baseRevision: "1",
      layerId: "points",
      layout: {
        visibility: "none",
      },
    },
    assertSpec: (spec) => {
      expect(spec.layers[0]?.layout).toEqual({
        visibility: "none",
        "circle-sort-key": ["get", "rank"],
      });
    },
  },
  {
    name: "setFilter",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [pointLayer],
    }),
    command: {
      id: "cmd-set-filter",
      version: "0.1",
      type: "setFilter",
      baseRevision: "1",
      layerId: "points",
      filter: ["==", ["get", "category"], "landmark"],
    },
    assertSpec: (spec) => {
      expect(spec.layers[0]?.filter).toEqual(["==", ["get", "category"], "landmark"]);
    },
  },
  {
    name: "setLayerZoomRange",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [pointLayer],
    }),
    command: {
      id: "cmd-set-layer-zoom-range",
      version: "0.1",
      type: "setLayerZoomRange",
      baseRevision: "1",
      layerId: "points",
      minzoom: 10,
      maxzoom: 18,
    },
    assertSpec: (spec) => {
      expect(spec.layers[0]).toMatchObject({ minzoom: 10, maxzoom: 18 });
    },
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
        zoom: 12,
      },
    },
    assertSpec: (spec) => {
      expect(spec.view).toEqual({
        mode: "map2d",
        center: [120.1, 30.2],
        zoom: 12,
        pitch: 15,
      });
    },
  },
  {
    name: "setCapabilities",
    spec: baseSpec(),
    command: {
      id: "cmd-set-capabilities",
      version: "0.1",
      type: "setCapabilities",
      baseRevision: "1",
      capabilities: {
        dimensions: ["2d"],
        renderer: "maplibre",
        experimental: [],
      },
    },
    assertSpec: (spec) => {
      expect(spec.capabilities).toEqual({
        dimensions: ["2d"],
        renderer: "maplibre",
        experimental: [],
      });
    },
  },
  {
    name: "setInteractions",
    spec: baseSpec(),
    command: {
      id: "cmd-set-interactions",
      version: "0.1",
      type: "setInteractions",
      baseRevision: "1",
      interactions: {
        pan: true,
        zoom: true,
        click: true,
        popup: true,
      },
    },
    assertSpec: (spec) => {
      expect(spec.interactions).toEqual({
        pan: true,
        zoom: true,
        click: true,
        popup: true,
      });
    },
  },
  {
    name: "fitBounds",
    spec: baseSpec({ view: { mode: "map2d", center: [0, 0], zoom: 2, bearing: 10, pitch: 20 } }),
    command: {
      id: "cmd-fit-bounds",
      version: "0.1",
      type: "fitBounds",
      baseRevision: "1",
      bounds: [100, 20, 120, 40],
    },
    assertSpec: (spec) => {
      expect(spec.view).toEqual({
        mode: "map2d",
        bearing: 10,
        pitch: 20,
        bounds: [100, 20, 120, 40],
      });
    },
  },
  {
    name: "reorderLayer",
    spec: baseSpec({
      sources: { points: inlineGeoJsonSource },
      layers: [
        { id: "point-outline", type: "circle", source: "points" },
        { id: "points", type: "circle", source: "points" },
      ],
    }),
    command: {
      id: "cmd-reorder-layer",
      version: "0.1",
      type: "reorderLayer",
      baseRevision: "1",
      layerId: "point-outline",
    },
    assertSpec: (spec) => {
      expect(spec.layers.map((layer) => layer.id)).toEqual(["points", "point-outline"]);
    },
  },
  {
    name: "setSceneCamera",
    spec: baseSpec(),
    command: {
      id: "cmd-set-scene-camera",
      version: "0.1",
      type: "setSceneCamera",
      baseRevision: "1",
      camera: sceneCamera(),
    },
    assertSpec: (spec) => {
      expect(spec.extensions?.scene3d).toEqual({ camera: sceneCamera() });
    },
  },
  {
    name: "addSceneSource",
    spec: sceneSpec(),
    command: {
      id: "cmd-add-scene-source",
      version: "0.1",
      type: "addSceneSource",
      baseRevision: "1",
      sourceId: "city",
      source: sceneTilesetSource(),
    },
    assertSpec: (spec) => {
      expect((spec.extensions?.scene3d as { sources?: Record<string, unknown> }).sources?.city).toEqual(
        sceneTilesetSource(),
      );
    },
  },
  {
    name: "addSceneLayer",
    spec: sceneSpec({ sources: { city: sceneTilesetSource() } }),
    command: {
      id: "cmd-add-scene-layer",
      version: "0.1",
      type: "addSceneLayer",
      baseRevision: "1",
      layer: sceneTilesetLayer(),
    },
    assertSpec: (spec) => {
      expect((spec.extensions?.scene3d as { layers?: unknown[] }).layers).toEqual([sceneTilesetLayer()]);
    },
  },
  {
    name: "setSceneLayerVisibility",
    spec: sceneSpec({ sources: { city: sceneTilesetSource() }, layers: [sceneTilesetLayer()] }),
    command: {
      id: "cmd-set-scene-layer-visibility",
      version: "0.1",
      type: "setSceneLayerVisibility",
      baseRevision: "1",
      layerId: "city",
      visible: false,
    },
    assertSpec: (spec) => {
      expect((spec.extensions?.scene3d as { layers?: Array<{ visible?: boolean }> }).layers?.[0]?.visible).toBe(false);
    },
  },
  {
    name: "removeSceneLayer",
    spec: sceneSpec({ sources: { city: sceneTilesetSource() }, layers: [sceneTilesetLayer()] }),
    command: {
      id: "cmd-remove-scene-layer",
      version: "0.1",
      type: "removeSceneLayer",
      baseRevision: "1",
      layerId: "city",
    },
    assertSpec: (spec) => {
      expect((spec.extensions?.scene3d as { layers?: unknown[] }).layers).toEqual([]);
    },
  },
  {
    name: "removeSceneSource",
    spec: sceneSpec({ sources: { city: sceneTilesetSource() } }),
    command: {
      id: "cmd-remove-scene-source",
      version: "0.1",
      type: "removeSceneSource",
      baseRevision: "1",
      sourceId: "city",
    },
    assertSpec: (spec) => {
      expect((spec.extensions?.scene3d as { sources?: Record<string, unknown> }).sources).toEqual({});
    },
  },
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
      zoom: 2,
    },
    sources: {},
    layers: [],
    ...overrides,
  };
}

function sceneSpec(scene: Record<string, unknown> = {}): MapSpec {
  return baseSpec({
    extensions: {
      scene3d: {
        camera: sceneCamera(),
        ...scene,
      },
    },
  });
}

function sceneCamera() {
  return {
    position: [120.15, 30.28, 1200] as [number, number, number],
    target: [120.15, 30.28, 0] as [number, number, number],
  };
}

function sceneTilesetSource() {
  return {
    type: "3d-tiles" as const,
    url: "./data/city/tileset.json",
  };
}

function sceneTilesetLayer() {
  return {
    id: "city",
    type: "tileset3d" as const,
    source: "city",
    pickable: true,
  };
}
