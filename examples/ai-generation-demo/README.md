# ai-generation-demo

## Goal

Demonstrate the end-to-end AI map generation workflow: prompt → plan →
generate → validate → render → export. This shows the full pipeline that
MCP tools and AI agents would follow when generating maps from natural
language descriptions.

After the pipeline completes, a **real MapLibre GL map** appears on the left
panel — not just a text confirmation — so developers can see the full
prompt-to-rendered-map cycle in action.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map and pipeline panel side by side.

## What It Shows

- **Stage 1 — Prompt**: user describes the desired map
- **Stage 2 — Plan**: `planMapGenerationRequest` creates a generation plan
- **Stage 3 — Generate**: mock AI provider produces a MapSpec
- **Stage 4 — Validate**: `validateSpec` checks the generated spec
- **Stage 5 — Render**: `createMap` renders the validated spec as a real
  MapLibre GL map on the left panel
- **Stage 6 — Export**: `exportSpec` produces the final evidence bundle

## Visual Feedback

- **Progress bar**: a gradient bar at the top of the pipeline panel fills as
  each stage completes, with a live label describing the current step.
- **Live stage cards**: each pipeline stage appears incrementally with a
  status badge (⟳ running → ✓ success / ✗ error), giving a real-time
  feel for the generation process.
- **Map loading overlay**: the map area shows a "Rendering map…" overlay
  while MapLibre initializes, then fades in the live map once tiles load.
- **Error handling**: if validation fails, the pipeline aborts with a red
  error card and the map is never rendered.

## Pipeline Panel

The right panel shows each pipeline stage with its inputs and outputs,
simulating what an AI agent or MCP tool would produce. Stages appear
incrementally as they execute rather than all at once.

## Expected Output

- Left: rendered MapLibre GL map of Hangzhou with parks (green polygons),
  major roads (orange lines), an OpenStreetMap raster basemap, and park
  name labels.
- Right: step-by-step pipeline visualization with live progress bar,
  showing all 6 stages with status badges.
- Console: full spec objects, validation reports, and exported evidence
  bundle.

## Limits And Follow-up

- Uses a mock AI provider (no real LLM calls). For real AI integration see
  [`../ai-map-workbench`](../ai-map-workbench/README.md) and the MCP tools
  documentation.
- For MCP server setup see
  [`../mcp-server-setup`](../mcp-server-setup/README.md).
