import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { ServerState } from "../App";

interface Props {
  serverState: ServerState | null;
  status: string;
  onSave: () => void;
  savedMsg: string;
  basemaps: Array<{ id: string; label: string }>;
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
          setMapLoadError(
            error instanceof Error
              ? error.message
              : "Map renderer failed to load",
          );
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
  }, [mapReadyToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !serverState?.style) return;
    const style = serverState.style as StyleSpecification;
    map.setStyle(style, { diff: false });
    map.once("style.load", () => {
      const target = serverState.summary;
      if (target.center && target.zoom != null)
        map.flyTo({ center: target.center, zoom: target.zoom, duration: 600 });
    });
  }, [mapReadyToken, serverState?.style, serverState?.summary.revision]);

  const badgeColor =
    status === "ready" || status === "applied"
      ? "bg-green-900/50 text-green-400"
      : status === "thinking"
        ? "bg-yellow-900/50 text-yellow-400"
        : "bg-red-900/50 text-red-400";

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {mapReadyToken === 0 && !mapLoadError && (
        <div className="absolute inset-0 grid place-items-center bg-gray-950 text-xs text-gray-500">
          Loading map renderer...
        </div>
      )}
      {mapLoadError && (
        <div className="absolute inset-0 grid place-items-center bg-gray-950 text-xs text-red-300">
          {mapLoadError}
        </div>
      )}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-3">
          <select
            value={currentBasemap}
            onChange={(e) => onChangeBasemap(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            {basemaps.map((bm) => (
              <option key={bm.id} value={bm.id}>
                {bm.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 font-mono">
            {serverState
              ? `v${serverState.summary.revision} · ${serverState.summary.layerCount} layers`
              : "--"}
          </p>
          {savedMsg && (
            <span className="text-xs text-green-400 animate-pulse">
              {savedMsg}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={!serverState}
            className="text-xs px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 transition"
            title="Save"
          >
            💾 Save
          </button>
          <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur rounded px-3 py-1.5 text-xs text-gray-400 font-mono">
        MapSpec v0.1 · MapLibre GL
      </div>
    </div>
  );
}
