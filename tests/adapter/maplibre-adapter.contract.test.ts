import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import after from "../fixtures/commands/replay/style-update/after.map.json";
import { applyCommands, createAdapter, listAdapters, MapLibreAdapter, type MapCommand, type MapSpec } from "@gis-engine/engine";
import { createAdapterContractSuite } from "./createAdapterContractSuite.js";

createAdapterContractSuite("maplibre", () => new MapLibreAdapter());

describe("MapLibreAdapter MVP", () => {
  it("is registered as a built-in adapter", () => {
    expect(listAdapters()).toContain("maplibre");
    expect(createAdapter("maplibre")).toBeInstanceOf(MapLibreAdapter);
  });

  it("keeps its internal style and spec in sync after patches", async () => {
    const adapter = new MapLibreAdapter();
    await adapter.load(before as MapSpec, { container: {} as HTMLElement });
    const result = applyCommands(before as MapSpec, commands as MapCommand[]);
    const patch = result.results.flatMap((commandResult) => commandResult.patch ?? []);

    const adapterResult = await adapter.applyPatch(patch, { container: {} as HTMLElement });

    expect(adapterResult.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);
    expect(adapter.exportSpec()).toEqual(after);
    expect(adapter.exportStyle()?.layers[0]?.paint?.["fill-opacity"]).toBe(0.85);
  });

  it("returns a stable data-url snapshot smoke result after load", async () => {
    const adapter = new MapLibreAdapter();
    await adapter.load(before as MapSpec, { container: {} as HTMLElement });

    const snapshot = await adapter.snapshot({ format: "data-url" });

    expect(snapshot.passed).toBe(true);
    expect(snapshot.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(snapshot.dataUrl!.length).toBeGreaterThan("data:image/png;base64,".length);
  });
});
