// Type-only imports — erased at compile time, safe even when maplibre-gl is absent.
import type { Map as MapLibreMap } from "maplibre-gl";
import { DiagnosticCodes } from "../../diagnostics/codes.js";
import { applyJsonPatch } from "../../spec/patch/index.js";
import { validateSpec } from "../../spec/validate.js";
import type {
  CapabilityReport,
  Diagnostic,
  FeatureQueryResult,
  InteractionSpec,
  JsonPatchOperation,
  JsonValue,
  MapSpec,
  QueryFeaturesOptions,
  ResourceReport,
  SnapshotOptions,
  SnapshotResult,
} from "../../types.js";
import type {
  AdapterApplyResult,
  AdapterEvent,
  AdapterEventListener,
  RenderContext,
  RendererAdapter,
  Unsubscribe,
} from "../adapter.js";
import { queryInlineGeoJsonFeatures } from "../queryGeoJson.js";
import { applyIncrementalPatch } from "./styleDiff.js";
import { type MapLibreStyle, transformMapSpecToMapLibreStyle } from "./transformer.js";

const TRANSPARENT_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAgMBgN4nS3QAAAAASUVORK5CYII=";

/**
 * Enriched interaction event payload emitted by the adapter.
 * Contains the original MapLibre event data plus resolved feature information.
 */
export interface InteractionBridgeEvent {
  type: "click" | "mousemove" | "moveend" | "zoomend" | "data";
  point?: { x: number; y: number };
  lngLat?: { lng: number; lat: number };
  features?: JsonValue[];
  center?: [number, number];
  zoom?: number;
  bounds?: { sw: [number, number]; ne: [number, number] };
  dataType?: string;
  sourceId?: string;
  originalEvent?: unknown;
}

/** MapLibre lifecycle events bridged through the adapter listener system.
 *  Click and mousemove are handled separately via #setupInteractionHandlers
 *  so that InteractionSpec toggles can gate feature queries. */
const BRIDGED_MAP_EVENTS: readonly string[] = ["moveend", "zoomend", "data", "idle", "load"] as const;

export class MapLibreAdapter implements RendererAdapter {
  readonly id = "maplibre";
  readonly version = "0.2.0";
  #spec: MapSpec | null = null;
  #style: MapLibreStyle | null = null;
  #listeners = new Map<string, Set<AdapterEventListener>>();

  /**
   * Live `maplibregl.Map` instance. `null` when maplibre-gl is unavailable
   * (SSR / Node.js / not installed) or before `load()` / after `destroy()`.
   */
  #map: MapLibreMap | null = null;

  /**
   * Individual MapLibre event handler references stored so they can be
   * removed in `destroy()`. Keyed by event name.
   */
  #mapEventHandlers = new Map<string, (event: unknown) => void>();

  /**
   * Separate handler references for interaction-specific handlers (click,
   * mousemove) that are gated by InteractionSpec toggles.
   */
  #interactionHandlers = new Map<string, (event: unknown) => void>();

  /** Current interaction toggles applied to the live map instance. */
  #interactions: InteractionSpec = {};

  /** Active MapLibre popup instance, if any. */
  #activePopup: import("maplibre-gl").Popup | null = null;

  /** Tracks the currently selected feature for feature-state cleanup. */
  #activeSelectState: { source: string; sourceLayer?: string; id: number | string } | null = null;

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      renderer: this.id,
      dimensions: ["2d", "2_5d"],
      sources: ["geojson", "raster", "pmtiles", "vector"],
      layers: [
        "background",
        "raster",
        "fill",
        "line",
        "circle",
        "symbol",
        "symbol-lite",
        "fill-extrusion-lite",
        "heatmap",
      ],
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

