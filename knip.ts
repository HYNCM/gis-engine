import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      ignoreDependencies: [
        "maplibre-gl", // peer dep used in tests
        "vite", // used by studio + examples
        "tsx", // used in example scripts and CI workflows
      ],
      ignoreBinaries: ["du", "gh", "tsx"],
    },
    "packages/engine": {
      entry: ["scripts/build-schema.ts"],
      ignore: ["src/spec/schema-type-assertions.ts"],
    },
    "packages/ai": {},
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
    "examples/getting-started": {},
  },
  ignoreExportsUsedInFile: true,
};

export default config;
