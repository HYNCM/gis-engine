import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      ignoreDependencies: [
        "maplibre-gl", // peer dep used in tests
        "vite", // used by studio + examples
        "tsx", // used in example scripts and CI workflows
      ],
      ignoreBinaries: ["du", "gh"],
    },
    "packages/engine": {
      entry: ["src/index.ts", "scripts/build-schema.ts"],
      ignore: ["src/spec/schema-type-assertions.ts"],
    },
    "packages/ai": {
      entry: ["src/index.ts", "src/mcp/server.ts", "scripts/build-schema.mjs"],
    },
    "packages/cli": {},
    "packages/scene3d": {},
    "packages/scene3d-three-adapter": {},
    "apps/studio": {
      ignoreDependencies: [
        "@gis-engine/engine", // workspace dep used via alias
        "@gis-engine/ai", // workspace dep used via alias
      ],
    },
    "docs/website": {},
    "examples/getting-started": {
      ignore: ["src/**", "vite.config.ts"],
    },
  },
  ignoreExportsUsedInFile: true,
};

export default config;
