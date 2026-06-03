import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    // Ensure @gis-engine/engine resolves correctly when linked from the
    // monorepo workspace or installed from npm.
    dedupe: ["maplibre-gl"],
  },
});
