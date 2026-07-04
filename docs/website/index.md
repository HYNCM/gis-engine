---
layout: home

hero:
  name: GIS Engine
  text: AI-Native Map Engine
  tagline: Schema-first. Command-driven. Deterministically replayable.
  image:
    src: /gis-engine/hero.svg
    alt: GIS Engine
  actions:
    - theme: brand
      text: Quick Start
      link: /guide/quick-start
    - theme: alt
      text: Try Playground
      link: https://stackblitz.com/github/HYNCM/gis-engine/tree/main/examples/basic-geojson
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/HYNCM/gis-engine

features:
  - icon: 🧩
    title: Schema-First MapSpec
    details: Describe your map as a validated JSON spec. TypeBox schemas generate JSON Schema and TypeScript types in sync — one source of truth for map structure.
  - icon: 🤖
    title: AI Generation Pipeline
    details: Go from natural language prompt to a validated, rendered map. Every generation step is traceable, auditable, and replayable through the command system.
  - icon: 🛠️
    title: 7 MCP Tools
    details: validate_spec, apply_commands, export_spec, get_context_summary, snapshot_spec, explain_spec, and export_example_app. Every tool exposes input and output schemas.
  - icon: 🔍
    title: Structured Diagnostics
    details: Errors are machine-readable diagnostic codes with paths and fix suggestions — not opaque strings. Your AI agent and your IDE can both act on them.
  - icon: ⚡
    title: StackBlitz Playground
    details: Zero-install trial. Open a fully working example in your browser, edit the MapSpec, and see changes live. No npm, no build step, no setup.
  - icon: 📸
    title: Deterministic Snapshots
    details: Smoke snapshots verify every change is non-breaking. Visual snapshots catch pixel regressions. CI-friendly and headless.
---

<div style="text-align:center;padding:2rem 0 1rem;">
  <p style="font-size:1.1rem;font-weight:600;color:var(--vp-c-brand-1);">
    🎉 v1.4.0 Released — Real Browser Rendering
  </p>
  <p style="color:var(--vp-c-text-2);">
    createMap() now renders a real interactive MapLibre map — <a href="/release-notes">Read the Release Notes →</a>
  </p>
</div>
