# AI Map Workbench Design

## Goal

Create a runnable example application at `examples/ai-map-workbench` that shows
the current GIS Engine through a visual interface: a local mock AI chat sidebar
and a real MapLibre map display.

## Confirmed Scope

- Location: `examples/ai-map-workbench`.
- AI mode: local mock conversation, no external model API.
- Delivery shape: server-backed static example.
- Rendering: browser MapLibre map driven by GIS Engine `MapSpec` and
  `transformMapSpecToMapLibreStyle`.
- Mutation: all map edits go through `MapCommand` and `applyCommands`.
- Evidence: show command status, diagnostics, current spec summary, and
  readiness state in the UI.

## Architecture

The example uses a small Node HTTP server instead of a frontend bundler. The
server imports the built GIS Engine package, owns the active `MapSpec`, serves
the static UI, exposes local JSON endpoints, and vendors the already-installed
MapLibre browser assets from `node_modules`.

The browser loads plain HTML, CSS, and JavaScript. It renders the chat sidebar,
the evidence panel, and a MapLibre map. The browser never mutates the map spec
directly. It sends chat text to the local server, receives structured command
results and the next MapLibre style, then updates the visible map.

## Components

- `server.mjs`: local HTTP server, API routes, static file serving, active spec
  state, and vendor asset serving.
- `mock-ai.mjs`: deterministic phrase-to-command planner for the first release.
- `initial-map.mjs`: inline starter `MapSpec` and local GeoJSON features so the
  app does not depend on external network resources.
- `public/index.html`: workbench shell.
- `public/app.js`: browser state, chat interactions, API calls, and MapLibre map
  synchronization.
- `public/styles.css`: production-quality dashboard styling for the workbench.
- `README.md`: run instructions and capability boundaries.

## User Flow

1. Start the example with `pnpm example:ai-map-workbench`.
2. Open the printed localhost URL.
3. The UI loads the initial spec and renders a MapLibre map.
4. The user types a simple instruction such as `make points red`,
   `make points blue`, `increase point size`, `zoom to Hangzhou`, or `reset`.
5. The server maps the instruction to one or more `MapCommand` values.
6. The server applies commands through `applyCommands`, validates/transforms the
   resulting spec, and returns structured evidence.
7. The UI appends an assistant message, updates the evidence panel, and applies
   the returned MapLibre style to the map.

## Error Handling

Unsupported text returns a structured `unsupported` response with no spec
mutation. Command failures return command diagnostics and keep the last
committed spec visible. Transform or validation errors are surfaced as
diagnostic cards. The UI must not infer readiness from prose; it uses explicit
status fields returned by the server.

## Testing

Automated coverage should prove the example contract before implementation:

- The mock AI planner maps supported phrases to deterministic commands.
- Unsupported phrases do not mutate state.
- The workbench HTTP API returns an initial style and applies a supported chat
  prompt through `applyCommands`.
- The bundled example list includes `ai-map-workbench`.

Manual/browser verification should start the local server and confirm that the
page loads, the map is nonblank, the chat sidebar works, and a supported prompt
changes visible map styling.

## Non-Goals

- No real AI model call.
- No new MCP tool names.
- No new frontend framework or bundler.
- No file writes from the browser UI.
- No stable SceneView3D promotion or 3D renderer claims.
- No external basemap or network fetch requirement.
