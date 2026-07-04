import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * GET /api/state — Return initial MapSpec state.
 *
 * Stateless: every call returns a fresh default spec.
 * The client (MapStage) uses @gis-engine/engine to render it.
 */

type Req = IncomingMessage & { query?: Record<string, string | string[]> };
type Res = ServerResponse & { json: (body: unknown) => void; status: (code: number) => Res };

const TILE_PROXY_PREFIX = "/api/tiles";

interface BasemapDef {
  id: string;
  label: string;
  tiles?: string[];
  attribution?: string;
  maxzoom?: number;
  backgroundColor?: string;
}

const BASEMAPS: Record<string, BasemapDef> = {
  none: { id: "none", label: "No basemap", backgroundColor: "#020617" },
  osm: {
    id: "osm",
    label: "OSM Standard",
    tiles: [`${TILE_PROXY_PREFIX}/osm/{z}/{x}/{y}.png`],
    attribution: "© OpenStreetMap contributors",
    maxzoom: 19,
  },
  "arcgis-imagery": {
    id: "arcgis-imagery",
    label: "ArcGIS World Imagery",
    tiles: [`${TILE_PROXY_PREFIX}/arcgis-imagery/{z}/{x}/{y}.jpg`],
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxzoom: 23,
  },
  "bing-aerial": {
    id: "bing-aerial",
    label: "Bing Aerial",
    tiles: [`${TILE_PROXY_PREFIX}/bing-aerial/{z}/{x}/{y}.jpeg`],
    attribution: "© Microsoft Bing",
    maxzoom: 19,
  },
};

const DEFAULT_BASEMAP = "none";

function createInitialSpec(basemapId: string = DEFAULT_BASEMAP) {
  const basemap = BASEMAPS[basemapId] ?? BASEMAPS[DEFAULT_BASEMAP];
  const basemapSources = basemap.tiles
    ? {
        basemap: {
          type: "raster",
          tiles: basemap.tiles,
          tileSize: 256,
          attribution: basemap.attribution,
          minzoom: 0,
          maxzoom: basemap.maxzoom ?? 19,
        },
      }
    : {};

  const basemapLayer = basemap.tiles
    ? { id: "basemap-layer", type: "raster", source: "basemap" }
    : {
        id: "basemap-background",
        type: "background",
        paint: { "background-color": basemap.backgroundColor || "#020617" },
      };

  return {
    version: "0.1",
    id: randomUUID(),
    revision: "0",
    sources: {
      ...basemapSources,
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.155, 30.274] },
              properties: { name: "West Lake", category: "lake" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.165, 30.245] },
              properties: { name: "Leifeng Pagoda", category: "landmark" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.145, 30.255] },
              properties: { name: "Lingyin Temple", category: "temple" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.172, 30.248] },
              properties: { name: "Hangzhou Museum", category: "museum" },
            },
          ],
        },
      },
    },
    layers: [
      basemapLayer,
      {
        id: "points-layer",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 8,
          "circle-color": "#3b82f6",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
    view: { center: [120.155, 30.274], zoom: 13 },
  };
}

function buildSummary(spec: Record<string, unknown>) {
  const sources = (spec.sources ?? {}) as Record<string, unknown>;
  const layers = (spec.layers ?? []) as unknown[];
  const view = (spec.view ?? {}) as Record<string, unknown>;
  return {
    mapId: String(spec.id ?? "unknown"),
    revision: String(spec.revision ?? "0"),
    sourceCount: Object.keys(sources).length,
    layerCount: layers.length,
    center: (view.center as [number, number] | null) ?? null,
    zoom: (view.zoom as number | null) ?? null,
    bounds: (view.bounds as [number, number, number, number] | null) ?? null,
  };
}

export default function handler(_req: Req, res: Res): void {
  const spec = createInitialSpec();
  res.status(200).json({
    status: "ready",
    spec,
    style: null,
    summary: buildSummary(spec),
    diagnostics: [],
  });
}
