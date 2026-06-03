# basic-geojson

Minimal example that loads a local GeoJSON file and renders point features as styled circles on a 2D map.

## MapSpec Overview

- **ID:** `basic-geojson-example` | **View:** `map2d`, center [120.15, 30.28], zoom 11
- **Source:** `pois` (geojson) -- external file at `./data/points.geojson`
- **Layer:** `poi-circles` (circle) -- 6px blue circles (`#2563eb`)

## Key Concepts

- Simplest MapSpec fixture: one GeoJSON source, one circle layer, static paint properties.
- Demonstrates referencing an external `.geojson` data file via relative path.

## Usage

Copy this fixture to bootstrap a new MapSpec test or example. Useful for verifying basic GeoJSON ingestion, circle rendering, and local file path resolution.

## Requirements

The file `./data/points.geojson` must be present alongside `map.json`.
