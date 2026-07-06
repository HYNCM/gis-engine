/**
 * CLI template registry.
 *
 * Each template generates a set of files for the target project.
 * Templates: static-html, vite-ts, mapspec, app
 * Community templates: community:<name> (see ./community.ts)
 */

import {
  generateCommunityTemplate,
  getCommunityTemplate,
  isCommunityTemplateName,
  parseCommunityTemplateName,
} from "./community.js";

export {
  type CommunityManifestValidationResult,
  type CommunityTemplateDescriptor,
  type CommunityTemplateFile,
  type CommunityTemplateGenerateResult,
  type CommunityTemplateListEntry,
  type CommunityTemplateManifest,
  generateCommunityTemplate,
  getCommunityTemplate,
  isCommunityTemplateName,
  listCommunityTemplates,
  parseCommunityTemplateName,
  registerCommunityTemplate,
  unregisterCommunityTemplate,
  validateCommunityManifest,
} from "./community.js";

export const TEMPLATES = ["static-html", "vite-ts", "mapspec", "app"] as const;
export type TemplateName = (typeof TEMPLATES)[number];

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface TemplateContext {
  projectName: string;
  provider: string;
  cliVersion: string;
}

export type AppType = "explorer" | "dashboard" | "locator";

export interface AppConfig {
  appType: AppType;
  title: string;
  description: string;
  components: string[];
}

export interface AppTemplateContext extends TemplateContext {
  appConfig?: AppConfig;
}

export interface AppConfigInput {
  appType?: AppType;
  title?: string;
  description?: string;
  components?: string[];
}

export const APP_COMPONENTS = ["LayerPanel", "FeaturePopup", "Legend", "SearchBox", "BasemapSwitcher"] as const;

export type AppComponentName = (typeof APP_COMPONENTS)[number];

const DEFAULT_APP_COMPONENTS: Record<AppType, AppComponentName[]> = {
  explorer: ["LayerPanel", "Legend", "FeaturePopup", "SearchBox", "BasemapSwitcher"],
  dashboard: ["LayerPanel", "Legend", "FeaturePopup"],
  locator: ["SearchBox", "BasemapSwitcher", "FeaturePopup"],
};

const APP_COMPONENT_SET = new Set<string>(APP_COMPONENTS);

export function normalizeAppConfig(
  appConfig: AppConfigInput | undefined,
  defaults: { projectName: string; description: string },
): AppConfig {
  const appType =
    appConfig?.appType === "dashboard" || appConfig?.appType === "locator" ? appConfig.appType : "explorer";
  const title =
    typeof appConfig?.title === "string" && appConfig.title.trim().length > 0 ? appConfig.title : defaults.projectName;
  const description =
    typeof appConfig?.description === "string" && appConfig.description.trim().length > 0
      ? appConfig.description
      : defaults.description;
  const filteredComponents = (Array.isArray(appConfig?.components) ? appConfig.components : [])
    .filter(
      (component): component is AppComponentName => typeof component === "string" && APP_COMPONENT_SET.has(component),
    )
    .filter((component, index, items) => items.indexOf(component) === index);

  return {
    appType,
    title,
    description,
    components: filteredComponents.length > 0 ? filteredComponents : DEFAULT_APP_COMPONENTS[appType],
  };
}

/**
 * Derive a major-version-compatible semver range from the CLI version.
 * e.g. "1.1.0" → "1.x", "2.0.0" → "2.x"
 *
 * This ensures scaffolded projects always resolve to the latest compatible
 * minor/patch within the same major, rather than pinning to the initial
 * release ("^1.0.0") or excluding prior minors ("^1.1.0").
 */
function engineVersionRange(cliVersion: string): string {
  const major = cliVersion.split(".")[0];
  return `${major}.x`;
}

export interface Template {
  name: TemplateName;
  description: string;
  generate(ctx: TemplateContext): GeneratedFile[];
}

const staticHtmlTemplate: Template = {
  name: "static-html",
  description: "Standalone HTML file with inline GIS Engine CDN imports",
  generate(ctx) {
    return [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${ctx.projectName} — GIS Engine</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    #map { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script type="module">
    import { createMap, applyCommands } from "https://unpkg.com/@gis-engine/engine";

    const spec = {
      version: "0.1",
      sources: {
        points: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] }
        }
      },
      layers: [
        { id: "points-layer", type: "circle", source: "points", paint: { "circle-radius": 6, "circle-color": "#3b82f6" } }
      ],
      view: { center: [0, 0], zoom: 2 }
    };

    const container = document.getElementById("map");
    const map = await createMap(container, spec, { renderer: "maplibre" });
    console.log("[${ctx.projectName}] map created", map.exportSpec());
  </script>
</body>
</html>
`,
      },
      {
        path: "README.md",
        content: `# ${ctx.projectName}

Generated by \`create-gis-map\` v${ctx.cliVersion} using the **static-html** template.

## Usage

Open \`index.html\` in a browser.

## Provider

Current provider: \`${ctx.provider}\`
`,
      },
    ];
  },
};

const viteTsTemplate: Template = {
  name: "vite-ts",
  description: "Vite + TypeScript project with GIS Engine",
  generate(ctx) {
    return [
      {
        path: "package.json",
        content: `${JSON.stringify(
          {
            name: ctx.projectName,
            version: "0.1.0",
            private: true,
            type: "module",
            scripts: {
              dev: "vite",
              build: "tsc && vite build",
              preview: "vite preview",
            },
            dependencies: {
              "@gis-engine/engine": engineVersionRange(ctx.cliVersion),
              "@gis-engine/ai": engineVersionRange(ctx.cliVersion),
              "maplibre-gl": "^5.0.0",
            },
            devDependencies: {
              typescript: "^5.7.0",
              vite: "^5.4.0",
            },
          },
          null,
          2,
        )}\n`,
      },
      {
        path: "tsconfig.json",
        content: `${JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "ESNext",
              moduleResolution: "bundler",
              strict: true,
              esModuleInterop: true,
              outDir: "./dist",
            },
            include: ["src"],
          },
          null,
          2,
        )}\n`,
      },
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${ctx.projectName}</title>
</head>
<body>
  <div id="map" style="width:100vw;height:100vh;"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`,
      },
      {
        path: "src/main.ts",
        content: `import { createMap } from "@gis-engine/engine";
import "maplibre-gl/dist/maplibre-gl.css";

const spec = {
  version: "0.1" as const,
  sources: {
    points: {
      type: "geojson" as const,
      data: { type: "FeatureCollection" as const, features: [] },
    },
  },
  layers: [
    {
      id: "points-layer",
      type: "circle" as const,
      source: "points",
      paint: { "circle-radius": 6, "circle-color": "#3b82f6" },
    },
  ],
  view: { center: [0, 0] as [number, number], zoom: 2 },
};

async function main() {
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container");

  const map = await createMap(container, spec, { renderer: "maplibre" });
  console.log("[${ctx.projectName}] map ready", map.exportSpec());
}

main().catch((error) => {
  console.error("[${ctx.projectName}] failed to initialize map", error);
});
`,
      },
      {
        path: "README.md",
        content: `# ${ctx.projectName}

Generated by \`create-gis-map\` v${ctx.cliVersion} using the **vite-ts** template.

## Usage

\`\`\`bash
npm install
npm run dev
\`\`\`

## Controls

- Reload map.json to re-run the current spec without a browser refresh.
- Load map.json to import a local file and re-render the map.
- The status banner reports loading, ready, empty, and error states.

## Provider

Current provider: \`${ctx.provider}\`
`,
      },
    ];
  },
};

