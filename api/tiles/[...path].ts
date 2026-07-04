/**
 * GET /api/tiles/{provider}/{z}/{x}/{y}.{ext}
 *
 * Proxies basemap tile requests to upstream servers.
 * Mirrors the logic in apps/studio/server/index.mjs → proxyBasemapTile().
 */

import type { IncomingMessage, ServerResponse } from "node:http";

export const config = {
  runtime: "nodejs",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Req = IncomingMessage & {
  query?: Record<string, string | string[]>;
  method?: string;
};

type Res = ServerResponse & {
  json: (body: unknown) => void;
  status: (code: number) => Res;
  send: (body: Buffer | string) => void;
};

/* ------------------------------------------------------------------ */
/*  Tile provider registry                                             */
/* ------------------------------------------------------------------ */

interface TileProvider {
  contentType: string;
  maxzoom: number;
  resolveUrl: (coords: { z: number; x: number; y: number }) => string | Promise<string>;
}

const TILE_PROVIDERS: Record<string, TileProvider> = {
  osm: {
    contentType: "image/png",
    maxzoom: 19,
    resolveUrl: ({ z, x, y }) =>
      `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  },
  "arcgis-imagery": {
    contentType: "image/jpeg",
    maxzoom: 23,
    resolveUrl: ({ z, x, y }) =>
      `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
  "bing-aerial": {
    contentType: "image/jpeg",
    maxzoom: 19,
    resolveUrl: resolveBingTileUrl,
  },
};

/* ------------------------------------------------------------------ */
/*  Bing Aerial helpers                                                */
/* ------------------------------------------------------------------ */

let bingMetadataCache: {
  key: string;
  expiresAt: number;
  value: BingMetadata;
} | null = null;

interface BingMetadata {
  imageUrl: string;
  subdomains: string[];
}

async function resolveBingTileUrl({
  z,
  x,
  y,
}: {
  z: number;
  x: number;
  y: number;
}): Promise<string> {
  const key = process.env.BING_MAPS_KEY?.trim();
  if (!key) throw new Error("Bing Aerial requires BING_MAPS_KEY.");

  const metadata = await loadBingMetadata(key);
  const subdomains = metadata.subdomains.length > 0 ? metadata.subdomains : ["t0"];
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length];
  return metadata.imageUrl
    .replace("{quadkey}", tileQuadKey(x, y, z))
    .replace("{subdomain}", subdomain)
    .replace("{culture}", "en-US");
}

async function loadBingMetadata(key: string): Promise<BingMetadata> {
  const now = Date.now();
  if (bingMetadataCache?.key === key && bingMetadataCache.expiresAt > now) {
    return bingMetadataCache.value;
  }

  const metadataUrl = new URL("https://dev.virtualearth.net/REST/V1/Imagery/Metadata/Aerial");
  metadataUrl.searchParams.set("output", "json");
  metadataUrl.searchParams.set("include", "ImageryProviders");
  metadataUrl.searchParams.set("key", key);

  const response = await fetch(metadataUrl);
  if (!response.ok) {
    throw new Error(`Bing metadata returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    resourceSets?: {
      resources?: { imageUrl?: string; imageUrlSubdomains?: string[] }[];
    }[];
  };
  const resource = payload?.resourceSets?.[0]?.resources?.[0];
  if (!resource?.imageUrl) {
    throw new Error("Bing metadata did not include an imageUrl template.");
  }

  const value: BingMetadata = {
    imageUrl: String(resource.imageUrl).replace(/^http:/, "https:"),
    subdomains: (resource.imageUrlSubdomains ?? []).map(String),
  };

  bingMetadataCache = { key, expiresAt: now + 10 * 60_000, value };
  return value;
}

function tileQuadKey(x: number, y: number, z: number): string {
  let quad = "";
  for (let i = z; i > 0; i--) {
    const mask = 1 << (i - 1);
    let digit = 0;
    if ((x & mask) !== 0) digit += 1;
    if ((y & mask) !== 0) digit += 2;
    quad += digit;
  }
  return quad;
}

/* ------------------------------------------------------------------ */
/*  Coord parsing                                                      */
/* ------------------------------------------------------------------ */

function parseTileCoords(
  zValue: string,
  xValue: string,
  yValue: string,
  maxzoom: number,
): { z: number; x: number; y: number } | null {
  const z = Number.parseInt(zValue, 10);
  const x = Number.parseInt(xValue, 10);
  const y = Number.parseInt(yValue, 10);
  if (![z, x, y].every(Number.isInteger)) return null;
  if (z < 0 || z > maxzoom) return null;
  const limit = 2 ** z;
  if (x < 0 || y < 0 || x >= limit || y >= limit) return null;
  return { z, x, y };
}

/* ------------------------------------------------------------------ */
/*  Content-Type helper                                                */
/* ------------------------------------------------------------------ */

const EXT_CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/* ------------------------------------------------------------------ */
/*  Handler                                                            */
/* ------------------------------------------------------------------ */

export default async function handler(req: Req, res: Res): Promise<void> {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Parse path: /api/tiles/{provider}/{z}/{x}/{y}.{ext}
  // Vercel catch-all route populates req.query.path as string[]
  const rawPath = (req.query as Record<string, string | string[]> | undefined)?.path;
  const pathParts = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];

  if (pathParts.length < 4) {
    res.status(400).json({
      error: "Invalid tile path. Expected /api/tiles/{provider}/{z}/{x}/{y}.{ext}",
    });
    return;
  }

  const provider = pathParts[0];
  const zValue = pathParts[1];
  const xValue = pathParts[2];
  const yWithExt = pathParts[3];
  const dotIndex = yWithExt.lastIndexOf(".");
  const yValue = dotIndex >= 0 ? yWithExt.slice(0, dotIndex) : yWithExt;
  const ext = dotIndex >= 0 ? yWithExt.slice(dotIndex + 1) : "png";

  const tileProvider = TILE_PROVIDERS[provider];
  if (!tileProvider) {
    res.status(404).json({ error: `Unknown tile provider: ${provider}` });
    return;
  }

  const coords = parseTileCoords(zValue, xValue, yValue, tileProvider.maxzoom);
  if (!coords) {
    res.status(400).json({ error: "Invalid tile coordinates" });
    return;
  }

  try {
    const upstreamUrl = await tileProvider.resolveUrl(coords);
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "GIS Engine Studio/0.1 (explicit user-selected basemap proxy)",
      },
    });

    if (!upstream.ok) {
      res.status(502).json({ error: `Tile provider returned HTTP ${upstream.status}` });
      return;
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    const contentType =
      upstream.headers.get("content-type") ||
      EXT_CONTENT_TYPE[ext] ||
      tileProvider.contentType;

    res.setHeader("Content-Type", contentType);
    // Cache 24h at CDN edge (s-maxage) and browser (max-age) to minimise
    // Vercel function invocations for repeat tile requests.
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.setHeader("Content-Length", String(body.byteLength));
    res.status(200).send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tile proxy failed";
    res.status(502).json({ error: message });
  }
}
