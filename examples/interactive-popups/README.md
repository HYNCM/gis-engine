# interactive-popups

## Goal

Demonstrate interactive map features: click-to-popup, hover highlighting, and
cursor feedback using the MapSpec `interactions` field.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

- **interactions.click**: clicking a feature opens a MapLibre popup with
  name, description, and star rating
- **interactions.hover**: mouseover changes cursor to pointer and enlarges
  the circle with a different color
- **interactions.popup**: declared in the spec to signal popup capability

## Data

6 landmark points with `name`, `description`, and `rating` properties.

## Expected Output

- Red circles for each landmark
- Click a circle to see a styled popup with feature details
- Hover over a circle to see it enlarge and change to amber
- Cursor changes to pointer on hover

## Limits And Follow-up

- Popup rendering uses MapLibre GL JS native Popup API (not a GIS Engine
  abstraction). The `interactions.popup` field signals intent.
- For non-interactive schema-only examples see
  [`../basic-geojson`](../basic-geojson/README.md).
