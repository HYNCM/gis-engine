import { afterEach, describe, expect, it } from "vitest";
import { planMockAiEdit } from "../../examples/ai-map-workbench/mock-ai.mjs";
import { createWorkbenchServer } from "../../examples/ai-map-workbench/server.mjs";

let closeServer: (() => Promise<void>) | undefined;

afterEach(async () => {
  await closeServer?.();
  closeServer = undefined;
});

describe("ai-map-workbench mock planner", () => {
  it("maps a red point request to a setPaint command", () => {
    const plan = planMockAiEdit("make points red");

    expect(plan.status).toBe("planned");
    expect(plan.commands).toEqual([
      expect.objectContaining({
        type: "setPaint",
        layerId: "poi-circles",
        paint: expect.objectContaining({
          "circle-color": "#ef4444"
        })
      })
    ]);
  });

  it("returns unsupported without commands for unknown text", () => {
    const plan = planMockAiEdit("build a 3d terrain city");

    expect(plan.status).toBe("unsupported");
    expect(plan.commands).toEqual([]);
  });
});

describe("ai-map-workbench API", () => {
  it("serves the initial workbench state with a MapLibre style", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/state`);
    const state = await response.json();

    expect(response.ok).toBe(true);
    expect(state.status).toBe("ready");
    expect(state.spec).toMatchObject({
      id: "ai-map-workbench",
      revision: "1"
    });
    expect(state.style).toMatchObject({
      version: 8,
      sources: expect.objectContaining({
        pois: expect.objectContaining({ type: "geojson" })
      })
    });
    expect(state.validation.valid).toBe(true);
    expect(state.diagnostics).toEqual([]);
  });

  it("applies a supported chat prompt through command evidence", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "make points red"
      })
    });
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("applied");
    expect(result.plan).toMatchObject({
      status: "planned",
      intent: "style-red"
    });
    expect(result.commandEvidence).toMatchObject({
      commandCount: 1,
      committed: true,
      failed: false
    });
    expect(result.results[0]).toMatchObject({
      status: "applied",
      commandId: "cmd-mock-red-points"
    });
    expect(result.spec.layers.find((layer: { id: string }) => layer.id === "poi-circles")?.paint).toMatchObject({
      "circle-color": "#ef4444"
    });
    expect(result.diagnostics).toEqual([]);
  });
});
