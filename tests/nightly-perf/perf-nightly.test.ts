import { describe, expect, it } from "vitest";
import { createMap, type MapSpec } from "@gis-engine/engine";

const scales = [
  { featureCount: 1_000, createBudgetMs: 1_500, queryBudgetMs: 1_000, snapshotBudgetMs: 500, destroyBudgetMs: 500 },
  { featureCount: 10_000, createBudgetMs: 3_000, queryBudgetMs: 1_500, snapshotBudgetMs: 500, destroyBudgetMs: 500 },
  { featureCount: 100_000, createBudgetMs: 10_000, queryBudgetMs: 5_000, snapshotBudgetMs: 500, destroyBudgetMs: 500 }
] as const;

describe("nightly performance evidence", () => {
  it.each(scales)(
    "keeps create/query/snapshot/destroy within nightly budgets for $featureCount inline features",
    async ({ featureCount, createBudgetMs, queryBudgetMs, snapshotBudgetMs, destroyBudgetMs }) => {
      const spec = createLargeGeoJsonSpec(featureCount);

      const createStartedAt = performance.now();
      const runtime = await createMap({} as HTMLElement, spec, { renderer: "mock" });
      const createMs = performance.now() - createStartedAt;

      const queryStartedAt = performance.now();
      const query = await runtime.queryFeatures({ point: [10, 10], layers: ["nightly-points"] });
      const queryMs = performance.now() - queryStartedAt;

      const snapshotStartedAt = performance.now();
      const snapshot = await runtime.snapshot({ targetLayers: ["nightly-points"] });
      const snapshotMs = performance.now() - snapshotStartedAt;

      const destroyStartedAt = performance.now();
      const resourceReport = await runtime.destroy();
      const destroyMs = performance.now() - destroyStartedAt;

      expect(query.features).toHaveLength(1);
      expect(snapshot.passed).toBe(true);
      expect(resourceReport.destroyed).toBe(true);

      expect(createMs).toBeLessThan(createBudgetMs);
      expect(queryMs).toBeLessThan(queryBudgetMs);
      expect(snapshotMs).toBeLessThan(snapshotBudgetMs);
      expect(destroyMs).toBeLessThan(destroyBudgetMs);
    }
  );
});

function createLargeGeoJsonSpec(featureCount: number): MapSpec {
  return {
    version: "0.1",
    id: `nightly-perf-${featureCount}`,
    revision: "1",
    view: {
      mode: "map2d",
      center: [10, 10],
      zoom: 4
    },
    sources: {
      nightly: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: buildFeatures(featureCount)
        }
      }
    },
    layers: [
      {
        id: "nightly-points",
        type: "circle",
        source: "nightly",
        paint: {
          "circle-radius": 4,
          "circle-color": "#0f172a"
        }
      }
    ]
  };
}

function buildFeatures(featureCount: number): Array<{ type: "Feature"; properties: Record<string, unknown>; geometry: { type: "Point"; coordinates: [number, number] } }> {
  const features = Array.from({ length: featureCount }, (_, index) => ({
    type: "Feature" as const,
    properties: {
      id: index,
      group: index % 2 === 0 ? "even" : "odd"
    },
    geometry: {
      type: "Point" as const,
      coordinates: index === 0 ? ([10, 10] as [number, number]) : ([10 + index * 0.00001, 10 + index * 0.00001] as [number, number])
    }
  }));

  return features;
}
