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
export type MapLibreV6CandidateDecision = "keep-baseline" | "bump-approved";

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
  /** Exact versions exercised by the executable matrix. */
  checkedVersions: readonly ["5.24.0", "6.0.0-22"];
  /** Version retained by release and workspace defaults. */
  releaseBaseline: "5.24.0";
  /** Candidate adoption decision; independent from runtime compatibility evidence. */
  candidateDecision: MapLibreV6CandidateDecision;
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
    id: "prerelease-peer-range",
    description:
      "npm resolves the release baseline natively but rejects the checked prerelease against the public peer range.",
    breakingChange: "Semver range ^6.0.0 does not include 6.0.0-22.",
    severity: "warning",
    impact: "The v6 prerelease is evidence-only and cannot be presented as a supported peer installation.",
    remediation: "Keep 5.24.0 as the release baseline; make any future stable-v6 range change a separate decision.",
  },
  {
    id: "public-adapter-types",
    description: "The packed public adapter API compiles under strict TypeScript against both exact versions.",
    breakingChange: "v6 changes event subscription return types and adds camera/event types.",
    severity: "pass",
    impact:
      "MapLibreAdapter, InteractionBridgeEvent, MapSpec, lifecycle subscriptions, and Map access remain type-safe.",
    remediation: "Keep the exact-version consumer compile in the compatibility matrix.",
  },
  {
    id: "esm-generated-example",
    description: "Both entries bundle as ESM; v6 requires explicit delivery of its module worker and shared module.",
    breakingChange:
      "v6 derives maplibre-gl-worker.mjs beside import.meta.url; Vite renames the application chunk and does not copy the worker pair automatically.",
    severity: "warning",
    impact:
      "A generated v6 app stalls before style.load unless it calls setWorkerUrl with a deployed module-worker URL.",
    remediation:
      "Copy maplibre-gl-worker.mjs and maplibre-gl-shared.mjs as public assets and call setWorkerUrl before constructing a v6 map.",
  },
  {
    id: "adapter-lifecycle-events",
    description:
      "With explicit v6 worker delivery, raw Map and MapLibreAdapter emit load/idle and adapter moveend events.",
    breakingChange: "v6 module-worker delivery is a prerequisite for lifecycle completion.",
    severity: "pass",
    impact: "The adapter event bridge works unchanged once the v6 worker is available.",
    remediation: "Retain raw-map and adapter event assertions in the generated browser fixture.",
  },
  {
    id: "strict-visual-readiness",
    description: "Both exact versions produce snapshot success and nonblank Chromium pixels without console errors.",
    breakingChange: "v6 cannot reach strict visual readiness without explicit module-worker delivery.",
    severity: "pass",
    impact: "The accepted migration path preserves visible renderer output in the evidence fixture.",
    remediation: "Continue to require strict visual evidence before any dependency baseline change.",
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
    targetVersionRange: "5.24.0 / 6.0.0-22 evidence-only",
    checkedVersions: ["5.24.0", "6.0.0-22"],
    releaseBaseline: "5.24.0",
    candidateDecision: "keep-baseline",
    entries,
    summary: {
      totalChecks: entries.length,
      passCount,
      warningCount,
      failCount,
    },
  };
}

/** Returns true when the checked runtime/type/visual evidence has no failures. */
export function isMapLibreV6RuntimeCompatible(report: MapLibreV6AuditReport = runMapLibreV6Audit()): boolean {
  return report.status !== "incompatible";
}

/**
 * Backwards-compatible runtime compatibility alias.
 * This does not approve a dependency or release-baseline change.
 */
export function isMapLibreV6Compatible(): boolean {
  return isMapLibreV6RuntimeCompatible();
}

/** Returns true only when runtime evidence passes and quality separately approves the bump. */
export function isMapLibreV6AdoptionApproved(report: MapLibreV6AuditReport = runMapLibreV6Audit()): boolean {
  return isMapLibreV6RuntimeCompatible(report) && report.candidateDecision === "bump-approved";
}

/**
 * Returns the list of audit entries that have warnings.
 * Useful for CI/CD gates and preflight checks.
 */
export function getMapLibreV6Warnings(): MapLibreV6AuditEntry[] {
  return MAPLIBRE_V6_AUDIT_ENTRIES.filter((entry) => entry.severity === "warning");
}
