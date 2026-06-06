import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { BasemapOption, ServerState } from "../App";

interface Props {
  serverState: ServerState | null;
  status: string;
  onSave: () => void;
  savedMsg: string;
  basemaps: BasemapOption[];
  currentBasemap: string;
  onChangeBasemap: (id: string) => void;
}

export default function MapStage({
  serverState,
  status,
  onSave,
  savedMsg,
  basemaps,
  currentBasemap,
  onChangeBasemap,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReadyToken, setMapReadyToken] = useState(0);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let createdMap: MapLibreMap | null = null;

    async function loadMapRenderer() {
      try {
        const [{ default: maplibregl }] = await Promise.all([
          import("maplibre-gl"),
          import("maplibre-gl/dist/maplibre-gl.css"),
        ]);

        if (cancelled || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: { version: 8, sources: {}, layers: [] },
          center: [120.15, 30.28],
          zoom: 10,
        });
        map.addControl(new maplibregl.NavigationControl(), "top-right");
        createdMap = map;
        mapRef.current = map;
        setMapReadyToken((token) => token + 1);
      } catch (error) {
        if (!cancelled) {
          setMapLoadError(error instanceof Error ? error.message : "Map renderer failed to load");
        }
      }
    }

    void loadMapRenderer();

    return () => {
      cancelled = true;
      if (mapRef.current === createdMap) mapRef.current = null;
      createdMap?.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !serverState?.style) return;
    const style = serverState.style as StyleSpecification;
    map.setStyle(style, { diff: false });
    map.once("style.load", () => {
      const target = serverState.summary;
      if (target.center && target.zoom != null) {
        map.flyTo({ center: target.center, zoom: target.zoom, duration: 600 });
        return;
      }
      if (target.bounds) {
        map.fitBounds(
          [
            [target.bounds[0], target.bounds[1]],
            [target.bounds[2], target.bounds[3]],
          ],
          { duration: 600, padding: 40 },
        );
      }
    });
  }, [serverState?.style, serverState?.summary.revision, serverState?.summary]);

  const badgeColor =
    status === "ready" || status === "applied" || status === "reviewed"
      ? "bg-green-900/50 text-green-400"
      : status === "thinking"
        ? "bg-yellow-900/50 text-yellow-400"
        : "bg-red-900/50 text-red-400";

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {mapReadyToken === 0 && !mapLoadError && (
        <div className="absolute inset-0 grid place-items-center bg-gray-950 text-xs text-gray-500">
          Loading map renderer...
        </div>
      )}
      {mapLoadError && (
        <div className="absolute inset-0 grid place-items-center bg-gray-950 text-xs text-red-300">{mapLoadError}</div>
      )}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <select
            value={currentBasemap}
            onChange={(event) => onChangeBasemap(event.target.value)}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            {basemaps.map((basemap) => (
              <option key={basemap.id} value={basemap.id} disabled={!basemap.enabled}>
                {basemap.missingCredential ? `${basemap.label} (${basemap.missingCredential})` : basemap.label}
              </option>
            ))}
          </select>
          <p className="font-mono text-xs text-gray-500">
            {serverState ? `v${serverState.summary.revision} · ${serverState.summary.layerCount} layers` : "--"}
          </p>
          {savedMsg && <span className="animate-pulse text-xs text-green-400">{savedMsg}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={!serverState}
            className="rounded bg-gray-800 px-3 py-1 text-xs text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
            title="Save"
          >
            💾 Save
          </button>
          <span className={`rounded-full px-2 py-0.5 text-xs ${badgeColor}`}>{status}</span>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 rounded bg-gray-900/80 px-3 py-1.5 font-mono text-xs text-gray-400 backdrop-blur">
        MapSpec v0.1 · MapLibre GL
      </div>
    </div>
  );
}
