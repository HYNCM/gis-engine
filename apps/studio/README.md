# AI Map Studio

Natural language map editing powered by GIS Engine.

## Quick Start

```bash
# Terminal 1: Start the API server
pnpm studio:server

# Terminal 2: Start the dev frontend
pnpm studio:dev
```

Open http://localhost:5173

## How It Works

```
User types "make points red"
        │
        ▼
┌──────────────────┐     POST /api/chat      ┌──────────────────────┐
│  React SPA       │ ───────────────────────▶ │  Workbench Server     │
│  (Vite :5173)    │ ◀─────────────────────── │  (Node :4321)        │
└──────────────────┘   {status, style, spec}  └──────────────────────┘
        │                                              │
        │  map.setStyle(style)                         │  applyCommands()
        ▼                                              ▼
┌──────────────────┐                          ┌──────────────────────┐
│  MapLibre GL     │                          │  GIS Engine          │
│  Canvas Render   │                          │  Command System      │
└──────────────────┘                          └──────────────────────┘
```

## Architecture

| Panel | Purpose |
|-------|---------|
| **Chat** (left) | Natural language input, quick prompts, message history |
| **Map** (center) | MapLibre GL rendering driven by server MapSpec |
| **Evidence** (right) | Review trail, compact audit history, diagnostics, AI provider info |

## Performance

The Studio shell loads chat, provider controls, and evidence panels first.
MapLibre GL is imported on demand by the map stage, so the renderer package is
kept out of the initial React entry path while the map canvas is still created
automatically when the app opens.

## Basemaps

Studio supports OSM Standard, ArcGIS World Imagery, and Bing Aerial basemaps.
MapSpec keeps those sources policy-safe by using relative `/api/tiles/...`
proxy URLs; the server resolves the selected provider explicitly.

Bing Aerial requires a server-side `BING_MAPS_KEY`:

```bash
BING_MAPS_KEY=... pnpm studio:server
```

## Review Evidence

The right-hand evidence rail reads from compact server evidence instead of raw
provider payloads or full map specs:

- `GET /api/audit` returns payload-free session audit records
- `GET /api/review-decisions` returns append-only review decisions
- `POST /api/review-decision` records reviewer outcomes against recent evidence

Accepted, blocked, and follow-up decisions stay bounded to compact command and
diagnostic evidence so the review surface remains replayable without leaking
provider credentials, URLs, prompts, or full spec payloads.

## MapLibre Capability Registry

Studio exposes an AI-facing MapLibre GL JS capability registry at
`GET /api/maplibre-capabilities`. Provider prompts include the same registry so
models can distinguish currently commanded GIS Engine abilities from broader
MapLibre abilities that still need a schema/command contract before mutation.

The current commanded MapLibre layer controls include paint/layout edits,
layer visibility through `layout.visibility`, layer filters, layer zoom
visibility ranges, layer reordering, and view fitting.

## Docker

```bash
docker compose -f apps/studio/docker-compose.yml up --build
```

## AI Providers

Set `DEEPSEEK_API_KEY` to enable the DeepSeek AI provider:

```bash
DEEPSEEK_API_KEY=sk-... pnpm studio:server
```

Without an API key, the server defaults to mock AI mode (6 preset commands).
