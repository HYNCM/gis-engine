import {
  type AdapterApplyResult,
  type AdapterEventListener,
  type CapabilityReport,
  type FeatureQueryResult,
  type JsonPatchOperation,
  type MapCommand,
  MapRuntime,
  type MapSpec,
  MapSpecValidationError,
  MockAdapter,
  type QueryFeaturesOptions,
  type RenderContext,
  type RendererAdapter,
  type ResourceReport,
  type SnapshotOptions,
  type SnapshotResult,
  type Unsubscribe,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";

const styleUpdateCommands = commands as MapCommand[];

class RuntimeMockAdapter implements RendererAdapter {
  readonly id = "runtime-mock";
  readonly version = "0.1.0";
  patches: JsonPatchOperation[][] = [];
  loadCalls = 0;
  loadedSpec: MapSpec | null = null;
  applyDiagnostics: AdapterApplyResult["diagnostics"] = [];
  applyDelayMs = 0;
  failLoadAfterFirstCall = false;
  loadError: Error | null = null;

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: this.id,
      dimensions: ["2d"],
      sources: ["geojson"],
      layers: ["fill"],
      expressions: [],
      queries: [],
      snapshot: { supported: true, formats: ["data-url"] },
      experimental: [],
    };
  }

  async load(spec: MapSpec, _context: RenderContext): Promise<void> {
    this.loadCalls += 1;
    if (this.failLoadAfterFirstCall && this.loadCalls > 1) {
      throw this.loadError ?? new Error("RuntimeMockAdapter load failed.");
    }
    this.loadedSpec = structuredClone(spec);
  }

  async applyPatch(patch: JsonPatchOperation[], _context: RenderContext): Promise<AdapterApplyResult> {
    if (this.applyDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.applyDelayMs));
    }
    this.patches.push(patch);
    return { diagnostics: this.applyDiagnostics };
  }

  async queryFeatures(_options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    return { features: [], diagnostics: [] };
  }

  async snapshot(_options: SnapshotOptions): Promise<SnapshotResult> {
    return { passed: true, diagnostics: [] };
  }

  resize(_size: { width: number; height: number }): void {}

  async destroy(): Promise<ResourceReport> {
    return { destroyed: true, diagnostics: [] };
  }

  on(_event: "error" | "warning" | "stats", _listener: AdapterEventListener): Unsubscribe {
    return () => undefined;
  }
}

