import type {
  CapabilityReport,
  FeatureQueryResult,
  JsonPatchOperation,
  MapSpec,
  QueryFeaturesOptions,
  ResourceReport,
  SnapshotOptions,
  SnapshotResult,
} from "../types.js";

export interface RenderContext {
  container: HTMLElement;
  signal?: AbortSignal;
}

export interface AdapterApplyResult {
  diagnostics: import("../types.js").Diagnostic[];
}

export type AdapterEventListener = (event: unknown) => void;
export type Unsubscribe = () => void;

/**
 * All event types emitted by renderer adapters.
 *
 * Diagnostic events: `"error"`, `"warning"`, `"stats"`
 * Map interaction / lifecycle events: `"click"`, `"mousemove"`, `"moveend"`,
 * `"zoomend"`, `"data"`, `"idle"`, `"load"`
 * Interaction state change: `"interaction"` — fired when InteractionSpec is applied.
 */
export type AdapterEvent =
  | "error"
  | "warning"
  | "stats"
  | "click"
  | "mousemove"
  | "moveend"
  | "zoomend"
  | "data"
  | "idle"
  | "load"
  | "interaction";

export interface RendererAdapter {
  readonly id: string;
  readonly version: string;
  getCapabilities(): Promise<CapabilityReport>;
  load(spec: MapSpec, context: RenderContext): Promise<void>;
  applyPatch(patch: JsonPatchOperation[], context: RenderContext): Promise<AdapterApplyResult>;
  queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult>;
  snapshot(options: SnapshotOptions): Promise<SnapshotResult>;
  resize(size: { width: number; height: number }): void;
  destroy(): Promise<ResourceReport>;
  on(event: AdapterEvent, listener: AdapterEventListener): Unsubscribe;
  /**
   * Escape-hatch accessor for the underlying renderer instance
   * (e.g. `maplibregl.Map`). Returns `null` when the adapter has no live
   * renderer (headless mode, mock adapter, or before `load()` is called).
   */
  getMapInstance?(): unknown;
}
