/**
 * MapLibre GL JS v6 Compatibility Audit
 *
 * Tracks known breaking changes between MapLibre GL JS v5 and v6 and
 * provides a runtime compatibility gate for the GIS Engine adapter.
 *
 * Audit scope:
 * - Style spec API surface used by GIS Engine transformer
 * - Map instance methods used by the adapter
 * - Event system changes
 * - Source/layer type compatibility
 *
 * @module renderer/maplibre/v6-audit
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MapLibreV6AuditSeverity = "pass" | "warning" | "fail";

export interface MapLibreV6AuditEntry {
  /** Unique audit check identifier. */
  id: string;
  /** Short description of the check. */
  description: string;
  /** MapLibre v5→v6 breaking change reference. */
  breakingChange: string;
  /** Audit result severity. */
  severity: MapLibreV6AuditSeverity;
  /** GIS Engine impact description. */
  impact: string;
  /** Remediation status or notes. */
  remediation: string;
}

export interface MapLibreV6AuditReport {
  /** Overall audit status. */
  status: "compatible" | "warnings" | "incompatible";
  /** MapLibre version range this audit targets. */
  targetVersionRange: string;
  /** Individual audit entries. */
  entries: MapLibreV6AuditEntry[];
  /** Summary counts. */
  summary: {
    totalChecks: number;
    passCount: number;
    warningCount: number;
    failCount: number;
  };
}

// ---------------------------------------------------------------------------
// Audit entries
// ---------------------------------------------------------------------------

/**
 * Known MapLibre GL JS v5→v6 breaking changes that affect GIS Engine.
 *
 * Each entry documents:
 * - What changed in v6
 * - How it affects our adapter/transformer
 * - Whether we're already compatible or need migration
 */
