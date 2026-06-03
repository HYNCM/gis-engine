# Custom Adapters

GIS Engine decouples the core command system from the rendering backend via
**Renderer Adapters**. The built-in adapters cover most use cases, but you can
register your own when you need a different rendering engine or a specialized
test harness.

## The `RendererAdapter` Interface

Every adapter — built-in or custom — implements this contract:

```typescript
import type { RendererAdapter } from "@gis-engine/engine";

interface RendererAdapter {
  readonly id: string;
  readonly version: string;

  getCapabilities(): Promise<CapabilityReport>;
  load(spec: MapSpec, context: RenderContext): Promise<void>;
  applyPatch(patch: JsonPatchOperation[], context: RenderContext): Promise<AdapterApplyResult>;
  queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult>;
  snapshot(options: SnapshotOptions): Promise<SnapshotResult>;
  resize(size: { width: number; height: number }): void;
  destroy(): Promise<ResourceReport>;
  on(event: "error" | "warning" | "stats", listener: AdapterEventListener): Unsubscribe;
}
```

| Method | Purpose |
|---|---|
| `getCapabilities` | Declare supported sources, layers, expressions, queries |
| `load` | Initialize the renderer with a `MapSpec` |
| `applyPatch` | Apply JSON Patch operations to the rendered state |
| `queryFeatures` | Execute point or bbox spatial queries |
| `snapshot` | Capture the current rendered state as an image |
| `destroy` | Clean up renderer resources; return a `ResourceReport` |

## Built-in Adapters

Two adapters ship with `@gis-engine/engine`:

| Adapter | ID | Use Case |
|---|---|---|
| `MapLibreAdapter` | `"maplibre"` | Production maps with MapLibre GL JS |
| `MockAdapter` | `"mock"` | Headless testing, CI, evidence generation |

```typescript
import { createAdapter, listAdapters } from "@gis-engine/engine";

console.log(listAdapters());  // ["maplibre", "mock"]

const adapter = createAdapter("mock");
```

## Registering a Custom Adapter

Use `registerAdapter(id, factory)` to add your own adapter to the registry.
The factory is a zero-argument function that returns a new `RendererAdapter`
instance.

```typescript
import { registerAdapter, createAdapter, type RendererAdapterFactory } from "@gis-engine/engine";

const factory: RendererAdapterFactory = () => new MyCustomAdapter();
registerAdapter("my-renderer", factory);

// Later, use it like any built-in adapter
const adapter = createAdapter("my-renderer");
```

## `RendererAdapterFactory`

```typescript
type RendererAdapterFactory = () => RendererAdapter;
```

The factory pattern ensures each `createAdapter` call returns a fresh instance
with no shared state. This is critical for concurrent evidence bundle generation
where multiple adapters run in parallel.

## Minimal Custom Adapter Example

```typescript
import type {
  RendererAdapter, RenderContext, AdapterApplyResult,
  AdapterEventListener, Unsubscribe, CapabilityReport,
  FeatureQueryResult, JsonPatchOperation, QueryFeaturesOptions,
  ResourceReport, SnapshotOptions, SnapshotResult, MapSpec
} from "@gis-engine/engine";

export class MinimalAdapter implements RendererAdapter {
  readonly id = "minimal";
  readonly version = "0.1.0";
  #spec: MapSpec | null = null;

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: "minimal",
      dimensions: ["2d"],
      sources: ["geojson"],
      layers: ["circle", "fill", "line"],
      expressions: [],
      queries: ["point"],
      snapshot: { supported: false, formats: [] },
      experimental: []
    };
  }

  async load(spec: MapSpec, _context: RenderContext): Promise<void> {
    this.#spec = structuredClone(spec);
  }

  async applyPatch(
    patch: JsonPatchOperation[],
    _context: RenderContext
  ): Promise<AdapterApplyResult> {
    // Apply patch to internal state
    return { diagnostics: [] };
  }

  async queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    return { features: [], diagnostics: [] };
  }

  async snapshot(_options: SnapshotOptions): Promise<SnapshotResult> {
    return { passed: false, diagnostics: [], dataUrl: "" };
  }

  resize(_size: { width: number; height: number }): void {}

  async destroy(): Promise<ResourceReport> {
    this.#spec = null;
    return { destroyed: true, diagnostics: [] };
  }

  on(_event: string, _listener: AdapterEventListener): Unsubscribe {
    return () => {};
  }
}
```

Register and use it:

```typescript
import { registerAdapter } from "@gis-engine/engine";

registerAdapter("minimal", () => new MinimalAdapter());
```

## When to Use Custom Adapters

| Scenario | Recommended Adapter |
|---|---|
| Production browser maps | `MapLibreAdapter` (built-in) |
| CI, headless tests, evidence bundles | `MockAdapter` (built-in) |
| Alternative renderer (e.g. Deck.gl, Cesium) | Custom adapter |
| Simulated rendering for load tests | Custom adapter |
| Server-side image generation | Custom adapter with real snapshot |

Custom adapters are most useful when you need to integrate GIS Engine with a
rendering backend that is not MapLibre, or when you need fine-grained control
over snapshot and query behavior for specialized testing scenarios.

## Related

- [Core Concepts](/guide/core-concepts) — adapter boundary principle
- [Snapshot Testing](/guide/snapshot-testing) — using `MockAdapter` for tests
- [Engine API Reference](/api/engine) — `createAdapter`, `registerAdapter`, `listAdapters`
