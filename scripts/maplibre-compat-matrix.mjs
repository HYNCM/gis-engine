#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MAPLIBRE_RELEASE_BASELINE = "5.24.0";
export const MAPLIBRE_COMPATIBILITY_VERSIONS = Object.freeze([MAPLIBRE_RELEASE_BASELINE, "6.1.0"]);

const OVERSCALED_VECTOR_TILE_BASE64 = "Gjd4AQoGbWF0cml4KIAgEg0SAgAAGAEiBQmAIIAgGgRuYW1lIhMKEW92ZXJzY2FsZWQtbWF0cml4";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, "..");

function parseOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? null : (args[index + 1] ?? null);
}

function timingDelta(baseline, candidate) {
  const delta = candidate - baseline;
  return {
    baseline,
    candidate,
    delta,
    deltaPercent: baseline === 0 ? null : Math.round((delta / baseline) * 100_000) / 1_000,
  };
}

export function buildPerformanceDelta(results) {
  const baseline = results.find((result) => result.version === MAPLIBRE_RELEASE_BASELINE);
  const candidate = results.find((result) => result.version === "6.1.0");
  if (!baseline || !candidate) return null;
  return {
    baselineVersion: baseline.version,
    candidateVersion: candidate.version,
    renderDurationMs: timingDelta(baseline.renderDurationMs, candidate.renderDurationMs),
    queryDurationMs: timingDelta(baseline.queryDurationMs, candidate.queryDurationMs),
  };
}

function aggregateError(code, message) {
  return new Error(`[${code}] ${message}`);
}

export function aggregateMatrixSummaries(summaries, generatedAt = new Date().toISOString()) {
  if (!Array.isArray(summaries)) {
    throw aggregateError("MAPLIBRE_AGGREGATE_INVALID_ENTRY", "Aggregate inputs must be an array of summaries.");
  }

  const resultsByVersion = new Map();
  for (const summary of summaries) {
    if (!Array.isArray(summary?.checkedVersions) || !Array.isArray(summary?.results)) {
      throw aggregateError(
        "MAPLIBRE_AGGREGATE_INVALID_ENTRY",
        "Each aggregate input must contain checkedVersions and results arrays.",
      );
    }
    if (summary.checkedVersions.length !== 1 || summary.results.length !== 1) {
      throw aggregateError(
        "MAPLIBRE_AGGREGATE_INVALID_ENTRY",
        "Each aggregate input must contain exactly one checked version and one result.",
      );
    }

    const checkedVersion = summary.checkedVersions[0];
    const result = summary.results[0];
    if (checkedVersion !== result?.version) {
      throw aggregateError(
        "MAPLIBRE_AGGREGATE_VERSION_MISMATCH",
        `Summary checked version ${checkedVersion ?? "unknown"} does not match result version ${result?.version ?? "unknown"}.`,
      );
    }
    if (!MAPLIBRE_COMPATIBILITY_VERSIONS.includes(checkedVersion)) {
      throw aggregateError(
        "MAPLIBRE_AGGREGATE_VERSION_MISMATCH",
        `Aggregate entry version ${checkedVersion} is outside ${MAPLIBRE_COMPATIBILITY_VERSIONS.join(", ")}.`,
      );
    }
    if (resultsByVersion.has(checkedVersion)) {
      throw aggregateError("MAPLIBRE_AGGREGATE_DUPLICATE_VERSION", `Duplicate aggregate entry for ${checkedVersion}.`);
    }
    if (result.status !== "passed") {
      throw aggregateError(
        "MAPLIBRE_AGGREGATE_ENTRY_FAILED",
        `Aggregate entry ${checkedVersion} has non-passing status ${result.status ?? "unknown"}.`,
      );
    }
    if (!Number.isFinite(result.renderDurationMs) || !Number.isFinite(result.queryDurationMs)) {
      throw aggregateError(
        "MAPLIBRE_AGGREGATE_INVALID_ENTRY",
        `Aggregate entry ${checkedVersion} is missing finite render/query timings.`,
      );
    }
    resultsByVersion.set(checkedVersion, result);
  }

  const missingVersions = MAPLIBRE_COMPATIBILITY_VERSIONS.filter((version) => !resultsByVersion.has(version));
  if (missingVersions.length > 0) {
    throw aggregateError(
      "MAPLIBRE_AGGREGATE_MISSING_VERSION",
      `Missing exact compatibility result(s): ${missingVersions.join(", ")}.`,
    );
  }

  const results = MAPLIBRE_COMPATIBILITY_VERSIONS.map((version) => resultsByVersion.get(version));
  return {
    generatedAt,
    releaseBaseline: MAPLIBRE_RELEASE_BASELINE,
    checkedVersions: [...MAPLIBRE_COMPATIBILITY_VERSIONS],
    defaultDependencyChanged: false,
    performanceDelta: buildPerformanceDelta(results),
    results,
  };
}

