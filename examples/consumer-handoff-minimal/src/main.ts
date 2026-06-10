import "maplibre-gl/dist/maplibre-gl.css";
import { createMap } from "@gis-engine/engine";
import spec from "../map.json";

async function main() {
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container");

  const runtime = await createMap(container, spec, { renderer: "maplibre" });
  console.log("[consumer-handoff-minimal] map ready", runtime.exportSpec());
}

main().catch((error) => {
  console.error("[consumer-handoff-minimal] failed to initialize map", error);
});
