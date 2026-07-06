import { applyCommands, type MapCommand, type MapSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import { measurePerfTrendScale, PERF_TREND_SCALES } from "../../scripts/perf-trend.mjs";
import beforeSpec from "../fixtures/commands/replay/style-update/before.map.json";

/**
 * VPE-002: Nightly perf trend ledger
 * Records lifecycle timing for 1k/10k/100k inline GeoJSON fixtures.
 * These are evidence-gathering tests, not PR-blocking gates.
 */
describe("perf trend ledger: lifecycle timing", () => {
  for (const scale of PERF_TREND_SCALES) {
    it(`${scale.name}: create/query/destroy lifecycle within budget`, async () => {
      const measurement = await measurePerfTrendScale(scale);

      expect(measurement.createMs).toBeLessThan(scale.createBudgetMs);
      expect(measurement.queryMs).toBeLessThan(scale.queryBudgetMs);
      expect(measurement.destroyMs).toBeLessThan(scale.destroyBudgetMs);
      expect(measurement.destroyed).toBe(true);
      expect(measurement.queryCount).toBe(1);

      // Log timing for trend ledger (informational, not blocking)
      console.log(
        `[perf-trend] ${scale.name}: create=${measurement.createMs.toFixed(1)}ms query=${measurement.queryMs.toFixed(1)}ms destroy=${measurement.destroyMs.toFixed(1)}ms`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// applyCommands batch performance benchmarks
// ---------------------------------------------------------------------------

const APPLY_COMMAND_SCALES = [
  { name: "100-commands", count: 100, budgetMs: 500 },
  { name: "500-commands", count: 500, budgetMs: 2_000 },
  { name: "1000-commands", count: 1_000, budgetMs: 5_000 },
];

describe("perf trend ledger: applyCommands batch timing", () => {
  for (const scale of APPLY_COMMAND_SCALES) {
    it(`${scale.name}: batch replay within ${scale.budgetMs}ms budget`, () => {
      const commands: MapCommand[] = Array.from({ length: scale.count }, (_, index) => ({
        id: `cmd-view-${index}`,
        version: "0.1" as const,
        type: "setView" as const,
        view: {
          zoom: 2 + (index % 18),
        },
      }));

      const startedAt = performance.now();
      const result = applyCommands(beforeSpec as MapSpec, commands, { transaction: "best-effort" });
      const elapsed = performance.now() - startedAt;

      expect(result.results.every((r) => r.status === "applied")).toBe(true);
      expect(elapsed).toBeLessThan(scale.budgetMs);

      console.log(
        `[perf-trend] applyCommands ${scale.name}: ${elapsed.toFixed(1)}ms (budget ${scale.budgetMs}ms, ${result.results.length} results)`,
      );
    });
  }

  it("mixed command types: setView + setPaint batch within budget", () => {
    const baseSpec: MapSpec = {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {
        data: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      },
      layers: [
        { id: "layer-0", type: "circle", source: "data", paint: { "circle-radius": 5, "circle-color": "#333333" } },
      ],
    };

    const commands: MapCommand[] = [];
    for (let i = 0; i < 200; i++) {
      commands.push({
        id: `cmd-setview-${i}`,
        version: "0.1",
        type: "setView",
        view: { zoom: 2 + (i % 10) },
      } as MapCommand);
      commands.push({
        id: `cmd-setpaint-${i}`,
        version: "0.1",
        type: "setPaint",
        layerId: "layer-0",
        paint: { "circle-radius": 3 + (i % 10) },
      } as MapCommand);
    }

    const startedAt = performance.now();
    const result = applyCommands(baseSpec, commands, { transaction: "best-effort" });
    const elapsed = performance.now() - startedAt;

    expect(result.results.every((r) => r.status === "applied")).toBe(true);
    expect(elapsed).toBeLessThan(3_000);

    console.log(
      `[perf-trend] applyCommands mixed-400: ${elapsed.toFixed(1)}ms (budget 3000ms, ${result.results.length} results)`,
    );
  });
});
