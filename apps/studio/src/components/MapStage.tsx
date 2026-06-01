import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StudioState } from "../App";

interface Props {
  state: StudioState | null;
  status: string;
}

export default function MapStage({ state, status }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [
          {
            id: "osm-tiles-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [120.15, 30.28],
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map center when state changes
  useEffect(() => {
    if (!mapRef.current || !state?.camera) return;
    mapRef.current.flyTo({
      center: [state.camera.lng, state.camera.lat],
      zoom: state.camera.zoom,
      duration: 800,
    });
  }, [state?.camera, state?.epoch]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="map-canvas" />

      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div>
          <p className="text-xs text-gray-400">
            MapLibre GL &middot; MapSpec v0.1
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            status === "ready"
              ? "bg-green-900/50 text-green-400"
              : status === "thinking"
                ? "bg-yellow-900/50 text-yellow-400"
                : "bg-red-900/50 text-red-400"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Camera readout */}
      <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur rounded px-3 py-1.5 text-xs text-gray-400 font-mono">
        {state?.revision ? `r${state.revision}` : "--"} &middot;{" "}
        {state?.camera
          ? `${state.camera.zoom.toFixed(1)}z`
          : "--"}
      </div>
    </div>
  );
}
