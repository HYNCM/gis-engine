import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node"
  },
  resolve: {
    alias: {
      "@gis-engine/engine": resolve(root, "packages/engine/src/index.ts"),
      "@gis-engine/ai": resolve(root, "packages/ai/src/index.ts"),
      "@gis-engine/scene3d": resolve(root, "packages/scene3d/src/index.ts"),
      "@gis-engine/scene3d-three-adapter": resolve(root, "packages/scene3d-three-adapter/src/index.ts"),
      "@gis-engine/cli": resolve(root, "packages/cli/src/index.ts")
    }
  }
});
