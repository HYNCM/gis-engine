import { DiagnosticCodes } from "../diagnostics/codes.js";
import { applyJsonPatch } from "../spec/patch/index.js";
import { validateSpec } from "../spec/validate.js";
import type {
  CapabilityReport,
  Diagnostic,
  FeatureQueryResult,
  JsonPatchOperation,
  MapSpec,
  QueryFeaturesOptions,
  ResourceReport,
  SnapshotOptions,
  SnapshotResult,
} from "../types.js";
import type {
  AdapterApplyResult,
  AdapterEvent,
  AdapterEventListener,
  RenderContext,
  RendererAdapter,
  Unsubscribe,
} from "./adapter.js";
import { queryInlineGeoJsonFeatures } from "./queryGeoJson.js";

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
        formats: ["png", "data-url"],
      },
      experimental: [],
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
            message: "MockAdapter must load a MapSpec before applying patches.",
          },
        ],
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
            message: error instanceof Error ? error.message : "Failed to apply patch in MockAdapter.",
          },
        ],
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
      dataUrl: "data:image/png;base64,mock",
    };
  }

  resize(_size: { width: number; height: number }): void {}

  async destroy(): Promise<ResourceReport> {
    const listenersRemoved = this.countListeners();
    this.#listeners.clear();
    this.#spec = null;
    return {
      destroyed: true,
      diagnostics: [],
      resources: {
        listenersRemoved,
        verifiable: true,
      },
    };
  }

  private countListeners(): number {
    let count = 0;
    for (const set of this.#listeners.values()) count += set.size;
    return count;
  }

  on(event: AdapterEvent, listener: AdapterEventListener): Unsubscribe {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event)?.add(listener);
    return () => this.#listeners.get(event)?.delete(listener);
  }

  exportSpec(): MapSpec | null {
    return this.#spec ? structuredClone(this.#spec) : null;
  }

  getMapInstance(): null {
    return null;
  }
}
