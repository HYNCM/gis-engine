import { describe, expect, it } from "vitest";
import { measurePerfTrendScale, PERF_TREND_SCALES } from "../../scripts/perf-trend.mjs";

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
