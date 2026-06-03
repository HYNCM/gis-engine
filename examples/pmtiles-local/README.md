# pmtiles-local

Loads vector data from a local PMTiles archive and renders it with fill and line layers.

## MapSpec Overview

- **ID:** `pmtiles-local-example` | **View:** `map2d`, center [120.15, 30.28], zoom 12
- **Source:** `local-parcels` (pmtiles) -- local file `./data/parcels.pmtiles`, zoom range 0-14
- **Layers:**
  - `parcel-fill` (fill) -- semi-transparent green (`#22c55e`, 36% opacity), source-layer `parcels`
  - `parcel-outline` (line) -- dark green outline (`#166534`, 1.2px), source-layer `parcels`

## Key Concepts

- PMTiles source for efficient, HTTP-range-request-friendly vector tile archives.
- `metadata.source-layer` targets a specific layer within the PMTiles archive.
- Two layers share one source but render different geometry styles (fill + outline).

## Usage

Use this fixture to test PMTiles ingestion, verify source-layer targeting, or validate fill and line rendering from a single vector source.

## Requirements

- A valid PMTiles file at `./data/parcels.pmtiles` containing a vector layer named `parcels`.
