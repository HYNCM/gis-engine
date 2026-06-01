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
| **Evidence** (right) | Command trail, diagnostics, AI provider info |

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
