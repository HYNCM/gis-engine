/**
 * MapSpec Playground Templates
 *
 * Each template provides a complete, valid MapSpec with a name and description
 * so users can quickly start exploring different map configurations.
 */

export interface MapSpecTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  spec: Record<string, unknown>;
}

const BASIC_MAP_ID = crypto.randomUUID?.() ?? `basic-${Date.now()}`;
const CHOROPLETH_MAP_ID = crypto.randomUUID?.() ?? `choropleth-${Date.now()}`;
const HEATMAP_MAP_ID = crypto.randomUUID?.() ?? `heatmap-${Date.now()}`;
const MULTILAYER_MAP_ID = crypto.randomUUID?.() ?? `multilayer-${Date.now()}`;

export const basicMapTemplate: MapSpecTemplate = {
  id: "tpl-basic",
  name: "Basic Map",
  description: "A simple map with GeoJSON points around West Lake, Hangzhou.",
  icon: "📍",
  spec: {
    version: "0.1",
    id: BASIC_MAP_ID,
    revision: "0",
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.155, 30.274] },
              properties: { name: "West Lake", category: "lake" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.165, 30.245] },
              properties: { name: "Leifeng Pagoda", category: "landmark" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.145, 30.255] },
              properties: { name: "Lingyin Temple", category: "temple" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.172, 30.248] },
              properties: { name: "Hangzhou Museum", category: "museum" },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "points-layer",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 8,
          "circle-color": "#3b82f6",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
    view: { center: [120.155, 30.274], zoom: 13 },
  },
};

export const choroplethMapTemplate: MapSpecTemplate = {
  id: "tpl-choropleth",
  name: "Choropleth",
  description: "A fill-based choropleth map with colored polygons representing regions.",
  icon: "🗺️",
  spec: {
    version: "0.1",
    id: CHOROPLETH_MAP_ID,
    revision: "0",
    sources: {
      regions: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [120.1, 30.29],
                    [120.14, 30.29],
                    [120.14, 30.26],
                    [120.1, 30.26],
                    [120.1, 30.29],
                  ],
                ],
              },
              properties: { name: "North District", population: 82000, density: "high" },
            },
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [120.14, 30.29],
                    [120.2, 30.29],
                    [120.2, 30.26],
                    [120.14, 30.26],
                    [120.14, 30.29],
                  ],
                ],
              },
              properties: { name: "East District", population: 45000, density: "medium" },
            },
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [120.1, 30.26],
                    [120.14, 30.26],
                    [120.14, 30.22],
                    [120.1, 30.22],
                    [120.1, 30.26],
                  ],
                ],
              },
              properties: { name: "West District", population: 28000, density: "low" },
            },
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [120.14, 30.26],
                    [120.2, 30.26],
                    [120.2, 30.22],
                    [120.14, 30.22],
                    [120.14, 30.26],
                  ],
                ],
              },
              properties: { name: "South District", population: 63000, density: "high" },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "region-fill",
        type: "fill",
        source: "regions",
        paint: {
          "fill-color": [
            "match",
            ["get", "density"],
            "high",
            "#ef4444",
            "medium",
            "#f59e0b",
            "low",
            "#22c55e",
            "#6b7280",
          ],
          "fill-opacity": 0.6,
        },
      },
      {
        id: "region-outline",
        type: "line",
        source: "regions",
        paint: {
          "line-color": "#ffffff",
          "line-width": 2,
        },
      },
    ],
    view: { center: [120.15, 30.255], zoom: 13 },
  },
};

export const heatmapMapTemplate: MapSpecTemplate = {
  id: "tpl-heatmap",
  name: "Heatmap",
  description: "A heatmap layer showing point density with a gradient color ramp.",
  icon: "🔥",
  spec: {
    version: "0.1",
    id: HEATMAP_MAP_ID,
    revision: "0",
    sources: {
      incidents: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.153, 30.275] },
              properties: { intensity: 9 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.157, 30.273] },
              properties: { intensity: 7 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.161, 30.27] },
              properties: { intensity: 5 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.148, 30.268] },
              properties: { intensity: 4 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.165, 30.262] },
              properties: { intensity: 6 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.155, 30.28] },
              properties: { intensity: 8 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.142, 30.258] },
              properties: { intensity: 3 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.17, 30.252] },
              properties: { intensity: 5 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.162, 30.278] },
              properties: { intensity: 7 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.15, 30.265] },
              properties: { intensity: 6 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.158, 30.256] },
              properties: { intensity: 4 },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.167, 30.272] },
              properties: { intensity: 8 },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "heatmap-layer",
        type: "heatmap",
        source: "incidents",
        paint: {
          "heatmap-weight": ["get", "intensity"],
          "heatmap-intensity": 1,
          "heatmap-radius": 20,
          "heatmap-opacity": 0.8,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,255,0)",
            0.2,
            "#22c55e",
            0.4,
            "#f59e0b",
            0.6,
            "#ef4444",
            1,
            "#7f1d1d",
          ],
        },
      },
    ],
    view: { center: [120.156, 30.268], zoom: 14 },
  },
};

export const multiLayerMapTemplate: MapSpecTemplate = {
  id: "tpl-multilayer",
  name: "Multi-Layer",
  description: "Multiple overlapping layers: points, lines, and fills composed together.",
  icon: "🧩",
  spec: {
    version: "0.1",
    id: MULTILAYER_MAP_ID,
    revision: "0",
    sources: {
      areas: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [120.135, 30.285],
                    [120.175, 30.285],
                    [120.175, 30.245],
                    [120.135, 30.245],
                    [120.135, 30.285],
                  ],
                ],
              },
              properties: { name: "Scenic Zone" },
            },
          ],
        },
      },
      routes: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [120.145, 30.275],
                  [120.155, 30.27],
                  [120.165, 30.265],
                  [120.17, 30.26],
                ],
              },
              properties: { name: "Tourist Route" },
            },
          ],
        },
      },
      landmarks: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.155, 30.274] },
              properties: { name: "West Lake", type: "scenic" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.165, 30.265] },
              properties: { name: "Leifeng Pagoda", type: "landmark" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.145, 30.275] },
              properties: { name: "Lingyin Temple", type: "cultural" },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "area-fill",
        type: "fill",
        source: "areas",
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.15,
        },
      },
      {
        id: "area-border",
        type: "line",
        source: "areas",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      },
      {
        id: "route-line",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 3,
        },
      },
      {
        id: "landmark-points",
        type: "circle",
        source: "landmarks",
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match",
            ["get", "type"],
            "scenic",
            "#3b82f6",
            "landmark",
            "#ef4444",
            "cultural",
            "#a855f7",
            "#6b7280",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
    view: { center: [120.155, 30.268], zoom: 14 },
  },
};

export const ALL_TEMPLATES: MapSpecTemplate[] = [
  basicMapTemplate,
  choroplethMapTemplate,
  heatmapMapTemplate,
  multiLayerMapTemplate,
];
