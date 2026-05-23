import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";
import { assertSnapshotReport } from "../report.js";
import { runScene3DThreeAdapterBrowserRunner } from "../scene3d-browser-runner.js";

test("renders a release-capable SceneView3D browser runner snapshot", async ({}, testInfo) => {
  const runner = await runScene3DThreeAdapterBrowserRunner();

  assertSnapshotReport(runner.report);
  await testInfo.attach("scene3d-browser-runner-report.json", {
    body: Buffer.from(JSON.stringify(runner.report, null, 2), "utf8"),
    contentType: "application/json"
  });
  await testInfo.attach("scene3d-browser-runner.png", {
    body: Buffer.from(runner.browserRenderResult.dataUrl.split(",")[1] ?? "", "base64"),
    contentType: "image/png"
  });

  expect(runner.report.status).toBe("passed");
  expect(runner.rendererEvidence.passed).toBe(true);
  expect(runner.capture.nonTransparentPixels).toBeGreaterThan(0);
  expect(runner.capture.changedPixelsFromBackground).toBeGreaterThan(0);
  expect(runner.capture.consoleErrors).toEqual([]);
});
