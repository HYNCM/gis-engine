# Project Definition

Generated: 2026-06-14
Status: Confirmed intent

## Definition

GIS Engine is a WebGIS development engine for AI Agent collaboration. Its core
object is `MapSpec`, an executable blueprint for map and scene applications.

The first-priority users are developers building WebGIS and digital-twin
scenes. They use AI Agents to improve development efficiency by generating or
modifying `MapSpec` from natural language or task descriptions.

The project exists to make AI-generated map applications verifiable and
trustworthy. AI output is not trusted directly; every AI change must leave
structured evidence so developers can audit what changed and CI can block bad
changes.

The core model should stay generic enough to support future scene and domain
extensions. `MapSpec` is the core contract plus extension surface, not a
hard-coded model centered on the current 2D path.

## First-Phase Success

The first phase is successful when a developer can:

1. Use an AI Agent to generate or modify a 2D `MapSpec` from natural language.
2. Use MCP tools to validate, apply, export, explain, and snapshot the spec.
3. Run a generated or exported Web example.
4. Rely on CI to verify schema coverage, command replay, structured
   diagnostics, and key snapshots.

## Scope

2D WebGIS should become stable first. 3D and digital-twin capabilities enter
gradually through adapter boundaries, without over-widening the early core
protocol.

## Out Of Scope

The first phase does not include:

- A complete low-code editor.
- A full replacement for MapLibre or Cesium.
- A stable 3D digital-twin runtime guarantee.
- A multiplayer realtime collaboration UI.
- Treating AI output as trustworthy without validation evidence.
