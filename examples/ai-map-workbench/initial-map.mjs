export const INITIAL_SPEC = {
  version: "0.1",
  id: "ai-map-workbench",
  revision: "1",
  view: {
    mode: "map2d",
    center: [120.15, 30.28],
    zoom: 11
  },
  sources: {
    pois: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              name: "West Lake",
              category: "landmark",
              score: 96
            },
            geometry: {
              type: "Point",
              coordinates: [120.148, 30.246]
            }
          },
          {
            type: "Feature",
            properties: {
              name: "Canal District",
              category: "district",
              score: 82
            },
            geometry: {
              type: "Point",
              coordinates: [120.165, 30.312]
            }
          },
          {
            type: "Feature",
            properties: {
              name: "Qianjiang New City",
              category: "business",
              score: 74
            },
            geometry: {
              type: "Point",
              coordinates: [120.205, 30.249]
            }
          }
        ]
      }
    }
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#eef2f3"
      }
    },
    {
      id: "poi-circles",
      type: "circle",
      source: "pois",
      paint: {
        "circle-radius": 8,
        "circle-color": "#2563eb",
        "circle-stroke-color": "#f8fafc",
        "circle-stroke-width": 2
      }
    }
  ],
  interactions: {
    pan: true,
    zoom: true,
    hover: true,
    click: true
  },
  metadata: {
    title: "AI Map Workbench",
    description: "Local mock AI conversation driving GIS Engine commands."
  }
};

export function createInitialSpec() {
  return structuredClone(INITIAL_SPEC);
}
