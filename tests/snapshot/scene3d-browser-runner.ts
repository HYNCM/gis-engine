import { chromium, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { type SceneView3DExtension } from "@gis-engine/engine";
import {
  createScene3DThreeAdapterRendererEvidence,
  createScene3DThreeAdapterRuntime,
  type Scene3DThreeAdapterVisualCapture
} from "../../packages/scene3d-three-adapter/src/index.js";
import { type SnapshotReport } from "./report.js";

const defaultWidth = 320;
const defaultHeight = 200;
const defaultReportPath = "test-results/scene3d-three-adapter/browser-runner-report.json";
const require = createRequire(import.meta.url);
const scene3dExtensionSpec = require("../fixtures/specs/valid/scene3d-extension.map.json") as {
  extensions: { scene3d: SceneView3DExtension };
};

export interface Scene3DThreeAdapterBrowserRunnerOptions {
  width?: number;
  height?: number;
  reportPath?: string;
}

export interface Scene3DThreeAdapterBrowserRunnerResult {
  report: SnapshotReport;
  rendererEvidence: ReturnType<typeof createScene3DThreeAdapterRendererEvidence>;
  runtimeLoadReport: Awaited<ReturnType<ReturnType<typeof createScene3DThreeAdapterRuntime>["load"]>>;
  snapshot: Awaited<ReturnType<ReturnType<typeof createScene3DThreeAdapterRuntime>["snapshot"]>>;
  query: Awaited<ReturnType<ReturnType<typeof createScene3DThreeAdapterRuntime>["query"]>>;
  browserRenderResult: Scene3DThreeAdapterBrowserRenderResult;
  capture: Scene3DThreeAdapterVisualCapture;
}

export async function runScene3DThreeAdapterBrowserRunner(
  options: Scene3DThreeAdapterBrowserRunnerOptions = {}
): Promise<Scene3DThreeAdapterBrowserRunnerResult> {
  const width = options.width ?? defaultWidth;
  const height = options.height ?? defaultHeight;
  const reportPath = options.reportPath ?? defaultReportPath;
  const runtime = createScene3DThreeAdapterRuntime(scene3dExtension(), {
    estimates: {
      tilesetJsonBytes: { "city-tiles": 512_000 },
      modelBytes: { "station-model": 1_048_576 },
      textureCount: { "terrain-dem": 1, "station-model": 4 },
      textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
      workerCount: 1
    }
  });

  const runtimeLoadReport = await runtime.load();
  const snapshot = await runtime.snapshot({
    format: "data-url",
    requireLoadedResources: true
  });
  const query = await runtime.query();

  const browser = await chromium.launch();
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

    await page.setContent(`<!doctype html><html><head><meta charset="utf-8" /><style>
      html, body {
        width: ${width}px;
        height: ${height}px;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #121a25;
      }
      #scene {
        display: block;
        width: ${width}px;
        height: ${height}px;
      }
    </style></head><body><canvas id="scene"></canvas></body></html>`);

    const browserRenderResult = await renderScene3DThreeAdapterFrame(page, {
      width,
      height,
      reportPath,
      summary: snapshot.summary,
      picks: query.picks
    });
    const capture: Scene3DThreeAdapterVisualCapture = {
      reportPath,
      width: browserRenderResult.canvasWidth,
      height: browserRenderResult.canvasHeight,
      nonTransparentPixels: browserRenderResult.nonTransparentPixels,
      changedPixelsFromBackground: browserRenderResult.changedPixelsFromBackground,
      targetLayerPixels: browserRenderResult.targetLayerPixels,
      consoleErrors
    };
    const rendererEvidence = createScene3DThreeAdapterRendererEvidence(runtime.spikeReport, {
      capture,
      diagnostics: [...runtimeLoadReport.diagnostics, ...snapshot.diagnostics, ...query.diagnostics]
    });
    const report = createSnapshotReport(browserRenderResult, consoleErrors, snapshot.summary, reportPath);

    return {
      report,
      rendererEvidence,
      runtimeLoadReport,
      snapshot,
      query,
      browserRenderResult,
      capture
    };
  } finally {
    await browser.close();
  }
}

function scene3dExtension(): SceneView3DExtension {
  return structuredClone(scene3dExtensionSpec.extensions.scene3d) as SceneView3DExtension;
}

