import { chromium, expect, test, type Page, type TestInfo } from "@playwright/test";
import { Buffer } from "node:buffer";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { assertSnapshotReport, type SnapshotReport } from "../report.js";

const require = createRequire(import.meta.url);
const width = 320;
const height = 200;
const strictVisualSnapshot = process.env.GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT === "1";

test("renders a real MapLibre visual snapshot when dependencies are available", async ({}, testInfo) => {
  const maplibre = resolveMapLibreBundle();
  if (!maplibre.scriptPath) {
    await completeUnavailable(testInfo, maplibre.reason);
    return;
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    await completeUnavailable(testInfo, `Playwright Chromium is unavailable: ${formatError(error)}`);
    return;
  }

  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1
    });
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.setContent(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            html, body, #map {
              width: ${width}px;
              height: ${height}px;
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body><div id="map"></div></body>
      </html>
    `);

    const webgl = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      const context =
        canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl");
      if (!context) return { available: false };
      const gl = context as WebGLRenderingContext;
      return {
        available: true,
        renderer: String(gl.getParameter(gl.RENDERER))
      };
    });
    if (!webgl.available) {
      await completeUnavailable(testInfo, "Browser WebGL is unavailable.");
      return;
    }

    try {
      await page.addScriptTag({ path: maplibre.scriptPath });
    } catch (error) {
      await completeUnavailable(testInfo, `maplibre-gl browser bundle could not be loaded: ${formatError(error)}`);
      return;
    }

    const renderResult = await page.evaluate(
      async ({ style }) => {
        const maplibregl = (window as typeof window & { maplibregl?: { Map?: new (options: unknown) => unknown } })
          .maplibregl;
        if (!maplibregl?.Map) {
          return {
            ok: false,
            reason: "maplibre-gl browser bundle did not expose window.maplibregl.Map."
          };
        }

        const container = document.getElementById("map");
        if (!container) {
          return {
            ok: false,
            reason: "Map container was not mounted."
          };
        }

        return await new Promise<BrowserRenderResult>((resolve) => {
          let settled = false;
          const timeout = window.setTimeout(() => {
            finish({
              ok: false,
              reason: "MapLibre render timed out before load/idle."
            });
          }, 10_000);
          const map = new maplibregl.Map({
            container,
            style,
            interactive: false,
            attributionControl: false,
            preserveDrawingBuffer: true,
            fadeDuration: 0
          }) as {
            getCanvas(): HTMLCanvasElement;
            once(event: string, listener: (event?: { error?: Error }) => void): void;
            remove(): void;
          };

          function finish(result: BrowserRenderResult): void {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            try {
              map.remove();
            } catch {
              // Best effort cleanup after the browser-side report is complete.
            }
            resolve(result);
          }

          function capture(): void {
            const canvas = map.getCanvas();
            const sampleCanvas = document.createElement("canvas");
            sampleCanvas.width = canvas.width;
            sampleCanvas.height = canvas.height;
            const context = sampleCanvas.getContext("2d");
            if (!context) {
              finish({
                ok: false,
                reason: "2D canvas context is unavailable for visual snapshot sampling."
              });
              return;
            }

            context.drawImage(canvas, 0, 0);
            const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
            let nonTransparentSamples = 0;
            let nonWhiteSamples = 0;
            for (let index = 0; index < pixels.length; index += 64) {
              const red = pixels[index] ?? 0;
              const green = pixels[index + 1] ?? 0;
              const blue = pixels[index + 2] ?? 0;
              const alpha = pixels[index + 3] ?? 0;
              if (alpha > 0) nonTransparentSamples += 1;
              if (alpha > 0 && (Math.abs(red - 255) > 5 || Math.abs(green - 255) > 5 || Math.abs(blue - 255) > 5)) {
                nonWhiteSamples += 1;
              }
            }

            finish({
              ok: true,
              dataUrl: canvas.toDataURL("image/png"),
              canvasWidth: canvas.width,
              canvasHeight: canvas.height,
              nonTransparentSamples,
              nonWhiteSamples
            });
          }

          map.once("error", (event) => {
            finish({
              ok: false,
              reason: event?.error?.message ?? "MapLibre emitted an error while rendering."
            });
          });
          map.once("load", () => {
            map.once("idle", capture);
          });
        });
      },
      { style: visualMapLibreStyle() }
    );

    const report = createVisualReport(renderResult, consoleErrors);
    assertSnapshotReport(report);
    await attachReport(testInfo, report);

    if (!renderResult.ok) {
      throw new Error(`Visual snapshot failed: ${renderResult.reason}`);
    }
    expect(renderResult.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(renderResult.canvasWidth).toBeGreaterThan(0);
    expect(renderResult.canvasHeight).toBeGreaterThan(0);
    expect(renderResult.nonTransparentSamples).toBeGreaterThan(0);
    expect(renderResult.nonWhiteSamples).toBeGreaterThan(0);
    expect(report.status).toBe("passed");
  } finally {
    await browser.close();
  }
});

test("renders a vector tile release acceptance snapshot with generated local MVT", async ({}, testInfo) => {
  const maplibre = resolveMapLibreBundle();
  if (!maplibre.scriptPath) {
    await completeUnavailable(testInfo, maplibre.reason);
    return;
  }

  const vectorTileServer = await createVectorTileServer();
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    await completeUnavailable(testInfo, `Playwright Chromium is unavailable: ${formatError(error)}`);
    return;
  }

  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1
    });
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.route("**/tiles/**/*.pbf*", async (route) => {
      const tileBytes = vectorTileServer.tileForUrl(route.request().url());
      await route.fulfill({
        status: tileBytes ? 200 : 204,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/vnd.mapbox-vector-tile"
        },
        body: tileBytes ? Buffer.from(tileBytes) : Buffer.alloc(0)
      });
    });

    await page.setContent(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            html, body, #map {
              width: ${width}px;
              height: ${height}px;
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body><div id="map"></div></body>
      </html>
    `);

    const webgl = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      const context =
        canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl");
      if (!context) return { available: false };
      const gl = context as WebGLRenderingContext;
      return {
        available: true,
        renderer: String(gl.getParameter(gl.RENDERER))
      };
    });
    if (!webgl.available) {
      await completeUnavailable(testInfo, "Browser WebGL is unavailable.");
      return;
    }

    try {
      await page.addScriptTag({ path: maplibre.scriptPath });
    } catch (error) {
      await completeUnavailable(testInfo, `maplibre-gl browser bundle could not be loaded: ${formatError(error)}`);
      return;
    }

    const renderResult = await renderStyleSnapshot(page, visualVectorTileStyle("https://tiles.local/tiles/{z}/{x}/{y}.pbf"));
    const report = createVisualReport(renderResult, consoleErrors, {
      id: "vector-tile-url-fixture",
      revision: "1",
      sourceCount: 1,
      layerCount: 2
    });
    assertSnapshotReport(report);
    await attachReport(testInfo, report);

    if (!renderResult.ok) {
      throw new Error(`Vector tile visual snapshot failed: ${renderResult.reason}`);
    }
    expect(renderResult.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(renderResult.canvasWidth).toBeGreaterThan(0);
    expect(renderResult.canvasHeight).toBeGreaterThan(0);
    expect(renderResult.nonTransparentSamples).toBeGreaterThan(0);
    expect(renderResult.nonWhiteSamples).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
    expect(report.status).toBe("passed");
  } finally {
    await browser.close();
  }
});

