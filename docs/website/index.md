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
      text: MCP Tools
      link: /mcp/overview
    - theme: alt
      text: View on GitHub
      link: https://github.com/HYNCM/gis-engine

features:
  - icon: 🧠
    title: AI-Native by Design
    details: Every public API is schema-described and AI-callable. MCP tools expose input/output schemas so LLMs can validate, edit, snapshot, and export maps without guesswork.
  - icon: 🔒
    title: Command-Only Mutation
    details: All state changes go through the command system. Dry-run, rollback, replay, and deterministic audit trails keep AI edits safe and auditable.
  - icon: 🔍
    title: Structured Diagnostics
    details: Errors are machine-readable diagnostic codes with paths and fix suggestions—not natural-language prose. Your AI agent can act on them.
  - icon: 🗺️
    title: Schema-First MapSpec
    description: TypeBox schemas generate JSON Schema and TypeScript types in sync. One source of truth for map structure.
  - icon: 🎨
    title: Adapter Architecture
    description: MapLibre GL JS today, other renderers tomorrow. All renderer-specific code stays behind RendererAdapter contracts.
  - icon: 📸
    title: Deterministic Snapshots
    description: Smoke snapshots verify every change is non-breaking. Visual snapshots catch pixel regressions. CI-friendly and headless.
---
