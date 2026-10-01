import { defineConfig } from "@playwright/test";

/**
 * testDir stays broad: `pnpm test:e2e:browser` and `pnpm test:workbench:e2e` pass their own
 * spec paths to the same implicit config, and narrowing this to the visual suite would make
 * them collect zero tests.
 *
 * Only darwin baselines are committed. The `{-platform}` token keeps a foreign runner from
 * comparing against a frame it never produced — it reports a missing baseline instead of a
 * rendering regression. Within one platform the SceneView3D frame is pure `fillRect` with
 * image smoothing disabled, so the comparator stays exact and antialiasing is no excuse.
 */
export default defineConfig({
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}{-platform}{ext}",
  // A comparison run must never author reference frames: missing baselines fail loudly
  // until an explicit SNAPSHOT_UPDATE=1 run (locally or via the visual-baselines workflow) writes them.
  updateSnapshots: process.env.SNAPSHOT_UPDATE === "1" ? "all" : "none",
  expect: {
    timeout: 10_000,
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.001,
      threshold: 0,
    },
  },
});