type BrowserRenderResult =
  | {
      ok: true;
      dataUrl: string;
      canvasWidth: number;
      canvasHeight: number;
      nonTransparentSamples: number;
      nonWhiteSamples: number;
    }
  | {
      ok: false;
      reason: string;
    };

interface VectorTileServer {
  tileForUrl(url: string): Uint8Array | null;
}

interface GeoJsonVtIndex {
  getTile(z: number, x: number, y: number): unknown | null;
}

async function renderStyleSnapshot(page: Page, style: unknown): Promise<BrowserRenderResult> {
  return await page.evaluate(
    async ({ style }) => {
      const maplibregl = (window as typeof window & { maplibregl?: { Map?: new (options: unknown) => unknown } }).maplibregl;
      if (!maplibregl?.Map) {
        return {
          ok: false,
          reason: "maplibre-gl browser bundle did not expose window.maplibregl.Map."
        };
      }

      const container = document.getElementById("map");
      if (!container) {
        return {
          ok: false,
          reason: "Map container was not mounted."
        };
      }

      return await new Promise<BrowserRenderResult>((resolve) => {
        let settled = false;
        const timeout = window.setTimeout(() => {
          finish({
            ok: false,
            reason: "MapLibre render timed out before load/idle."
          });
        }, 10_000);
        const map = new maplibregl.Map({
          container,
          style,
          interactive: false,
          attributionControl: false,
          preserveDrawingBuffer: true,
          fadeDuration: 0
        }) as {
          getCanvas(): HTMLCanvasElement;
          once(event: string, listener: (event?: { error?: Error }) => void): void;
          remove(): void;
        };

        function finish(result: BrowserRenderResult): void {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          try {
            map.remove();
          } catch {
            // Best effort cleanup after the browser-side report is complete.
          }
          resolve(result);
        }

        function capture(): void {
          const canvas = map.getCanvas();
          const sampleCanvas = document.createElement("canvas");
          sampleCanvas.width = canvas.width;
          sampleCanvas.height = canvas.height;
          const context = sampleCanvas.getContext("2d");
          if (!context) {
            finish({
              ok: false,
              reason: "2D canvas context is unavailable for visual snapshot sampling."
            });
            return;
          }

          context.drawImage(canvas, 0, 0);
          const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
          let nonTransparentSamples = 0;
          let nonWhiteSamples = 0;
          for (let index = 0; index < pixels.length; index += 64) {
            const red = pixels[index] ?? 0;
            const green = pixels[index + 1] ?? 0;
            const blue = pixels[index + 2] ?? 0;
            const alpha = pixels[index + 3] ?? 0;
            if (alpha > 0) nonTransparentSamples += 1;
            if (alpha > 0 && (Math.abs(red - 255) > 5 || Math.abs(green - 255) > 5 || Math.abs(blue - 255) > 5)) {
              nonWhiteSamples += 1;
            }
          }

          finish({
            ok: true,
            dataUrl: canvas.toDataURL("image/png"),
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            nonTransparentSamples,
            nonWhiteSamples
          });
        }

        map.once("error", (event) => {
          finish({
            ok: false,
            reason: event?.error?.message ?? "MapLibre emitted an error while rendering."
          });
        });
        map.once("load", () => {
          map.once("idle", capture);
        });
      });
    },
    { style }
  );
}