  async load(spec: MapSpec, context: RenderContext): Promise<void> {
    const result = transformMapSpecToMapLibreStyle(spec);
    if (hasError(result.diagnostics)) {
      throw new Error(formatDiagnostics(result.diagnostics));
    }

    this.#spec = structuredClone(spec);
    this.#style = result.style ?? null;

    // Attempt to instantiate a live maplibregl.Map when a real DOM container
    // is available and maplibre-gl can be dynamically imported.
    await this.#instantiateMap(context, result.style);
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

      // Update internal spec first (needed for both paths).
      this.#spec = nextSpec;

      // Try incremental MapLibre API calls — avoids expensive full setStyle.
      const incrementalOk = applyIncrementalPatch(this.#map, patch, nextSpec);

      if (!incrementalOk) {
        // Fallback: full style rebuild.
        const transformResult = transformMapSpecToMapLibreStyle(nextSpec);
        if (hasError(transformResult.diagnostics)) return { diagnostics: transformResult.diagnostics };
        this.#style = transformResult.style ?? null;

        if (this.#map && transformResult.style) {
          this.#map.setStyle(transformResult.style as never, { diff: false });
        }

        // Re-apply interactions after full rebuild (setStyle resets handlers).
        if (this.#map) {
          this.#applyInteractions(this.#map);
          this.#setupInteractionHandlers(this.#map);
        }

        return { diagnostics: transformResult.diagnostics };
      }

      // Incremental path succeeded — sync the cached style for export/snapshot.
      const transformResult = transformMapSpecToMapLibreStyle(nextSpec);
      this.#style = transformResult.style ?? this.#style;

      // Re-apply interactions if they were part of this patch.
      const hasInteractionChange = patch.some((op) => op.path.startsWith("/interactions"));
      if (hasInteractionChange && this.#map) {
        this.#applyInteractions(this.#map);
        this.#setupInteractionHandlers(this.#map);
      }

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
    // When a live map exists, use MapLibre's rendered feature query.
    if (this.#map) {
      return this.#queryRenderedFeatures(options);
    }
    // Fallback: inline GeoJSON query (headless / Node.js / no maplibre-gl).
    return queryInlineGeoJsonFeatures(this.#spec, options, this.id);
  }

  async snapshot(options: SnapshotOptions): Promise<SnapshotResult> {
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

    // When no live map exists (SSR / Node.js / headless), return the stub.
    if (!this.#map) {
      return {
        passed: true,
        diagnostics: [],
        dataUrl: TRANSPARENT_PNG_DATA_URL,
      };
    }

    return this.#captureCanvas(options);
  }

  resize(_size: { width: number; height: number }): void {
    this.#map?.resize();
  }

  async destroy(): Promise<ResourceReport> {
    const listenersRemoved = this.countListeners();

    // Remove MapLibre event listeners and destroy the map instance.
    this.#teardownMap();

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

  getMapInstance(): MapLibreMap | null {
    return this.#map;
  }

  private countListeners(): number {
    let count = 0;
    for (const set of this.#listeners.values()) count += set.size;
    return count;
  }

  on(event: AdapterEvent, listener: AdapterEventListener): Unsubscribe {
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

  emit(event: AdapterEvent, payload: unknown): void {
    const listeners = this.#listeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) listener(payload);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Dynamically import `maplibre-gl` and create a `maplibregl.Map` instance
   * inside the provided container. Falls back gracefully (emits a warning
   * diagnostic) when maplibre-gl is unavailable.
   */
  async #instantiateMap(context: RenderContext, style: MapLibreStyle | undefined): Promise<void> {
    // Already instantiated from a prior load() — tear down first.
    this.#teardownMap();

    // Guard: only attempt rendering in a browser-like environment.
    if (typeof HTMLElement === "undefined" || !(context.container instanceof HTMLElement)) {
      return;
    }

    let maplibregl: typeof import("maplibre-gl");
    try {
      maplibregl = await import("maplibre-gl");
    } catch {
      this.emit("warning", {
        severity: "warning",
        code: DiagnosticCodes.RenderAdapterError,
        message:
          "maplibre-gl could not be imported. The adapter is running in style-transform-only mode. " +
          "Install maplibre-gl ^5.0.0 || ^6.0.0 to enable live rendering.",
      });
      return;
    }

    const { center, zoom, bearing, pitch } = this.#spec?.view ?? {};

    try {
      const map = new maplibregl.Map({
        container: context.container,
        style: (style ?? { version: 8, sources: {}, layers: [] }) as never,
        center: center ?? [0, 0],
        zoom: zoom ?? 0,
        bearing: bearing ?? 0,
        pitch: pitch ?? 0,
      });

      this.#map = map;
      this.#bridgeMapEvents(map);
      this.#applyInteractions(map);
      this.#setupInteractionHandlers(map);
    } catch (error) {
      this.emit("error", {
        severity: "error",
        code: DiagnosticCodes.RenderAdapterError,
        message: error instanceof Error ? error.message : "Failed to instantiate maplibregl.Map.",
      });
    }
  }

  /**
   * Register MapLibre lifecycle event listeners that re-emit through the
   * adapter's listener system so consumers can subscribe via `adapter.on(...)`.
   * Click and mousemove are registered separately via #setupInteractionHandlers.
   */
  #bridgeMapEvents(map: MapLibreMap): void {
    for (const eventName of BRIDGED_MAP_EVENTS) {
      let handler: (event: unknown) => void;

      if (eventName === "moveend") {
        handler = (event: unknown) => this.#handleMoveEnd(event);
      } else if (eventName === "zoomend") {
        handler = (event: unknown) => this.#handleZoomEnd(event);
      } else if (eventName === "data") {
        handler = (event: unknown) => this.#handleDataEvent(event);
      } else {
        // idle, load — simple pass-through.
        handler = (event: unknown) => this.emit(eventName as AdapterEvent, event);
      }

      this.#mapEventHandlers.set(eventName, handler);
      map.on(eventName as Parameters<MapLibreMap["on"]>[0], handler as never);
    }
  }

  /**
   * Remove all MapLibre event listeners, clean up interaction state (popup,
   * feature selection), and destroy the map instance, releasing WebGL resources.
   */
  #teardownMap(): void {
    if (!this.#map) return;

    // Remove bridged lifecycle event listeners.
    for (const [eventName, handler] of this.#mapEventHandlers) {
      this.#map.off(eventName as Parameters<MapLibreMap["off"]>[0], handler as never);
    }
    this.#mapEventHandlers.clear();

    // Remove interaction-specific event listeners.
    for (const [eventName, handler] of this.#interactionHandlers) {
      this.#map.off(eventName as Parameters<MapLibreMap["off"]>[0], handler as never);
    }
    this.#interactionHandlers.clear();

    // Clear active feature selection state.
    this.#clearSelectState();

    // Remove active popup.
    if (this.#activePopup) {
      try {
        this.#activePopup.remove();
      } catch {
        // Popup may already be removed.
      }
      this.#activePopup = null;
    }

    this.#map.remove();
    this.#map = null;
  }

  // ---------------------------------------------------------------------------
  // Enriched event bridging helpers
  // ---------------------------------------------------------------------------

  /**
   * Emit a `moveend` event enriched with the current center, zoom, and bounds.
   */
  #handleMoveEnd(_raw: unknown): void {
    const map = this.#map;
    if (!map) return;
    const center = map.getCenter();
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    this.emit("moveend", {
      type: "moveend",
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      bounds: {
        sw: [sw.lng, sw.lat],
        ne: [ne.lng, ne.lat],
      },
    } satisfies InteractionBridgeEvent);
  }

  /**
   * Emit a `zoomend` event enriched with the current zoom level.
   */
  #handleZoomEnd(_raw: unknown): void {
    const map = this.#map;
    if (!map) return;
    this.emit("zoomend", {
      type: "zoomend",
      zoom: map.getZoom(),
    } satisfies InteractionBridgeEvent);
  }

  /**
   * Emit a `data` event enriched with the data type and source identifier.
   */
  #handleDataEvent(raw: unknown): void {
    const event = raw as { dataType?: unknown; sourceId?: unknown } | undefined;
    const payload: InteractionBridgeEvent = { type: "data" };
    if (typeof event?.dataType === "string") payload.dataType = event.dataType;
    if (typeof event?.sourceId === "string") payload.sourceId = event.sourceId;
    this.emit("data", payload);
  }

  // ---------------------------------------------------------------------------
  // Interaction-specific handlers (gated by InteractionSpec)
  // ---------------------------------------------------------------------------

  /**
   * Handle map click: query rendered features at the click point and emit a
   * `click` event enriched with feature data. When `select` is enabled, set
   * feature-state on the clicked feature. When `popup` is enabled, show a
   * MapLibre Popup with the feature properties.
   */
  #handleClick(raw: unknown): void {
    const map = this.#map;
    if (!map) return;
    const event = raw as { point?: unknown; lngLat?: unknown };
    const interactions = this.#interactions;

    let features: JsonValue[] | undefined;

    if (interactions.click !== false && event.point !== undefined) {
      try {
        const rendered = map.queryRenderedFeatures(event.point as never);
        features = rendered.map((f) => structuredClone(f.toJSON?.() ?? f) as JsonValue);
      } catch {
        // Feature query not available at this point.
      }
    }

    this.emit("click", {
      type: "click",
      point: (event.point as { x: number; y: number } | undefined) ?? undefined,
      lngLat: (event.lngLat as { lng: number; lat: number } | undefined) ?? undefined,
      features,
      originalEvent: raw,
    } as InteractionBridgeEvent);

    // Feature selection via setFeatureState.
    if (interactions.select !== false && features && features.length > 0) {
      const first = features[0] as {
        id?: number | string;
        source?: string;
        sourceLayer?: string;
      };
      if (first?.id !== undefined && first?.source) {
        // Clear previous selection.
        this.#clearSelectState();
        const featureState: { source: string; sourceLayer?: string; id: number | string } = {
          source: first.source,
          id: first.id,
        };
        if (first.sourceLayer) featureState.sourceLayer = first.sourceLayer;
        map.setFeatureState(featureState as never, { selected: true });
        this.#activeSelectState = featureState;
      }
    }

    // Popup with feature properties.
    if (interactions.popup !== false && features && features.length > 0) {
      const first = features[0] as { properties?: Record<string, unknown> };
      const lngLat = event.lngLat as { lng: number; lat: number } | undefined;
      if (first?.properties && lngLat) {
        this.#showPopup(lngLat, first.properties);
      }
    }
  }

