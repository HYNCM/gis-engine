import type {
  CapabilityReport,
  FeatureQueryResult,
  JsonPatchOperation,
  QueryFeaturesOptions,
  ResourceReport,
  SnapshotOptions,
  SnapshotResult,
  MapSpec,
  Diagnostic
} from "../types.js";
import type { RendererAdapter, RenderContext, AdapterApplyResult, AdapterEventListener, Unsubscribe } from "./adapter.js";

export class MockAdapter implements RendererAdapter {
  readonly id = "mock";
  readonly version = "0.1.0";
  #spec: MapSpec | null = null;
  #listeners = new Map<string, Set<AdapterEventListener>>();

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: "mock",
      dimensions: ["2d", "2_5d", "3d"],
      sources: ["geojson", "raster", "pmtiles"],
      layers: ["background", "raster", "fill", "line", "circle", "symbol-lite", "fill-extrusion-lite"],
      expressions: ["get", "step", "interpolate"],
      queries: ["point", "bbox"],
      snapshot: {
        supported: true,
        formats: ["png", "data-url"]
      },
      experimental: []
    };
  }

  async load(spec: MapSpec, _context: RenderContext): Promise<void> {
    this.#spec = structuredClone(spec);
  }

  async applyPatch(patch: JsonPatchOperation[], _context: RenderContext): Promise<AdapterApplyResult> {
    // In a real mock, we might want to actually apply the patch to #spec
    // but for now, we just return success.
    const diagnostics: Diagnostic[] = [];
    
    for (const op of patch) {
      if (op.path.startsWith("/layers/") && op.op === "add") {
        const value = op.value as any;
        if (value && value.type === "fill" && !value.source) {
          diagnostics.push({
            severity: "error",
            code: "MOCK.MISSING_SOURCE" as any,
            message: `Layer "${value.id}" of type "fill" must have a source.`,
            path: op.path
          });
        }
      }
    }

    return { diagnostics };
  }

  async queryFeatures(_options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    return {
      features: [],
      diagnostics: []
    };
  }

  async snapshot(_options: SnapshotOptions): Promise<SnapshotResult> {
    return {
      passed: true,
      diagnostics: [],
      dataUrl: "data:image/png;base64,mock"
    };
  }

  resize(_size: { width: number; height: number }): void {}

  async destroy(): Promise<ResourceReport> {
    return {
      destroyed: true,
      diagnostics: []
    };
  }

  on(event: string, listener: AdapterEventListener): Unsubscribe {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event)!.add(listener);
    return () => this.#listeners.get(event)?.delete(listener);
  }
}