async function createVectorTileServer(): Promise<VectorTileServer> {
  const { GeoJSONVT, fromGeojsonVt } = await loadVectorTileModules();
  const index = new GeoJSONVT(vectorTileGeoJson(), {
    maxZoom: 14,
    indexMaxZoom: 14,
    extent: 4096,
    tolerance: 1
  });

  return {
    tileForUrl(url: string): Uint8Array | null {
      const match = /\/tiles\/(\d+)\/(\d+)\/(\d+)\.pbf/.exec(new URL(url).pathname);
      if (!match) return null;
      const z = Number(match[1]);
      const x = Number(match[2]);
      const y = Number(match[3]);
      const tile = index.getTile(z, x, y);
      if (!tile) return null;
      return fromGeojsonVt({ parcels: tile });
    }
  };
}

async function loadVectorTileModules(): Promise<{
  GeoJSONVT: new (data: unknown, options: Record<string, unknown>) => GeoJsonVtIndex;
  fromGeojsonVt: (layers: Record<string, unknown>) => Uint8Array;
}> {
  const maplibreRoot = dirname(require.resolve("maplibre-gl/package.json"));
  const geoJsonVtPath = require.resolve("@maplibre/geojson-vt", { paths: [maplibreRoot] }).replace("geojson-vt.js", "geojson-vt.mjs");
  const vtPbfPath = require.resolve("@maplibre/vt-pbf", { paths: [maplibreRoot] });
  const [geoJsonVt, vtPbf] = await Promise.all([
    import(pathToFileURL(geoJsonVtPath).href),
    import(pathToFileURL(vtPbfPath).href)
  ]);

  return {
    GeoJSONVT: (geoJsonVt as { GeoJSONVT: new (data: unknown, options: Record<string, unknown>) => GeoJsonVtIndex }).GeoJSONVT,
    fromGeojsonVt: (vtPbf as { fromGeojsonVt: (layers: Record<string, unknown>) => Uint8Array }).fromGeojsonVt
  };
}

function resolveMapLibreBundle(): { scriptPath?: string; reason: string } {
  try {
    const directPath = require.resolve("maplibre-gl/dist/maplibre-gl.js");
    return {
      scriptPath: directPath,
      reason: ""
    };
  } catch {
    try {
      const packageJsonPath = require.resolve("maplibre-gl/package.json");
      const fallbackPath = join(dirname(packageJsonPath), "dist", "maplibre-gl.js");
      if (existsSync(fallbackPath)) {
        return {
          scriptPath: fallbackPath,
          reason: ""
        };
      }
      return {
        reason: `maplibre-gl is installed, but ${fallbackPath} does not exist.`
      };
    } catch {
      return {
        reason: "maplibre-gl is not installed. Install maplibre-gl to run real MapLibre visual snapshots."
      };
    }
  }
}

async function completeUnavailable(testInfo: TestInfo, reason: string): Promise<void> {
  const report = skippedVisualReport(reason);
  assertSnapshotReport(report);
  await attachReport(testInfo, report);
  if (strictVisualSnapshot) {
    throw new Error(`Visual snapshot required but skipped: ${reason}`);
  }
  expect(report.status).toBe("skipped");
}

