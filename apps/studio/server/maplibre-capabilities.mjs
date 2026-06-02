export const MAPLIBRE_CAPABILITY_REGISTRY = {
  id: "maplibre-gl-js-5.24.0",
  renderer: "MapLibre GL JS",
  packageName: "maplibre-gl",
  packageVersion: "5.24.0",
  styleSpecVersion: "v8",
  generatedFrom: [
    "node_modules/maplibre-gl/package.json",
    "node_modules/maplibre-gl/src/index.ts",
    "node_modules/maplibre-gl/src/ui/map.ts",
    "node_modules/maplibre-gl/src/ui/camera.ts",
    "node_modules/maplibre-gl/src/style/create_style_layer.ts",
    "node_modules/maplibre-gl/src/source/source.ts",
    "node_modules/.pnpm/@maplibre+maplibre-gl-style-spec@24.8.5/node_modules/@maplibre/maplibre-gl-style-spec/src/reference/v8.json",
  ],
  styleSpec: {
    rootProperties: [
      "version", "name", "metadata", "center", "centerAltitude", "zoom", "bearing", "pitch", "roll", "state",
      "light", "sky", "projection", "terrain", "sources", "sprite", "glyphs", "font-faces", "transition", "layers",
    ],
    sourceTypes: ["vector", "raster", "raster-dem", "geojson", "video", "image"],
    runtimeSourceTypes: ["canvas", "custom-source-type"],
    layerTypes: ["background", "fill", "line", "symbol", "circle", "heatmap", "fill-extrusion", "raster", "hillshade", "color-relief"],
    runtimeLayerTypes: ["custom"],
    expressionOperators: [
      "let", "var", "literal", "array", "at", "in", "index-of", "slice", "case", "match", "coalesce", "step",
      "interpolate", "interpolate-hcl", "interpolate-lab", "ln2", "pi", "e", "typeof", "string", "number",
      "boolean", "object", "collator", "format", "image", "global-state", "number-format", "to-string",
      "to-number", "to-boolean", "to-rgba", "to-color", "rgb", "rgba", "get", "has", "length", "properties",
      "feature-state", "geometry-type", "id", "zoom", "heatmap-density", "elevation", "line-progress", "accumulated",
      "+", "*", "-", "/", "%", "^", "sqrt", "log10", "ln", "log2", "sin", "cos", "tan", "asin", "acos",
      "atan", "min", "max", "round", "abs", "ceil", "floor", "distance", "==", "!=", ">", "<", ">=", "<=",
      "all", "any", "!", "within", "is-supported-script", "upcase", "downcase", "concat", "resolved-locale",
      "split", "join",
    ],
  },
  groups: [
    {
      id: "style-document",
      label: "Style document and global style state",
      naturalLanguage: ["load a style", "switch style", "set glyphs", "add sprites", "set transition", "set global state"],
      maplibreApis: ["setStyle", "getStyle", "setGlobalStateProperty", "getGlobalState", "setGlyphs", "addSprite", "removeSprite", "setSprite"],
      aiInvocation: {
        status: "partially-implemented",
        implementedVia: ["setPaint", "setLayout", "addLayer", "removeLayer", "addSource", "removeSource"],
        requiresContractFor: ["full style import", "sprite management", "glyph/font-face changes", "global-state mutation"],
      },
    },
    {
      id: "sources",
      label: "Data sources",
      naturalLanguage: ["add GeoJSON", "load vector tiles", "show raster tiles", "use DEM terrain", "add image/video/canvas overlay"],
      maplibreCapabilities: ["vector", "raster", "raster-dem", "geojson", "video", "image", "canvas", "addSourceType"],
      maplibreApis: ["addSource", "removeSource", "isSourceLoaded", "refreshTiles", "setSourceTileLodParams", "addSourceType"],
      aiInvocation: {
        status: "partially-implemented",
        implementedVia: ["addSource", "removeSource", "Studio basemap proxy"],
        requiresContractFor: ["raster-dem", "image", "video", "canvas", "custom source type", "live source diff updates"],
      },
    },
    {
      id: "layers",
      label: "Layers, styling, filters, and ordering",
      naturalLanguage: ["add a heatmap", "extrude buildings", "style labels", "filter features", "move a layer", "change opacity"],
      maplibreCapabilities: ["background", "fill", "line", "symbol", "circle", "heatmap", "fill-extrusion", "raster", "hillshade", "color-relief", "custom"],
      maplibreApis: ["addLayer", "moveLayer", "removeLayer", "setPaintProperty", "setLayoutProperty", "setFilter", "setLayerZoomRange"],
      aiInvocation: {
        status: "partially-implemented",
        implementedVia: ["setPaint", "setLayout", "setFilter", "setLayerZoomRange", "addLayer", "removeLayer", "reorderLayer"],
        requiresContractFor: ["heatmap", "hillshade", "color-relief", "custom layers", "advanced filter synthesis", "source-layer targeting"],
      },
    },
    {
      id: "expressions",
      label: "Expressions and data-driven styling",
      naturalLanguage: ["color by category", "size by population", "style by zoom", "format labels", "filter within polygon"],
      maplibreCapabilities: ["data expressions", "camera expressions", "feature-state", "global-state", "math", "string", "color", "geometry predicates"],
      aiInvocation: {
        status: "partially-implemented",
        implementedVia: ["expression validator subset"],
        requiresContractFor: ["all 87 expression operators", "type-directed expression synthesis", "feature-state/global-state write paths"],
      },
    },
    {
      id: "camera",
      label: "Camera and navigation",
      naturalLanguage: ["fly to Hangzhou", "fit these bounds", "tilt the map", "rotate north", "set field of view", "query terrain elevation"],
      maplibreApis: [
        "jumpTo", "easeTo", "flyTo", "fitBounds", "fitScreenCoordinates", "panBy", "panTo", "zoomTo", "zoomIn", "zoomOut",
        "rotateTo", "resetNorth", "resetNorthPitch", "setCenter", "setZoom", "setBearing", "setPitch", "setRoll", "setPadding",
      ],
      aiInvocation: {
        status: "partially-implemented",
        implementedVia: ["setView", "fitBounds"],
        requiresContractFor: ["animation options", "padding", "roll", "field-of-view", "terrain-aware camera"],
      },
    },
    {
      id: "interaction-controls",
      label: "Controls and interaction handlers",
      naturalLanguage: ["show navigation controls", "enable geolocation", "turn on globe control", "disable scroll zoom", "use cooperative gestures"],
      maplibreCapabilities: ["NavigationControl", "GeolocateControl", "AttributionControl", "LogoControl", "ScaleControl", "FullscreenControl", "TerrainControl", "GlobeControl"],
      maplibreApis: ["addControl", "removeControl", "hasControl", "BoxZoomHandler", "DragPanHandler", "DragRotateHandler", "ScrollZoomHandler", "KeyboardHandler"],
      aiInvocation: {
        status: "not-yet-commanded",
        requiresContractFor: ["UI control state", "handler enable/disable", "geolocation permission flow"],
      },
    },
    {
      id: "query-state",
      label: "Feature queries and per-feature state",
      naturalLanguage: ["select features here", "show features in this box", "highlight this feature", "clear hover state"],
      maplibreApis: ["queryRenderedFeatures", "querySourceFeatures", "setFeatureState", "getFeatureState", "removeFeatureState", "project", "unproject"],
      aiInvocation: {
        status: "partially-implemented",
        implementedVia: ["queryFeatures point/bbox for inline GeoJSON"],
        requiresContractFor: ["rendered feature queries", "vector source-layer queries", "feature-state commands"],
      },
    },
    {
      id: "terrain-projection-3d",
      label: "Terrain, projection, lighting, sky, and 2.5D",
      naturalLanguage: ["turn on terrain", "switch to globe", "add sky", "set lighting", "extrude buildings", "show hillshade"],
      maplibreCapabilities: ["terrain", "projection globe", "projection mercator", "sky", "light", "fill-extrusion", "raster-dem", "hillshade", "color-relief"],
      maplibreApis: ["setTerrain", "getTerrain", "setProjection", "getProjection", "setSky", "getSky", "setLight", "getLight", "queryTerrainElevation"],
      aiInvocation: {
        status: "not-yet-commanded",
        requiresContractFor: ["terrain source schema", "projection command", "sky/light command", "2.5D promotion gates"],
      },
    },
    {
      id: "overlays-assets",
      label: "Images, markers, popups, and DOM overlays",
      naturalLanguage: ["add a marker", "open a popup", "load an icon", "replace an icon image", "add a custom canvas overlay"],
      maplibreApis: ["Marker", "Popup", "addImage", "updateImage", "getImage", "hasImage", "removeImage", "loadImage", "listImages"],
      aiInvocation: {
        status: "not-yet-commanded",
        requiresContractFor: ["DOM overlay ownership", "image resource policy", "popup content sanitization"],
      },
    },
    {
      id: "events-lifecycle",
      label: "Events, lifecycle, and rendering state",
      naturalLanguage: ["run this when the map loads", "listen for clicks on a layer", "wait until idle", "redraw", "resize"],
      maplibreApis: ["on", "once", "off", "loaded", "isStyleLoaded", "areTilesLoaded", "isMoving", "isZooming", "isRotating", "resize", "redraw", "triggerRepaint", "remove"],
      aiInvocation: {
        status: "not-yet-commanded",
        requiresContractFor: ["event subscriptions", "callback safety", "browser-only lifecycle effects"],
      },
    },
    {
      id: "performance-network",
      label: "Workers, protocols, requests, and performance controls",
      naturalLanguage: ["limit tile requests", "set worker count", "use a custom protocol", "prewarm workers", "transform requests"],
      maplibreApis: [
        "setWorkerCount", "getWorkerCount", "setMaxParallelImageRequests", "getMaxParallelImageRequests", "setWorkerUrl", "getWorkerUrl",
        "setTransformRequest", "addProtocol", "removeProtocol", "prewarm", "clearPrewarmedResources", "importScriptInWorkers",
      ],
      aiInvocation: {
        status: "not-yet-commanded",
        requiresContractFor: ["resource policy approval", "worker lifecycle", "protocol security review", "credential redaction"],
      },
    },
  ],
};

