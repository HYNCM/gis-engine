import { describe, expect, it } from "vitest";
import basicGeoJson from "../../fixtures/specs/valid/basic-geojson.map.json";
import vectorTileUrl from "../../fixtures/specs/valid/vector-tile-url.map.json";
import fillExtrusionLite from "../../fixtures/specs/valid/fill-extrusion-lite.map.json";
import {
  MapRuntime,
  type AdapterApplyResult,
  type AdapterEventListener,
  type CapabilityReport,
  type Diagnostic,
  type FeatureQueryResult,
  type JsonPatchOperation,
  type MapSpec,
  type QueryFeaturesOptions,
  type RenderContext,
  type RendererAdapter,
  type ResourceReport,
  type SnapshotOptions,
  type SnapshotResult,
  type Unsubscribe
} from "@gis-engine/engine";
import { assertSnapshotReport, type SnapshotReport } from "../report.js";

class SnapshotSmokeAdapter implements RendererAdapter {
  readonly id = "snapshot-smoke";
  readonly version = "0.1.0";
  readonly calls: string[] = [];
  #loadedSpec: MapSpec | null = null;

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: this.id,
      dimensions: ["2d"],
      sources: ["geojson", "vector"],
      layers: ["background", "circle", "fill", "line", "fill-extrusion-lite"],
      expressions: ["to-number", "get"],
      queries: [],
      snapshot: {
        supported: true,
        formats: ["data-url"]
      },
      experimental: []
    };
  }

  async load(spec: MapSpec, _context: RenderContext): Promise<void> {
    this.calls.push("load");
    this.#loadedSpec = structuredClone(spec);
  }

  async applyPatch(_patch: JsonPatchOperation[], _context: RenderContext): Promise<AdapterApplyResult> {
    return { diagnostics: [] };
  }

  async queryFeatures(_options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    return { features: [], diagnostics: [] };
  }

  async snapshot(_options: SnapshotOptions): Promise<SnapshotResult> {
    this.calls.push("snapshot");
    return {
      passed: this.#loadedSpec !== null,
      diagnostics: [],
      dataUrl: "data:image/png;base64,c25hcHNob3Qtc21va2U="
    };
  }

  resize(_size: { width: number; height: number }): void {}

  async destroy(): Promise<ResourceReport> {
    this.calls.push("destroy");
    this.#loadedSpec = null;
    return {
      destroyed: true,
      diagnostics: []
    };
  }

  on(_event: "error" | "warning" | "stats", _listener: AdapterEventListener): Unsubscribe {
    return () => undefined;
  }
}

describe("snapshot smoke lifecycle", () => {
  it.each([
    ["basic-geojson", basicGeoJson],
    ["vector-tile-url", vectorTileUrl],
    ["fill-extrusion-lite", fillExtrusionLite]
  ])("loads, snapshots, exports %s, destroys, and validates a SnapshotReport", async (_name, fixture) => {
    const adapter = new SnapshotSmokeAdapter();
    const spec = fixture as MapSpec;
    const runtime = await MapRuntime.create(spec, {
      adapter,
      container: {} as HTMLElement
    });

    const snapshot = await runtime.snapshot({ width: 256, height: 160, format: "data-url" });
    const exportedSpec = runtime.exportSpec();
    adapter.calls.push("exportSpec");
    const resourceReport = await runtime.destroy();

    const diagnostics: Diagnostic[] = [...snapshot.diagnostics, ...resourceReport.diagnostics];
    const specReport: SnapshotReport["spec"] = {
      sourceCount: Object.keys(exportedSpec.sources).length,
      layerCount: exportedSpec.layers.length
    };
    if (exportedSpec.id !== undefined) specReport.id = exportedSpec.id;
    if (exportedSpec.revision !== undefined) specReport.revision = exportedSpec.revision;

    const snapshotReport: NonNullable<SnapshotReport["snapshot"]> = {
      passed: snapshot.passed,
      format: "data-url",
      width: 256,
      height: 160
    };
    if (snapshot.dataUrl !== undefined) {
      snapshotReport.dataUrlPrefix = snapshot.dataUrl.slice(0, "data:image/png;base64,".length);
      snapshotReport.byteLength = snapshot.dataUrl.length;
    }

    const report: SnapshotReport = {
      kind: "SnapshotReport",
      version: "0.1",
      suite: "snapshot.smoke",
      renderer: adapter.id,
      status: snapshot.passed && resourceReport.destroyed ? "passed" : "failed",
      passed: snapshot.passed && resourceReport.destroyed,
      skipped: false,
      lifecycle: {
        loaded: adapter.calls.includes("load"),
        snapshotted: adapter.calls.includes("snapshot"),
        exported: adapter.calls.includes("exportSpec"),
        destroyed: adapter.calls.includes("destroy")
      },
      spec: specReport,
      snapshot: snapshotReport,
      diagnostics,
      consoleErrors: [],
      artifacts: {
        reportJson: "attached:snapshot-report.json"
      }
    };

    assertSnapshotReport(report);
    expect(report.status).toBe("passed");
    expect(report.lifecycle).toEqual({
      loaded: true,
      snapshotted: true,
      exported: true,
      destroyed: true
    });
    expect(adapter.calls).toEqual(["load", "snapshot", "exportSpec", "destroy"]);
    expect(exportedSpec).toEqual(spec);
  });
});
