import { readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { expect, test } from "@playwright/test";

const distRoot = process.env.MAPLIBRE_MATRIX_DIST ?? "";
const expectedVersion = process.env.MAPLIBRE_MATRIX_VERSION ?? "";
const browserResultPath = process.env.MAPLIBRE_MATRIX_BROWSER_RESULT ?? "";
const matrixConfigured = Boolean(distRoot && expectedVersion && browserResultPath);

test.skip(!matrixConfigured, "This strict browser fixture is invoked through scripts/maplibre-compat-matrix.mjs.");

const contentTypes: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
};

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  const root = resolve(distRoot);
  server = createServer((request, response) => {
    const requestPath = request.url === "/" ? "/index.html" : (request.url ?? "/index.html").split("?")[0];
    const candidate = normalize(join(root, requestPath));
    if (relative(root, candidate).startsWith("..")) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    try {
      if (!statSync(candidate).isFile()) throw new Error("Not a file");
      response.writeHead(200, { "content-type": contentTypes[extname(candidate)] ?? "application/octet-stream" });
      response.end(readFileSync(candidate));
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolveListen());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Compatibility server did not bind a TCP port.");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
});

test(`loads generated example and records strict visual/event evidence for MapLibre ${expectedVersion}`, async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const webgl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  });
  expect(webgl, "Strict matrix evidence requires a WebGL-capable browser.").toBe(true);

  let terminalStateReached = true;
  try {
    await page.waitForFunction(() => window.__GIS_MATRIX_RESULT__?.status !== "loading", undefined, {
      timeout: 8_000,
    });
  } catch {
    terminalStateReached = false;
  }
  const browserState = await page.evaluate(() => ({
    result: window.__GIS_MATRIX_RESULT__,
    canvasCount: document.querySelectorAll("#map canvas").length,
    rawCanvasCount: document.querySelectorAll("#raw-map canvas").length,
    map: window.__GIS_MATRIX_MAP__
      ? {
          loaded: window.__GIS_MATRIX_MAP__.loaded(),
          styleLoaded: window.__GIS_MATRIX_MAP__.isStyleLoaded(),
          tilesLoaded: window.__GIS_MATRIX_MAP__.areTilesLoaded(),
          moving: window.__GIS_MATRIX_MAP__.isMoving(),
        }
      : null,
    rawMap: window.__GIS_MATRIX_RAW_MAP__
      ? {
          loaded: window.__GIS_MATRIX_RAW_MAP__.loaded(),
          styleLoaded: window.__GIS_MATRIX_RAW_MAP__.isStyleLoaded(),
          tilesLoaded: window.__GIS_MATRIX_RAW_MAP__.areTilesLoaded(),
          moving: window.__GIS_MATRIX_RAW_MAP__.isMoving(),
        }
      : null,
    resources: performance.getEntriesByType("resource").map((entry) => entry.name),
  }));
  const screenshotPath = test.info().outputPath(`maplibre-${expectedVersion}.png`);
  const screenshot = await page.locator("#map").screenshot({ path: screenshotPath });

  if (!terminalStateReached) {
    throw new Error(
      `Generated example did not reach strict readiness: ${JSON.stringify({ browserState, consoleErrors })}`,
    );
  }
  const result = await page.evaluate(() => window.__GIS_MATRIX_RESULT__);
  expect(result).toMatchObject({ status: "ready", version: expectedVersion, snapshotPassed: true });
  expect(result?.events).toEqual(expect.arrayContaining(["load", "idle", "moveend"]));
  expect(result?.rawEvents).toEqual(expect.arrayContaining(["load", "idle"]));
  expect(browserState.canvasCount).toBe(1);
  expect(browserState.rawCanvasCount).toBe(1);
  expect(browserState.map).toMatchObject({ styleLoaded: true, tilesLoaded: true, moving: false });
  expect(browserState.rawMap).toEqual({ loaded: true, styleLoaded: true, tilesLoaded: true, moving: false });
  expect(consoleErrors).toEqual([]);

  const visual = await page.evaluate(async (screenshotBase64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${screenshotBase64}`;
    await image.decode();
    const sample = document.createElement("canvas");
    sample.width = image.naturalWidth;
    sample.height = image.naturalHeight;
    const context = sample.getContext("2d");
    if (!context) return { width: image.naturalWidth, height: image.naturalHeight, nonBackgroundSamples: 0 };
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let nonBackgroundSamples = 0;
    let featureRegionSamples = 0;
    let lightBackgroundSamples = 0;
    for (let index = 0; index < pixels.length; index += 64) {
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;
      const alpha = pixels[index + 3] ?? 0;
      if (alpha > 0 && (red < 235 || green < 235 || blue < 235)) nonBackgroundSamples += 1;
    }
    for (let y = 0; y < sample.height; y += 1) {
      for (let x = 0; x < sample.width; x += 1) {
        const index = (y * sample.width + x) * 4;
        const red = pixels[index] ?? 0;
        const green = pixels[index + 1] ?? 0;
        const blue = pixels[index + 2] ?? 0;
        const alpha = pixels[index + 3] ?? 0;
        const inCenterFeatureRegion =
          x >= sample.width * 0.35 &&
          x <= sample.width * 0.65 &&
          y >= sample.height * 0.25 &&
          y <= sample.height * 0.75;
        if (
          inCenterFeatureRegion &&
          alpha > 0 &&
          red >= 170 &&
          red <= 245 &&
          green >= 35 &&
          green <= 135 &&
          blue >= 30 &&
          blue <= 135 &&
          red - green >= 55 &&
          red - blue >= 45
        ) {
          featureRegionSamples += 1;
        }
        if (x < sample.width * 0.2 && y < sample.height * 0.2 && red > 235 && green > 235 && blue > 235) {
          lightBackgroundSamples += 1;
        }
      }
    }
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      nonBackgroundSamples,
      featureRegionSamples,
      lightBackgroundSamples,
    };
  }, screenshot.toString("base64"));

  expect(visual.width).toBeGreaterThan(0);
  expect(visual.height).toBeGreaterThan(0);
  expect(visual.nonBackgroundSamples).toBeGreaterThan(0);
  expect(visual.featureRegionSamples).toBeGreaterThan(500);
  expect(visual.lightBackgroundSamples).toBeGreaterThan(500);
  writeFileSync(
    browserResultPath,
    `${JSON.stringify(
      {
        status: "passed",
        version: expectedVersion,
        eventsStatus: "passed",
        visualStatus: "passed",
        browserState,
        consoleErrors,
        visual,
      },
      null,
      2,
    )}\n`,
  );
});

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
