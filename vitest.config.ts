import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["packages/*/src/**/*.d.ts", "packages/*/src/internal/**", "packages/*/scripts/**"],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@gis-engine/engine": resolve(root, "packages/engine/src/index.ts"),
      "@gis-engine/ai": resolve(root, "packages/ai/src/index.ts"),
      "@gis-engine/scene3d": resolve(root, "packages/scene3d/src/index.ts"),
      "@gis-engine/scene3d-three-adapter": resolve(root, "packages/scene3d-three-adapter/src/index.ts"),
      "@gis-engine/cli": resolve(root, "packages/cli/src/index.ts"),
    },
  },
});
