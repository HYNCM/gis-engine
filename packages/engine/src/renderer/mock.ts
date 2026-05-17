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
import { DiagnosticCodes } from "../diagnostics/codes.js";
import { applyJsonPatch } from "../spec/patch/index.js";
import { validateSpec } from "../spec/validate.js";
import { queryInlineGeoJsonFeatures } from "./queryGeoJson.js";
import type { RendererAdapter, RenderContext, AdapterApplyResult, AdapterEventListener, Unsubscribe } from "./adapter.js";

export class MockAdapter implements RendererAdapter {
  readonly id = "mock";
  readonly version = "0.1.0";
  #spec: MapSpec | null = null;
  #listeners = new Map<string, Set<AdapterEventListener>>();

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: "mock",
      dimensions: ["2d"],
      sources: ["geojson", "raster", "pmtiles", "vector"],
      layers: ["background", "raster", "fill", "line", "circle", "symbol-lite"],
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
    const diagnostics: Diagnostic[] = [];
    if (!this.#spec) {
      return {
        diagnostics: [
          {
            severity: "error",
            code: DiagnosticCodes.RenderAdapterError,
            message: "MockAdapter must load a MapSpec before applying patches."
          }
        ]
      };
    }

    try {
      const nextSpec = applyJsonPatch(this.#spec, patch);
      const validation = validateSpec(nextSpec);
      if (!validation.valid) return { diagnostics: validation.diagnostics };
      this.#spec = nextSpec;
      return { diagnostics };
    } catch (error) {
      return {
        diagnostics: [
          {
            severity: "error",
            code: DiagnosticCodes.CommandInvalidPatch,
            message: error instanceof Error ? error.message : "Failed to apply patch in MockAdapter."
          }
        ]
      };
    }
  }

  async queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    return queryInlineGeoJsonFeatures(this.#spec, options, this.id);
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

  exportSpec(): MapSpec | null {
    return this.#spec ? structuredClone(this.#spec) : null;
  }
}