function findSummaryFiles(directory) {
  const summaries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      summaries.push(...findSummaryFiles(path));
    } else if (entry.isFile() && entry.name === "summary.json") {
      summaries.push(path);
    }
  }
  return summaries;
}

function writeMatrixSummary(outputDirectory, summary) {
  mkdirSync(outputDirectory, { recursive: true });
  for (const result of summary.results) {
    writeFileSync(join(outputDirectory, `${result.version}.json`), `${JSON.stringify(result, null, 2)}\n`);
  }
  writeFileSync(join(outputDirectory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

export function createConsumerFixture(version, engineTarball) {
  if (!MAPLIBRE_COMPATIBILITY_VERSIONS.includes(version)) {
    throw new Error(
      `Unsupported MapLibre matrix version ${version}. Expected one of: ${MAPLIBRE_COMPATIBILITY_VERSIONS.join(", ")}.`,
    );
  }

  const usesExplicitWorker = version.startsWith("6.");
  return {
    workerDelivery: usesExplicitWorker ? "explicit-module-worker" : "package-default",
    workerPath: usesExplicitWorker ? "/maplibre-gl-worker.mjs" : "package-default-blob-worker",
    cspWorkerSource: usesExplicitWorker ? "'self'" : "blob:",
    cspScriptSource: "'self' 'unsafe-eval'",
    importForm: "named-esm",
    packageJson: {
      name: `gis-engine-maplibre-${version.replaceAll(".", "-")}`,
      version: "0.0.0",
      private: true,
      type: "module",
      dependencies: {
        "@gis-engine/engine": `file:${engineTarball}`,
        "maplibre-gl": version,
      },
    },
    tsconfig: {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        noEmit: true,
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        skipLibCheck: false,
      },
      include: ["src/**/*.ts"],
    },
    html: '<!doctype html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; worker-src \'self\' blob:; img-src \'self\' data: blob:; connect-src \'self\'" /></head><body><div id="map" style="width:320px;height:200px"></div><div id="raw-map" style="width:320px;height:200px"></div><script type="module" src="/src/main.ts"></script></body></html>\n',
    source: `import "maplibre-gl/dist/maplibre-gl.css";
import { Map as RawMap, ${usesExplicitWorker ? "setWorkerUrl, " : ""}type StyleSpecification } from "maplibre-gl";
import {
  MapLibreAdapter,
  type InteractionBridgeEvent,
  type MapSpec,
} from "@gis-engine/engine";

declare global {
  interface Window {
    __GIS_MATRIX_MAP__?: import("maplibre-gl").Map;
    __GIS_MATRIX_RAW_MAP__?: import("maplibre-gl").Map;
    __GIS_MATRIX_RESULT__?: {
      status: "loading" | "ready" | "error";
      version: string;
      events: string[];
      rawEvents?: string[];
      snapshotPassed?: boolean;
      missingStyleImageHandled?: boolean;
      overscaledQueryPassed?: boolean;
      queryRenderedFeaturesCount?: number;
      adapterQueryFeaturesCount?: number;
      adapterQueryPassed?: boolean;
      adapterQueryDiagnostics?: unknown[];
      adapterQueryFeatureIdentity?: {
        properties: { name: string | null };
        layer: { id: string | null };
        source: string | null;
      };
      renderDurationMs?: number;
      queryDurationMs?: number;
      error?: string;
    };
  }
}

const version = ${JSON.stringify(version)};
${usesExplicitWorker ? 'setWorkerUrl(new URL("./maplibre-gl-worker.mjs", window.location.href).href);' : ""}
const events: string[] = [];
const rawEvents: string[] = [];
const renderStartedAt = performance.now();
let adapterIdle = false;
let adapterMoved = false;
let rawIdle = false;
let missingStyleImageHandled = false;
let completing = false;
window.__GIS_MATRIX_RESULT__ = { status: "loading", version, events, rawEvents };

const rawStyle: StyleSpecification = {
  version: 8,
  sources: {
    points: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "raw-matrix" },
            geometry: { type: "Point", coordinates: [0, 0] },
          },
        ],
      },
    },
    overscaled: {
      type: "vector",
      tiles: [\`\${window.location.origin}/tiles/{z}/{x}/{y}.pbf\`],
      minzoom: 0,
      maxzoom: 0,
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#f7f8fa" } },
    { id: "matrix-point", type: "circle", source: "points", paint: { "circle-radius": 28 } },
    {
      id: "overscaled-point",
      type: "circle",
      source: "overscaled",
      "source-layer": "matrix",
      paint: { "circle-radius": 20, "circle-color": "#197a5b" },
    },
  ],
};

const spec: MapSpec = {
  version: "0.1",
  id: "maplibre-compatibility-matrix",
  view: { center: [0, 0], zoom: 1 },
  sources: {
    points: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "matrix" },
            geometry: { type: "Point", coordinates: [0, 0] },
          },
        ],
      },
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#f7f8fa" } },
    {
      id: "matrix-point",
      type: "circle",
      source: "points",
      paint: {
        "circle-radius": 28,
        "circle-color": "#d94841",
        "circle-stroke-color": "#152536",
        "circle-stroke-width": 4,
      },
    },
  ],
};

function recordInteraction(event: InteractionBridgeEvent): void {
  events.push(event.type);
}

const adapter = new MapLibreAdapter();
adapter.on("load", () => events.push("load"));
adapter.on("moveend", (event) => {
  recordInteraction(event as InteractionBridgeEvent);
  adapterMoved = true;
  void completeEvidence();
});
adapter.on("idle", async () => {
  events.push("idle");
  adapterIdle = true;
  void completeEvidence();
});
adapter.on("error", (event) => {
  window.__GIS_MATRIX_RESULT__ = {
    status: "error",
    version,
    events: [...events],
    rawEvents: [...rawEvents],
    error: event instanceof Error ? event.message : JSON.stringify(event),
  };
});

async function completeEvidence(): Promise<void> {
  if (completing || !adapterIdle || !adapterMoved || !rawIdle || window.__GIS_MATRIX_RESULT__?.status !== "loading") {
    return;
  }
  completing = true;
  try {
    const map = adapter.getMapInstance();
    const rawMap = window.__GIS_MATRIX_RAW_MAP__;
    if (!map || !rawMap) throw new Error("Compatibility maps were not ready for evidence collection.");

    const queryStartedAt = performance.now();
    const rawFeatures = rawMap.queryRenderedFeatures(rawMap.project([0, 0]), { layers: ["overscaled-point"] });
    const adapterFeatures = await adapter.queryFeatures({ point: [0, 0], layers: ["matrix-point"] });
    const queryDurationMs = performance.now() - queryStartedAt;
    const snapshot = await adapter.snapshot({ format: "png", width: 320, height: 200 });
    const adapterFeature = adapterFeatures.features[0];
    const adapterFeatureRecord =
      adapterFeature && typeof adapterFeature === "object" && !Array.isArray(adapterFeature)
        ? (adapterFeature as Record<string, unknown>)
        : {};
    const adapterProperties =
      adapterFeatureRecord.properties &&
      typeof adapterFeatureRecord.properties === "object" &&
      !Array.isArray(adapterFeatureRecord.properties)
        ? (adapterFeatureRecord.properties as Record<string, unknown>)
        : {};
    const adapterLayer =
      adapterFeatureRecord.layer &&
      typeof adapterFeatureRecord.layer === "object" &&
      !Array.isArray(adapterFeatureRecord.layer)
        ? (adapterFeatureRecord.layer as Record<string, unknown>)
        : {};
    const adapterQueryFeatureIdentity = {
      properties: { name: typeof adapterProperties.name === "string" ? adapterProperties.name : null },
      layer: { id: typeof adapterLayer.id === "string" ? adapterLayer.id : null },
      source: typeof adapterFeatureRecord.source === "string" ? adapterFeatureRecord.source : null,
    };
    const expectedAdapterFeatureIdentity = {
      properties: { name: "matrix" },
      layer: { id: "matrix-point" },
      source: "points",
    };
    const adapterQueryPassed =
      adapterFeatures.diagnostics.length === 0 &&
      adapterFeatures.features.length > 0 &&
      adapterQueryFeatureIdentity.properties.name === expectedAdapterFeatureIdentity.properties.name &&
      adapterQueryFeatureIdentity.layer.id === expectedAdapterFeatureIdentity.layer.id &&
      adapterQueryFeatureIdentity.source === expectedAdapterFeatureIdentity.source;
    const overscaledQueryPassed = rawFeatures.some(
      (feature) => feature.properties?.name === "overscaled-matrix" && feature.layer.id === "overscaled-point",
    );
    window.__GIS_MATRIX_RESULT__ = {
      status: "ready",
      version,
      events: [...events],
      rawEvents: [...rawEvents],
      snapshotPassed: snapshot.passed,
      missingStyleImageHandled,
      overscaledQueryPassed,
      queryRenderedFeaturesCount: rawFeatures.length,
      adapterQueryFeaturesCount: adapterFeatures.features.length,
      adapterQueryPassed,
      adapterQueryDiagnostics: adapterFeatures.diagnostics,
      adapterQueryFeatureIdentity,
      renderDurationMs: performance.now() - renderStartedAt,
      queryDurationMs,
    };
  } catch (error) {
    window.__GIS_MATRIX_RESULT__ = {
      status: "error",
      version,
      events: [...events],
      rawEvents: [...rawEvents],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function start(): Promise<void> {
  const container = document.querySelector<HTMLElement>("#map");
  const rawContainer = document.querySelector<HTMLElement>("#raw-map");
  if (!container) throw new Error("Generated example did not mount #map.");
  if (!rawContainer) throw new Error("Generated example did not mount #raw-map.");
  container.style.width = "320px";
  container.style.height = "200px";
  rawContainer.style.width = "320px";
  rawContainer.style.height = "200px";

  const rawMap = new RawMap({
    container: rawContainer,
    style: rawStyle,
    center: [0, 0],
    zoom: 4,
    interactive: false,
  });
  window.__GIS_MATRIX_RAW_MAP__ = rawMap;
  rawMap.on("styleimagemissing", (event) => {
    rawEvents.push("styleimagemissing");
    if (event.id === "matrix-missing-icon" && !rawMap.hasImage(event.id)) {
      rawMap.addImage(event.id, { width: 1, height: 1, data: new Uint8Array([25, 122, 91, 255]) });
      missingStyleImageHandled = true;
    }
  });
  rawMap.on("load", () => {
    rawEvents.push("load");
    rawMap.addLayer({
      id: "missing-image-symbol",
      type: "symbol",
      source: "points",
      layout: { "icon-image": "matrix-missing-icon", "icon-size": 2 },
    });
  });
  rawMap.on("idle", () => {
    rawEvents.push("idle");
    rawIdle = true;
    void completeEvidence();
  });

  await adapter.load(spec, { container });
  const map = adapter.getMapInstance();
  if (!map) throw new Error("MapLibreAdapter did not expose a live Map instance.");
  window.__GIS_MATRIX_MAP__ = map;
  map.jumpTo({ center: [0, 0], zoom: 2 });
}

void start().catch((error: unknown) => {
  window.__GIS_MATRIX_RESULT__ = {
    status: "error",
    version,
    events: [...events],
    rawEvents: [...rawEvents],
    error: error instanceof Error ? error.message : String(error),
  };
});
`,
  };
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });
}