  /**
   * Handle mouse movement: query the rendered feature under the cursor and
   * emit a `mousemove` event enriched with the topmost feature data.
   */
  #handleMouseMove(raw: unknown): void {
    const map = this.#map;
    if (!map) return;
    const event = raw as { point?: unknown; lngLat?: unknown };

    let features: JsonValue[] | undefined;
    if (event.point !== undefined) {
      try {
        const rendered = map.queryRenderedFeatures(event.point as never);
        if (rendered.length > 0 && rendered[0]) {
          features = [structuredClone(rendered[0].toJSON?.() ?? rendered[0]) as JsonValue];
        }
      } catch {
        // Feature query not available.
      }
    }

    this.emit("mousemove", {
      type: "mousemove",
      point: (event.point as { x: number; y: number } | undefined) ?? undefined,
      lngLat: (event.lngLat as { lng: number; lat: number } | undefined) ?? undefined,
      features,
      originalEvent: raw,
    } as InteractionBridgeEvent);
  }

  // ---------------------------------------------------------------------------
  // InteractionSpec application
  // ---------------------------------------------------------------------------

  /**
   * Apply InteractionSpec toggles to the live MapLibre map instance.
   * Reads the spec's `interactions` field and enables/disables the
   * corresponding MapLibre handlers. Defaults to enabled (true) when a
   * toggle is not specified.
   */
  #applyInteractions(map: MapLibreMap): void {
    const interactions = this.#spec?.interactions ?? {};
    this.#interactions = interactions;

    // Pan toggle.
    if (interactions.pan === false) {
      map.dragPan.disable();
      try {
        (map as unknown as { touchPanInertia?: { disable(): void } }).touchPanInertia?.disable();
      } catch {
        // touchPanInertia may not be available in all MapLibre versions.
      }
    } else {
      map.dragPan.enable();
    }

    // Zoom toggle.
    if (interactions.zoom === false) {
      map.scrollZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    } else {
      map.scrollZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
    }

    this.emit("interaction", { interactions: structuredClone(this.#interactions) });
  }

  /**
   * Register or unregister click and mousemove handlers on the live map
   * based on the current InteractionSpec toggles. Removes any previously
   * registered interaction handlers before applying new ones.
   */
  #setupInteractionHandlers(map: MapLibreMap): void {
    // Remove previously registered interaction handlers.
    for (const [eventName, handler] of this.#interactionHandlers) {
      map.off(eventName as Parameters<MapLibreMap["off"]>[0], handler as never);
    }
    this.#interactionHandlers.clear();

    const interactions = this.#interactions;

    // Click handler: registered when click, select, or popup is enabled.
    const needsClick = interactions.click !== false || interactions.select !== false || interactions.popup !== false;
    if (needsClick) {
      const clickHandler = (event: unknown) => this.#handleClick(event);
      this.#interactionHandlers.set("click", clickHandler);
      map.on("click" as Parameters<MapLibreMap["on"]>[0], clickHandler as never);
    }

    // Mousemove handler: registered only when hover is enabled.
    if (interactions.hover !== false) {
      const mousemoveHandler = (event: unknown) => this.#handleMouseMove(event);
      this.#interactionHandlers.set("mousemove", mousemoveHandler);
      map.on("mousemove" as Parameters<MapLibreMap["on"]>[0], mousemoveHandler as never);
    }
  }

  /**
   * Clear the currently selected feature state on the map, if any.
   */
  #clearSelectState(): void {
    if (this.#activeSelectState && this.#map) {
      try {
        this.#map.removeFeatureState(this.#activeSelectState as never);
      } catch {
        // Feature may have been removed from the source.
      }
      this.#activeSelectState = null;
    }
  }

  /**
   * Show a MapLibre Popup at the given coordinates with the feature
   * properties formatted as an HTML definition list.
   */
  async #showPopup(lngLat: { lng: number; lat: number }, properties: Record<string, unknown>): Promise<void> {
    if (!this.#map) return;

    // Remove any existing popup first.
    if (this.#activePopup) {
      try {
        this.#activePopup.remove();
      } catch {
        // Already removed.
      }
      this.#activePopup = null;
    }

    let maplibregl: typeof import("maplibre-gl");
    try {
      maplibregl = await import("maplibre-gl");
    } catch {
      return; // Cannot create popup without maplibre-gl.
    }

    const html = Object.entries(properties)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(value))}</dd>`)
      .join("");

    if (!html) return;

    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
      .setLngLat([lngLat.lng, lngLat.lat])
      .setHTML(`<dl style="margin:0;padding:4px 0;font-size:12px;">${html}</dl>`)
      .addTo(this.#map);

    this.#activePopup = popup;
  }

  /**
   * Query rendered features via MapLibre's `queryRenderedFeatures()` API.
   * Falls back to inline GeoJSON query when the map has no rendered features
   * or the query fails.
   */
  #queryRenderedFeatures(options: QueryFeaturesOptions): FeatureQueryResult {
    if (!this.#map) {
      return queryInlineGeoJsonFeatures(this.#spec, options, this.id);
    }

    const diagnostics: Diagnostic[] = [];
    try {
      const queryArgs: Parameters<MapLibreMap["queryRenderedFeatures"]> = [];

      // Build geometry filter from point or bbox.
      if (options.point) {
        const pixel = this.#map.project(options.point as [number, number]);
        queryArgs[0] = pixel as never;
      } else if (options.bbox) {
        const sw = this.#map.project([options.bbox[0], options.bbox[1]]) as never;
        const ne = this.#map.project([options.bbox[2], options.bbox[3]]) as never;
        queryArgs[0] = [sw, ne] as never;
      }

      if (options.layers && options.layers.length > 0) {
        queryArgs[1] = { layers: options.layers };
      }

      const rendered = this.#map.queryRenderedFeatures(...queryArgs);
      const features: JsonValue[] = rendered.map((f) => structuredClone(f.toJSON?.() ?? f) as JsonValue);

      return { features, diagnostics };
    } catch (error) {
      diagnostics.push({
        severity: "warning",
        code: DiagnosticCodes.RenderAdapterError,
        message: error instanceof Error ? error.message : "queryRenderedFeatures failed, falling back to inline query.",
      });
      const fallback = queryInlineGeoJsonFeatures(this.#spec, options, this.id);
      return { features: fallback.features, diagnostics: [...diagnostics, ...fallback.diagnostics] };
    }
  }
  /**
   * Capture the live MapLibre canvas as a data-URL snapshot.
   *
   * 1. Optionally resize the map to requested dimensions.
   * 2. Wait for the `idle` event (tiles loaded, style applied) with a timeout.
   * 3. Read the canvas via `toDataURL`.
   * 4. Restore original dimensions if they were changed.
   */
  async #captureCanvas(options: SnapshotOptions): Promise<SnapshotResult> {
    // biome-ignore lint/style/noNonNullAssertion: #map is guaranteed to be initialized before snapshot capture
    const map = this.#map!;
    const IDLE_TIMEOUT_MS = 10_000;

    // --- Optional resize -------------------------------------------------------
    const originalContainer = map.getContainer();
    const originalWidth = originalContainer.clientWidth;
    const originalHeight = originalContainer.clientHeight;
    let resized = false;

    if (options.width && options.height) {
      const style = originalContainer.style;
      style.width = `${options.width}px`;
      style.height = `${options.height}px`;
      map.resize();
      resized = true;
    }

    // --- Wait for idle ---------------------------------------------------------
    try {
      await this.#waitForIdle(map, IDLE_TIMEOUT_MS);
    } catch {
      // Timeout: restore size and return diagnostic.
      if (resized) {
        const style = originalContainer.style;
        style.width = `${originalWidth}px`;
        style.height = `${originalHeight}px`;
        map.resize();
      }
      return {
        passed: false,
        diagnostics: [
          {
            severity: "warning",
            code: DiagnosticCodes.SnapshotBlankCanvas,
            message: `Map did not reach idle state within ${IDLE_TIMEOUT_MS}ms. Canvas may be blank or incomplete.`,
          },
        ],
      };
    }

    // --- Capture ---------------------------------------------------------------
    const diagnostics: Diagnostic[] = [];
    let dataUrl: string;

    try {
      const canvas = map.getCanvas();

      // Detect blank canvas (WebGL context lost or zero-size).
      if (canvas.width === 0 || canvas.height === 0) {
        if (resized) {
          const style = originalContainer.style;
          style.width = `${originalWidth}px`;
          style.height = `${originalHeight}px`;
          map.resize();
        }
        return {
          passed: false,
          diagnostics: [
            {
              severity: "error",
              code: DiagnosticCodes.SnapshotBlankCanvas,
              message: "Map canvas has zero dimensions; WebGL context may be lost.",
            },
          ],
        };
      }

      const mimeType = options.format === "jpeg" ? "image/jpeg" : "image/png";
      dataUrl = canvas.toDataURL(mimeType);
    } catch (error) {
      if (resized) {
        const style = originalContainer.style;
        style.width = `${originalWidth}px`;
        style.height = `${originalHeight}px`;
        map.resize();
      }
      return {
        passed: false,
        diagnostics: [
          {
            severity: "error",
            code: DiagnosticCodes.SnapshotBlankCanvas,
            message: error instanceof Error ? error.message : "Failed to capture canvas toDataURL.",
          },
        ],
      };
    }

    // --- Restore original size -------------------------------------------------
    if (resized) {
      const style = originalContainer.style;
      style.width = `${originalWidth}px`;
      style.height = `${originalHeight}px`;
      map.resize();
    }

    return { passed: true, diagnostics, dataUrl };
  }

  /**
   * Resolve when the map fires its next `idle` event, or reject after the
   * given timeout.
   */
  #waitForIdle(map: MapLibreMap, timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // If the map has already finished loading and is idle, resolve immediately.
      if (map.loaded() && map.isMoving() === false) {
        resolve();
        return;
      }

      let settled = false;
      const onIdle = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        map.off("idle" as Parameters<MapLibreMap["off"]>[0], onIdle as never);
        reject(new Error("idle timeout"));
      }, timeoutMs);

      map.on("idle" as Parameters<MapLibreMap["on"]>[0], onIdle as never);
    });
  }
}

function hasError(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function formatDiagnostics(diagnostics: Diagnostic[]): string {
  return diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`).join("\n");
}

/**
 * Escape special HTML characters in a string to prevent XSS when injecting
 * user-supplied feature property values into popup HTML.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