describe("MapRuntime", () => {
  it("applies commands and synchronizes patches to the adapter", async () => {
    const adapter = new RuntimeMockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });

    const results = await runtime.apply(commands as MapCommand[]);

    expect(results[0]?.status).toBe("applied");
    expect(runtime.exportSpec().revision).toBe("2");
    expect(adapter.patches).toHaveLength(1);
  });

  it("rejects invalid specs before loading the adapter", async () => {
    const adapter = new RuntimeMockAdapter();
    const invalidSpec = structuredClone(before) as MapSpec;
    invalidSpec.layers = [{ ...firstLayer(invalidSpec), source: "missing-source" }];

    await expect(
      MapRuntime.create(invalidSpec, {
        adapter,
        container: {} as HTMLElement,
      }),
    ).rejects.toMatchObject({
      name: "MapSpecValidationError",
      diagnostics: [expect.objectContaining({ code: "SRC.NOT_FOUND" })],
    });
    await expect(
      MapRuntime.create(invalidSpec, {
        adapter,
        container: {} as HTMLElement,
      }),
    ).rejects.toBeInstanceOf(MapSpecValidationError);
    expect(adapter.loadCalls).toBe(0);
  });

  it("does not synchronize staged patches when an atomic batch rolls back", async () => {
    const adapter = new RuntimeMockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });
    const styleCommand = firstStyleCommand();
    const failingCommand: MapCommand = {
      id: "cmd-remove-missing-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "2",
      layerId: "missing-layer",
    };

    const results = await runtime.apply([styleCommand, failingCommand]);

    expect(results.map((result) => result.status)).toEqual(["applied", "failed"]);
    expect(runtime.exportSpec()).toEqual(before);
    expect(adapter.patches).toHaveLength(0);
  });

  it("synchronizes successful commands in best-effort batches", async () => {
    const adapter = new RuntimeMockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });
    const styleCommand = firstStyleCommand();
    const failingCommand: MapCommand = {
      id: "cmd-remove-missing-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "2",
      layerId: "missing-layer",
    };

    const results = await runtime.apply([styleCommand, failingCommand], { transaction: "best-effort" });

    expect(results.map((result) => result.status)).toEqual(["applied", "failed"]);
    expect(runtime.exportSpec().revision).toBe("2");
    expect(adapter.patches).toHaveLength(1);
  });

  it("does not synchronize command-level dry runs", async () => {
    const adapter = new RuntimeMockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });
    const previewCommand: MapCommand = { ...firstStyleCommand(), id: "cmd-preview-style", dryRun: true };

    const results = await runtime.apply(previewCommand);

    expect(results[0]?.status).toBe("applied");
    expect(results[0]?.patch).toHaveLength(3);
    expect(runtime.exportSpec()).toEqual(before);
    expect(adapter.patches).toHaveLength(0);
  });

  it("does not synchronize batch-level dry runs", async () => {
    const adapter = new RuntimeMockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });

    const results = await runtime.apply(commands as MapCommand[], { dryRun: true });

    expect(results[0]?.status).toBe("applied");
    expect(results[0]?.patch).toHaveLength(3);
    expect(runtime.exportSpec()).toEqual(before);
    expect(adapter.patches).toHaveLength(0);
  });

  it("only synchronizes non-dry-run commands in mixed batches", async () => {
    const adapter = new RuntimeMockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });
    const previewCommand: MapCommand = { ...firstStyleCommand(), id: "cmd-preview-style", dryRun: true };
    const viewCommand: MapCommand = {
      id: "cmd-commit-view",
      version: "0.1",
      type: "setView",
      baseRevision: "1",
      view: { zoom: 12 },
    };

    const results = await runtime.apply([previewCommand, viewCommand], { transaction: "best-effort" });

    expect(results.map((result) => result.status)).toEqual(["applied", "applied"]);
    expect(runtime.exportSpec().revision).toBe("2");
    expect(runtime.exportSpec().view.zoom).toBe(12);
    expect(runtime.exportSpec().layers[0]?.paint).toEqual((before as MapSpec).layers[0]?.paint);
    expect(adapter.patches).toHaveLength(1);
    expect(adapter.patches[0]?.some((operation) => operation.path.startsWith("/layers/"))).toBe(false);
    expect(adapter.patches[0]?.some((operation) => operation.path === "/view")).toBe(true);
  });

  it("serializes concurrent applies and rejects stale base revisions deterministically", async () => {
    const adapter = new RuntimeMockAdapter();
    adapter.applyDelayMs = 10;
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });
    const styleCommand = firstStyleCommand();
    const staleViewCommand: MapCommand = {
      id: "cmd-stale-view",
      version: "0.1",
      type: "setView",
      baseRevision: "1",
      view: { zoom: 12 },
    };

    const [firstResults, secondResults] = await Promise.all([
      runtime.apply(styleCommand),
      runtime.apply(staleViewCommand),
    ]);

    expect(firstResults[0]?.status).toBe("applied");
    expect(secondResults[0]?.status).toBe("failed");
    expect(secondResults[0]?.diagnostics.some((diagnostic) => diagnostic.code === "CONFLICT.BASE_REVISION")).toBe(true);
    expect(runtime.exportSpec().revision).toBe("2");
    expect(runtime.exportSpec().view.zoom).toBe((before as MapSpec).view.zoom);
    expect(adapter.patches).toHaveLength(1);
  });

  it("keeps the last committed spec and reloads the adapter when adapter apply fails", async () => {
    const adapter = new RuntimeMockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });
    adapter.applyDiagnostics = [
      {
        severity: "error",
        code: "RENDER.ADAPTER_ERROR",
        message: "adapter rejected patch",
      },
    ];

    const results = await runtime.apply(commands as MapCommand[]);

    expect(results[0]?.status).toBe("failed");
    expect(results[0]?.diagnostics.some((diagnostic) => diagnostic.code === "RENDER.ADAPTER_ERROR")).toBe(true);
    expect(runtime.exportSpec()).toEqual(before);
    expect(adapter.loadCalls).toBe(2);
    expect(adapter.loadedSpec).toEqual(before);
  });

  it("rejects and recovers when a queued reload fails after an adapter error", async () => {
    const adapter = new RuntimeMockAdapter();
    adapter.failLoadAfterFirstCall = true;
    adapter.loadError = new Error("reload failed");
    adapter.applyDiagnostics = [
      {
        severity: "error",
        code: "RENDER.ADAPTER_ERROR",
        message: "adapter rejected patch",
      },
    ];
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement,
    });

    await expect(runtime.apply(commands as MapCommand[])).rejects.toThrow("reload failed");

    adapter.failLoadAfterFirstCall = false;
    adapter.applyDiagnostics = [];
    const viewCommand: MapCommand = {
      id: "cmd-recover-view",
      version: "0.1",
      type: "setView",
      baseRevision: "1",
      view: { zoom: 8 },
    };

    const recoveryResults = await runtime.apply(viewCommand);

    expect(recoveryResults[0]?.status).toBe("applied");
    expect(runtime.exportSpec().view.zoom).toBe(8);
    expect(adapter.loadCalls).toBe(2);
  });

  it("forwards queryFeatures to the committed adapter state", async () => {
    const runtime = await MapRuntime.create(runtimeQuerySpec(), {
      adapter: new MockAdapter(),
      container: {} as HTMLElement,
    });

    const result = await runtime.queryFeatures({ point: [1, 2], layers: ["runtime-points"] });

    expect(result.diagnostics).toEqual([]);
    expect(result.features).toEqual([
      expect.objectContaining({
        properties: { id: "runtime-point" },
      }),
    ]);
  });
});

function firstStyleCommand(): MapCommand {
  const command = styleUpdateCommands[0];
  if (!command) throw new Error("Expected style-update command fixture.");
  return command;
}

function firstLayer(spec: MapSpec): MapSpec["layers"][number] {
  const layer = spec.layers[0];
  if (!layer) throw new Error("Expected first layer fixture.");
  return layer;
}

function runtimeQuerySpec(): MapSpec {
  return {
    version: "0.1",
    id: "runtime-query",
    revision: "1",
    view: {
      mode: "map2d",
      center: [0, 0],
      zoom: 2,
    },
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { id: "runtime-point" },
              geometry: { type: "Point", coordinates: [1, 2] },
            },
          ],
        },
      },
    },
    layers: [{ id: "runtime-points", type: "circle", source: "points" }],
  };
}
