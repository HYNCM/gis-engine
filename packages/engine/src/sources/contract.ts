/**
 * Source Loader Contract
 *
 * Defines the engine-level interface for source spec validation, capability
 * introspection, and lifecycle management. Currently, source data fetching
 * is delegated to renderer adapters (e.g., MapLibre). This contract provides
 * a forward-looking interface for:
 *
 * - Standardizing source validation across renderer adapters
 * - Exposing source capabilities (streaming, random access, worker requirements)
 * - Enabling engine-level source lifecycle observability
 * - Supporting future non-MapLibre renderer backends without re-implementing
 *   source configuration transformation
 *
 * v0.1: Contract-only. No engine-level source loading implementation exists yet.
 *       The MapLibre adapter handles source config transformation internally.
 *       This contract is intended for v0.3+ source architecture hardening.
 *
 * @module sources/contract
 */

import type { Diagnostic, SourceSpec } from "../types.js";
import type { ResourcePolicy } from "../spec/resource-policy.js";

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Lifecycle state of a source during validation and preparation.
 * This is NOT about tile-loading state (which is renderer-internal).
 */
export type SourceValidationStatus = "idle" | "validating" | "ready" | "error";

// ---------------------------------------------------------------------------
// Capability introspection
// ---------------------------------------------------------------------------

/**
 * Describes runtime characteristics of a source type.
 * Used by AI tooling and capability reports to determine what
 * operations are feasible without probing the renderer.
 */
export interface SourceCapabilitySummary {
    /** The source type identifier (e.g. "geojson", "raster", "pmtiles", "vector"). */
    sourceType: string;

    /** Whether the source supports progressive/streaming loading. */
    supportsStreaming: boolean;

    /** Whether the source supports random-access queries (e.g. feature lookup by id). */
    supportsRandomAccess: boolean;

    /** Whether loading or decoding may require a Web Worker. */
    requiresWorker: boolean;

    /** Estimated on-wire or on-disk byte size, if known. */
    estimatedByteSize?: number;

    /** Additional source-type-specific metadata. */
    metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

/**
 * Result of validating a single source spec against resource policy
 * and source-type-specific constraints.
 */
export interface SourceValidationResult {
    /** Final lifecycle status after validation. */
    status: SourceValidationStatus;

    /** Source id from the MapSpec sources map. */
    sourceId: string;

    /** Source type discriminator (e.g. "geojson", "raster"). */
    sourceType: string;

    /** Diagnostics produced during validation. */
    diagnostics: Diagnostic[];

    /** Capability summary when validation succeeds. */
    capabilities?: SourceCapabilitySummary;
}

// ---------------------------------------------------------------------------
// Source Loader interface
// ---------------------------------------------------------------------------

/**
 * Engine-level contract for validating and introspecting a single source.
 *
 * Each source type (geojson, raster, pmtiles, vector) may have its own
 * loader implementation. Loaders are registered with the renderer adapter
 * and invoked during `MapRuntime.load()` and `validateSpec()`.
 *
 * This interface is intentionally minimal in v0.1. It does NOT own data
 * fetching — that remains the renderer adapter's responsibility. Future
 * versions may add `fetch()`, `abort()`, and `getFeatures()` methods.
 */
export interface SourceLoader {
    /** The source id this loader is bound to (matches MapSpec sources key). */
    readonly sourceId: string;

    /**
     * Validate a source spec against resource policy and type-specific rules.
     *
     * Implementations must:
     * - Check URL schemes against the resource policy
     * - Validate source-type-specific fields (tileSize ranges, zoom ranges, etc.)
     * - Return structured diagnostics for any violation
     * - NOT initiate network requests (validation is synchronous/spec-only)
     */
    validate(spec: SourceSpec, policy: ResourcePolicy): SourceValidationResult;

    /**
     * Return a static capability summary for this source type.
     * Does not depend on a specific spec instance.
     */
    getCapabilitySummary(): SourceCapabilitySummary;
}

// ---------------------------------------------------------------------------
// Source Loader Factory
// ---------------------------------------------------------------------------

/**
 * Creates a SourceLoader for a given source type and id.
 *
 * Registered by renderer adapters via the renderer registry.
 * Example:
 *   registry.registerSourceLoader("geojson", (id) => new GeoJsonSourceLoader(id));
 */
export type SourceLoaderFactory = (sourceId: string) => SourceLoader;

// ---------------------------------------------------------------------------
// Built-in capability summaries (static, per source type)
// ---------------------------------------------------------------------------

/**
 * Static capability summaries for the four currently supported source types.
 * These are advisory and may be overridden by adapter-specific loaders.
 */
export const SOURCE_CAPABILITY_PRESETS: Record<string, SourceCapabilitySummary> = {
    geojson: {
        sourceType: "geojson",
        supportsStreaming: false,
        supportsRandomAccess: true,
        requiresWorker: false,
        metadata: { maxInlineBytes: 5_242_880 /* 5 MB soft limit */ }
    },
    raster: {
        sourceType: "raster",
        supportsStreaming: true,
        supportsRandomAccess: false,
        requiresWorker: false
    },
    pmtiles: {
        sourceType: "pmtiles",
        supportsStreaming: true,
        supportsRandomAccess: true,
        requiresWorker: true
    },
    vector: {
        sourceType: "vector",
        supportsStreaming: true,
        supportsRandomAccess: false,
        requiresWorker: true
    }
};
