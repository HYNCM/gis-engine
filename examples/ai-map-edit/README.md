# ai-map-edit

## Goal

Demonstrate the AI-driven command replay workflow with provenance tracking
and audit capabilities for production-grade map edits.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

- **before.map.json**: schema-valid base `MapSpec` as the starting state
- **commands.json**: minimal generated edit replayable through `apply_commands`
- **audit.commands.json**: commands with agent provenance, `createdAt`, and
  `sourcePromptHash` for audit flows using `collectTrace: true`

## Data

Point-of-interest (POI) dataset with circle markers demonstrating the
complete AI edit lifecycle: initial spec → command generation → replay →
audit trail.

## Expected Output

- Base map with POI circle markers from `before.map.json`
- After replaying `commands.json`: updated styling and feature highlights
- After replaying `audit.commands.json`: same visual result plus trace
  metadata (provenance, timestamps, prompt hashes) for review workflows

## Limits And Follow-up

- Prompt-level generation should treat this example as delivery evidence only
  after validation, command replay, snapshot evidence, and export/example
  evidence pass.
- Scene browsing output remains under `extensions.scene3d`; stable
  `view.mode: "scene3d"` is not part of this example.
- For AI integration setup see [`../mcp-server-setup`](../mcp-server-setup/README.md).
