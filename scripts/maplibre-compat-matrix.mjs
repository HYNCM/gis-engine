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
export const MAPLIBRE_COMPATIBILITY_VERSIONS = Object.freeze([MAPLIBRE_RELEASE_BASELINE, "6.0.0-22"]);

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, "..");

function parseOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? null : (args[index + 1] ?? null);
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
    html: '<!doctype html><html><head><meta charset="UTF-8" /></head><body><div id="map"></div><div id="raw-map"></div><script type="module" src="/src/main.ts"></script></body></html>\n',
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
      error?: string;
    };
  }
}

const version = ${JSON.stringify(version)};
${usesExplicitWorker ? 'setWorkerUrl(new URL("./maplibre-gl-worker.mjs", window.location.href).href);' : ""}
const events: string[] = [];
const rawEvents: string[] = [];
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
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#f7f8fa" } },
    { id: "matrix-point", type: "circle", source: "points", paint: { "circle-radius": 28 } },
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
adapter.on("moveend", (event) => recordInteraction(event as InteractionBridgeEvent));
adapter.on("idle", async () => {
  if (window.__GIS_MATRIX_RESULT__?.status !== "loading") return;
  events.push("idle");
  const snapshot = await adapter.snapshot({ format: "png", width: 320, height: 200 });
  window.__GIS_MATRIX_RESULT__ = {
    status: "ready",
    version,
    events: [...events],
    rawEvents: [...rawEvents],
    snapshotPassed: snapshot.passed,
  };
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
    zoom: 1,
    interactive: false,
  });
  window.__GIS_MATRIX_RAW_MAP__ = rawMap;
  rawMap.on("load", () => rawEvents.push("load"));
  rawMap.on("idle", () => rawEvents.push("idle"));

  await adapter.load(spec, { container });
  const map = adapter.getMapInstance();
  if (!map) throw new Error("MapLibreAdapter did not expose a live Map instance.");
  window.__GIS_MATRIX_MAP__ = map;
  map.once("idle", () => map.jumpTo({ center: [0.1, 0.1] }));
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

function installConsumerDependencies(directory) {
  const nativePeerInstall = attemptNativePeerInstall(directory);
  if (nativePeerInstall.status === "rejected") {
    run("npm", [...NPM_INSTALL_ARGS, "--legacy-peer-deps"], { cwd: directory });
  }
  return {
    nativePeerInstall,
    peerRangeSatisfied: nativePeerInstall.status === "passed",
    peerResolution: nativePeerInstall.status === "passed" ? "native" : "forced-evidence-only",
  };
}

function writeFixture(directory, fixture) {
  mkdirSync(join(directory, "src"), { recursive: true });
  writeFileSync(join(directory, "package.json"), `${JSON.stringify(fixture.packageJson, null, 2)}\n`);
  writeFileSync(join(directory, "tsconfig.json"), `${JSON.stringify(fixture.tsconfig, null, 2)}\n`);
  writeFileSync(join(directory, "index.html"), fixture.html);
  writeFileSync(join(directory, "src", "main.ts"), fixture.source);
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

  const peerEvidence = installConsumerDependencies(fixtureDirectory);
  prepareMapLibreWorker(fixtureDirectory, fixture);
  const packageEvidence = inspectInstalledMapLibre(fixtureDirectory, version);
  packageEvidence.workerDelivery = fixture.workerDelivery;
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
    stages: {
      publicTypes: "passed",
      esmBrowserBuild: "passed",
      adapterEvents: browserEvidence.eventsStatus,
      strictVisual: browserEvidence.visualStatus,
    },
    packageEvidence,
    browserEvidence,
  };
  return result;
}

export function main(args = process.argv.slice(2)) {
  const requestedVersion = parseOption(args, "--version");
  const versions = requestedVersion ? [requestedVersion] : [...MAPLIBRE_COMPATIBILITY_VERSIONS];
  for (const version of versions) {
    if (!MAPLIBRE_COMPATIBILITY_VERSIONS.includes(version)) {
      throw new Error(`--version must be one of ${MAPLIBRE_COMPATIBILITY_VERSIONS.join(", ")}.`);
    }
  }

  const outputDirectory = resolve(repoRoot, parseOption(args, "--output") ?? "test-results/maplibre-compatibility");
  const tempRoot = mkdtempSync(join(tmpdir(), "gis-engine-maplibre-matrix-"));
  const keepTemp = args.includes("--keep-temp");

  try {
    const engineTarball = packEngine(tempRoot);
    const results = versions.map((version) => executeEntry(version, engineTarball, tempRoot));
    mkdirSync(outputDirectory, { recursive: true });
    for (const result of results) {
      writeFileSync(join(outputDirectory, `${result.version}.json`), `${JSON.stringify(result, null, 2)}\n`);
    }
    const summary = {
      generatedAt: new Date().toISOString(),
      releaseBaseline: MAPLIBRE_RELEASE_BASELINE,
      checkedVersions: versions,
      defaultDependencyChanged: false,
      results,
    };
    writeFileSync(join(outputDirectory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
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
