# AI Map Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable `examples/ai-map-workbench` app with a mock AI chat sidebar and real MapLibre map display backed by the current GIS Engine.

**Architecture:** A local Node HTTP server owns the active `MapSpec`, applies mock AI-generated `MapCommand` values through `applyCommands`, transforms the resulting spec into MapLibre style, and serves static browser UI assets. The browser renders chat, evidence, and the map, but never mutates the spec directly.

**Tech Stack:** Node ESM HTTP server, plain browser HTML/CSS/JavaScript, MapLibre browser assets from existing `maplibre-gl`, Vitest, GIS Engine `applyCommands`, `validateSpec`, and `transformMapSpecToMapLibreStyle`.

---

## File Structure

- Create `examples/ai-map-workbench/initial-map.mjs`: starter map spec and inline GeoJSON data.
- Create `examples/ai-map-workbench/mock-ai.mjs`: deterministic chat text to command planner.
- Create `examples/ai-map-workbench/server.mjs`: local API and static asset server.
- Create `examples/ai-map-workbench/public/index.html`: app shell.
- Create `examples/ai-map-workbench/public/app.js`: browser controller and MapLibre synchronization.
- Create `examples/ai-map-workbench/public/styles.css`: workbench styling.
- Create `examples/ai-map-workbench/README.md`: run instructions and boundaries.
- Create `tests/examples/ai-map-workbench.test.ts`: planner and API contract tests.
- Modify `tests/examples/examples.test.ts`: include `ai-map-workbench` in the bundled example list.
- Modify `package.json`: add `example:ai-map-workbench`.

## Task 1: Mock Planner Contract

**Files:**
- Create: `examples/ai-map-workbench/initial-map.mjs`
- Create: `examples/ai-map-workbench/mock-ai.mjs`
- Create: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Write failing planner tests**

```ts
import { describe, expect, it } from "vitest";
import { planMockAiEdit } from "../../examples/ai-map-workbench/mock-ai.mjs";

describe("ai-map-workbench mock planner", () => {
  it("maps a red point request to a setPaint command", () => {
    const plan = planMockAiEdit("make points red");
    expect(plan.status).toBe("planned");
    expect(plan.commands).toEqual([
      expect.objectContaining({
        type: "setPaint",
        layerId: "poi-circles",
        paint: expect.objectContaining({ "circle-color": "#ef4444" })
      })
    ]);
  });

  it("returns unsupported without commands for unknown text", () => {
    const plan = planMockAiEdit("build a 3d terrain city");
    expect(plan.status).toBe("unsupported");
    expect(plan.commands).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `pnpm vitest run tests/examples/ai-map-workbench.test.ts`

Expected: fail because `examples/ai-map-workbench/mock-ai.mjs` does not exist.

- [ ] **Step 3: Implement initial map and planner**

Create a starter map with id `ai-map-workbench`, view mode `map2d`, inline
GeoJSON source `pois`, and circle layer `poi-circles`. Implement
`planMockAiEdit(input)` with supported intents: red, blue, larger points,
smaller points, zoom to Hangzhou, and reset.

- [ ] **Step 4: Run tests and verify green**

Run: `pnpm vitest run tests/examples/ai-map-workbench.test.ts`

Expected: planner tests pass.

## Task 2: Workbench HTTP API

**Files:**
- Modify: `examples/ai-map-workbench/server.mjs`
- Modify: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Add failing API tests**

Extend the test file to start the server on an ephemeral port, call `GET /api/state`,
call `POST /api/chat` with `make points red`, and assert that the returned state
has `status: "applied"`, command evidence, diagnostics array, spec, and style.

- [ ] **Step 2: Run API tests and verify red**

Run: `pnpm vitest run tests/examples/ai-map-workbench.test.ts`

Expected: fail because the server module is not implemented.

- [ ] **Step 3: Implement server module**

Export `createWorkbenchServer({ port })`. Use Node `http`, `fs/promises`, and
`path`. API routes:

- `GET /api/state`: returns current spec, transformed style, validation report,
  diagnostics, and summary.
- `POST /api/chat`: parses `{ message }`, calls `planMockAiEdit`, applies
  commands through `applyCommands` with `collectTrace: true`, commits only when
  command replay succeeds, and returns evidence.
- `POST /api/reset`: restores the initial spec.
- `/vendor/maplibre-gl.js` and `/vendor/maplibre-gl.css`: serve existing
  MapLibre assets from `node_modules/maplibre-gl/dist`.
- Static files: serve `public/index.html`, `public/app.js`, and
  `public/styles.css`.

- [ ] **Step 4: Run API tests and verify green**

Run: `pnpm vitest run tests/examples/ai-map-workbench.test.ts`

Expected: planner and API tests pass.

## Task 3: Browser UI And Example Script

**Files:**
- Create: `examples/ai-map-workbench/public/index.html`
- Create: `examples/ai-map-workbench/public/app.js`
- Create: `examples/ai-map-workbench/public/styles.css`
- Create: `examples/ai-map-workbench/README.md`
- Modify: `package.json`
- Modify: `tests/examples/examples.test.ts`

- [ ] **Step 1: Add failing example registry assertion**

Update `tests/examples/examples.test.ts` so the bundled example list includes
`ai-map-workbench`.

- [ ] **Step 2: Run examples test and verify red**

Run: `pnpm vitest run tests/examples/examples.test.ts`

Expected: fail until the new example is represented by runnable files and the
registry assertion is updated.

- [ ] **Step 3: Implement static UI and package script**

Add a dense, tool-like interface: chat sidebar, evidence cards, map canvas,
prompt chips, reset control, and status bar. Add
`"example:ai-map-workbench": "node examples/ai-map-workbench/server.mjs"` to the
root scripts.

- [ ] **Step 4: Run examples tests and verify green**

Run: `pnpm vitest run tests/examples/examples.test.ts`

Expected: pass with `ai-map-workbench` included.

## Task 4: Verification

**Files:**
- No new implementation files expected.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts tests/examples/examples.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Run deterministic project gate**

Run: `pnpm check`

Expected: build and existing deterministic tests pass.

- [ ] **Step 3: Browser smoke**

Run the app with `pnpm example:ai-map-workbench`, open the printed localhost
URL, verify the map is nonblank, send `make points red`, and confirm the map
style and evidence panel update.