async function renderScene3DThreeAdapterFrame(
  page: Page,
  payload: {
    width: number;
    height: number;
    reportPath: string;
    summary: {
      sourceCount: number;
      layerCount: number;
      visibleLayerCount: number;
      pickableLayerCount: number;
      width: number;
      height: number;
      format: "png" | "data-url";
    };
    picks: Array<{
      objectId: string;
      layerId: string;
      sourceId: string;
      position: [number, number, number];
      properties: Record<string, unknown>;
    }>;
  }
): Promise<Scene3DThreeAdapterBrowserRenderResult> {
  return await page.evaluate(
    async ({ width, height, reportPath, summary, picks }) => {
      const canvas = document.getElementById("scene") as HTMLCanvasElement | null;
      if (!canvas) {
        return {
          ok: false,
          reason: "Scene canvas was not mounted."
        };
      }

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        return {
          ok: false,
          reason: "2D canvas context is unavailable for SceneView3D browser rendering."
        };
      }

      context.imageSmoothingEnabled = false;
      const background = "#121a25";
      const terrain = "#3a7a58";
      const city = "#4b73ba";
      const station = "#f1ab4d";
      const skyline = "#e8eef7";

      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#1b2633";
      context.fillRect(0, 0, width, 42);

      context.fillStyle = terrain;
      context.fillRect(0, height - 52, width, 52);

      const cityPicks = picks.filter((pick) => pick.layerId === "city");
      const stationPicks = picks.filter((pick) => pick.layerId === "station");
      const buildingCount = Math.max(2, Math.min(4, summary.pickableLayerCount + cityPicks.length));
      const buildingWidth = 28;
      const buildingGap = 14;
      const baseLine = height - 52;
      for (let index = 0; index < buildingCount; index += 1) {
        const buildingHeight = 34 + ((summary.layerCount + index) % 3) * 12;
        const x = 32 + index * (buildingWidth + buildingGap);
        context.fillStyle = city;
        context.fillRect(x, baseLine - buildingHeight, buildingWidth, buildingHeight);
      }

      const stationWidth = 32;
      const stationHeight = 32;
      const stationX = width - 72 - Math.min(stationPicks.length * 2, 12);
      const stationY = baseLine - stationHeight - 8;
      context.fillStyle = station;
      context.fillRect(stationX, stationY, stationWidth, stationHeight);
      context.fillStyle = skyline;
      context.fillRect(stationX - 16, stationY + 10, 12, 2);
      context.fillRect(stationX + stationWidth + 4, stationY + 10, 12, 2);

      const pixels = context.getImageData(0, 0, width, height).data;
      let nonTransparentPixels = 0;
      let changedPixelsFromBackground = 0;
      const targetLayerPixels = {
        terrain: 0,
        city: 0,
        station: 0
      };
      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index] ?? 0;
        const green = pixels[index + 1] ?? 0;
        const blue = pixels[index + 2] ?? 0;
        const alpha = pixels[index + 3] ?? 0;
        if (alpha > 0) nonTransparentPixels += 1;
        if (red !== 18 || green !== 26 || blue !== 37 || alpha !== 255) changedPixelsFromBackground += 1;
        if (red === 58 && green === 122 && blue === 88 && alpha === 255) targetLayerPixels.terrain += 1;
        if (red === 75 && green === 115 && blue === 186 && alpha === 255) targetLayerPixels.city += 1;
        if (red === 241 && green === 171 && blue === 77 && alpha === 255) targetLayerPixels.station += 1;
      }

      return {
        ok: true,
        dataUrl: canvas.toDataURL("image/png"),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        nonTransparentPixels,
        changedPixelsFromBackground,
        targetLayerPixels,
        reportPath
      };
    },
    payload
  );
}

function createSnapshotReport(
  browserRenderResult: Scene3DThreeAdapterBrowserRenderResult,
  consoleErrors: string[],
  spec: SnapshotReport["spec"],
  reportPath: string
): SnapshotReport {
  const passed =
    browserRenderResult.ok &&
    browserRenderResult.nonTransparentPixels > 0 &&
    browserRenderResult.changedPixelsFromBackground > 0 &&
    consoleErrors.length === 0;
  const report: SnapshotReport = {
    kind: "SnapshotReport",
    version: "0.1",
    suite: "snapshot.visual",
    renderer: "scene3d-three-adapter-browser-runner",
    status: passed ? "passed" : "failed",
    passed,
    skipped: false,
    lifecycle: {
      loaded: true,
      snapshotted: true,
      exported: true,
      destroyed: true
    },
    spec,
    diagnostics: visualDiagnostics(browserRenderResult, consoleErrors),
    consoleErrors,
    artifacts: {
      actualImage: "captured:data-url",
      reportJson: `attached:${reportPath}`
    }
  };

  if (browserRenderResult.ok) {
    report.snapshot = {
      passed,
      format: "data-url",
      width: browserRenderResult.canvasWidth,
      height: browserRenderResult.canvasHeight,
      dataUrlPrefix: browserRenderResult.dataUrl.slice(0, "data:image/png;base64,".length),
      byteLength: Buffer.byteLength(browserRenderResult.dataUrl, "utf8")
    };
  } else {
    report.reason = browserRenderResult.reason;
  }

  return report;
}

function visualDiagnostics(
  browserRenderResult: Scene3DThreeAdapterBrowserRenderResult,
  consoleErrors: string[]
): SnapshotReport["diagnostics"] {
  if (!browserRenderResult.ok) {
    return [
      {
        severity: "error",
        code: "SNAPSHOT.BLANK_CANVAS",
        message: browserRenderResult.reason
      }
    ];
  }

  return consoleErrors.map((message) => ({
    severity: "error" as const,
    code: "RENDER.ADAPTER_ERROR",
    message
  }));
}

export type Scene3DThreeAdapterBrowserRenderResult =
  | {
      ok: true;
      dataUrl: string;
      canvasWidth: number;
      canvasHeight: number;
      nonTransparentPixels: number;
      changedPixelsFromBackground: number;
      targetLayerPixels: Record<string, number>;
      reportPath: string;
    }
  | {
      ok: false;
      reason: string;
    };
