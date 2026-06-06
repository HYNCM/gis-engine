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
  on(event: "error" | "warning" | "stats", listener: AdapterEventListener): Unsubscribe;
}
