/**
 * GET /api/basemaps — Return available basemap options.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage & { query?: Record<string, string | string[]> };
type Res = ServerResponse & { json: (body: unknown) => void; status: (code: number) => Res };

const TILE_PROXY_PREFIX = "/api/tiles";

interface BasemapDef {
  id: string;
  label: string;
  tiles?: string[];
  attribution?: string;
  maxzoom?: number;
  requiresEnv?: string;
}

const BASEMAPS: Record<string, BasemapDef> = {
  none: { id: "none", label: "No basemap" },
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
    requiresEnv: "BING_MAPS_KEY",
    maxzoom: 19,
  },
};

const DEFAULT_BASEMAP = "none";

export default function handler(_req: Req, res: Res): void {
  const env = process.env as Record<string, string | undefined>;
  const options = Object.entries(BASEMAPS).map(([id, basemap]) => {
    const missingCredential = basemap.requiresEnv && !env[basemap.requiresEnv]?.trim();
    return {
      id,
      label: basemap.label,
      enabled: !missingCredential,
      missingCredential: missingCredential || undefined,
      tileProvider: basemap.tiles ? id : undefined,
    };
  });

  res.status(200).json({
    current: DEFAULT_BASEMAP,
    options,
  });
}
