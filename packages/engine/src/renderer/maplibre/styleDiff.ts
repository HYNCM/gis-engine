import type { Map as MapLibreMap } from "maplibre-gl";
import type { JsonPatchOperation, MapSpec, SourceSpec } from "../../types.js";
import type { MapLibreSource } from "./transformer.js";

/**
 * Attempts to apply JSON Patch operations incrementally to a MapLibre map instance.
 * Returns `true` if all operations were applied successfully, `false` if fallback
 * to full `setStyle()` is needed.
 */
export function applyIncrementalPatch(map: MapLibreMap | null, patch: JsonPatchOperation[], spec: MapSpec): boolean {
  // No map instance (headless mode) — cannot apply incrementally.
  if (!map) return false;

  // Array indices in a patch describe intermediate states, while spec is the
  // final state. Rebuild structural layer changes instead of targeting the wrong
  // layer or losing an addLayer beforeLayerId anchor.
  if (patch.some((op) => /^\/layers\/[^/]+$/.test(op.path))) return false;

  // Apply the final camera once, after the style operations have succeeded.
  let hasViewChanges = false;

  for (const op of patch) {
    const parts = op.path.split("/").filter(Boolean);

    const segment0 = parts[0] ?? "";
    const segment1 = parts[1] ?? "";
    const segment2 = parts[2] ?? "";
    const segment3 = parts[3] ?? "";

    // --- View changes: /view/center, /view/zoom, /view/bearing, /view/pitch ---
    if (segment0 === "view" && parts.length === 2) {
      if (["center", "zoom", "bearing", "pitch", "bounds", "mode"].includes(segment1)) {
        hasViewChanges = true;
      } else {
        return false;
      }
      continue;
    }

    // --- Full view replacement: setView/fitBounds patch the whole /view object ---
    if (segment0 === "view" && parts.length === 1) {
      if (op.op !== "replace" && op.op !== "add") return false;
      hasViewChanges = true;
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

    // Revision metadata is not part of the rendered style.
    if (segment0 === "revision") {
      continue;
    }

    // Unrecognized path — fallback to full rebuild.
    return false;
  }

  // Apply batched view changes in a single call.
  if (hasViewChanges) {
    try {
      synchronizeMapLibreView(map, spec.view);
    } catch {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Keep camera synchronization identical for incremental and full-style paths. */
export function synchronizeMapLibreView(map: MapLibreMap, view: MapSpec["view"]): void {
  const options: { center?: [number, number]; zoom?: number; bearing?: number; pitch?: number } = {};
  if (view.bearing !== undefined) options.bearing = view.bearing;
  if (view.pitch !== undefined) options.pitch = view.pitch;
  if (view.bounds && !view.center && view.zoom === undefined) {
    map.fitBounds(view.bounds as never, { ...options, duration: 0, linear: true });
    return;
  }
  if (view.center) options.center = view.center;
  if (view.zoom !== undefined) options.zoom = view.zoom;
  if (Object.keys(options).length > 0) map.jumpTo(options);
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
