/**
 * End-to-End Rendering Pipeline Tests (Playwright)
 *
 * These tests verify the full rendering pipeline in a real browser environment:
 * create map → render → verify canvas → snapshot → apply commands → verify visual update.
 *
 * Current approach: mirrors the existing visual snapshot test pattern by loading
 * the MapLibre GL bundle directly and exercising maplibregl.Map in the browser.
 * This validates the same rendering patterns that MapLibreAdapter uses internally.
 *
 * TODO(upgrade): Once the engine provides a browser-consumable bundle (UMD/ESM dist),
 * these tests should be upgraded to use the engine's runtime APIs directly:
 *   - `createMap()` from `@gis-engine/engine`
 *   - `runtime.snapshot()` instead of manual canvas capture
 *   - `runtime.apply()` instead of style re-creation
 *   - `runtime.queryFeatures()` instead of maplibregl queryRenderedFeatures
 * See `tests/e2e/render-pipeline.test.ts` for the Node-side integration tests
 * that already exercise these APIs via MapRuntime + MockAdapter.
 */

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, expect, type Page, type TestInfo, test } from "@playwright/test";

const require = createRequire(import.meta.url);
const width = 320;
const height = 200;

// ---------------------------------------------------------------------------
// 1×1 transparent PNG stub — same as MapLibreAdapter.TRANSPARENT_PNG_DATA_URL
// Used to verify that real rendering produces non-stub output.
// ---------------------------------------------------------------------------
const TRANSPARENT_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAgMBgN4nS3QAAAAASUVORK5CYII=";

// ---------------------------------------------------------------------------
// MapLibre bundle resolution (shared with visual snapshot tests)
// ---------------------------------------------------------------------------

interface MapLibreBundle {
  scriptPath?: string;
  scriptType?: "umd" | "esm";
  reason: string;
}

function resolveMapLibreBundle(): MapLibreBundle {
  try {
    const directPath = require.resolve("maplibre-gl/dist/maplibre-gl.js");
    return { scriptPath: directPath, scriptType: "umd", reason: "" };
  } catch {
    // UMD not found
  }
  try {
    const esmPath = require.resolve("maplibre-gl/dist/maplibre-gl.mjs");
    return { scriptPath: esmPath, scriptType: "esm", reason: "" };
  } catch {
    // ESM not found
  }
  try {
    const packageJsonPath = require.resolve("maplibre-gl/package.json");
    const root = dirname(packageJsonPath);
    const umdPath = join(root, "dist", "maplibre-gl.js");
    if (existsSync(umdPath)) return { scriptPath: umdPath, scriptType: "umd", reason: "" };
    const esmPath = join(root, "dist", "maplibre-gl.mjs");
    if (existsSync(esmPath)) return { scriptPath: esmPath, scriptType: "esm", reason: "" };
    return { reason: `maplibre-gl at ${root}: no dist bundle found.` };
  } catch {
    return { reason: "maplibre-gl is not installed." };
  }
}

async function loadMapLibreBundle(page: Page, bundle: MapLibreBundle): Promise<void> {
  if (!bundle.scriptPath) throw new Error("Cannot load MapLibre bundle: no script path");
  if (bundle.scriptType === "esm") {
    const fileUrl = pathToFileURL(bundle.scriptPath).href;
    await page.addScriptTag({
      type: "module",
      content: `import * as maplibregl from ${JSON.stringify(fileUrl)}; window.maplibregl = maplibregl;`,
    });
  } else {
    await page.addScriptTag({ path: bundle.scriptPath });
  }
}

// ---------------------------------------------------------------------------
// Shared page setup helpers
// ---------------------------------------------------------------------------

async function setupPage(browser: import("@playwright/test").Browser): Promise<{
  page: Page;
  consoleErrors: string[];
}> {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.setContent(`
    <!doctype html>
    <html>
      <head><meta charset="utf-8" />
        <style>
          html, body, #map { width: ${width}px; height: ${height}px; margin: 0; padding: 0; }
        </style>
      </head>
      <body><div id="map"></div></body>
    </html>
  `);
  return { page, consoleErrors };
}

