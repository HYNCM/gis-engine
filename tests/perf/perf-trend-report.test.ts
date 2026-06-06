import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  comparePerfTrendMeasurements,
  readLatestPerfTrendReport,
  readPerfTrendReport,
  writePerfTrendReport,
} from "../../scripts/perf-trend.mjs";

const tempOutputs: string[] = [];
const previousReportPath = fileURLToPath(new URL("../../docs/reviews/perf-trend-2026-W24.md", import.meta.url));

afterEach(() => {
  while (tempOutputs.length > 0) {
    const path = tempOutputs.pop();
    if (!path) continue;
    try {
      unlinkSync(path);
    } catch {
      // ignore cleanup failures in temp fixtures
    }
  }
});

describe("perf trend report generation", () => {
  it("compares the current cut against the previous weekly report", async () => {
    const previous = readPerfTrendReport(previousReportPath);
    const latestReport = readLatestPerfTrendReport();
    const currentMeasurements = previous.measurements.map((measurement, index) => ({
      ...measurement,
      createMs: Math.max(0, measurement.createMs - 0.5 - index * 0.1),
      queryMs: Math.max(0, measurement.queryMs - 0.25 - index * 0.05),
      destroyMs: Math.max(0, measurement.destroyMs),
      passed: true,
    }));
    const comparison = comparePerfTrendMeasurements(currentMeasurements, previous.measurements);
    const outputPath = join(tmpdir(), `perf-trend-${Date.now()}.md`);
    tempOutputs.push(outputPath);

    expect(comparison).toHaveLength(previous.measurements.length);
    expect(comparison[0].createDeltaMs ?? 0).toBeLessThanOrEqual(0);

    const result = await writePerfTrendReport({
      outputPath,
      period: "2026-W23",
      generatedAt: "2026-06-06T00:00:00Z",
      repoRevision: "test",
      measurements: currentMeasurements,
    });
    const markdown = readFileSync(outputPath, "utf8");

    expect(result.markdown).toContain("## Trend Comparison");
    expect(markdown).toContain(`Compared with ${latestReport?.file}`);
    expect(markdown).toContain("| 1k |");
    expect(markdown).toMatch(/\| 1k \| [-+0-9.]+ \| [-+0-9.]+ \| [-+0-9.]+ \|/);
  });
});
