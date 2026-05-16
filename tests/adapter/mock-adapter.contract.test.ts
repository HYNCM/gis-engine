import { createAdapterContractSuite } from "./createAdapterContractSuite.js";
import type {
  CapabilityReport,
  FeatureQueryResult,
  JsonPatchOperation,
  QueryFeaturesOptions,
  ResourceReport,
  SnapshotOptions,
  SnapshotResult,
  AdapterApplyResult,
  AdapterEventListener,
  RenderContext,
  RendererAdapter,
  Unsubscribe,
  MapSpec
} from "@gis-engine/engine";

class MockAdapter implements RendererAdapter {
  readonly id = "mock";
  readonly version = "0.1.0";

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: this.id,
      dimensions: ["2d"],
      sources: ["geojson"],
      layers: ["background", "circle"],
      expressions: ["get", "literal"],
      queries: ["point", "bbox"],
      snapshot: {
        supported: true,
        formats: ["data-url"]
      },
      experimental: []
    };
  }

  async load(_spec: MapSpec, _context: RenderContext): Promise<void> {
    return undefined;
  }

  async applyPatch(_patch: JsonPatchOperation[], _context: RenderContext): Promise<AdapterApplyResult> {
    return { diagnostics: [] };
  }

  async queryFeatures(_options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    return { features: [], diagnostics: [] };
  }

  async snapshot(_options: SnapshotOptions): Promise<SnapshotResult> {
    return { passed: true, diagnostics: [], dataUrl: "data:image/png;base64," };
  }

  resize(_size: { width: number; height: number }): void {
    return undefined;
  }

  async destroy(): Promise<ResourceReport> {
    return { destroyed: true, diagnostics: [], resources: { verifiable: false, reason: "mock adapter" } };
  }

  on(_event: "error" | "warning" | "stats", _listener: AdapterEventListener): Unsubscribe {
    return () => undefined;
  }
}

createAdapterContractSuite("mock", () => new MockAdapter());
