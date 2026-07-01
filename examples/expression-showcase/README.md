# expression-showcase

## Goal

Demonstrate 4 categories of newly added expression capabilities in a single
map: arithmetic operators, coalesce fallback, string manipulation, and
exponential interpolation.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

### 1. Arithmetic Expressions (`/`)
Region fill color driven by computed population density
(`population / area`), mapped through a linear color ramp.

### 2. coalesce
Region labels use `coalesce` to resolve the best available name:
`name_en → name → "Unknown"`. Regions without `name_en` fall back gracefully.

### 3. String Expressions (`concat`, `upcase`, `to-string`)
City labels formatted as `"NAME (population)"` using string concatenation
and case transformation.

### 4. Exponential Interpolate
Circle radius scaled using `["exponential", 1.5]` for non-linear
magnitude-to-size mapping, producing more dramatic visual differentiation
for high-magnitude events.

## Data

- 4 polygon regions with `population`, `area`, `density`, and `magnitude`
- 4 city points with `name`, `name_en`, `population`, and `magnitude`

## Expected Output

- Regions colored by computed population density (blue gradient)
- Region labels with coalesce fallback
- City labels with uppercase names and population in parentheses
- Circles with exponentially-scaled radii and magnitude-driven colors

## Limits And Follow-up

- These expressions are validated by the schema engine; see
  [`../style-expressions`](../style-expressions/README.md) for the full
  expression catalog.
- For `downcase` usage, replace `upcase` in the city label expression.
