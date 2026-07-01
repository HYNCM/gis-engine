# ai-generation-demo

## Goal

Demonstrate the end-to-end AI map generation workflow: prompt → plan →
generate → validate → render → export. This shows the full pipeline that
MCP tools and AI agents would follow when generating maps from natural
language descriptions.

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
- **Stage 5 — Render**: `createMap` renders the validated spec
- **Stage 6 — Export**: `exportSpec` produces the final evidence bundle

## Pipeline Panel

The right panel shows each pipeline stage with its inputs and outputs,
simulating what an AI agent or MCP tool would produce.

## Expected Output

- Left: rendered map of Hangzhou with parks (green) and roads (orange)
- Right: step-by-step pipeline visualization showing all 6 stages
- Console: full spec objects and validation reports

## Limits And Follow-up

- Uses a mock AI provider (no real LLM calls). For real AI integration see
  [`../ai-map-workbench`](../ai-map-workbench/README.md) and the MCP tools
  documentation.
- For MCP server setup see
  [`../mcp-server-setup`](../mcp-server-setup/README.md).
