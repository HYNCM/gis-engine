#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createMap } from "../packages/engine/src/index.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");

export const PERF_TREND_SCALES = [
  { name: "1k", featureCount: 1_000, createBudgetMs: 5_000, queryBudgetMs: 2_000, destroyBudgetMs: 1_000 },
  { name: "10k", featureCount: 10_000, createBudgetMs: 15_000, queryBudgetMs: 5_000, destroyBudgetMs: 2_000 },
  { name: "100k", featureCount: 100_000, createBudgetMs: 60_000, queryBudgetMs: 30_000, destroyBudgetMs: 10_000 }
];

export async function measurePerfTrendScale(scale) {
  const spec = createInlineGeoJsonSpec(scale);

  const createStartedAt = performance.now();
  const runtime = await createMap({}, spec, { renderer: "mock" });
  const createMs = performance.now() - createStartedAt;

  const queryStartedAt = performance.now();
  const query = await runtime.queryFeatures({ point: [10, 10], layers: [`scale-${scale.name}-circle`] });
  const queryMs = performance.now() - queryStartedAt;

  const destroyStartedAt = performance.now();
  const report = await runtime.destroy();
  const destroyMs = performance.now() - destroyStartedAt;

  const passed =
    createMs < scale.createBudgetMs && queryMs < scale.queryBudgetMs && destroyMs < scale.destroyBudgetMs;

  return {
    ...scale,
    createMs,
    queryMs,
    destroyMs,
    passed,
    queryCount: query.features.length,
    destroyed: report.destroyed
  };
}

export async function collectPerfTrendMeasurements(scales = PERF_TREND_SCALES) {
  const measurements = [];
  for (const scale of scales) {
    measurements.push(await measurePerfTrendScale(scale));
  }
  return measurements;
}

export function formatPerfTrendReport({
  period,
  generatedAt,
  repoRevision,
  measurements
}) {
  const lines = [
    "---",
    "title: Perf Trend Ledger",
    `period: ${period}`,
    `generated_at: ${generatedAt}`,
    `repo_revision: "${repoRevision}"`,
    "inputs:",
    "  - tests/perf/perf-trend-ledger.test.ts",
    "owner: \"@builder @quality\"",
    "decision_level: info",
    "---",
    "",
    `# Perf Trend Ledger: ${period}`,
    "",
    "Evidence only. This report records local create/query/destroy measurements for inline GeoJSON fixtures.",
    "",
    "| Scale | Features | Create (ms) | Query (ms) | Destroy (ms) | Budgets (ms) | Pass |",
    "| --- | ---: | ---: | ---: | ---: | --- | --- |"
  ];

  for (const measurement of measurements) {
    lines.push(
      `| ${measurement.name} | ${measurement.featureCount} | ${measurement.createMs.toFixed(1)} | ${measurement.queryMs.toFixed(1)} | ${measurement.destroyMs.toFixed(1)} | ${measurement.createBudgetMs} / ${measurement.queryBudgetMs} / ${measurement.destroyBudgetMs} | ${measurement.passed ? "yes" : "no"} |`
    );
  }

  const passedCount = measurements.filter((measurement) => measurement.passed).length;
  lines.push(
    "",
    `Passed scales: ${passedCount}/${measurements.length}`,
    `Collected at: ${generatedAt}`
  );

  return `${lines.join("\n")}\n`;
}

export async function writePerfTrendReport(options = {}) {
  const period = options.period ?? utcWeekStamp();
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const repoRevision = options.repoRevision ?? gitRevision();
  const measurements = options.measurements ?? (await collectPerfTrendMeasurements());
  const markdown = formatPerfTrendReport({ period, generatedAt, repoRevision, measurements });

  if (options.outputPath) {
    const outputPath = resolve(ROOT, options.outputPath);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, markdown, "utf8");
  }

  return { period, generatedAt, repoRevision, measurements, markdown };
}

function createInlineGeoJsonSpec(scale) {
  const { featureCount, name } = scale;
  const features = Array.from({ length: featureCount }, (_unused, index) => ({
    type: "Feature",
    properties: { id: `f-${index}`, value: index },
    geometry: {
      type: "Point",
      coordinates: [10 + (index % 100) * 0.01, 10 + Math.floor(index / 100) * 0.01]
    }
  }));

  return {
    version: "0.1",
    id: `perf-trend-${featureCount}`,
    revision: "1",
    view: { mode: "map2d", center: [10, 10], zoom: 8 },
    sources: {
      [`scale-${name}`]: {
        type: "geojson",
        data: { type: "FeatureCollection", features }
      }
    },
    layers: [
      {
        id: `scale-${name}-circle`,
        type: "circle",
        source: `scale-${name}`,
        paint: { "circle-color": "#2563eb", "circle-radius": 3 }
      }
    ]
  };
}

function utcWeekStamp(date = new Date()) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() + 3 - ((copy.getUTCDay() + 6) % 7));
  const week1 = new Date(Date.UTC(copy.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((copy.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7);
  return `${copy.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function gitRevision() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8"
    }).trim();
  } catch {
    return "unknown";
  }
}

function parseArgs(argv) {
  const args = {
    outputPath: undefined,
    period: undefined
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--output") {
      args.outputPath = argv[index + 1];
      index += 1;
    } else if (value.startsWith("--output=")) {
      args.outputPath = value.slice("--output=".length);
    } else if (value === "--period") {
      args.period = argv[index + 1];
      index += 1;
    } else if (value.startsWith("--period=")) {
      args.period = value.slice("--period=".length);
    }
  }

  return args;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const result = await writePerfTrendReport({
    outputPath: args.outputPath,
    period: args.period
  });
  if (!args.outputPath) {
    process.stdout.write(result.markdown);
  } else {
    process.stdout.write(`Perf trend report written: ${resolve(ROOT, args.outputPath)}\n`);
  }
}