async function checkWebGL(page: Page, testInfo: TestInfo): Promise<boolean> {
  const webgl = await page.evaluate(() => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2") ?? c.getContext("webgl") ?? c.getContext("experimental-webgl");
    return { available: !!ctx };
  });
  if (!webgl.available) {
    testInfo.skip(true, "Browser WebGL is unavailable.");
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Style factories
// ---------------------------------------------------------------------------

function simpleFillStyle(fillColor = "#3b82f6"): unknown {
  return {
    version: 8,
    name: "e2e-fill",
    center: [120.15, 30.28],
    zoom: 12,
    sources: {
      polygon: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "test-polygon" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [120.14, 30.27],
                    [120.16, 30.27],
                    [120.16, 30.29],
                    [120.14, 30.29],
                    [120.14, 30.27],
                  ],
                ],
              },
            },
          ],
        },
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#f0f0f0" } },
      {
        id: "fill-layer",
        type: "fill",
        source: "polygon",
        paint: { "fill-color": fillColor, "fill-opacity": 1 },
      },
    ],
  };
}

function pointCircleStyle(): unknown {
  return {
    version: 8,
    name: "e2e-point",
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
              properties: { name: "test-point" },
              geometry: { type: "Point", coordinates: [120.15, 30.28] },
            },
          ],
        },
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#e8f7ef" } },
      {
        id: "circle-layer",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 24,
          "circle-color": "#d7263d",
          "circle-stroke-color": "#102a43",
          "circle-stroke-width": 3,
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Browser-side render-and-capture helper
// ---------------------------------------------------------------------------

type BrowserRenderResult =
  | {
      ok: true;
      dataUrl: string;
      canvasWidth: number;
      canvasHeight: number;
      nonTransparentSamples: number;
      nonWhiteSamples: number;
      sampledPixelCount: number;
    }
  | { ok: false; reason: string };

async function renderAndCapture(page: Page, style: unknown): Promise<BrowserRenderResult> {
  return await page.evaluate(
    async ({ style }) => {
      const maplibregl = (window as typeof window & { maplibregl?: { Map?: new (opts: unknown) => unknown } })
        .maplibregl;
      if (!maplibregl?.Map) {
        return { ok: false as const, reason: "maplibregl.Map not available." };
      }
      const container = document.getElementById("map");
      if (!container) return { ok: false as const, reason: "No #map container." };

      return await new Promise<BrowserRenderResult>((resolve) => {
        let settled = false;
        const timeout = window.setTimeout(() => finish({ ok: false, reason: "Render timed out (10s)." }), 10_000);

        const map = new maplibregl.Map({
          container,
          style,
          interactive: false,
          attributionControl: false,
          preserveDrawingBuffer: true,
          fadeDuration: 0,
        }) as {
          getCanvas(): HTMLCanvasElement;
          once(event: string, cb: (e?: { error?: Error }) => void): void;
          remove(): void;
        };

        function finish(r: BrowserRenderResult): void {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          try {
            map.remove();
          } catch {
            /* best-effort */
          }
          resolve(r);
        }

        function capture(): void {
          const canvas = map.getCanvas();
          const sample = document.createElement("canvas");
          sample.width = canvas.width;
          sample.height = canvas.height;
          const ctx = sample.getContext("2d");
          if (!ctx) {
            finish({ ok: false, reason: "2D context unavailable." });
            return;
          }
          ctx.drawImage(canvas, 0, 0);
          const pixels = ctx.getImageData(0, 0, sample.width, sample.height).data;
          let nonTransparent = 0;
          let nonWhite = 0;
          let sampled = 0;
          for (let i = 0; i < pixels.length; i += 64) {
            sampled++;
            const r = pixels[i] ?? 0;
            const g = pixels[i + 1] ?? 0;
            const b = pixels[i + 2] ?? 0;
            const a = pixels[i + 3] ?? 0;
            if (a > 0) nonTransparent++;
            if (a > 0 && (Math.abs(r - 255) > 5 || Math.abs(g - 255) > 5 || Math.abs(b - 255) > 5)) nonWhite++;
          }
          finish({
            ok: true,
            dataUrl: canvas.toDataURL("image/png"),
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            nonTransparentSamples: nonTransparent,
            nonWhiteSamples: nonWhite,
            sampledPixelCount: sampled,
          });
        }

        map.once("error", (e) => finish({ ok: false, reason: e?.error?.message ?? "MapLibre error." }));
        map.once("load", () => map.once("idle", capture));
      });
    },
    { style },
  );
}

// ---------------------------------------------------------------------------
// Test 1: Basic Rendering — canvas is not blank
// ---------------------------------------------------------------------------

test("E2E-1: basic rendering produces a non-blank canvas", async ({}, testInfo) => {
  const bundle = resolveMapLibreBundle();
  if (!bundle.scriptPath) {
    testInfo.skip(true, bundle.reason);
    return;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    testInfo.skip(true, `Chromium unavailable: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  try {
    const { page } = await setupPage(browser);
    if (!(await checkWebGL(page, testInfo))) return;
    await loadMapLibreBundle(page, bundle);

    const result = await renderAndCapture(page, simpleFillStyle());
    if (!result.ok) {
      throw new Error(`Render failed: ${result.reason}`);
    }

    // Canvas exists and has real dimensions
    expect(result.canvasWidth).toBeGreaterThan(0);
    expect(result.canvasHeight).toBeGreaterThan(0);

    // Canvas is NOT blank — has non-transparent pixels
    expect(result.nonTransparentSamples).toBeGreaterThan(0);

    // Canvas has colored (non-white) content from the fill layer + background
    expect(result.nonWhiteSamples).toBeGreaterThan(0);
  } finally {
    await browser.close();
  }
});

// ---------------------------------------------------------------------------
// Test 2: Snapshot returns real image (not the 1×1 transparent stub)
// ---------------------------------------------------------------------------

test("E2E-2: snapshot produces a real PNG, not the 1×1 transparent stub", async ({}, testInfo) => {
  const bundle = resolveMapLibreBundle();
  if (!bundle.scriptPath) {
    testInfo.skip(true, bundle.reason);
    return;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    testInfo.skip(true, `Chromium unavailable: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  try {
    const { page } = await setupPage(browser);
    if (!(await checkWebGL(page, testInfo))) return;
    await loadMapLibreBundle(page, bundle);

    const result = await renderAndCapture(page, pointCircleStyle());
    if (!result.ok) throw new Error(`Render failed: ${result.reason}`);

    // Data URL is a valid PNG
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);

    // The snapshot is NOT the 1×1 transparent stub
    expect(result.dataUrl).not.toBe(TRANSPARENT_PNG_DATA_URL);

    // The image has meaningful dimensions (not 1×1)
    expect(result.canvasWidth).toBeGreaterThan(1);
    expect(result.canvasHeight).toBeGreaterThan(1);

    // The image has non-uniform content (circle + background)
    expect(result.nonWhiteSamples).toBeGreaterThan(0);
    expect(result.nonTransparentSamples).toBeGreaterThan(0);
  } finally {
    await browser.close();
  }
});

// ---------------------------------------------------------------------------
// Test 3: Command application updates visual (setPaint color change)
// ---------------------------------------------------------------------------

test("E2E-3: applying a style change produces a visually different snapshot", async ({}, testInfo) => {
  const bundle = resolveMapLibreBundle();
  if (!bundle.scriptPath) {
    testInfo.skip(true, bundle.reason);
    return;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    testInfo.skip(true, `Chromium unavailable: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  try {
    const { page } = await setupPage(browser);
    if (!(await checkWebGL(page, testInfo))) return;
    await loadMapLibreBundle(page, bundle);

    // Phase 1: Render with blue fill, capture snapshot
    const blueResult = await renderAndCapture(page, simpleFillStyle("#3b82f6"));
    if (!blueResult.ok) throw new Error(`Blue render failed: ${blueResult.reason}`);

    // Phase 2: Re-render with red fill (simulates setPaint command), capture snapshot
    // We create a fresh page to avoid MapLibre state leakage.
    await page.close();
    const { page: page2 } = await setupPage(browser);
    await loadMapLibreBundle(page2, bundle);

    const redResult = await renderAndCapture(page2, simpleFillStyle("#ef4444"));
    if (!redResult.ok) throw new Error(`Red render failed: ${redResult.reason}`);

    // Both snapshots are valid PNGs
    expect(blueResult.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(redResult.dataUrl).toMatch(/^data:image\/png;base64,/);

    // The two snapshots are visually different (different fill colors)
    expect(blueResult.dataUrl).not.toBe(redResult.dataUrl);

    // Both have real content
    expect(blueResult.nonWhiteSamples).toBeGreaterThan(0);
    expect(redResult.nonWhiteSamples).toBeGreaterThan(0);

    await page2.close();
  } finally {
    await browser.close();
  }
});

// ---------------------------------------------------------------------------
// Test 4: Query features returns results for a visible point
// ---------------------------------------------------------------------------

test("E2E-4: queryRenderedFeatures returns the point feature at its location", async ({}, testInfo) => {
  const bundle = resolveMapLibreBundle();
  if (!bundle.scriptPath) {
    testInfo.skip(true, bundle.reason);
    return;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    testInfo.skip(true, `Chromium unavailable: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  try {
    const { page } = await setupPage(browser);
    if (!(await checkWebGL(page, testInfo))) return;
    await loadMapLibreBundle(page, bundle);

    const queryResult = await page.evaluate(
      async ({ style }) => {
        const maplibregl = (window as typeof window & { maplibregl?: { Map?: new (opts: unknown) => unknown } })
          .maplibregl;
        if (!maplibregl?.Map) return { ok: false as const, reason: "maplibregl.Map not available." };
        const container = document.getElementById("map");
        if (!container) return { ok: false as const, reason: "No #map container." };

        return await new Promise<{
          ok: boolean;
          reason?: string;
          featureCount?: number;
          hasTestPoint?: boolean;
        }>((resolve) => {
          let settled = false;
          const timeout = window.setTimeout(() => finish({ ok: false, reason: "Timeout (10s)." }), 10_000);

          const map = new maplibregl.Map({
            container,
            style,
            interactive: false,
            attributionControl: false,
            preserveDrawingBuffer: true,
            fadeDuration: 0,
          }) as {
            once(event: string, cb: (e?: { error?: Error }) => void): void;
            remove(): void;
            project(lngLat: [number, number]): { x: number; y: number };
            queryRenderedFeatures(
              point: { x: number; y: number },
              opts?: unknown,
            ): Array<{
              properties: Record<string, unknown>;
              toJSON?: () => unknown;
            }>;
          };

          function finish(r: { ok: boolean; reason?: string; featureCount?: number; hasTestPoint?: boolean }): void {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            try {
              map.remove();
            } catch {
              /* best-effort */
            }
            resolve(r);
          }

          map.once("error", (e) => finish({ ok: false, reason: e?.error?.message ?? "MapLibre error." }));
          map.once("load", () => {
            map.once("idle", () => {
              // Query at the point's coordinates [120.15, 30.28]
              const pixel = map.project([120.15, 30.28]);
              const features = map.queryRenderedFeatures(pixel, { layers: ["circle-layer"] });
              const hasTestPoint = features.some((f) => {
                const props = f.properties ?? {};
                return props.name === "test-point";
              });
              finish({
                ok: true,
                featureCount: features.length,
                hasTestPoint,
              });
            });
          });
        });
      },
      { style: pointCircleStyle() },
    );

    if (!queryResult.ok) throw new Error(`Query failed: ${queryResult.reason}`);

    // queryRenderedFeatures should return at least one feature at the point location
    expect(queryResult.featureCount).toBeGreaterThan(0);

    // The returned feature should include our test-point
    expect(queryResult.hasTestPoint).toBe(true);
  } finally {
    await browser.close();
  }
});

// ---------------------------------------------------------------------------
// Test 5: Resize updates canvas dimensions
// ---------------------------------------------------------------------------

test("E2E-5: resizing the container updates the canvas dimensions", async ({}, testInfo) => {
  const bundle = resolveMapLibreBundle();
  if (!bundle.scriptPath) {
    testInfo.skip(true, bundle.reason);
    return;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    testInfo.skip(true, `Chromium unavailable: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  try {
    const { page } = await setupPage(browser);
    if (!(await checkWebGL(page, testInfo))) return;
    await loadMapLibreBundle(page, bundle);

    const resizeResult = await page.evaluate(
      async ({ style }) => {
        const maplibregl = (window as typeof window & { maplibregl?: { Map?: new (opts: unknown) => unknown } })
          .maplibregl;
        if (!maplibregl?.Map) return { ok: false as const, reason: "maplibregl.Map not available." };
        const container = document.getElementById("map");
        if (!container) return { ok: false as const, reason: "No #map container." };

        return await new Promise<{
          ok: boolean;
          reason?: string;
          initialWidth?: number;
          initialHeight?: number;
          resizedWidth?: number;
          resizedHeight?: number;
        }>((resolve) => {
          let settled = false;
          const timeout = window.setTimeout(() => finish({ ok: false, reason: "Timeout (10s)." }), 10_000);

          const map = new maplibregl.Map({
            container,
            style,
            interactive: false,
            attributionControl: false,
            preserveDrawingBuffer: true,
            fadeDuration: 0,
          }) as {
            getCanvas(): HTMLCanvasElement;
            once(event: string, cb: (e?: { error?: Error }) => void): void;
            remove(): void;
            resize(): void;
          };

          function finish(r: {
            ok: boolean;
            reason?: string;
            initialWidth?: number;
            initialHeight?: number;
            resizedWidth?: number;
            resizedHeight?: number;
          }): void {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            try {
              map.remove();
            } catch {
              /* best-effort */
            }
            resolve(r);
          }

          map.once("error", (e) => finish({ ok: false, reason: e?.error?.message ?? "MapLibre error." }));
          map.once("load", () => {
            map.once("idle", () => {
              const canvas = map.getCanvas();
              const initialWidth = canvas.width;
              const initialHeight = canvas.height;

              // Resize the container to a new size
              container.style.width = "480px";
              container.style.height = "300px";

              // Call map.resize() — same as MapLibreAdapter.resize() does
              map.resize();

              // Allow a frame for the resize to take effect
              requestAnimationFrame(() => {
                const resizedCanvas = map.getCanvas();
                finish({
                  ok: true,
                  initialWidth,
                  initialHeight,
                  resizedWidth: resizedCanvas.width,
                  resizedHeight: resizedCanvas.height,
                });
              });
            });
          });
        });
      },
      { style: simpleFillStyle() },
    );

    if (!resizeResult.ok) throw new Error(`Resize test failed: ${resizeResult.reason}`);

    // Initial dimensions should match the viewport
    expect(resizeResult.initialWidth).toBeGreaterThan(0);
    expect(resizeResult.initialHeight).toBeGreaterThan(0);

    // After resize, dimensions should have changed
    expect(resizeResult.resizedWidth).not.toBe(resizeResult.initialWidth);
    expect(resizeResult.resizedHeight).not.toBe(resizeResult.initialHeight);

    // New dimensions should be approximately 480×300
    expect(resizeResult.resizedWidth).toBe(480);
    expect(resizeResult.resizedHeight).toBe(300);
  } finally {
    await browser.close();
  }
});
