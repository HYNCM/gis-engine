import { applyCommands, type MapSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import { applyIncrementalPatch } from "../../packages/engine/src/renderer/maplibre/styleDiff.js";

type FakeMap = {
  jumpToCalls: unknown[];
  fitBoundsCalls: unknown[];
};

function fakeMap(): { map: unknown; calls: FakeMap } {
  const calls: FakeMap = { jumpToCalls: [], fitBoundsCalls: [] };
  const map = {
    jumpTo: (options: unknown) => calls.jumpToCalls.push(options),
    fitBounds: (bounds: unknown, options: unknown) => calls.fitBoundsCalls.push([bounds, options]),
    getSource: () => undefined,
    addSource: () => {},
    removeSource: () => {},
    getLayer: () => undefined,
    addLayer: () => {},
    removeLayer: () => {},
    setPaintProperty: () => {},
    setLayoutProperty: () => {},
    setFilter: () => {},
  };
  return { map, calls };
}

function baseSpec(): MapSpec {
  return {
    version: "0.1",
    id: "camera-sync",
    revision: "0",
    view: { mode: "map2d", center: [120, 30], zoom: 5, bearing: 0 },
    sources: {},
    layers: [],
  };
}

function renderedPatchFor(spec: MapSpec, command: Record<string, unknown>) {
  const applied = applyCommands(spec, [command as never], { transaction: "atomic" });
  if (!applied.committed) throw new Error("Test command must commit.");
  const patch = applied.results[0]?.patch ?? [];
  return { patch, spec: applied.spec };
}

describe("MapLibre incremental view synchronization", () => {
  it("moves the camera when setView replaces the whole /view object", () => {
    const { patch, spec } = renderedPatchFor(baseSpec(), {
      id: "set-view",
      version: "0.1",
      type: "setView",
      view: { center: [110, 20], zoom: 8, bearing: 45 },
    });

    const { map, calls } = fakeMap();
    const incrementalOk = applyIncrementalPatch(map as never, patch, spec);

    expect(incrementalOk).toBe(true);
    expect(calls.jumpToCalls).toHaveLength(1);
    expect(calls.jumpToCalls[0]).toMatchObject({ center: [110, 20], zoom: 8, bearing: 45 });
  });

  it("fits the camera when fitBounds produces a /view replacement without center or zoom", () => {
    const { patch, spec } = renderedPatchFor(baseSpec(), {
      id: "fit-bounds",
      version: "0.1",
      type: "fitBounds",
      bounds: [100, 10, 105, 15],
    });

    const { map, calls } = fakeMap();
    const incrementalOk = applyIncrementalPatch(map as never, patch, spec);

    expect(incrementalOk).toBe(true);
    expect(calls.fitBoundsCalls).toHaveLength(1);
    expect(calls.fitBoundsCalls[0]).toMatchObject([[100, 10, 105, 15], expect.anything()]);
  });

  it("keeps incremental handling when the pipeline appends the /revision patch operation", () => {
    const { patch, spec } = renderedPatchFor(baseSpec(), {
      id: "set-zoom",
      version: "0.1",
      type: "setView",
      view: { zoom: 9 },
    });
    expect(patch.some((op) => op.path === "/revision")).toBe(true);

    const { map, calls } = fakeMap();
    const incrementalOk = applyIncrementalPatch(map as never, patch, spec);

    expect(incrementalOk).toBe(true);
    expect(calls.jumpToCalls[0]).toMatchObject({ zoom: 9, center: [120, 30] });
  });
});