function skippedVisualReport(reason: string): SnapshotReport {
  return {
    kind: "SnapshotReport",
    version: "0.1",
    suite: "snapshot.visual",
    renderer: "maplibre",
    status: "skipped",
    passed: false,
    skipped: true,
    reason,
    skipReason: reason,
    lifecycle: {
      loaded: false,
      snapshotted: false,
      exported: false,
      destroyed: false
    },
    spec: {
      id: "visual-maplibre",
      revision: "1",
      sourceCount: 1,
      layerCount: 2
    },
    diagnostics: [
      {
        severity: "info",
        code: "CAPABILITY.UNSUPPORTED",
        message: reason
      }
    ],
    consoleErrors: [],
    artifacts: {
      reportJson: "attached:snapshot-report.json"
    }
  };
}

function createVisualReport(
  renderResult: BrowserRenderResult,
  consoleErrors: string[],
  spec: SnapshotReport["spec"] = {
    id: "visual-maplibre",
    revision: "1",
    sourceCount: 1,
    layerCount: 2
  }
): SnapshotReport {
  const passed = renderResult.ok && renderResult.nonTransparentSamples > 0 && renderResult.nonWhiteSamples > 0 && consoleErrors.length === 0;
  const reason = renderResult.ok ? consoleErrors[0] : renderResult.reason;
  const report: SnapshotReport = {
    kind: "SnapshotReport",
    version: "0.1",
    suite: "snapshot.visual",
    renderer: "maplibre",
    status: passed ? "passed" : "failed",
    passed,
    skipped: false,
    lifecycle: {
      loaded: renderResult.ok,
      snapshotted: renderResult.ok,
      exported: renderResult.ok,
      destroyed: true
    },
    spec,
    diagnostics: visualDiagnostics(renderResult, consoleErrors),
    consoleErrors,
    artifacts: {
      reportJson: "attached:snapshot-report.json"
    }
  };

  if (reason) report.reason = reason;
  if (renderResult.ok) {
    report.artifacts.actualImage = "captured:data-url";
    report.snapshot = {
      passed,
      format: "png",
      width,
      height,
      dataUrlPrefix: renderResult.dataUrl.slice(0, "data:image/png;base64,".length),
      byteLength: renderResult.dataUrl.length
    };
  }

  return report;
}

function visualDiagnostics(renderResult: BrowserRenderResult, consoleErrors: string[]): SnapshotReport["diagnostics"] {
  if (!renderResult.ok) {
    return [
      {
        severity: "error",
        code: "SNAPSHOT.BLANK_CANVAS",
        message: renderResult.reason
      }
    ];
  }

  return consoleErrors.map((message) => ({
    severity: "error" as const,
    code: "RENDER.ADAPTER_ERROR",
    message
  }));
}

function visualMapLibreStyle(): unknown {
  return {
    version: 8,
    name: "visual-maplibre",
    center: [120.15, 30.28],
    zoom: 12,
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                name: "visual-snapshot-point"
              },
              geometry: {
                type: "Point",
                coordinates: [120.15, 30.28]
              }
            }
          ]
        }
      }
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#e8f7ef"
        }
      },
      {
        id: "point",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 24,
          "circle-color": "#d7263d",
          "circle-stroke-color": "#102a43",
          "circle-stroke-width": 3
        }
      }
    ]
  };
}

function visualVectorTileStyle(tileUrl: string): unknown {
  return {
    version: 8,
    name: "vector-tile-url-fixture",
    center: [120.15, 30.28],
    zoom: 12,
    sources: {
      "local-parcels": {
        type: "vector",
        tiles: [tileUrl],
        minzoom: 0,
        maxzoom: 14,
        attribution: "Generated local vector tile"
      }
    },
    layers: [
      {
        id: "parcel-fill",
        type: "fill",
        source: "local-parcels",
        "source-layer": "parcels",
        paint: {
          "fill-color": ["match", ["to-string", ["get", "class"]], "park", "#22c55e", "water", "#38bdf8", "#f97316"],
          "fill-opacity": 0.72
        }
      },
      {
        id: "parcel-outline",
        type: "line",
        source: "local-parcels",
        "source-layer": "parcels",
        paint: {
          "line-color": "#14532d",
          "line-width": ["step", ["zoom"], 1, 12, ["to-number", ["get", "stroke_width"], 1], 14, 2]
        }
      }
    ]
  };
}

function vectorTileGeoJson(): unknown {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          class: "park",
          stroke_width: 2
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [120.02, 30.16],
              [120.34, 30.16],
              [120.34, 30.42],
              [120.02, 30.42],
              [120.02, 30.16]
            ]
          ]
        }
      }
    ]
  };
}

async function attachReport(testInfo: TestInfo, report: SnapshotReport): Promise<void> {
  await testInfo.attach("snapshot-report.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json"
  });
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
