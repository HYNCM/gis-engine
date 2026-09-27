import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    // Vitest's default include (`**/*.{test,spec}.ts`) sweeps two git-ignored trees that live
    // inside this directory: `.worktrees/**` (sibling feature branches, whose copies of this
    // repo's tests are stale by definition) and `.pnpm-store/**` (a pnpm project cache holding
    // another copy of this repository). Both get reported as first-party failures otherwise.
    // The Workbench `.spec.ts` files are Playwright specs and must stay out of this runner too.
    exclude: [
      ...configDefaults.exclude,
      ".worktrees/**",
      ".pnpm-store/**",
      "tests/workbench/**/*.spec.ts",
      "tests/e2e/**/*.spec.ts",
    ],
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
      "@gis-engine/engine/evidence": resolve(root, "packages/engine/src/evidence/index.ts"),
      "@gis-engine/engine": resolve(root, "packages/engine/src/index.ts"),
      "@gis-engine/ai": resolve(root, "packages/ai/src/index.ts"),
      "@gis-engine/scene3d": resolve(root, "packages/scene3d/src/index.ts"),
      "@gis-engine/scene3d-three-adapter": resolve(root, "packages/scene3d-three-adapter/src/index.ts"),
      "@gis-engine/cli": resolve(root, "packages/cli/src/index.ts"),
    },
  },
});
