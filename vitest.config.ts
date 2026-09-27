import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    // The root gate must execute this checkout's tests only. Vitest's default include
    // (`**/*.test.ts`) also sweeps two git-ignored trees that live inside this directory:
    // `.worktrees/**` (sibling feature branches, whose stale tests assert the pre-EvidenceRecord
    // CLI output) and `.pnpm-store/**` (a pnpm project cache holding a copy of this repository).
    // Both were reported as first-party failures once a breaking change landed.
    exclude: [...configDefaults.exclude, ".worktrees/**", ".pnpm-store/**"],
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
