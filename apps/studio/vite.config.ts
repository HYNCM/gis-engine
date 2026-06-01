import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@gis-engine/engine": "/packages/engine/src/index.ts",
      "@gis-engine/ai": "/packages/ai/src/index.ts",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "maplibre": ["maplibre-gl"],
          "react-vendor": ["react", "react-dom"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:4321",
    },
  },
});