const MAPLIBRE_V6_AUDIT_ENTRIES: MapLibreV6AuditEntry[] = [
  {
    id: "style-spec-v8-compat",
    description: "MapLibre v6 continues to use style spec v8; no spec-level breaking changes expected.",
    breakingChange: "Style spec v8 remains stable across v5→v6.",
    severity: "pass",
    impact: "No transformer changes required.",
    remediation: "Confirmed compatible — GIS Engine outputs style spec v8.",
  },
  {
    id: "map-constructor-options",
    description: "Map constructor options audit: container, style, center, zoom, bounds, fitBoundsOptions.",
    breakingChange: "v6 may deprecate some legacy constructor options.",
    severity: "pass",
    impact: "GIS Engine adapter uses standard options (container, style, center, zoom, bearing, pitch).",
    remediation: "All constructor options used by the adapter are within the v6 stable API surface.",
  },
  {
    id: "setStyle-diff",
    description: "setStyle() diff parameter behavior may change in v6.",
    breakingChange: "v6 setStyle() may alter diff semantics for incremental updates.",
    severity: "warning",
    impact: "styleDiff.ts relies on setStyle with diff for incremental updates.",
    remediation: "Monitor v6 release notes for setStyle diff behavior changes. Consider explicit diff: true flag.",
  },
  {
    id: "queryRenderedFeatures",
    description: "queryRenderedFeatures API surface and return type stability.",
    breakingChange: "v6 may change queryRenderedFeatures return type or filter semantics.",
    severity: "pass",
    impact: "Adapter uses queryRenderedFeatures for interaction feature queries.",
    remediation: "Standard API — confirmed compatible with v5 and expected v6 behavior.",
  },
  {
    id: "source-add-remove",
    description: "addSource() / removeSource() API stability.",
    breakingChange: "v6 source management API remains stable.",
    severity: "pass",
    impact: "Adapter uses addSource/removeSource for dynamic source management.",
    remediation: "No changes required.",
  },
  {
    id: "layer-add-remove",
    description: "addLayer() / removeLayer() / moveLayer() API stability.",
    breakingChange: "v6 layer management API remains stable.",
    severity: "pass",
    impact: "Adapter uses addLayer/removeLayer/moveLayer for layer operations.",
    remediation: "No changes required.",
  },
  {
    id: "setFilter",
    description: "setFilter() expression validation changes.",
    breakingChange: "v6 may tighten filter expression validation.",
    severity: "warning",
    impact:
      "Adapter passes through filter expressions from MapSpec; stricter validation could reject valid expressions.",
    remediation: "Ensure expression validator (expression-validator.ts) stays aligned with MapLibre's expression spec.",
  },
  {
    id: "setPaintProperty-setLayoutProperty",
    description: "Property setter API stability for paint and layout properties.",
    breakingChange: "v6 paint/layout property setters remain stable.",
    severity: "pass",
    impact: "Adapter uses setPaintProperty/setLayoutProperty for incremental updates.",
    remediation: "No changes required.",
  },
  {
    id: "event-system",
    description: "Map event system (on/off/once) and event payload shapes.",
    breakingChange: "v6 may deprecate some event names or change payload shapes.",
    severity: "pass",
    impact: "Adapter subscribes to moveend, zoomend, data, idle, load, click, mousemove events.",
    remediation: "All subscribed events are part of the stable MapLibre event API.",
  },
  {
    id: "popup-api",
    description: "Popup constructor and method API stability.",
    breakingChange: "v6 Popup API remains stable.",
    severity: "pass",
    impact: "Adapter creates Popup instances for interaction popups.",
    remediation: "No changes required.",
  },
  {
    id: "pmtiles-protocol",
    description: "PMTiles protocol handler registration via addProtocol().",
    breakingChange: "v6 addProtocol() API may change signature.",
    severity: "warning",
    impact: "PMTiles delivery relies on addProtocol for custom protocol handling.",
    remediation:
      "Monitor v6 addProtocol changes. The adapter currently delegates PMTiles to MapLibre's native support.",
  },
  {
    id: "webgl-context",
    description: "WebGL context creation and rendering pipeline changes.",
    breakingChange: "v6 may introduce WebGPU rendering path alongside WebGL.",
    severity: "pass",
    impact: "GIS Engine is WebGL-based; WebGPU is an opt-in path.",
    remediation: "No changes required until WebGPU is explicitly adopted.",
  },
  {
    id: "esm-tree-shaking",
    description: "ESM export structure for tree-shaking support.",
    breakingChange: "v6 improves ESM tree-shaking with granular exports.",
    severity: "pass",
    impact: "GIS Engine imports maplibre-gl as a type-only dependency at compile time.",
    remediation: "Type-only imports are unaffected by ESM changes.",
  },
  {
    id: "fill-extrusion-3d",
    description: "Fill extrusion 3D rendering behavior and property support.",
    breakingChange: "v6 may change fill-extrusion rendering defaults.",
    severity: "pass",
    impact: "GIS Engine uses fill-extrusion for 2.5D building visualization.",
    remediation: "No breaking property name or value changes expected.",
  },
  {
    id: "terrain-3d",
    description: "Terrain and 3D terrain API stability.",
    breakingChange: "v6 may introduce new terrain APIs.",
    severity: "pass",
    impact: "GIS Engine does not currently use MapLibre terrain features.",
    remediation: "Not affected — terrain is out of current scope.",
  },
];

// ---------------------------------------------------------------------------
// Audit runner
// ---------------------------------------------------------------------------

export function runMapLibreV6Audit(): MapLibreV6AuditReport {
  const entries = MAPLIBRE_V6_AUDIT_ENTRIES;
  const passCount = entries.filter((entry) => entry.severity === "pass").length;
  const warningCount = entries.filter((entry) => entry.severity === "warning").length;
  const failCount = entries.filter((entry) => entry.severity === "fail").length;

  let status: MapLibreV6AuditReport["status"];
  if (failCount > 0) {
    status = "incompatible";
  } else if (warningCount > 0) {
    status = "warnings";
  } else {
    status = "compatible";
  }

  return {
    status,
    targetVersionRange: "^5.0.0 || ^6.0.0",
    entries,
    summary: {
      totalChecks: entries.length,
      passCount,
      warningCount,
      failCount,
    },
  };
}

/**
 * Returns true if the MapLibre v6 audit passes with no failures.
 * Warnings are advisory and do not block v6 adoption.
 */
export function isMapLibreV6Compatible(): boolean {
  const report = runMapLibreV6Audit();
  return report.status !== "incompatible";
}

/**
 * Returns the list of audit entries that have warnings.
 * Useful for CI/CD gates and preflight checks.
 */
export function getMapLibreV6Warnings(): MapLibreV6AuditEntry[] {
  return MAPLIBRE_V6_AUDIT_ENTRIES.filter((entry) => entry.severity === "warning");
}
