import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const ROOT = resolve(__dirname, "..", "..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@gis-engine/engine": resolve(ROOT, "packages/engine/src/index.ts"),
      "@gis-engine/ai": resolve(ROOT, "packages/ai/src/index.ts"),
    },
  },
  build: {
    // Keep MapLibre out of HTML preloads so the shell can render before the renderer downloads.
    modulePreload: {
      resolveDependencies(_filename, deps, context) {
        if (context.hostType !== "html") return deps;
        return deps.filter((dep) => !dep.includes("maplibre"));
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
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