const NPM_INSTALL_ARGS = ["install", "--ignore-scripts", "--no-package-lock", "--no-audit", "--no-fund"];

function summarizeInstallError(error) {
  const stderr = String(error?.stderr ?? "");
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => line.includes("ERESOLVE")) ?? lines[0] ?? "native npm install rejected";
}

function attemptNativePeerInstall(directory) {
  try {
    execFileSync("npm", NPM_INSTALL_ARGS, {
      cwd: directory,
      env: process.env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: "passed", error: null };
  } catch (error) {
    rmSync(join(directory, "node_modules"), { recursive: true, force: true });
    return { status: "rejected", error: summarizeInstallError(error) };
  }
}

export function requireNativePeerInstall(version, nativePeerInstall) {
  if (nativePeerInstall.status !== "passed") {
    throw new Error(
      `[MAPLIBRE_NATIVE_INSTALL_REJECTED] Native npm install rejected exact MapLibre ${version}: ${nativePeerInstall.error ?? "unknown error"}. The stable compatibility matrix requires native peer resolution; update the engine peer range or select a compatible exact version before rerunning.`,
    );
  }
  return {
    nativePeerInstall,
    peerRangeSatisfied: true,
    peerResolution: "native",
  };
}

function installConsumerDependencies(directory, version) {
  return requireNativePeerInstall(version, attemptNativePeerInstall(directory));
}

export function adapterQueryStageStatus(browserEvidence) {
  return browserEvidence.adapterQueryPassed === true ? "passed" : "failed";
}

function writeFixture(directory, fixture) {
  mkdirSync(join(directory, "src"), { recursive: true });
  writeFileSync(join(directory, "package.json"), `${JSON.stringify(fixture.packageJson, null, 2)}\n`);
  writeFileSync(join(directory, "tsconfig.json"), `${JSON.stringify(fixture.tsconfig, null, 2)}\n`);
  writeFileSync(join(directory, "index.html"), fixture.html);
  writeFileSync(join(directory, "src", "main.ts"), fixture.source);
  const tileDirectory = join(directory, "public", "tiles", "0", "0");
  mkdirSync(tileDirectory, { recursive: true });
  writeFileSync(join(tileDirectory, "0.pbf"), Buffer.from(OVERSCALED_VECTOR_TILE_BASE64, "base64"));
}

function inspectInstalledMapLibre(directory, checkedVersion) {
  const packageRoot = join(directory, "node_modules", "maplibre-gl");
  const packageJsonPath = join(packageRoot, "package.json");
  const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  if (manifest.version !== checkedVersion) {
    throw new Error(`MapLibre install drift: requested ${checkedVersion}, installed ${manifest.version ?? "unknown"}.`);
  }

  const esmCandidates = ["dist/maplibre-gl.mjs", "dist/maplibre-gl.js"];
  return {
    requestedVersion: checkedVersion,
    installedVersion: manifest.version,
    packageType: manifest.type ?? null,
    mainEntry: manifest.main ?? null,
    typeEntry: manifest.types ?? manifest.typings ?? null,
    exportsDeclared: Boolean(manifest.exports),
    importForm: "named-esm",
    esmEntry: esmCandidates.find((candidate) => existsSync(join(packageRoot, candidate))) ?? null,
    umdEntry: existsSync(join(packageRoot, "dist", "maplibre-gl.js")) ? "dist/maplibre-gl.js" : null,
    packageJsonSha256: createHash("sha256").update(readFileSync(packageJsonPath)).digest("hex"),
  };
}

function prepareMapLibreWorker(directory, fixture) {
  if (fixture.workerDelivery !== "explicit-module-worker") return;
  const publicDirectory = join(directory, "public");
  mkdirSync(publicDirectory, { recursive: true });
  copyFileSync(
    join(directory, "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs"),
    join(publicDirectory, "maplibre-gl-worker.mjs"),
  );
  copyFileSync(
    join(directory, "node_modules", "maplibre-gl", "dist", "maplibre-gl-shared.mjs"),
    join(publicDirectory, "maplibre-gl-shared.mjs"),
  );
}

function packEngine(tempRoot) {
  const packDirectory = join(tempRoot, "pack");
  mkdirSync(packDirectory, { recursive: true });
  run("pnpm", ["--filter", "@gis-engine/engine", "build"]);
  run("pnpm", ["--filter", "@gis-engine/engine", "pack", "--pack-destination", packDirectory]);
  const tarballs = readdirSync(packDirectory).filter((file) => file.endsWith(".tgz"));
  if (tarballs.length !== 1) throw new Error(`Expected one packed engine tarball, found ${tarballs.length}.`);
  return join(packDirectory, tarballs[0]);
}

function executeEntry(version, engineTarball, tempRoot) {
  const startedAt = new Date().toISOString();
  const fixtureDirectory = join(tempRoot, `maplibre-${version}`);
  mkdirSync(fixtureDirectory, { recursive: true });
  const fixture = createConsumerFixture(version, engineTarball);
  writeFixture(fixtureDirectory, fixture);

  const peerEvidence = installConsumerDependencies(fixtureDirectory, version);
  prepareMapLibreWorker(fixtureDirectory, fixture);
  const packageEvidence = inspectInstalledMapLibre(fixtureDirectory, version);
  packageEvidence.workerDelivery = fixture.workerDelivery;
  packageEvidence.workerPath = fixture.workerPath;
  packageEvidence.cspWorkerSource = fixture.cspWorkerSource;
  packageEvidence.cspScriptSource = fixture.cspScriptSource;
  run(join(repoRoot, "node_modules", ".bin", "tsc"), ["--project", "tsconfig.json"], {
    cwd: fixtureDirectory,
  });
  run(join(repoRoot, "node_modules", ".bin", "vite"), ["build", "--base", "./", "--outDir", "dist"], {
    cwd: fixtureDirectory,
  });
  const browserResultPath = join(fixtureDirectory, "browser-result.json");
  run("pnpm", ["exec", "playwright", "test", "tests/compatibility/maplibre-compatibility.spec.ts"], {
    cwd: repoRoot,
    env: {
      MAPLIBRE_MATRIX_DIST: join(fixtureDirectory, "dist"),
      MAPLIBRE_MATRIX_VERSION: version,
      MAPLIBRE_MATRIX_BROWSER_RESULT: browserResultPath,
      GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT: "1",
    },
  });
  const browserEvidence = JSON.parse(readFileSync(browserResultPath, "utf8"));

  const result = {
    version,
    releaseBaseline: version === MAPLIBRE_RELEASE_BASELINE,
    status: browserEvidence.status === "passed" ? "passed" : "evidence-only-blocked",
    checkedAt: startedAt,
    peerRangeSatisfied: peerEvidence.peerRangeSatisfied,
    peerResolution: peerEvidence.peerResolution,
    nativePeerInstall: peerEvidence.nativePeerInstall,
    browserEngine: browserEvidence.browserEngine,
    importForm: browserEvidence.importForm,
    workerPath: browserEvidence.workerPath,
    cspWorkerSource: browserEvidence.cspWorkerSource,
    cspScriptSource: browserEvidence.cspScriptSource,
    renderDurationMs: browserEvidence.renderDurationMs,
    queryDurationMs: browserEvidence.queryDurationMs,
    stages: {
      publicTypes: "passed",
      esmBrowserBuild: "passed",
      adapterEvents: browserEvidence.eventsStatus,
      strictVisual: browserEvidence.visualStatus,
      missingStyleImage: browserEvidence.missingStyleImageHandled ? "passed" : "failed",
      overscaledVectorQuery: browserEvidence.overscaledQueryPassed ? "passed" : "failed",
      queryRenderedFeatures: adapterQueryStageStatus(browserEvidence),
    },
    packageEvidence,
    browserEvidence,
  };
  return result;
}

export function main(args = process.argv.slice(2)) {
  const requestedVersion = parseOption(args, "--version");
  const aggregateInput = parseOption(args, "--aggregate-input");
  const outputDirectory = resolve(repoRoot, parseOption(args, "--output") ?? "test-results/maplibre-compatibility");
  if (args.includes("--aggregate-input")) {
    if (!aggregateInput) {
      throw aggregateError("MAPLIBRE_AGGREGATE_INVALID_ENTRY", "--aggregate-input requires a directory.");
    }
    if (requestedVersion) {
      throw aggregateError("MAPLIBRE_AGGREGATE_INVALID_ENTRY", "--aggregate-input cannot be combined with --version.");
    }
    const inputDirectory = resolve(repoRoot, aggregateInput);
    const summaries = findSummaryFiles(inputDirectory).map((path) => JSON.parse(readFileSync(path, "utf8")));
    const summary = aggregateMatrixSummaries(summaries);
    writeMatrixSummary(outputDirectory, summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  const versions = requestedVersion ? [requestedVersion] : [...MAPLIBRE_COMPATIBILITY_VERSIONS];
  for (const version of versions) {
    if (!MAPLIBRE_COMPATIBILITY_VERSIONS.includes(version)) {
      throw new Error(`--version must be one of ${MAPLIBRE_COMPATIBILITY_VERSIONS.join(", ")}.`);
    }
  }

  const tempRoot = mkdtempSync(join(tmpdir(), "gis-engine-maplibre-matrix-"));
  const keepTemp = args.includes("--keep-temp");

  try {
    const engineTarball = packEngine(tempRoot);
    const results = versions.map((version) => executeEntry(version, engineTarball, tempRoot));
    const summary = {
      generatedAt: new Date().toISOString(),
      releaseBaseline: MAPLIBRE_RELEASE_BASELINE,
      checkedVersions: versions,
      defaultDependencyChanged: false,
      performanceDelta: buildPerformanceDelta(results),
      results,
    };
    writeMatrixSummary(outputDirectory, summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    if (keepTemp) {
      process.stderr.write(`MapLibre matrix temp fixture preserved at ${tempRoot}\n`);
    } else {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
