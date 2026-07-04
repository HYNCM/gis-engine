import type { Map as MapLibreMap } from "maplibre-gl";
import type { JsonPatchOperation, LayerSpec, MapSpec, SourceSpec } from "../../types.js";
import type { MapLibreLayer, MapLibreSource } from "./transformer.js";

/**
 * Attempts to apply JSON Patch operations incrementally to a MapLibre map instance.
 * Returns `true` if all operations were applied successfully, `false` if fallback
 * to full `setStyle()` is needed.
 */
export function applyIncrementalPatch(map: MapLibreMap | null, patch: JsonPatchOperation[], spec: MapSpec): boolean {
  // No map instance (headless mode) — cannot apply incrementally.
  if (!map) return false;

  // Collect view changes to batch them into a single jumpTo call.
  const viewChanges: { center?: [number, number]; zoom?: number; bearing?: number; pitch?: number } = {};
  let hasViewChanges = false;

  for (const op of patch) {
    const parts = op.path.split("/").filter(Boolean);

    const segment0 = parts[0] ?? "";
    const segment1 = parts[1] ?? "";
    const segment2 = parts[2] ?? "";
    const segment3 = parts[3] ?? "";

    // --- View changes: /view/center, /view/zoom, /view/bearing, /view/pitch ---
    if (segment0 === "view" && parts.length === 2) {
      if (segment1 === "center" && spec.view.center) {
        viewChanges.center = spec.view.center;
        hasViewChanges = true;
      } else if (segment1 === "zoom" && spec.view.zoom !== undefined) {
        viewChanges.zoom = spec.view.zoom;
        hasViewChanges = true;
      } else if (segment1 === "bearing" && spec.view.bearing !== undefined) {
        viewChanges.bearing = spec.view.bearing;
        hasViewChanges = true;
      } else if (segment1 === "pitch" && spec.view.pitch !== undefined) {
        viewChanges.pitch = spec.view.pitch;
        hasViewChanges = true;
      } else {
        return false;
      }
      continue;
    }

    // --- Source operations: /sources/{id} ---
    if (segment0 === "sources" && parts.length === 2) {
      const sourceId = segment1;
      if (op.op === "add" || op.op === "replace") {
        const sourceSpec = spec.sources[sourceId];
        if (!sourceSpec) return false;
        const maplibreSource = transformSourceForMapLibre(sourceId, sourceSpec);
        if (!maplibreSource) return false;

        try {
          if (map.getSource(sourceId)) map.removeSource(sourceId);
          map.addSource(sourceId, maplibreSource as never);
        } catch {
          return false;
        }
      } else if (op.op === "remove") {
        try {
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {
          return false;
        }
      } else {
        return false;
      }
      continue;
    }

    // --- Layer operations: /layers/{index}[/property[/sub-property]] ---
    if (segment0 === "layers" && parts.length >= 2) {
      const layerIndex = Number.parseInt(segment1, 10);
      if (Number.isNaN(layerIndex)) return false;

      const layer = spec.layers[layerIndex];

      // Full layer add / replace / remove
      if (parts.length === 2) {
        if (op.op === "add" || op.op === "replace") {
          if (!layer) return false;
          const maplibreLayer = transformLayerForMapLibre(spec, layer);
          if (!maplibreLayer) return false;

          try {
            if (op.op === "replace" && map.getLayer(layer.id)) {
              map.removeLayer(layer.id);
            }
            map.addLayer(maplibreLayer as never);
          } catch {
            return false;
          }
        } else if (op.op === "remove") {
          // Layer ID must come from the patch value for remove ops.
          const layerId = extractLayerId(op.value);
          if (!layerId) return false;
          try {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
          } catch {
            return false;
          }
        } else {
          return false;
        }
        continue;
      }

      // Layer property updates (paint / layout / filter)
      if (!layer) return false;
      const layerId = layer.id;

      if (parts.length === 4 && segment2 === "paint") {
        const prop = segment3;
        const value = layer.paint?.[prop];
        try {
          map.setPaintProperty(layerId, prop, value as never);
        } catch {
          return false;
        }
        continue;
      }

      if (parts.length === 4 && segment2 === "layout") {
        const prop = segment3;
        const value = layer.layout?.[prop];
        try {
          map.setLayoutProperty(layerId, prop, value as never);
        } catch {
          return false;
        }
        continue;
      }

      if (parts.length === 3 && segment2 === "filter") {
        try {
          map.setFilter(layerId, (layer.filter ?? null) as never);
        } catch {
          return false;
        }
        continue;
      }

      // Unrecognized layer property path.
      return false;
    }

    // --- Interaction changes: /interactions or /interactions/{field} ---
    // Interaction toggles are applied by the adapter, not the MapLibre style.
    // Accept them here to avoid triggering an expensive full rebuild.
    if (segment0 === "interactions") {
      continue;
    }

    // Unrecognized path — fallback to full rebuild.
    return false;
  }

  // Apply batched view changes in a single call.
  if (hasViewChanges) {
    try {
      map.jumpTo(viewChanges as never);
    } catch {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Safely extract `id` from a patch value that is expected to be a layer-like object. */
function extractLayerId(value: unknown): string | undefined {
  if (value !== null && typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === "string") return id;
  }
  return undefined;
}

/**
 * Transform a MapSpec `SourceSpec` to a MapLibre-compatible source descriptor.
 * Only handles types supported for incremental updates (geojson, raster, vector).
 */
function transformSourceForMapLibre(_sourceId: string, source: SourceSpec): MapLibreSource | null {
  if (source.type === "geojson") {
    return { type: "geojson", data: source.data };
  }
  if (source.type === "raster") {
    const raster: MapLibreSource = { type: "raster", tiles: source.tiles };
    if (source.tileSize !== undefined) raster.tileSize = source.tileSize;
    return raster;
  }
  if (source.type === "vector") {
    const vector: MapLibreSource = { type: "vector" };
    if ("tiles" in source) vector.tiles = source.tiles;
    if ("url" in source) vector.url = source.url;
    if (source.minzoom !== undefined) vector.minzoom = source.minzoom;
    if (source.maxzoom !== undefined) vector.maxzoom = source.maxzoom;
    if (source.attribution !== undefined) vector.attribution = source.attribution;
    return vector;
  }
  // pmtiles / flatgeobuf / geoparquet / geotiff — not supported incrementally.
  return null;
}

/**
 * Transform a MapSpec `LayerSpec` to a MapLibre-compatible layer descriptor.
 * Only handles layer types supported by the MapLibre transformer.
 */
function transformLayerForMapLibre(spec: MapSpec, layer: LayerSpec): MapLibreLayer | null {
  const supportedTypes = new Set([
    "background",
    "raster",
    "fill",
    "line",
    "circle",
    "symbol",
    "symbol-lite",
    "fill-extrusion-lite",
    "heatmap",
  ]);

  if (!supportedTypes.has(layer.type)) return null;

  const maplibreLayer: MapLibreLayer = {
    id: layer.id,
    type: mapLayerType(layer.type),
  };

  if (layer.type !== "background" && layer.source) {
    maplibreLayer.source = layer.source;
  }

  // Resolve source-layer metadata for vector / pmtiles sources.
  if (layer.source) {
    const source = spec.sources[layer.source];
    if (source && (source.type === "pmtiles" || source.type === "vector")) {
      const sourceLayer = layer.metadata?.["source-layer"];
      if (typeof sourceLayer === "string" && sourceLayer.length > 0) {
        maplibreLayer["source-layer"] = sourceLayer;
      }
    }
  }

  if (layer.filter) maplibreLayer.filter = layer.filter;
  if (layer.minzoom !== undefined) maplibreLayer.minzoom = layer.minzoom;
  if (layer.maxzoom !== undefined) maplibreLayer.maxzoom = layer.maxzoom;
  if (layer.paint) maplibreLayer.paint = layer.paint;
  if (layer.layout) maplibreLayer.layout = layer.layout;

  return maplibreLayer;
}

function mapLayerType(type: string): MapLibreLayer["type"] {
  if (type === "symbol-lite") return "symbol";
  if (type === "fill-extrusion-lite") return "fill-extrusion";
  return type as MapLibreLayer["type"];
}
