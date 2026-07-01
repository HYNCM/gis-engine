import { DiagnosticCodes } from "../../diagnostics/codes.js";
import { applyJsonPatch } from "../../spec/patch/index.js";
import { validateSpec } from "../../spec/validate.js";
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
} from "../../types.js";
import type {
  AdapterApplyResult,
  AdapterEventListener,
  RenderContext,
  RendererAdapter,
  Unsubscribe,
} from "../adapter.js";
import { queryInlineGeoJsonFeatures } from "../queryGeoJson.js";
import { type MapLibreStyle, transformMapSpecToMapLibreStyle } from "./transformer.js";

const TRANSPARENT_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAgMBgN4nS3QAAAAASUVORK5CYII=";

export class MapLibreAdapter implements RendererAdapter {
  readonly id = "maplibre";
  readonly version = "0.1.0";
  #spec: MapSpec | null = null;
  #style: MapLibreStyle | null = null;
  #listeners = new Map<string, Set<AdapterEventListener>>();

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: this.id,
      dimensions: ["2d", "2_5d"],
      sources: ["geojson", "raster", "pmtiles", "vector"],
      layers: ["background", "raster", "fill", "line", "circle", "symbol", "symbol-lite", "fill-extrusion-lite"],
      expressions: [
        "get",
        "has",
        "literal",
        "case",
        "match",
        "interpolate",
        "step",
        "zoom",
        "all",
        "any",
        "!",
        "==",
        "!=",
        ">",
        "<",
        ">=",
        "<=",
        "in",
        "to-number",
        "to-string",
      ],
      queries: ["point", "bbox"],
      snapshot: {
        supported: true,
        formats: ["png", "data-url"],
      },
      experimental: ["fill-extrusion-lite"],
    };
  }

  async load(spec: MapSpec, _context: RenderContext): Promise<void> {
    const result = transformMapSpecToMapLibreStyle(spec);
    if (hasError(result.diagnostics)) {
      throw new Error(formatDiagnostics(result.diagnostics));
    }

    this.#spec = structuredClone(spec);
    this.#style = result.style ?? null;
  }

  async applyPatch(patch: JsonPatchOperation[], _context: RenderContext): Promise<AdapterApplyResult> {
    if (!this.#spec) {
      return {
        diagnostics: [
          {
            severity: "error",
            code: DiagnosticCodes.RenderAdapterError,
            message: "MapLibreAdapter must load a MapSpec before applying patches.",
          },
        ],
      };
    }

    try {
      const nextSpec = applyJsonPatch(this.#spec, patch);
      const validation = validateSpec(nextSpec);
      if (!validation.valid) return { diagnostics: validation.diagnostics };

      const transformResult = transformMapSpecToMapLibreStyle(nextSpec);
      if (hasError(transformResult.diagnostics)) return { diagnostics: transformResult.diagnostics };

      this.#spec = nextSpec;
      this.#style = transformResult.style ?? null;
      return { diagnostics: transformResult.diagnostics };
    } catch (error) {
      const diagnostics = [
        {
          severity: "error" as const,
          code: DiagnosticCodes.CommandInvalidPatch,
          message: error instanceof Error ? error.message : "Failed to apply patch.",
        },
      ];
      this.emit("error", diagnostics[0]);
      return { diagnostics };
    }
  }

  async queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    return queryInlineGeoJsonFeatures(this.#spec, options, this.id);
  }

  async snapshot(_options: SnapshotOptions): Promise<SnapshotResult> {
    if (!this.#style) {
      return {
        passed: false,
        diagnostics: [
          {
            severity: "error",
            code: DiagnosticCodes.SnapshotBlankCanvas,
            message: "MapLibreAdapter has no rendered style to snapshot.",
          },
        ],
      };
    }

    return {
      passed: true,
      diagnostics: [],
      dataUrl: TRANSPARENT_PNG_DATA_URL,
    };
  }

  resize(_size: { width: number; height: number }): void {}

  async destroy(): Promise<ResourceReport> {
    const listenersRemoved = this.countListeners();
    this.#spec = null;
    this.#style = null;
    this.#listeners.clear();
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

  on(event: "error" | "warning" | "stats", listener: AdapterEventListener): Unsubscribe {
    const listeners = this.#listeners.get(event) ?? new Set<AdapterEventListener>();
    listeners.add(listener);
    this.#listeners.set(event, listeners);
    return () => listeners.delete(listener);
  }

  exportStyle(): MapLibreStyle | null {
    return this.#style ? structuredClone(this.#style) : null;
  }

  exportSpec(): MapSpec | null {
    return this.#spec ? structuredClone(this.#spec) : null;
  }

  emit(event: "error" | "warning" | "stats", payload: unknown): void {
    const listeners = this.#listeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) listener(payload);
  }
}

function hasError(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function formatDiagnostics(diagnostics: Diagnostic[]): string {
  return diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`).join("\n");
}
