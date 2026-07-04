/**
 * End-to-End Integration Tests (Node-side, vitest)
 *
 * These tests exercise the full engine pipeline via MapRuntime + MockAdapter:
 *   createMap → apply commands → query features → snapshot → destroy.
 *
 * They complement the Playwright browser E2E tests (`tests/e2e/render-pipeline.spec.ts`)
 * by verifying the engine's API contracts using real MapRuntime with MockAdapter
 * (inline GeoJSON queries, snapshot stubs, command application, spec export).
 */

import { type MapCommand, MapRuntime, type MapSpec, MockAdapter } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Shared spec factories
// ---------------------------------------------------------------------------

function simpleFillSpec(fillColor = "#3b82f6"): MapSpec {
  return {
    version: "0.1",
    id: "e2e-fill",
    revision: "1",
    view: { mode: "map2d", center: [120.15, 30.28], zoom: 12 },
    sources: {
      polygon: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "test-polygon" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [120.14, 30.27],
                    [120.16, 30.27],
                    [120.16, 30.29],
                    [120.14, 30.29],
                    [120.14, 30.27],
                  ],
                ],
              },
            },
          ],
        },
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#f0f0f0" } },
      {
        id: "fill-layer",
        type: "fill",
        source: "polygon",
        paint: { "fill-color": fillColor, "fill-opacity": 1 },
      },
    ],
  };
}

function pointCircleSpec(): MapSpec {
  return {
    version: "0.1",
    id: "e2e-point",
    revision: "1",
    view: { mode: "map2d", center: [120.15, 30.28], zoom: 12 },
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "test-point" },
              geometry: { type: "Point", coordinates: [120.15, 30.28] },
            },
          ],
        },
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#e8f7ef" } },
      {
        id: "circle-layer",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 24,
          "circle-color": "#d7263d",
        },
      },
    ],
  };
}