export function buildMapLibreCapabilityPrompt(registry = MAPLIBRE_CAPABILITY_REGISTRY) {
  const style = registry.styleSpec;
  const groupLines = registry.groups.map((group) => {
    const status = group.aiInvocation.status;
    const verbs = group.naturalLanguage.slice(0, 4).join("; ");
    const requires = group.aiInvocation.requiresContractFor?.slice(0, 4).join(", ") || "none";
    return `- ${group.id} (${status}): ${verbs}. Requires contract for: ${requires}.`;
  });

  return [
    `MapLibre GL JS package: ${registry.packageVersion}; style spec: ${registry.styleSpecVersion}.`,
    `Style roots: ${style.rootProperties.join(", ")}.`,
    `Source types: ${[...style.sourceTypes, ...style.runtimeSourceTypes].join(", ")}.`,
    `Layer types: ${[...style.layerTypes, ...style.runtimeLayerTypes].join(", ")}.`,
    `Expression operators (${style.expressionOperators.length}): ${style.expressionOperators.join(", ")}.`,
    "Capability groups:",
    ...groupLines,
    "Invocation rule: use implemented commands when available; when a requested MapLibre ability lacks a GIS Engine command contract, return a structured unsupported capability response; do not invent browser-side mutations.",
  ].join("\n");
}
