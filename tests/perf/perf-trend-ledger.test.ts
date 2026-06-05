import { describe, expect, it } from "vitest";
import { MapRuntime, MockAdapter, type MapSpec } from "@gis-engine/engine";

/**
 * VPE-002: Nightly perf trend ledger
 * Records lifecycle timing for 1k/10k/100k inline GeoJSON fixtures.
 * These are evidence-gathering tests, not PR-blocking gates.
 */
describe("perf trend ledger: lifecycle timing", () => {
  const scales = [
    { name: "1k", count: 1_000, createBudgetMs: 5_000, queryBudgetMs: 2_000, destroyBudgetMs: 1_000 },
    { name: "10k", count: 10_000, createBudgetMs: 15_000, queryBudgetMs: 5_000, destroyBudgetMs: 2_000 },
    { name: "100k", count: 100_000, createBudgetMs: 60_000, queryBudgetMs: 30_000, destroyBudgetMs: 10_000 }
  ];

  for (const { name, count, createBudgetMs, queryBudgetMs, destroyBudgetMs } of scales) {
    it(`${name}: create/query/destroy lifecycle within budget`, async () => {
      const spec = generateInlineGeoJsonSpec(count);

      const createStart = performance.now();
      const runtime = await MapRuntime.create(spec, {
        adapter: new MockAdapter(),
        container: {} as HTMLElement
      });
      const createMs = performance.now() - createStart;
      expect(createMs).toBeLessThan(createBudgetMs);

      const queryStart = performance.now();
      const result = await runtime.queryFeatures({ point: [10, 10], layers: [`scale-${name}-circle`] });
      const queryMs = performance.now() - queryStart;
      expect(queryMs).toBeLessThan(queryBudgetMs);

      const destroyStart = performance.now();
      const report = await runtime.destroy();
      const destroyMs = performance.now() - destroyStart;
      expect(destroyMs).toBeLessThan(destroyBudgetMs);

      expect(report.destroyed).toBe(true);

      // Log timing for trend ledger (informational, not blocking)
      console.log(`[perf-trend] ${name}: create=${createMs.toFixed(1)}ms query=${queryMs.toFixed(1)}ms destroy=${destroyMs.toFixed(1)}ms`);
    });
  }
});

function generateInlineGeoJsonSpec(featureCount: number): MapSpec {
  const features = Array.from({ length: featureCount }, (_, i) => ({
    type: "Feature" as const,
    properties: { id: `f-${i}`, value: i },
    geometry: {
      type: "Point" as const,
      coordinates: [10 + (i % 100) * 0.01, 10 + Math.floor(i / 100) * 0.01]
    }
  }));

  return {
    version: "0.1",
    id: `perf-trend-${featureCount}`,
    revision: "1",
    view: { mode: "map2d", center: [10, 10], zoom: 8 },
    sources: {
      [`scale-${featureCount}`]: {
        type: "geojson",
        data: { type: "FeatureCollection", features }
      }
    },
    layers: [
      {
        id: `scale-${featureCount}-circle`,
        type: "circle",
        source: `scale-${featureCount}`,
        paint: { "circle-color": "#2563eb", "circle-radius": 3 }
      }
    ]
  };
}