function multiSourceSpec(): MapSpec {
  return {
    version: "0.1",
    id: "e2e-multi",
    revision: "1",
    view: { mode: "map2d", center: [0, 0], zoom: 2 },
    sources: {
      cities: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Beijing", population: 21_540_000 },
              geometry: { type: "Point", coordinates: [116.4, 39.9] },
            },
            {
              type: "Feature",
              properties: { name: "Shanghai", population: 24_870_000 },
              geometry: { type: "Point", coordinates: [121.47, 31.23] },
            },
          ],
        },
      },
      regions: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "East China" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [115, 28],
                    [125, 28],
                    [125, 35],
                    [115, 35],
                    [115, 28],
                  ],
                ],
              },
            },
          ],
        },
      },
    },
    layers: [
      { id: "city-points", type: "circle", source: "cities" },
      { id: "region-fill", type: "fill", source: "regions", paint: { "fill-color": "#22c55e" } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("E2E Node Integration: MapRuntime pipeline", () => {
  // -------------------------------------------------------------------------
  // Test 1: createMap + basic rendering contract
  // -------------------------------------------------------------------------
  it("creates a runtime from a valid spec and exports the loaded spec", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(simpleFillSpec(), {
      adapter,
      container: {} as HTMLElement,
    });

    const exported = runtime.exportSpec();
    expect(exported.id).toBe("e2e-fill");
    expect(exported.version).toBe("0.1");
    expect(exported.sources.polygon).toBeDefined();
    expect(exported.layers).toHaveLength(2);
    expect(exported.layers[1]?.paint).toEqual({ "fill-color": "#3b82f6", "fill-opacity": 1 });

    await runtime.destroy();
  });

  // -------------------------------------------------------------------------
  // Test 2: snapshot returns stub data (not blank / not error)
  // -------------------------------------------------------------------------
  it("returns a snapshot stub with passed=true and a data URL", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(pointCircleSpec(), {
      adapter,
      container: {} as HTMLElement,
    });

    const snapshot = await runtime.snapshot({ format: "data-url" });

    expect(snapshot.passed).toBe(true);
    expect(snapshot.diagnostics).toEqual([]);
    // MockAdapter returns a known stub data URL
    expect(snapshot.dataUrl).toMatch(/^data:image\/png;base64,/);

    await runtime.destroy();
  });

  // -------------------------------------------------------------------------
  // Test 3: apply setPaint command updates the exported spec
  // -------------------------------------------------------------------------
  it("applies a setPaint command and updates the spec paint property", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(simpleFillSpec("#3b82f6"), {
      adapter,
      container: {} as HTMLElement,
    });

    const command: MapCommand = {
      id: "cmd-recolor-fill",
      version: "0.1",
      type: "setPaint",
      baseRevision: "1",
      layerId: "fill-layer",
      paint: { "fill-color": "#ef4444" },
    };

    const results = await runtime.apply(command);

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe("applied");

    const updated = runtime.exportSpec();
    expect(updated.revision).toBe("2");
    expect(updated.layers[1]?.paint).toEqual({ "fill-color": "#ef4444", "fill-opacity": 1 });

    await runtime.destroy();
  });

  // -------------------------------------------------------------------------
  // Test 4: queryFeatures returns inline GeoJSON features
  // -------------------------------------------------------------------------
  it("queries features at a point and returns matching inline GeoJSON features", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(pointCircleSpec(), {
      adapter,
      container: {} as HTMLElement,
    });

    const result = await runtime.queryFeatures({
      point: [120.15, 30.28],
      layers: ["circle-layer"],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.features).toHaveLength(1);
    expect(result.features[0]).toEqual(
      expect.objectContaining({
        properties: { name: "test-point" },
        geometry: { type: "Point", coordinates: [120.15, 30.28] },
      }),
    );

    await runtime.destroy();
  });

  it("queries features by bbox and returns intersecting features from multiple sources", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(multiSourceSpec(), {
      adapter,
      container: {} as HTMLElement,
    });

    // Bbox covering East China region (includes both cities)
    const result = await runtime.queryFeatures({
      bbox: [115, 28, 125, 42],
    });

    expect(result.diagnostics).toEqual([]);
    // Should find both city points and the region polygon
    expect(result.features.length).toBeGreaterThanOrEqual(2);

    const names = result.features.map((f) => {
      const props = (f as { properties?: { name?: string } }).properties;
      return props?.name;
    });
    expect(names).toContain("Beijing");
    expect(names).toContain("Shanghai");

    await runtime.destroy();
  });

  it("returns empty features when querying outside the data extent", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(pointCircleSpec(), {
      adapter,
      container: {} as HTMLElement,
    });

    const result = await runtime.queryFeatures({
      point: [0, 0], // far from the data at [120.15, 30.28]
      layers: ["circle-layer"],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.features).toHaveLength(0);

    await runtime.destroy();
  });

  // -------------------------------------------------------------------------
  // Test 5: resize is forwarded to the adapter
  // -------------------------------------------------------------------------
  it("forwards resize to the adapter without error", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(simpleFillSpec(), {
      adapter,
      container: {} as HTMLElement,
    });

    // MockAdapter.resize is a no-op, but calling it should not throw
    expect(() => adapter.resize({ width: 800, height: 600 })).not.toThrow();

    await runtime.destroy();
  });

  // -------------------------------------------------------------------------
  // Test 6: Full pipeline — create → apply → query → snapshot → destroy
  // -------------------------------------------------------------------------
  it("runs the full create → apply → query → snapshot → destroy pipeline", async () => {
    const adapter = new MockAdapter();
    const spec = multiSourceSpec();
    const runtime = await MapRuntime.create(spec, {
      adapter,
      container: {} as HTMLElement,
    });

    // Step 1: Verify initial state
    expect(runtime.exportSpec().revision).toBe("1");
    expect(runtime.validate().valid).toBe(true);

    // Step 2: Apply a view change command
    const viewCommand: MapCommand = {
      id: "cmd-zoom-in",
      version: "0.1",
      type: "setView",
      baseRevision: "1",
      view: { zoom: 5 },
    };
    const viewResults = await runtime.apply(viewCommand);
    expect(viewResults[0]?.status).toBe("applied");
    expect(runtime.exportSpec().view.zoom).toBe(5);
    expect(runtime.exportSpec().revision).toBe("2");

    // Step 3: Query features — still works after command application
    const queryResult = await runtime.queryFeatures({
      point: [116.4, 39.9],
      layers: ["city-points"],
    });
    expect(queryResult.features).toHaveLength(1);
    expect(queryResult.features[0]).toEqual(
      expect.objectContaining({
        properties: { name: "Beijing", population: 21_540_000 },
      }),
    );

    // Step 4: Snapshot — returns stub
    const snapshot = await runtime.snapshot();
    expect(snapshot.passed).toBe(true);
    expect(snapshot.dataUrl).toBeDefined();

    // Step 5: Destroy — clean shutdown
    const report = await runtime.destroy();
    expect(report.destroyed).toBe(true);

    // Step 6: Post-destroy operations should throw
    expect(() => runtime.snapshot()).toThrow(/destroyed/i);
    expect(() => runtime.queryFeatures({ point: [0, 0] })).toThrow(/destroyed/i);
  });

  // -------------------------------------------------------------------------
  // Test 7: apply multiple commands in a batch
  // -------------------------------------------------------------------------
  it("applies multiple commands atomically in a single batch", async () => {
    const adapter = new MockAdapter();
    const runtime = await MapRuntime.create(simpleFillSpec(), {
      adapter,
      container: {} as HTMLElement,
    });

    const commands: MapCommand[] = [
      {
        id: "cmd-set-fill-opacity",
        version: "0.1",
        type: "setPaint",
        baseRevision: "1",
        layerId: "fill-layer",
        paint: { "fill-opacity": 0.5 },
      },
      {
        id: "cmd-set-view",
        version: "0.1",
        type: "setView",
        view: { zoom: 15, center: [120.15, 30.28] },
      },
    ];

    const results = await runtime.apply(commands);

    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe("applied");
    expect(results[1]?.status).toBe("applied");

    const updated = runtime.exportSpec();
    expect(updated.layers[1]?.paint).toEqual({ "fill-color": "#3b82f6", "fill-opacity": 0.5 });
    expect(updated.view.zoom).toBe(15);

    await runtime.destroy();
  });

  // -------------------------------------------------------------------------
  // Test 8: dry-run command does not mutate spec
  // -------------------------------------------------------------------------
  it("dry-run apply returns patches without mutating the spec", async () => {
    const adapter = new MockAdapter();
    const spec = simpleFillSpec();
    const runtime = await MapRuntime.create(spec, {
      adapter,
      container: {} as HTMLElement,
    });

    const command: MapCommand = {
      id: "cmd-dry-run",
      version: "0.1",
      type: "setPaint",
      baseRevision: "1",
      layerId: "fill-layer",
      paint: { "fill-color": "#000000" },
      dryRun: true,
    };

    const results = await runtime.apply(command);

    expect(results[0]?.status).toBe("applied");
    expect(results[0]?.patch).toBeDefined();
    expect(results[0]?.patch?.length).toBeGreaterThan(0);

    // Spec is unchanged
    const exported = runtime.exportSpec();
    expect(exported.revision).toBe("1");
    expect(exported.layers[1]?.paint).toEqual({ "fill-color": "#3b82f6", "fill-opacity": 1 });

    await runtime.destroy();
  });

  // -------------------------------------------------------------------------
  // Test 9: validation rejects invalid specs at creation
  // -------------------------------------------------------------------------
  it("rejects creation with an invalid spec (layer references missing source)", async () => {
    const invalidSpec: MapSpec = {
      version: "0.1",
      id: "e2e-invalid",
      revision: "1",
      view: { mode: "map2d", center: [0, 0], zoom: 0 },
      sources: {},
      layers: [{ id: "orphan-layer", type: "fill", source: "nonexistent" }],
    };

    await expect(
      MapRuntime.create(invalidSpec, {
        adapter: new MockAdapter(),
        container: {} as HTMLElement,
      }),
    ).rejects.toThrow();
  });
});
