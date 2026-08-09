import { createMap, type MapRuntime, type MapSpec } from "@gis-engine/engine";
import { useEffect, useRef, useState } from "react";
import type { BasemapOption, ServerState } from "../App";

const EMPTY_SPEC: MapSpec = {
  version: "0.1",
  sources: {},
  layers: [],
  view: { center: [120.15, 30.28], zoom: 10 },
};

interface Props {
  serverState: ServerState | null;
  status: string;
  onSave: () => void;
  savedMsg: string;
  basemaps: BasemapOption[];
  currentBasemap: string;
  onChangeBasemap: (id: string) => void;
}

export default function MapStage({ serverState }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<MapRuntime | null>(null);
  const [mapReadyToken, setMapReadyToken] = useState(0);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  // Create or recreate the MapRuntime whenever the server spec changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: revision change must trigger full runtime re-creation
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let createdRuntime: MapRuntime | null = null;
    const container = containerRef.current;

    async function initOrUpdate() {
      try {
        // Tear down the previous runtime if any.
        if (runtimeRef.current) {
          await runtimeRef.current.destroy();
          runtimeRef.current = null;
        }

        // Lazy-load the MapLibre JS + CSS alongside each other.
        await import("maplibre-gl");
        await import("maplibre-gl/dist/maplibre-gl.css");
        const spec = (serverState?.spec as MapSpec | undefined) ?? EMPTY_SPEC;
        const runtime = await createMap(container, spec, { renderer: "maplibre" });

        if (cancelled) {
          await runtime.destroy();
          return;
        }

        createdRuntime = runtime;
        runtimeRef.current = runtime;
        setMapLoadError(null);
        setMapReadyToken((token) => token + 1);
      } catch (error) {
        if (!cancelled) {
          setMapLoadError(error instanceof Error ? error.message : "Map renderer failed to load");
        }
      }
    }

    void initOrUpdate();

    return () => {
      cancelled = true;
      if (runtimeRef.current === createdRuntime) runtimeRef.current = null;
      createdRuntime?.destroy();
    };
  }, [serverState?.spec, serverState?.summary.revision]);

  // Resize observer — uses the runtime's resize method.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mapReadyToken ensures observer is set up after runtime is created
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      runtimeRef.current?.resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapReadyToken]);

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
      <div className="absolute bottom-4 left-4 rounded bg-gray-900/80 px-3 py-1.5 font-mono text-xs text-gray-400 backdrop-blur">
        MapSpec v0.1 · MapLibre GL
      </div>
    </div>
  );
}
