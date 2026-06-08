import { DiagnosticCodes } from "../../diagnostics/codes.js";
import { validateSpec } from "../../spec/validate.js";
import type { Diagnostic, LayerSpec, MapSpec, SourceSpec } from "../../types.js";

export interface MapLibreStyle {
  version: 8;
  name?: string;
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  sources: Record<string, MapLibreSource>;
  layers: MapLibreLayer[];
}

export type MapLibreSource =
  | {
      type: "geojson";
      data: unknown;
    }
  | {
      type: "raster";
      tiles: string[];
      tileSize?: number;
    }
  | {
      type: "vector";
      url?: string;
      tiles?: string[];
      minzoom?: number;
      maxzoom?: number;
      attribution?: string;
    };

export interface MapLibreLayer {
  id: string;
  type: "background" | "raster" | "fill" | "line" | "circle" | "symbol" | "fill-extrusion";
  source?: string;
  "source-layer"?: string;
  filter?: unknown[];
  minzoom?: number;
  maxzoom?: number;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
}

export interface TransformResult {
  style?: MapLibreStyle;
  diagnostics: Diagnostic[];
}

const supportedLayerTypes = new Set([
  "background",
  "raster",
  "fill",
  "line",
  "circle",
  "symbol-lite",
  "fill-extrusion-lite",
]);

export function transformMapSpecToMapLibreStyle(spec: MapSpec): TransformResult {
  const diagnostics: Diagnostic[] = [];
  const validation = validateSpec(spec);
  diagnostics.push(...validation.diagnostics);

  if (!validation.valid) {
    return { diagnostics };
  }

  const style: MapLibreStyle = {
    version: 8,
    sources: transformSources(spec, diagnostics),
    layers: transformLayers(spec, diagnostics),
  };
  if (spec.id) style.name = spec.id;
  if (spec.view.center) style.center = spec.view.center;
  if (spec.view.zoom !== undefined) style.zoom = spec.view.zoom;
  if (spec.view.bearing !== undefined) style.bearing = spec.view.bearing;
  if (spec.view.pitch !== undefined) style.pitch = spec.view.pitch;

  return diagnostics.some((diagnostic) => diagnostic.severity === "error") ? { diagnostics } : { style, diagnostics };
}

function transformSources(spec: MapSpec, diagnostics: Diagnostic[]): Record<string, MapLibreSource> {
  const sources: Record<string, MapLibreSource> = {};
  for (const [sourceId, source] of Object.entries(spec.sources)) {
    sources[sourceId] = transformSource(sourceId, source, diagnostics);
  }
  return sources;
}

function transformSource(sourceId: string, source: SourceSpec, diagnostics: Diagnostic[]): MapLibreSource {
  if (source.type === "geojson") return { type: "geojson", data: source.data };
  if (source.type === "raster") {
    const rasterSource: MapLibreSource = { type: "raster", tiles: source.tiles };
    if (source.tileSize !== undefined) rasterSource.tileSize = source.tileSize;
    return rasterSource;
  }
  if (source.type === "pmtiles") {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `PMTiles source "${sourceId}" is mapped to a vector source URL for MapLibre MVP.`,
      path: `/sources/${sourceId}`,
    });
    return { type: "vector", url: source.url };
  }
  if (source.type === "flatgeobuf") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `FlatGeobuf source "${sourceId}" is accepted by MapSpec but remains runtime-blocked in the MapLibre MVP.`,
      path: `/sources/${sourceId}/url`,
    });
    return { type: "geojson", data: null };
  }
  if (source.type === "geoparquet") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `GeoParquet source "${sourceId}" is accepted by MapSpec but remains runtime-blocked in the MapLibre MVP.`,
      path: `/sources/${sourceId}/url`,
    });
    return { type: "geojson", data: null };
  }
  if (source.type === "vector") {
    const vectorSource: MapLibreSource = { type: "vector" };
    if ("tiles" in source) vectorSource.tiles = source.tiles;
    if ("url" in source) vectorSource.url = source.url;
    if (source.minzoom !== undefined) vectorSource.minzoom = source.minzoom;
    if (source.maxzoom !== undefined) vectorSource.maxzoom = source.maxzoom;
    if (source.attribution !== undefined) vectorSource.attribution = source.attribution;
    return vectorSource;
  }

  diagnostics.push({
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: `Source "${sourceId}" of type "${(source as { type: string }).type}" is not supported by the MapLibre transformer.`,
    path: `/sources/${sourceId}`,
  });
  return { type: "geojson", data: null };
}

function transformLayers(spec: MapSpec, diagnostics: Diagnostic[]): MapLibreLayer[] {
  const layers: MapLibreLayer[] = [];
  for (const [index, layer] of spec.layers.entries()) {
    const transformed = transformLayer(spec, layer, index, diagnostics);
    if (transformed) layers.push(transformed);
  }
  return layers;
}

function transformLayer(
  spec: MapSpec,
  layer: LayerSpec,
  index: number,
  diagnostics: Diagnostic[],
): MapLibreLayer | undefined {
  if (!supportedLayerTypes.has(layer.type)) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `Layer "${layer.id}" of type "${layer.type}" is not supported by the MapLibre MVP transformer.`,
      path: `/layers/${index}/type`,
    });
    return undefined;
  }

  const styleLayer: MapLibreLayer = {
    id: layer.id,
    type: mapLayerType(layer.type),
  };
  if (layer.type !== "background" && layer.source) styleLayer.source = layer.source;
  const sourceLayer = sourceLayerFor(spec, layer);
  if (sourceLayer) styleLayer["source-layer"] = sourceLayer;
  if (layer.filter) styleLayer.filter = layer.filter;
  if (layer.minzoom !== undefined) styleLayer.minzoom = layer.minzoom;
  if (layer.maxzoom !== undefined) styleLayer.maxzoom = layer.maxzoom;
  if (layer.paint) styleLayer.paint = layer.paint;
  if (layer.layout) styleLayer.layout = layer.layout;

  return styleLayer;
}

function sourceLayerFor(spec: MapSpec, layer: LayerSpec): string | undefined {
  const source = layer.source ? spec.sources[layer.source] : undefined;
  if (!source || (source.type !== "pmtiles" && source.type !== "vector")) return undefined;
  const metadata = layer.metadata;
  const sourceLayer = metadata?.["source-layer"];
  return typeof sourceLayer === "string" && sourceLayer.length > 0 ? sourceLayer : undefined;
}

function mapLayerType(layerType: LayerSpec["type"]): MapLibreLayer["type"] {
  if (
    layerType === "background" ||
    layerType === "raster" ||
    layerType === "fill" ||
    layerType === "line" ||
    layerType === "circle"
  )
    return layerType;
  if (layerType === "symbol-lite") return "symbol";
  if (layerType === "fill-extrusion-lite") return "fill-extrusion";
  throw new Error(`Unsupported MapLibre layer type: ${layerType}`);
}
