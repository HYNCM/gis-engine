import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      entry: [
        "api/*.ts", // Vercel file-based serverless entries
        "tests/types/*.ts", // compiled by tests/types/tsconfig.json (pnpm test:types)
      ],
      ignore: [
        "examples/**", // Vite app entries exercised by pnpm test:examples and the qa-matrix
        ".vercel-tmp/**", // deploy scratch output
        // knip baseline 2026-11-10: no consumers found; pending removal decision
        "tests/utils/startStaticServer.ts",
      ],
      ignoreDependencies: [
        "maplibre-gl", // peer dep used in tests
        "tsx", // used in example scripts and CI workflows
        "typedoc", // spawned via CLI in scripts/build-api-docs.mjs
        "typedoc-plugin-markdown", // loaded by the typedoc CLI
        "@maplibre/geojson-vt", // transitive via maplibre-gl; visual fixture builder imports it directly
        "@maplibre/vt-pbf", // transitive via maplibre-gl; visual fixture builder imports it directly
      ],
      ignoreBinaries: ["gh", "tsx"],
    },
    "packages/engine": {
      entry: ["scripts/build-schema.ts", "scripts/build-evidence-verifier.ts"],
      ignore: ["src/spec/schema-type-assertions.ts"],
    },
    "packages/ai": {},
    "packages/cli": {},
    "packages/scene3d": {},
    "packages/scene3d-three-adapter": {},
    "apps/workbench": {
      entry: ["api/*.ts"], // Vercel file-based serverless entries
      ignore: [
        // knip baseline 2026-11-10: no imports found; pending removal decision
        "src/components/AIAssistant.tsx",
        "src/components/TemplateBar.tsx",
      ],
    },
    "docs/website": {},
    "examples/getting-started": {},
  },
  ignoreExportsUsedInFile: true,
};

export default config;