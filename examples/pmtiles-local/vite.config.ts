import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    dedupe: ["maplibre-gl"],
  },
});