const mapspecTemplate: Template = {
  name: "mapspec",
  description: "Minimal MapSpec JSON file only",
  generate(ctx) {
    return [
      {
        path: "map.json",
        content: `${JSON.stringify(
          {
            version: "0.1",
            sources: {
              points: {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
              },
            },
            layers: [
              {
                id: "points-layer",
                type: "circle",
                source: "points",
                paint: { "circle-radius": 6, "circle-color": "#3b82f6" },
              },
            ],
            view: { center: [0, 0], zoom: 2 },
          },
          null,
          2,
        )}\n`,
      },
      {
        path: "README.md",
        content: `# ${ctx.projectName}

Generated by \`create-gis-map\` v${ctx.cliVersion} using the **mapspec** template.

## Usage

Load \`map.json\` with any GIS Engine runtime:

\`\`\`js
import { createMap } from "@gis-engine/engine";
const spec = JSON.parse(await fetch("./map.json").then(r => r.text()));
const map = await createMap(container, spec, { renderer: "maplibre" });
\`\`\`

## Preflight

Validate the generated spec before handing it to an app or CI pipeline:

\`\`\`bash
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./map.json --json
\`\`\`

## Provider

Current provider: \`${ctx.provider}\`
`,
      },
    ];
  },
};

const appTemplate: Template = {
  name: "app",
  description:
    "Full interactive map application (Vite + React + Tailwind) with responsive status and local map.json controls",
  generate(ctx) {
    const appCtx = ctx as AppTemplateContext;
    const cfg: AppConfig = normalizeAppConfig(appCtx.appConfig, {
      projectName: ctx.projectName,
      description: `Interactive map generated by GIS Engine CLI v${ctx.cliVersion}`,
    });

    const hasComponent = (name: string) => cfg.components.includes(name);

    const componentImports = cfg.components.map((c) => `import ${c} from "./components/${c}";`).join("\n");

    const componentRender = cfg.components.map((c) => `          <${c} map={map} spec={spec} />`).join("\n");

    const componentFiles: GeneratedFile[] = [];

    if (hasComponent("LayerPanel")) {
      componentFiles.push({
        path: "src/components/LayerPanel.tsx",
        content: `import { useEffect, useMemo, useState } from "react";
import maplibregl from "maplibre-gl";

interface LayerInfo { id: string; type: string; visible: boolean; }

interface Props {
  map: maplibregl.Map | null;
  spec: Record<string, unknown>;
}

export default function LayerPanel({ map, spec }: Props) {
  const layers: LayerInfo[] = useMemo(
    () => ((spec.layers as Array<Record<string, unknown>>) ?? []).map((l) => ({
      id: String(l.id ?? "unknown"),
      type: String(l.type ?? "fill"),
      visible: (l.layout as Record<string, unknown>)?.visibility !== "none",
    })),
    [spec],
  );
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVisibility(Object.fromEntries(layers.map((l) => [l.id, l.visible])));
  }, [layers]);

  const toggle = (layerId: string) => {
    const next = !visibility[layerId];
    setVisibility((v) => ({ ...v, [layerId]: next }));
    if (map) {
      map.setLayoutProperty(layerId, "visibility", next ? "visible" : "none");
    }
  };

  return (
    <div className="absolute top-28 left-4 z-10 w-56 max-w-[calc(100vw-2rem)] rounded-lg bg-white/95 shadow-lg backdrop-blur-sm max-md:left-3 max-md:top-32 max-md:w-[calc(100vw-1.5rem)]">
      <div className="border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-700">Layers</h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {layers.length}
          </span>
        </div>
      </div>
      <ul className="max-h-60 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <li className="px-2 py-2 text-xs text-gray-500">No layers in this spec yet.</li>
        ) : (
          layers.map((layer) => (
            <li key={layer.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
              <input
                aria-label={"Toggle " + layer.id + " visibility"}
                type="checkbox"
                checked={visibility[layer.id] ?? true}
                onChange={() => toggle(layer.id)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex-1 truncate text-xs text-gray-700">{layer.id}</span>
              <span className="text-[10px] text-gray-400">{layer.type}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
`,
      });
    }

    if (hasComponent("FeaturePopup")) {
      componentFiles.push({
        path: "src/components/FeaturePopup.tsx",
        content: `import { useEffect } from "react";
import maplibregl from "maplibre-gl";

interface Props {
  map: maplibregl.Map | null;
  spec: Record<string, unknown>;
}

export default function FeaturePopup({ map, spec }: Props) {
  useEffect(() => {
    if (!map) return;

    const layers = (spec.layers as Array<Record<string, unknown>>) ?? [];
    const clickableLayers = layers
      .filter((l) => ["circle", "fill", "line", "symbol"].includes(String(l.type)))
      .map((l) => String(l.id));

    const handlers: Array<{
      layerId: string;
      clickHandler: (e: maplibregl.MapMouseEvent) => void;
      enterHandler: () => void;
      leaveHandler: () => void;
    }> = [];

    for (const layerId of clickableLayers) {
      const clickHandler = (e: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
        if (!features.length) return;
        const props = features[0].properties ?? {};
        const html = Object.entries(props)
          .map(([k, v]) => \`<div class="flex gap-2"><span class="font-medium text-gray-600">\${k}:</span><span class="text-gray-900">\${v}</span></div>\`)
          .join("");
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(\`<div class="space-y-1 text-xs p-1">\${html || "<em>No properties</em>"}</div>\`)
          .addTo(map);
      };
      const enterHandler = () => {
        map.getCanvas().style.cursor = "pointer";
      };
      const leaveHandler = () => {
        map.getCanvas().style.cursor = "";
      };
      map.on("click", layerId, clickHandler);
      map.on("mouseenter", layerId, enterHandler);
      map.on("mouseleave", layerId, leaveHandler);
      handlers.push({ layerId, clickHandler, enterHandler, leaveHandler });
    }

    return () => {
      for (const { layerId, clickHandler, enterHandler, leaveHandler } of handlers) {
        map.off("click", layerId, clickHandler);
        map.off("mouseenter", layerId, enterHandler);
        map.off("mouseleave", layerId, leaveHandler);
      }
    };
  }, [map, spec]);

  return null;
}
`,
      });
    }

    if (hasComponent("Legend")) {
      componentFiles.push({
        path: "src/components/Legend.tsx",
        content: `import maplibregl from "maplibre-gl";

interface Props {
  map: maplibregl.Map | null;
  spec: Record<string, unknown>;
}

interface LegendEntry { id: string; type: string; color: string; }

function extractColor(paint: Record<string, unknown> | undefined, layerType: string): string {
  if (!paint) return "#6b7280";
  const key = layerType === "circle" ? "circle-color"
    : layerType === "fill" ? "fill-color"
    : layerType === "line" ? "line-color"
    : "text-color";
  const val = paint[key];
  return typeof val === "string" ? val : "#6b7280";
}

export default function Legend({ spec }: Props) {
  const layers = (spec.layers as Array<Record<string, unknown>>) ?? [];
  const entries: LegendEntry[] = layers.map((l) => ({
    id: String(l.id ?? "unknown"),
    type: String(l.type ?? "fill"),
    color: extractColor(l.paint as Record<string, unknown> | undefined, String(l.type)),
  }));

  return (
    <div className="absolute bottom-8 right-4 z-10 w-56 max-w-[calc(100vw-2rem)] rounded-lg bg-white/95 shadow-lg backdrop-blur-sm max-md:bottom-4 max-md:left-3 max-md:right-3 max-md:w-[calc(100vw-1.5rem)]">
      <div className="border-b border-gray-200 px-3 py-2">
        <h3 className="text-sm font-semibold text-gray-700">Legend</h3>
      </div>
      <ul className="space-y-1 p-2">
        {entries.length === 0 ? (
          <li className="px-1 py-1 text-xs text-gray-500">No visible layers yet.</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 px-1">
              <span className="h-3 w-3 flex-shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="truncate text-xs text-gray-600">{entry.id}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
`,
      });
    }

    if (hasComponent("SearchBox")) {
      componentFiles.push({
        path: "src/components/SearchBox.tsx",
        content: `import { useCallback, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";

interface Props {
  map: maplibregl.Map | null;
  spec: Record<string, unknown>;
}

export default function SearchBox({ map, spec }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; label: string; lng: number; lat: number }>>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery("");
    setResults([]);
    setOpen(false);
  }, [spec]);

  const search = useCallback(() => {
    if (!map || !query.trim()) { setResults([]); return; }

    const layers = (spec.layers as Array<Record<string, unknown>>) ?? [];
    const found: Array<{ id: string; label: string; lng: number; lat: number }> = [];

    for (const layer of layers) {
      const sourceId = String(layer.source ?? "");
      const source = (spec.sources as Record<string, Record<string, unknown>>)?.[sourceId];
      if (!source || source.type !== "geojson") continue;
      const data = source.data as { features?: Array<Record<string, unknown>> } | undefined;
      if (!data?.features) continue;

      for (const feature of data.features) {
        const props = (feature.properties ?? {}) as Record<string, unknown>;
        const geom = feature.geometry as { type?: string; coordinates?: number[] } | undefined;
        if (!geom || geom.type !== "Point" || !geom.coordinates) continue;

        const text = Object.values(props).map(String).join(" ").toLowerCase();
        if (text.includes(query.toLowerCase())) {
          const name = String(props.name ?? props.title ?? props.label ?? Object.values(props)[0] ?? "Feature");
          found.push({ id: \`\${sourceId}-\${found.length}\`, label: name, lng: geom.coordinates[0], lat: geom.coordinates[1] });
        }
      }
    }

    setResults(found.slice(0, 10));
    setOpen(found.length > 0);
  }, [map, query, spec]);

  const flyTo = (lng: number, lat: number) => {
    if (map) map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
    setOpen(false);
  };

  return (
    <div className="absolute top-4 left-1/2 z-10 w-80 -translate-x-1/2 max-md:left-3 max-md:right-3 max-md:w-auto max-md:translate-x-0">
      <div className="flex overflow-hidden rounded-lg bg-white shadow-lg">
        <input
          aria-label="Search features"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search features..."
          className="flex-1 px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
        <button type="button" onClick={search} aria-label="Run search" className="bg-blue-600 px-3 text-white hover:bg-blue-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </div>
      {open && (
        <ul role="listbox" aria-live="polite" className="mt-1 max-h-48 overflow-y-auto rounded-lg bg-white shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => flyTo(r.lng, r.lat)} className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50">
                {r.label} <span className="text-gray-400">({r.lng.toFixed(2)}, {r.lat.toFixed(2)})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
`,
      });
    }

    if (hasComponent("BasemapSwitcher")) {
      componentFiles.push({
        path: "src/components/BasemapSwitcher.tsx",
        content: `import { useState } from "react";
import maplibregl from "maplibre-gl";

const BASEMAPS = [
  { id: "osm", label: "Streets", style: "https://demotiles.maplibre.org/style.json" },
  { id: "dark", label: "Dark", style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { id: "light", label: "Light", style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
];

interface Props {
  map: maplibregl.Map | null;
  spec: Record<string, unknown>;
}

export default function BasemapSwitcher({ map }: Props) {
  const [active, setActive] = useState("osm");

  const switchBasemap = (id: string) => {
    if (!map) return;
    const basemap = BASEMAPS.find((b) => b.id === id);
    if (!basemap) return;
    setActive(id);
    fetch(basemap.style)
      .then((r) => r.json())
      .then((style) => {
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();
        map.setStyle(style);
        map.once("style.load", () => {
          map.setCenter(currentCenter);
          map.setZoom(currentZoom);
        });
      })
      .catch(() => {});
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-1 rounded-lg bg-white/95 p-1 shadow-lg backdrop-blur-sm max-md:top-16 max-md:left-3 max-md:right-3 max-md:justify-between">
      {BASEMAPS.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => switchBasemap(b.id)}
          aria-pressed={active === b.id}
          title={"Switch to " + b.label}
          className={\`rounded px-2.5 py-1 text-xs transition \${
            active === b.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          }\`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
`,
      });
    }

    return [
      {
        path: "package.json",
        content: `${JSON.stringify(
          {
            name: ctx.projectName,
            version: "0.1.0",
            private: true,
            type: "module",
            scripts: {
              dev: "vite",
              build: "tsc -b && vite build",
              preview: "vite preview",
            },
            dependencies: {
              "@gis-engine/engine": engineVersionRange(ctx.cliVersion),
              "maplibre-gl": "^5.0.0",
              react: "^18.3.0",
              "react-dom": "^18.3.0",
            },
            devDependencies: {
              "@types/react": "^18.3.0",
              "@types/react-dom": "^18.3.0",
              "@vitejs/plugin-react": "^4.3.0",
              autoprefixer: "^10.4.0",
              postcss: "^8.4.0",
              tailwindcss: "^3.4.0",
              typescript: "^5.7.0",
              vite: "^5.4.0",
            },
          },
          null,
          2,
        )}\n`,
      },
      {
        path: "vite.config.ts",
        content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
      },
      {
        path: "tsconfig.json",
        content: `${JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              lib: ["ES2022", "DOM", "DOM.Iterable"],
              module: "ESNext",
              moduleResolution: "bundler",
              resolveJsonModule: true,
              jsx: "react-jsx",
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              outDir: "./dist",
            },
            include: ["src"],
          },
          null,
          2,
        )}\n`,
      },
      {
        path: "tailwind.config.js",
        content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
`,
      },
      {
        path: "postcss.config.js",
        content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
      },
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="data:," />
  <title>${cfg.title}</title>
</head>
<body class="m-0">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`,
      },
      {
        path: "src/index.css",
        content: `@import "maplibre-gl/dist/maplibre-gl.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
`,
      },
      {
        path: "src/vite-env.d.ts",
        content: `/// <reference types="vite/client" />
`,
      },
      {
        path: "src/main.tsx",
        content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      },
      {
        path: "src/App.tsx",
        content: `import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { validateSpec, type Diagnostic, type ValidationReport } from "@gis-engine/engine";
import maplibregl from "maplibre-gl";
${componentImports}
import mapSpec from "../map.json";

type MapSpecShape = {
  version?: string;
  revision?: string;
  view?: { center?: [number, number]; zoom?: number };
  sources?: Record<string, Record<string, unknown>>;
  layers?: Array<Record<string, unknown>>;
};

type MapLoadStatus = "loading" | "ready" | "empty" | "error";
type DeliveryLoadStatus = "loading" | "ready" | "missing" | "error";

type DeliverySectionSummary = {
  id?: string;
  status?: string;
  blockerCount?: number;
  confirmationRequired?: boolean;
  followUpCount?: number;
};

type DeliverySourceSummary = {
  sourceId?: string;
  type?: string;
  state?: string;
  queryReady?: boolean;
  resourcePolicy?: string;
  confirmationReasons?: string[];
  notes?: string[];
};

type DeliveryPromotionCandidate = {
  candidateId?: string;
  format?: string;
  state?: string;
  target?: string;
  exitCondition?: string;
};

type DeliveryConfirmation = {
  reason?: string;
  required?: boolean;
  target?: string;
};

type DeliveryFollowUp = {
  id?: string;
  owner?: string;
  targetArtifact?: string;
  reason?: string;
};

type DeliverySummaryShape = {
  promptHash?: string;
  traceId?: string;
  generatedAt?: string;
  preflight?: {
    ok?: boolean;
    status?: string;
    diagnostics?: {
      error?: number;
      warning?: number;
      info?: number;
    };
    sourceReadiness?: {
      status?: string;
      summary?: {
        supportedSourceCount?: number;
        readinessOnlySourceCount?: number;
        blockedSourceCount?: number;
      };
    };
    pmtiles?: {
      status?: string;
      summary?: {
        readySourceCount?: number;
        metadataRequiredSourceCount?: number;
        blockedSourceCount?: number;
      };
    };
  };
  delivery?: {
    status?: string;
    acceptance?: { state?: string };
    sections?: DeliverySectionSummary[];
    sourceReadiness?: {
      total?: number;
      supported?: number;
      readinessOnly?: number;
      blocked?: number;
      sources?: DeliverySourceSummary[];
    };
    sourcePromotionCandidates?: DeliveryPromotionCandidate[];
    spatialQueryReadiness?: { state?: string; status?: string };
    confirmationRequired?: boolean;
    confirmations?: DeliveryConfirmation[];
    followUps?: DeliveryFollowUp[];
  };
  evidenceStatus?: string;
  retainedRawPrompt?: boolean;
};

type ArtifactManifestFile = {
  path?: string;
  role?: string;
  required?: boolean;
  bytes?: number;
  sha256?: string;
};

type ArtifactManifestShape = {
  schemaVersion?: string;
  artifactCount?: number;
  requiredReviewFiles?: string[];
  files?: ArtifactManifestFile[];
};

type ArtifactVerificationStatus = "idle" | "loading" | "ready" | "error";

type ArtifactVerificationFileStatus =
  | "verified"
  | "missing"
  | "byte-mismatch"
  | "hash-mismatch"
  | "invalid"
  | "error";

type ArtifactVerificationFile = {
  path: string;
  role?: string;
  required?: boolean;
  status: ArtifactVerificationFileStatus;
  expectedBytes?: number;
  actualBytes?: number;
  expectedSha256?: string;
  actualSha256?: string;
  detail?: string;
};

function isMapSpecShape(value: unknown): value is MapSpecShape {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDeliverySummaryShape(value: unknown): value is DeliverySummaryShape {
  return typeof value === "object" && value !== null;
}

function isArtifactManifestShape(value: unknown): value is ArtifactManifestShape {
  return typeof value === "object" && value !== null;
}

function isHtmlFallbackResponse(response: Response): boolean {
  return (response.headers.get("content-type") ?? "").toLowerCase().includes("text/html");
}

function formatDeliveryState(delivery: DeliverySummaryShape["delivery"], loadStatus: DeliveryLoadStatus): string {
  if (delivery?.acceptance?.state) return delivery.acceptance.state;
  if (delivery?.status) return delivery.status;
  if (loadStatus === "missing") return "scaffold";
  if (loadStatus === "error") return "unavailable";
  return "loading";
}

function deliveryBadgeTone(state: string, loadStatus: DeliveryLoadStatus): string {
  if (state === "blocked" || loadStatus === "error") return "bg-red-600 text-white";
  if (state === "needs-confirmation") return "bg-amber-500 text-white";
  if (state === "follow-up-required") return "bg-blue-600 text-white";
  if (state === "ready") return "bg-emerald-600 text-white";
  return "bg-slate-600 text-white";
}

function displayValue(value: string | number | undefined): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim().length > 0) return value;
  return "--";
}

function flagValue(value: boolean | undefined): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "--";
}

function shortHash(value: string | undefined): string {
  if (!value) return "--";
  return value.length > 22 ? value.slice(0, 19) + "..." : value;
}

function artifactFileHref(path: string | undefined): string | undefined {
  const trimmed = path?.trim();
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("\\\\") || trimmed.includes("://")) return undefined;
  const parts = trimmed.split(/[\\\\/]+/);
  if (parts.some((part) => !part || part === "." || part === "..")) return undefined;
  return "./" + parts.map((part) => encodeURIComponent(part)).join("/");
}

function isRequiredReviewArtifact(file: ArtifactManifestFile, requiredReviewFiles: string[] | undefined): boolean {
  if (file.required === true) return true;
  return typeof file.path === "string" && (requiredReviewFiles ?? []).includes(file.path);
}

function normalizeSha256(value: string | undefined): string | undefined {
  if (!value || !/^sha256:[a-f0-9]{64}$/i.test(value)) return undefined;
  return value.toLowerCase();
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function digestSha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return "sha256:" + arrayBufferToHex(digest);
}

async function verifyArtifactFile(file: ArtifactManifestFile): Promise<ArtifactVerificationFile> {
  const path = file.path ?? "<invalid>";
  const href = artifactFileHref(file.path);
  const expectedBytes =
    typeof file.bytes === "number" && Number.isInteger(file.bytes) && file.bytes >= 0 ? file.bytes : undefined;
  const expectedSha256 = normalizeSha256(file.sha256);
  const base = {
    path,
    ...(file.role !== undefined ? { role: file.role } : {}),
    ...(file.required !== undefined ? { required: file.required } : {}),
    ...(expectedBytes !== undefined ? { expectedBytes } : {}),
    ...(expectedSha256 !== undefined ? { expectedSha256 } : {}),
  };

  if (!href) {
    return { ...base, status: "invalid", detail: "Artifact path is missing or unsafe." };
  }
  if (expectedBytes === undefined) {
    return { ...base, status: "invalid", detail: "Artifact manifest entry is missing a valid byte count." };
  }
  if (!expectedSha256) {
    return { ...base, status: "invalid", detail: "Artifact manifest entry is missing a sha256:<hex> hash." };
  }
  if (!crypto.subtle) {
    return { ...base, status: "error", detail: "Browser SHA-256 verification is unavailable." };
  }

  try {
    const response = await fetch(href, { cache: "no-store" });
    if (!response.ok) {
      return { ...base, status: "missing", detail: "HTTP " + response.status };
    }
    if (isHtmlFallbackResponse(response)) {
      return { ...base, status: "missing", detail: "Artifact response looked like an HTML fallback." };
    }
    const buffer = await response.arrayBuffer();
    const actualBytes = buffer.byteLength;
    const actualSha256 = await digestSha256(buffer);
    if (actualBytes !== expectedBytes) {
      return { ...base, status: "byte-mismatch", actualBytes, actualSha256 };
    }
    if (actualSha256 !== expectedSha256) {
      return { ...base, status: "hash-mismatch", actualBytes, actualSha256 };
    }
    return { ...base, status: "verified", actualBytes, actualSha256 };
  } catch (error) {
    return {
      ...base,
      status: "error",
      detail: error instanceof Error ? error.message : "Could not verify artifact.",
    };
  }
}

function downloadJsonFile(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2) + "\\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function countDiagnostics(diagnostics: Diagnostic[]): Record<Diagnostic["severity"], number> {
  return diagnostics.reduce(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}

function formatDiagnosticLine(diagnostic: Diagnostic): string {
  return diagnostic.code + " " + (diagnostic.path ?? "/") + ": " + diagnostic.message;
}

function formatDiagnosticDetail(diagnostics: Diagnostic[]): string | null {
  if (diagnostics.length === 0) return null;
  const detail = diagnostics.slice(0, 3).map(formatDiagnosticLine).join(" | ");
  const remaining = diagnostics.length - 3;
  return remaining > 0 ? detail + " | +" + String(remaining) + " more diagnostic(s)" : detail;
}

function buildValidationReport(spec: MapSpecShape, validation: ValidationReport) {
  return {
    schemaVersion: "gis-engine.generated-app.mapspec-validation-report.v1",
    generatedAt: new Date().toISOString(),
    source: "generated-app",
    spec: {
      version: typeof spec.version === "string" ? spec.version : undefined,
      revision: typeof spec.revision === "string" ? spec.revision : undefined,
    },
    valid: validation.valid,
    stats: validation.stats,
    diagnosticCounts: countDiagnostics(validation.diagnostics),
    diagnostics: validation.diagnostics,
  };
}

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [spec, setSpec] = useState<MapSpecShape>(() => mapSpec as unknown as MapSpecShape);
  const [status, setStatus] = useState<MapLoadStatus>("loading");
  const [statusMessage, setStatusMessage] = useState("Loading map.json...");
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [deliverySummary, setDeliverySummary] = useState<DeliverySummaryShape | null>(null);
  const [deliveryLoadStatus, setDeliveryLoadStatus] = useState<DeliveryLoadStatus>("loading");
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [artifactManifest, setArtifactManifest] = useState<ArtifactManifestShape | null>(null);
  const [artifactManifestLoadStatus, setArtifactManifestLoadStatus] = useState<DeliveryLoadStatus>("loading");
  const [artifactManifestError, setArtifactManifestError] = useState<string | null>(null);
  const [artifactVerificationFiles, setArtifactVerificationFiles] = useState<ArtifactVerificationFile[]>([]);
  const [artifactVerificationStatus, setArtifactVerificationStatus] = useState<ArtifactVerificationStatus>("idle");
  const [artifactVerificationError, setArtifactVerificationError] = useState<string | null>(null);
  const [reviewDetailsOpen, setReviewDetailsOpen] = useState(false);

  const artifactManifestFiles = useMemo(() => artifactManifest?.files ?? [], [artifactManifest]);
  const artifactVerificationTargets = useMemo(
    () =>
      artifactManifestFiles.filter((file) =>
        isRequiredReviewArtifact(file, artifactManifest?.requiredReviewFiles),
      ),
    [artifactManifest?.requiredReviewFiles, artifactManifestFiles],
  );
  const specValidation = useMemo(() => validateSpec(spec), [spec]);
  const visibleSpecDiagnostics = useMemo(
    () => specValidation.diagnostics.filter((diagnostic) => diagnostic.severity !== "info"),
    [specValidation],
  );
  const blockingSpecDiagnostics = useMemo(
    () => specValidation.diagnostics.filter((diagnostic) => diagnostic.severity === "error"),
    [specValidation],
  );
  const specDiagnosticCounts = useMemo(() => countDiagnostics(specValidation.diagnostics), [specValidation]);
  const specValidationState = specValidation.valid
    ? visibleSpecDiagnostics.length > 0
      ? "warnings"
      : "valid"
    : "blocked";
  const sourceCount = Object.keys(spec.sources ?? {}).length;
  const layerCount = (spec.layers ?? []).length;
  const hasContent = sourceCount > 0 && layerCount > 0;

  useEffect(() => {
    let cancelled = false;

    const loadDeliverySummary = async () => {
      setDeliveryLoadStatus("loading");
      setDeliveryError(null);

      try {
        const response = await fetch("./delivery-summary.json", { cache: "no-store" });
        if (response.status === 404) {
          if (!cancelled) {
            setDeliverySummary(null);
            setDeliveryLoadStatus("missing");
          }
          return;
        }
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        if (isHtmlFallbackResponse(response)) {
          if (!cancelled) {
            setDeliverySummary(null);
            setDeliveryLoadStatus("missing");
          }
          return;
        }
        const parsed = (await response.json()) as unknown;
        if (!isDeliverySummaryShape(parsed)) {
          throw new Error("delivery-summary.json must contain a JSON object.");
        }
        if (!cancelled) {
          setDeliverySummary(parsed);
          setDeliveryLoadStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setDeliverySummary(null);
          setDeliveryLoadStatus("error");
          setDeliveryError(error instanceof Error ? error.message : "Could not read delivery-summary.json.");
        }
      }
    };

    void loadDeliverySummary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadArtifactManifest = async () => {
      setArtifactManifestLoadStatus("loading");
      setArtifactManifestError(null);

      try {
        const response = await fetch("./artifact-manifest.json", { cache: "no-store" });
        if (response.status === 404) {
          if (!cancelled) {
            setArtifactManifest(null);
            setArtifactManifestLoadStatus("missing");
          }
          return;
        }
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        if (isHtmlFallbackResponse(response)) {
          if (!cancelled) {
            setArtifactManifest(null);
            setArtifactManifestLoadStatus("missing");
          }
          return;
        }
        const parsed = (await response.json()) as unknown;
        if (!isArtifactManifestShape(parsed)) {
          throw new Error("artifact-manifest.json must contain a JSON object.");
        }
        if (!cancelled) {
          setArtifactManifest(parsed);
          setArtifactManifestLoadStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setArtifactManifest(null);
          setArtifactManifestLoadStatus("error");
          setArtifactManifestError(error instanceof Error ? error.message : "Could not read artifact-manifest.json.");
        }
      }
    };

    void loadArtifactManifest();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const verifyRequiredArtifacts = async () => {
      setArtifactVerificationFiles([]);
      setArtifactVerificationError(null);

      if (artifactManifestLoadStatus !== "ready" || artifactVerificationTargets.length === 0) {
        setArtifactVerificationStatus("idle");
        return;
      }

      setArtifactVerificationStatus("loading");

      try {
        const results: ArtifactVerificationFile[] = [];
        for (const file of artifactVerificationTargets) {
          results.push(await verifyArtifactFile(file));
        }
        if (!cancelled) {
          setArtifactVerificationFiles(results);
          setArtifactVerificationStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setArtifactVerificationFiles([]);
          setArtifactVerificationStatus("error");
          setArtifactVerificationError(error instanceof Error ? error.message : "Could not verify review artifacts.");
        }
      }
    };

    void verifyRequiredArtifacts();

    return () => {
      cancelled = true;
    };
  }, [artifactManifestLoadStatus, artifactVerificationTargets]);

  useEffect(() => {
    if (!mapContainer.current) return;

    setMap(null);
    setStatus("loading");
    setStatusMessage("Validating map.json...");
    setStatusDetail(null);

    if (blockingSpecDiagnostics.length > 0) {
      setStatus("error");
      setStatusMessage("MapSpec validation failed.");
      setStatusDetail(formatDiagnosticDetail(blockingSpecDiagnostics));
      return;
    }

    setStatusMessage("Rendering map...");

    const view = spec.view as { center?: [number, number]; zoom?: number } | undefined;
    const nextMap = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: view?.center ?? [0, 20],
      zoom: view?.zoom ?? 2,
    });

    nextMap.addControl(new maplibregl.NavigationControl(), "bottom-right");

    const syncSpecToMap = (targetMap: maplibregl.Map) => {
      const sources = (spec.sources ?? {}) as Record<string, Record<string, unknown>>;
      for (const [id, src] of Object.entries(sources)) {
        if (!targetMap.getSource(id)) {
          targetMap.addSource(id, src as maplibregl.SourceSpecification);
        }
      }
      const layers = (spec.layers ?? []) as Array<Record<string, unknown>>;
      for (const layer of layers) {
        if (!targetMap.getLayer(String(layer.id))) {
          targetMap.addLayer(layer as maplibregl.LayerSpecification);
        }
      }
    };

    nextMap.on("load", () => {
      try {
        setMap(nextMap);
        syncSpecToMap(nextMap);
        if (!hasContent) {
          setStatus("empty");
          setStatusMessage("Map loaded, but this spec does not define any sources or layers yet.");
          setStatusDetail("Load a local map.json file or add sources and layers to the spec.");
        } else {
          setStatus("ready");
          setStatusMessage("Map ready: " + sourceCount + " source(s) and " + layerCount + " layer(s).");
          setStatusDetail(null);
        }
      } catch (error) {
        setStatus("error");
        setStatusMessage("Map rendering failed.");
        setStatusDetail(error instanceof Error ? error.message : "The map could not finish rendering.");
      }
    });
    nextMap.on("error", (event) => {
      const detail = event.error instanceof Error ? event.error.message : "The map reported a rendering error.";
      setStatus("error");
      setStatusMessage("Map rendering failed.");
      setStatusDetail(detail);
    });

    return () => {
      nextMap.remove();
    };
  }, [blockingSpecDiagnostics, hasContent, layerCount, sourceCount, spec]);

  const reloadCurrentSpec = async () => {
    setStatus("loading");
    setStatusMessage("Reloading map.json...");
    setStatusDetail(null);

    try {
      const response = await fetch("./map.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      if (isHtmlFallbackResponse(response)) {
        throw new Error("map.json must be available as a JSON file.");
      }
      const parsed = (await response.json()) as unknown;
      if (!isMapSpecShape(parsed)) {
        throw new Error("map.json must contain a JSON object.");
      }
      setSpec(parsed);
    } catch (error) {
      setStatus("error");
      setStatusMessage("Could not reload map.json.");
      setStatusDetail(error instanceof Error ? error.message : "The current map.json file could not be loaded.");
    }
  };

  const openSpecFile = () => {
    fileInputRef.current?.click();
  };

  const downloadCurrentSpec = () => {
    try {
      downloadJsonFile("map.json", spec);
    } catch (error) {
      setStatus("error");
      setStatusMessage("Could not download map.json.");
      setStatusDetail(error instanceof Error ? error.message : "The current spec could not be serialized.");
    }
  };

  const downloadValidationReport = () => {
    try {
      downloadJsonFile("mapspec-validation-report.json", buildValidationReport(spec, specValidation));
    } catch (error) {
      setStatus("error");
      setStatusMessage("Could not download validation report.");
      setStatusDetail(error instanceof Error ? error.message : "The validation report could not be serialized.");
    }
  };

  const handleSpecFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setStatus("loading");
    setStatusMessage("Loading " + file.name + "...");
    setStatusDetail(null);

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      if (!isMapSpecShape(parsed)) {
        throw new Error("The file must contain a JSON object.");
      }
      setSpec(parsed);
    } catch (error) {
      setStatus("error");
      setStatusMessage("Could not load the selected map.json file.");
      setStatusDetail(error instanceof Error ? error.message : "The file is not valid JSON.");
    }
  };

  const statusLabel = status === "error" ? "Error" : status === "empty" ? "Empty" : status === "ready" ? "Ready" : "Loading";
  const bannerTone = status === "error"
    ? "border-red-200 bg-red-50/95"
    : status === "empty"
      ? "border-amber-200 bg-amber-50/95"
      : status === "ready"
        ? "border-emerald-200 bg-emerald-50/95"
        : "border-slate-200 bg-white/95";
  const badgeTone = status === "error"
    ? "bg-red-600 text-white"
    : status === "empty"
      ? "bg-amber-500 text-white"
      : status === "ready"
        ? "bg-emerald-600 text-white"
        : "bg-slate-900 text-white";
  const delivery = deliverySummary?.delivery;
  const deliveryState = formatDeliveryState(delivery, deliveryLoadStatus);
  const deliveryTone = deliveryBadgeTone(deliveryState, deliveryLoadStatus);
  const deliverySourceSummary = delivery?.sourceReadiness;
  const deliveryFollowUpCount = delivery?.followUps?.length ?? 0;
  const deliveryConfirmationCount = delivery?.confirmations?.filter((confirmation) => confirmation.required).length ?? 0;
  const deliverySourceText = deliverySourceSummary
    ? String(deliverySourceSummary.supported ?? 0) + "/" + String(deliverySourceSummary.total ?? 0)
    : "--";
  const deliveryPreflightState = deliverySummary?.preflight?.status ?? "--";
  const deliverySpatialState = delivery?.spatialQueryReadiness?.state ?? "--";
  const deliveryDetail = deliveryLoadStatus === "error" ? deliveryError : null;
  const artifactManifestRequiredCount =
    artifactManifest?.requiredReviewFiles?.length ?? artifactManifestFiles.filter((file) => file.required === true).length;
  const artifactManifestBytes = artifactManifestFiles.reduce(
    (total, file) => total + (typeof file.bytes === "number" ? file.bytes : 0),
    0,
  );
  const artifactManifestState = artifactManifestLoadStatus === "ready" ? "available" : artifactManifestLoadStatus;
  const artifactManifestDetail = artifactManifestLoadStatus === "error" ? artifactManifestError : null;
  const artifactVerificationSummary = {
    total: artifactVerificationFiles.length,
    verified: artifactVerificationFiles.filter((file) => file.status === "verified").length,
    missing: artifactVerificationFiles.filter((file) => file.status === "missing").length,
    byteMismatch: artifactVerificationFiles.filter((file) => file.status === "byte-mismatch").length,
    hashMismatch: artifactVerificationFiles.filter((file) => file.status === "hash-mismatch").length,
    invalid: artifactVerificationFiles.filter((file) => file.status === "invalid" || file.status === "error").length,
  };
  const artifactIntegrityState =
    artifactManifestLoadStatus !== "ready"
      ? artifactManifestState
      : artifactVerificationStatus === "loading"
        ? "checking"
        : artifactVerificationStatus === "error"
          ? "unavailable"
          : artifactVerificationSummary.total === 0
            ? "none"
            : artifactVerificationSummary.verified === artifactVerificationSummary.total
              ? "verified"
              : "blocked";
  const artifactVerificationDetail = artifactVerificationStatus === "error" ? artifactVerificationError : null;
  const canShowReviewDetails =
    specValidation.valid ||
    specValidation.diagnostics.length > 0 ||
    (deliveryLoadStatus === "ready" && deliverySummary !== null) ||
    (artifactManifestLoadStatus === "ready" && artifactManifest !== null);
  const deliverySections = delivery?.sections ?? [];
  const deliverySources = deliverySourceSummary?.sources ?? [];
  const deliveryPromotions = delivery?.sourcePromotionCandidates ?? [];
  const deliveryConfirmations = delivery?.confirmations ?? [];
  const deliveryFollowUps = delivery?.followUps ?? [];
  const preflightDiagnostics = deliverySummary?.preflight?.diagnostics;
  const preflightSources = deliverySummary?.preflight?.sourceReadiness?.summary;
  const preflightPmtiles = deliverySummary?.preflight?.pmtiles?.summary;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div ref={mapContainer} className="h-full w-full" />
      <div
        className={"absolute left-4 top-4 z-20 w-[calc(100vw-2rem)] max-w-md rounded-lg border p-3 shadow-lg backdrop-blur-sm max-md:left-3 max-md:top-auto max-md:bottom-4 max-md:w-[calc(100vw-1.5rem)] " + bannerTone}
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Generated map app</p>
            <h1 className="truncate text-sm font-semibold text-gray-900">MapSpec workspace</h1>
          </div>
          <span className={"shrink-0 rounded-full px-2 py-1 text-[10px] font-medium " + badgeTone}>
            {statusLabel}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-700">{statusMessage}</p>
        {statusDetail ? <p className="mt-1 text-xs text-gray-500">{statusDetail}</p> : null}
        <div className="mt-3 border-t border-gray-200 pt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase text-gray-500">Delivery</span>
            <span className={"shrink-0 rounded-full px-2 py-1 text-[10px] font-medium " + deliveryTone}>
              {deliveryState}
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-600 sm:grid-cols-4">
            <div>
              <dt className="text-gray-400">Preflight</dt>
              <dd className="truncate font-medium text-gray-900">{deliveryPreflightState}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Sources</dt>
              <dd className="font-medium text-gray-900">{deliverySourceText}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Spatial</dt>
              <dd className="truncate font-medium text-gray-900">{deliverySpatialState}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Follow-ups</dt>
              <dd className="font-medium text-gray-900">{deliveryFollowUpCount + deliveryConfirmationCount}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Artifacts</dt>
              <dd className="truncate font-medium text-gray-900">{artifactManifestState}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Integrity</dt>
              <dd className="truncate font-medium text-gray-900">{artifactIntegrityState}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Spec</dt>
              <dd className="truncate font-medium text-gray-900">{specValidationState}</dd>
            </div>
          </dl>
          {deliveryDetail ? <p className="mt-2 truncate text-[11px] text-gray-500">{deliveryDetail}</p> : null}
          {artifactManifestDetail ? <p className="mt-2 truncate text-[11px] text-gray-500">{artifactManifestDetail}</p> : null}
          {artifactVerificationDetail ? <p className="mt-2 truncate text-[11px] text-gray-500">{artifactVerificationDetail}</p> : null}
          {visibleSpecDiagnostics.length > 0 ? (
            <ul className="mt-2 space-y-1 text-[11px] text-gray-600">
              {visibleSpecDiagnostics.slice(0, 3).map((diagnostic, index) => (
                <li key={diagnostic.code + (diagnostic.path ?? "/") + String(index)} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
                  <span className="font-medium text-gray-900">{diagnostic.code}</span>
                  <span className="truncate">{diagnostic.path ?? "/"}</span>
                  <span className="col-span-2 truncate text-gray-500">{diagnostic.message}</span>
                </li>
              ))}
              {visibleSpecDiagnostics.length > 3 ? (
                <li className="text-gray-400">+{visibleSpecDiagnostics.length - 3} more diagnostic(s)</li>
              ) : null}
            </ul>
          ) : null}
        </div>
        {reviewDetailsOpen && canShowReviewDetails ? (
          <div className="mt-3 max-h-64 overflow-y-auto border-t border-gray-200 pt-3 text-[11px] text-gray-600">
            <section>
              <h2 className="text-[11px] font-semibold uppercase text-gray-500">Review details</h2>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-gray-400">Spec</dt>
                  <dd className="truncate font-medium text-gray-900">{specValidationState}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Spec diagnostics</dt>
                  <dd className="font-medium text-gray-900">
                    {displayValue(specDiagnosticCounts.error)} / {displayValue(specDiagnosticCounts.warning)} / {displayValue(specDiagnosticCounts.info)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Spec sources</dt>
                  <dd className="font-medium text-gray-900">{displayValue(specValidation.stats.sourceCount)}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Spec layers</dt>
                  <dd className="font-medium text-gray-900">
                    {displayValue(specValidation.stats.visibleLayerCount)} visible / {displayValue(specValidation.stats.layerCount)} total
                  </dd>
                </div>
              </dl>
              {visibleSpecDiagnostics.length > 0 ? (
                <ul className="mt-2 divide-y divide-gray-200">
                  {visibleSpecDiagnostics.map((diagnostic, index) => (
                    <li key={diagnostic.code + (diagnostic.path ?? "/") + String(index)} className="py-1">
                      <p className="truncate font-medium text-gray-900">{diagnostic.code}: {diagnostic.path ?? "/"}</p>
                      <p className="text-gray-400">{diagnostic.message}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-gray-400">No schema, semantic, or resource-policy diagnostics.</p>
              )}
            </section>
            <section className="mt-3 border-t border-gray-200 pt-3">
              <h3 className="text-[11px] font-semibold uppercase text-gray-500">Delivery</h3>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-gray-400">Evidence</dt>
                  <dd className="truncate font-medium text-gray-900">{deliverySummary?.evidenceStatus ?? "--"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Raw prompt</dt>
                  <dd className="font-medium text-gray-900">
                    {deliverySummary?.retainedRawPrompt === true
                      ? "retained"
                      : deliverySummary?.retainedRawPrompt === false
                        ? "not retained"
                        : "--"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Preflight diagnostics</dt>
                  <dd className="font-medium text-gray-900">
                    {displayValue(preflightDiagnostics?.error)} / {displayValue(preflightDiagnostics?.warning)} / {displayValue(preflightDiagnostics?.info)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">PMTiles</dt>
                  <dd className="truncate font-medium text-gray-900">
                    {displayValue(preflightPmtiles?.readySourceCount)} ready, {displayValue(preflightPmtiles?.metadataRequiredSourceCount)} metadata, {displayValue(preflightPmtiles?.blockedSourceCount)} blocked
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Preflight sources</dt>
                  <dd className="font-medium text-gray-900">
                    {displayValue(preflightSources?.supportedSourceCount)} / {displayValue(preflightSources?.readinessOnlySourceCount)} / {displayValue(preflightSources?.blockedSourceCount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Trace</dt>
                  <dd className="truncate font-medium text-gray-900">{deliverySummary?.traceId ?? "--"}</dd>
                </div>
              </dl>
            </section>
            <section className="mt-3 border-t border-gray-200 pt-3">
              <h3 className="text-[11px] font-semibold uppercase text-gray-500">Artifacts</h3>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-gray-400">Manifest</dt>
                  <dd className="truncate font-medium text-gray-900">{artifactManifestState}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Schema</dt>
                  <dd className="truncate font-medium text-gray-900">{artifactManifest?.schemaVersion ?? "--"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Files</dt>
                  <dd className="font-medium text-gray-900">
                    {displayValue(artifactManifest?.artifactCount ?? artifactManifestFiles.length)} total, {displayValue(artifactManifestRequiredCount)} required
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Bytes</dt>
                  <dd className="font-medium text-gray-900">{displayValue(artifactManifestBytes)}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Artifact integrity</dt>
                  <dd className="truncate font-medium text-gray-900">{artifactIntegrityState}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Verified review files</dt>
                  <dd className="font-medium text-gray-900">
                    {displayValue(artifactVerificationSummary.verified)} / {displayValue(artifactVerificationSummary.total)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Missing</dt>
                  <dd className="font-medium text-gray-900">{displayValue(artifactVerificationSummary.missing)}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Mismatches</dt>
                  <dd className="font-medium text-gray-900">
                    {displayValue(artifactVerificationSummary.byteMismatch + artifactVerificationSummary.hashMismatch + artifactVerificationSummary.invalid)}
                  </dd>
                </div>
              </dl>
              {artifactVerificationStatus === "loading" ? (
                <p className="mt-2 text-gray-400">Checking required review artifacts...</p>
              ) : artifactVerificationFiles.length > 0 ? (
                <div className="mt-2 rounded border border-gray-200 bg-white/70 p-2">
                  <h4 className="text-[10px] font-semibold uppercase text-gray-500">Required review file integrity</h4>
                  <ul className="mt-1 divide-y divide-gray-200">
                    {artifactVerificationFiles.map((file) => (
                      <li key={file.path} className="py-1">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                          <span className="truncate font-medium text-gray-900">{file.path}</span>
                          <span className="font-medium text-gray-700">{file.status}</span>
                        </div>
                        <p className="truncate text-gray-400">
                          bytes {displayValue(file.actualBytes)} / {displayValue(file.expectedBytes)}, hash {shortHash(file.actualSha256)} / {shortHash(file.expectedSha256)}
                        </p>
                        {file.detail ? <p className="truncate text-gray-400">{file.detail}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : artifactManifestLoadStatus === "ready" ? (
                <p className="mt-2 text-gray-400">No required review artifacts to verify in the browser.</p>
              ) : null}
              {artifactManifestFiles.length > 0 ? (
                <ul className="mt-1 divide-y divide-gray-200">
                  {artifactManifestFiles.map((file, index) => {
                    const href = artifactFileHref(file.path);
                    return (
                      <li key={(file.path ?? "artifact") + String(index)} className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 py-1">
                        <span className="truncate font-medium text-gray-900">{file.path ?? "artifact"}</span>
                        <span className="font-medium text-gray-700">{file.role ?? "--"}</span>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={"Open " + (file.path ?? "artifact")}
                            className="font-medium text-blue-700 hover:text-blue-500"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="font-medium text-gray-400">--</span>
                        )}
                        <span className="col-span-3 text-gray-400">
                          required {flagValue(file.required)}, bytes {displayValue(file.bytes)}, {shortHash(file.sha256)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">None</p>
              )}
            </section>
            <section className="mt-3 border-t border-gray-200 pt-3">
              <h3 className="text-[11px] font-semibold uppercase text-gray-500">Sections</h3>
              {deliverySections.length > 0 ? (
                <ul className="mt-1 divide-y divide-gray-200">
                  {deliverySections.map((section, index) => (
                    <li key={(section.id ?? "section") + String(index)} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1">
                      <span className="truncate font-medium text-gray-900">{section.id ?? "section"}</span>
                      <span className="font-medium text-gray-700">{section.status ?? "--"}</span>
                      <span className="col-span-2 text-gray-400">
                        blockers {displayValue(section.blockerCount)}, confirmation {flagValue(section.confirmationRequired)}, follow-ups {displayValue(section.followUpCount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">None</p>
              )}
            </section>
            <section className="mt-3 border-t border-gray-200 pt-3">
              <h3 className="text-[11px] font-semibold uppercase text-gray-500">Sources</h3>
              {deliverySources.length > 0 ? (
                <ul className="mt-1 divide-y divide-gray-200">
                  {deliverySources.map((source, index) => (
                    <li key={(source.sourceId ?? "source") + String(index)} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1">
                      <span className="truncate font-medium text-gray-900">{source.sourceId ?? "source"}</span>
                      <span className="font-medium text-gray-700">{source.state ?? "--"}</span>
                      <span className="col-span-2 text-gray-400">
                        {source.type ?? "--"} source, query {flagValue(source.queryReady)}, policy {source.resourcePolicy ?? "--"}
                      </span>
                      {source.confirmationReasons && source.confirmationReasons.length > 0 ? (
                        <span className="col-span-2 truncate text-gray-400">
                          confirmation {source.confirmationReasons.join(", ")}
                        </span>
                      ) : null}
                      {source.notes && source.notes.length > 0 ? (
                        <span className="col-span-2 truncate text-gray-400">{source.notes.join(" ")}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">None</p>
              )}
            </section>
            {deliveryPromotions.length > 0 ? (
              <section className="mt-3 border-t border-gray-200 pt-3">
                <h3 className="text-[11px] font-semibold uppercase text-gray-500">Promotion</h3>
                <ul className="mt-1 divide-y divide-gray-200">
                  {deliveryPromotions.map((candidate, index) => (
                    <li key={(candidate.candidateId ?? "candidate") + String(index)} className="py-1">
                      <p className="truncate font-medium text-gray-900">{candidate.candidateId ?? "candidate"}: {candidate.format ?? "--"} / {candidate.state ?? "--"}</p>
                      <p className="text-gray-400">{candidate.target ?? "--"}; {candidate.exitCondition ?? "--"}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section className="mt-3 border-t border-gray-200 pt-3">
              <h3 className="text-[11px] font-semibold uppercase text-gray-500">Confirmations</h3>
              {deliveryConfirmations.length > 0 ? (
                <ul className="mt-1 divide-y divide-gray-200">
                  {deliveryConfirmations.map((confirmation, index) => (
                    <li key={(confirmation.reason ?? "confirmation") + String(index)} className="py-1">
                      <p className="truncate font-medium text-gray-900">{confirmation.reason ?? "confirmation"}: {flagValue(confirmation.required)}</p>
                      <p className="text-gray-400">{confirmation.target ?? "--"}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">None</p>
              )}
            </section>
            <section className="mt-3 border-t border-gray-200 pt-3">
              <h3 className="text-[11px] font-semibold uppercase text-gray-500">Follow-ups</h3>
              {deliveryFollowUps.length > 0 ? (
                <ul className="mt-1 divide-y divide-gray-200">
                  {deliveryFollowUps.map((followUp, index) => (
                    <li key={(followUp.id ?? "follow-up") + String(index)} className="py-1">
                      <p className="truncate font-medium text-gray-900">{followUp.id ?? "follow-up"}: {followUp.owner ?? "--"}</p>
                      <p className="text-gray-400">{followUp.reason ?? "--"}</p>
                      <p className="text-gray-400">{followUp.targetArtifact ?? "--"}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-400">None</p>
              )}
            </section>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void reloadCurrentSpec();
            }}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Reload map.json
          </button>
          <button
            type="button"
            onClick={openSpecFile}
            className="rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
          >
            Load map.json
          </button>
          <button
            type="button"
            onClick={downloadCurrentSpec}
            className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
          >
            Download map.json
          </button>
          <button
            type="button"
            onClick={downloadValidationReport}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Download validation report
          </button>
          <button
            type="button"
            onClick={() => setReviewDetailsOpen((open) => !open)}
            disabled={!canShowReviewDetails}
            aria-expanded={reviewDetailsOpen}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-medium " +
              (canShowReviewDetails
                ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400")
            }
          >
            Review details
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">
          Load a local map.json file, reload ./map.json from disk, or download the spec and validation report without refreshing the browser.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleSpecFileChange}
        />
      </div>
      {map && (
        <>
${componentRender}
        </>
      )}
    </div>
  );
}
`,
      },
      ...componentFiles,
      {
        path: "map.json",
        content: `${JSON.stringify(
          {
            version: "0.1",
            sources: {
              points: {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
              },
            },
            layers: [
              {
                id: "points-layer",
                type: "circle",
                source: "points",
                paint: { "circle-radius": 6, "circle-color": "#3b82f6" },
              },
            ],
            view: { center: [0, 0], zoom: 2 },
          },
          null,
          2,
        )}\n`,
      },
      {
        path: "README.md",
        content: `# ${ctx.projectName}

Generated by \`create-gis-map\` v${ctx.cliVersion} using the **app** template.

## App Type

**${cfg.appType}** — ${cfg.description}

Components: ${cfg.components.join(", ")}

## Usage

\`\`\`bash
npm install
npm run dev
\`\`\`

## Delivery Evidence

When this app is produced through \`--generate --template app\`, it reads the
generated \`delivery-summary.json\` at runtime and shows the delivery acceptance
state, preflight status, source-readiness count, spatial-query readiness, and
review follow-up count in the map status banner. It also reads
\`artifact-manifest.json\` when present and shows generated file roles, required
review flags, byte counts, hash references, and safe relative links for opening
listed artifacts in the review details panel. Scaffold-only projects keep
running when those evidence files are absent. Generated projects also include
\`REVIEW.md\` as the human-readable handoff for the same delivery evidence.
The app can also reload \`./map.json\` from disk without a page refresh and
download the currently loaded MapSpec as \`map.json\` for local review or
handoff. The app validates the loaded MapSpec with
\`@gis-engine/engine.validateSpec()\` before rendering and surfaces structured
diagnostic code/path/message feedback when validation blocks the map. It can
also download a local \`mapspec-validation-report.json\` with validity, stats,
diagnostic counts, and structured diagnostics for handoff.
The source rail also surfaces per-source confirmation reasons and next actions
when readiness-only or blocked evidence is present, so reviewers can see the
promotion boundary without opening the JSON payload.

## Preflight

Validate the generated spec before deployment or CI handoff:

\`\`\`bash
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./map.json --json
\`\`\`

Verify generated file integrity before CI or reviewer handoff:

\`\`\`bash
npm exec --package @gis-engine/cli@latest -- create-gis-map --verify-artifacts . --json
\`\`\`

## Provider

Current provider: \`${ctx.provider}\`

## AI Generation

Re-generate with a new prompt:

\`\`\`bash
npm exec --package @gis-engine/cli@latest -- create-gis-map . --generate --template app --prompt "Your description here" -y
\`\`\`
`,
      },
    ];
  },
};

const registry: Record<TemplateName, Template> = {
  "static-html": staticHtmlTemplate,
  "vite-ts": viteTsTemplate,
  mapspec: mapspecTemplate,
  app: appTemplate,
};

export function getTemplate(name: string): Template | undefined {
  if (isCommunityTemplateName(name)) {
    const communityName = parseCommunityTemplateName(name);
    const descriptor = getCommunityTemplate(communityName);
    if (!descriptor) return undefined;
    return {
      name: name as TemplateName,
      description: descriptor.manifest.description,
      generate(ctx: TemplateContext): GeneratedFile[] {
        const result = generateCommunityTemplate(name, ctx);
        return result ? result.files : [];
      },
    };
  }
  return registry[name as TemplateName];
}
