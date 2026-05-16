import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import {
  MapRuntime,
  MapSpecValidationError,
  type AdapterApplyResult,
  type AdapterEventListener,
  type CapabilityReport,
  type FeatureQueryResult,
  type JsonPatchOperation,
  type MapCommand,
  type MapSpec,
  type QueryFeaturesOptions,
  type RenderContext,
  type RendererAdapter,
  type ResourceReport,
  type SnapshotOptions,
  type SnapshotResult,
  type Unsubscribe
} from "@gis-engine/engine";

class RuntimeMockAdapter implements RendererAdapter {
  readonly id = "runtime-mock";
  readonly version = "0.1.0";
  patches: JsonPatchOperation[][] = [];
  loadCalls = 0;

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: this.id,
      dimensions: ["2d"],
      sources: ["geojson"],
      layers: ["fill"],
      expressions: [],
      queries: [],
      snapshot: { supported: true, formats: ["data-url"] },
      experimental: []
    };
  }

  async load(_spec: MapSpec, _context: RenderContext): Promise<void> {
    this.loadCalls += 1;
  }

  async applyPatch(patch: JsonPatchOperation[], _context: RenderContext): Promise<AdapterApplyResult> {
    this.patches.push(patch);
    return { diagnostics: [] };
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
      container: {} as HTMLElement
    });

    const results = await runtime.apply(commands as MapCommand[]);

    expect(results[0]?.status).toBe("applied");
    expect(runtime.exportSpec().revision).toBe("2");
    expect(adapter.patches).toHaveLength(1);
  });

  it("rejects invalid specs before loading the adapter", async () => {
    const adapter = new RuntimeMockAdapter();
    const invalidSpec = structuredClone(before) as MapSpec;
    invalidSpec.layers = [{ ...invalidSpec.layers[0]!, source: "missing-source" }];

    await expect(
      MapRuntime.create(invalidSpec, {
        adapter,
        container: {} as HTMLElement
      })
    ).rejects.toMatchObject({
      name: "MapSpecValidationError",
      diagnostics: [expect.objectContaining({ code: "SRC.NOT_FOUND" })]
    });
    await expect(
      MapRuntime.create(invalidSpec, {
        adapter,
        container: {} as HTMLElement
      })
    ).rejects.toBeInstanceOf(MapSpecValidationError);
    expect(adapter.loadCalls).toBe(0);
  });

  it("does not synchronize staged patches when an atomic batch rolls back", async () => {
    const adapter = new RuntimeMockAdapter();
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter,
      container: {} as HTMLElement
    });
    const styleCommand = (commands as MapCommand[])[0]!;
    const failingCommand: MapCommand = {
      id: "cmd-remove-missing-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "2",
      layerId: "missing-layer"
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
      container: {} as HTMLElement
    });
    const styleCommand = (commands as MapCommand[])[0]!;
    const failingCommand: MapCommand = {
      id: "cmd-remove-missing-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "2",
      layerId: "missing-layer"
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
      container: {} as HTMLElement
    });
    const previewCommand: MapCommand = { ...(commands as MapCommand[])[0]!, id: "cmd-preview-style", dryRun: true };

    const results = await runtime.apply(previewCommand);

    expect(results[0]?.status).toBe("applied");
    expect(results[0]?.patch).toHaveLength(2);
    expect(runtime.exportSpec()).toEqual(before);
    expect(adapter.patches).toHaveLength(0);
  });
});
