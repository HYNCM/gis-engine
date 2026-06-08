import {
  applyCommands,
  createAdapter,
  listAdapters,
  type MapCommand,
  MapLibreAdapter,
  MapRuntime,
  type MapSpec,
  transformMapSpecToMapLibreStyle,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import after from "../fixtures/commands/replay/style-update/after.map.json";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import fillExtrusionLite from "../fixtures/specs/valid/fill-extrusion-lite.map.json";
import { createAdapterContractSuite } from "./createAdapterContractSuite.js";

createAdapterContractSuite("maplibre", () => new MapLibreAdapter());

describe("MapLibreAdapter MVP", () => {
  it("is registered as a built-in adapter", () => {
    expect(listAdapters()).toContain("maplibre");
    expect(createAdapter("maplibre")).toBeInstanceOf(MapLibreAdapter);
  });

  it("declares fill-extrusion-lite as an experimental MapLibre beta capability", async () => {
    const capabilities = await new MapLibreAdapter().getCapabilities();

    expect(capabilities.dimensions).toContain("2_5d");
    expect(capabilities.layers).toContain("fill-extrusion-lite");
    expect(capabilities.experimental).toContain("fill-extrusion-lite");
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

  it("keeps adapter state unchanged when MapRuntime applies a dry run", async () => {
    const adapter = new MapLibreAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });
    const committedSpec = adapter.exportSpec();
    const committedStyle = adapter.exportStyle();

    const results = await runtime.apply(commands as MapCommand[], { dryRun: true });

    expect(results[0]?.status).toBe("applied");
    expect(results[0]?.patch).toHaveLength(3);
    expect(runtime.exportSpec()).toEqual(before);
    expect(adapter.exportSpec()).toEqual(committedSpec);
    expect(adapter.exportStyle()).toEqual(committedStyle);
  });

  it("keeps adapter state unchanged during unsupported feature preflight", async () => {
    const adapter = new MapLibreAdapter();
    await adapter.load(before as MapSpec, { container: {} as HTMLElement });
    const committedSpec = adapter.exportSpec();
    const committedStyle = adapter.exportStyle();
    const unsupportedSpec = structuredClone(before) as MapSpec;
    unsupportedSpec.layers[0] = {
      ...firstLayer(unsupportedSpec),
      type: "fill-extrusion-lite",
    };

    const preflight = transformMapSpecToMapLibreStyle(unsupportedSpec);

    expect(preflight.style).toBeUndefined();
    expect(preflight.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/layers/0/type",
      }),
    ]);
    expect(adapter.exportSpec()).toEqual(committedSpec);
    expect(adapter.exportStyle()).toEqual(committedStyle);
  });

  it("keeps adapter state unchanged when applying an unsupported feature patch fails", async () => {
    const adapter = new MapLibreAdapter();
    await adapter.load(before as MapSpec, { container: {} as HTMLElement });
    const committedSpec = adapter.exportSpec();
    const committedStyle = adapter.exportStyle();

    const adapterResult = await adapter.applyPatch(
      [
        {
          op: "replace",
          path: "/layers/0/type",
          value: "fill-extrusion-lite",
        },
      ],
      { container: {} as HTMLElement },
    );

    expect(adapterResult.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/layers/0/type",
      }),
    ]);
    expect(adapter.exportSpec()).toEqual(committedSpec);
    expect(adapter.exportStyle()).toEqual(committedStyle);
  });

  it("returns a stable data-url snapshot smoke result after load", async () => {
    const adapter = new MapLibreAdapter();
    await adapter.load(before as MapSpec, { container: {} as HTMLElement });

    const snapshot = await adapter.snapshot({ format: "data-url" });

    expect(snapshot.passed).toBe(true);
    expect(snapshot.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(snapshot.dataUrl?.length).toBeGreaterThan("data:image/png;base64,".length);
  });

  it("loads gated fill-extrusion-lite specs and keeps style export stable", async () => {
    const adapter = new MapLibreAdapter();
    await adapter.load(fillExtrusionLite as MapSpec, { container: {} as HTMLElement });

    const snapshot = await adapter.snapshot({ format: "data-url" });

    expect(adapter.exportStyle()?.layers[0]).toMatchObject({
      id: "district-extrusion",
      type: "fill-extrusion",
    });
    expect(snapshot.passed).toBe(true);
  });
});

function firstLayer(spec: MapSpec): MapSpec["layers"][number] {
  const layer = spec.layers[0];
  if (!layer) throw new Error("Expected first layer fixture.");
  return layer;
}
