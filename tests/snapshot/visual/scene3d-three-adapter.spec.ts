import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";
import { assertSnapshotReport } from "../report.js";
import { runScene3DThreeAdapterBrowserRunner } from "../scene3d-browser-runner.js";

test("renders a release-capable SceneView3D browser runner snapshot", async ({}, testInfo) => {
  const runner = await runScene3DThreeAdapterBrowserRunner();

  assertSnapshotReport(runner.report);
  await testInfo.attach("scene3d-browser-runner-report.json", {
    body: Buffer.from(JSON.stringify(runner.report, null, 2), "utf8"),
    contentType: "application/json",
  });
  await testInfo.attach("scene3d-browser-runner.png", {
    body: Buffer.from(runner.browserRenderResult.dataUrl.split(",")[1] ?? "", "base64"),
    contentType: "image/png",
  });

  expect(runner.report.status).toBe("passed");
  expect(runner.rendererEvidence.passed).toBe(true);
  expect(runner.capture.nonTransparentPixels).toBeGreaterThan(0);
  expect(runner.capture.changedPixelsFromBackground).toBeGreaterThan(0);
  expect(runner.capture.consoleErrors).toEqual([]);

  const matrix = runner.report.promotionMatrix;
  expect(matrix.frameMetrics).toEqual({
    width: runner.capture.width,
    height: runner.capture.height,
    nonTransparentPixels: runner.capture.nonTransparentPixels,
    changedPixelsFromBackground: runner.capture.changedPixelsFromBackground,
    targetLayerPixels: runner.capture.targetLayerPixels,
  });
  expect(matrix.consoleDiagnostics).toEqual({
    errorCount: 0,
    hasErrors: false,
    messages: [],
  });
  expect(matrix.rendererDiagnostics.counts).toEqual({
    error: 0,
    warning: 0,
    info: 1,
  });
  expect(matrix.rendererDiagnostics.entries).toContainEqual(
    expect.objectContaining({
      severity: "info",
      code: "CAPABILITY.UNSUPPORTED",
      path: "/extensions/scene3d",
    }),
  );
  expect(matrix.rendererVisualEvidence).toEqual({
    passed: true,
    ready: true,
    reportPath: "test-results/scene3d-three-adapter/browser-runner-report.json",
  });
  expect(matrix.snapshotQueryEvidence).toEqual({
    fixture: "tests/fixtures/specs/valid/scene3d-extension.map.json",
    snapshot: {
      passed: true,
      format: "data-url",
      width: runner.snapshot.summary.width,
      height: runner.snapshot.summary.height,
      pendingSourceIds: [],
      diagnosticCounts: {
        error: 0,
        warning: 0,
        info: 0,
      },
    },
    query: {
      pickCount: 2,
      objectIds: ["city-tiles:city:mock", "station-model:station:mock"],
      layerIds: ["city", "station"],
      sourceIds: ["city-tiles", "station-model"],
      diagnosticCounts: {
        error: 0,
        warning: 0,
        info: 0,
      },
    },
  });
  expect(matrix.readiness).toEqual({
    load: true,
    snapshot: true,
    query: true,
    rendererVisual: true,
    decisionReady: true,
    stablePromotionAllowed: false,
  });
});
