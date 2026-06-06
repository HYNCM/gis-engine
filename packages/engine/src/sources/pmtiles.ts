import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { PMTilesArchiveMetadata, PMTilesArchivePolicy } from "../spec/cloud-native/index.js";
import { defaultPMTilesArchivePolicy } from "../spec/cloud-native/index.js";
import { validatePMTilesArchivePolicy } from "../spec/cloud-native/validate.js";
import { escapePathSegment } from "../spec/patch/path.js";
import { defaultResourcePolicy, type ResourcePolicy, validateResourceUrl } from "../spec/resource-policy.js";
import type { Diagnostic, LayerSpec, MapSpec, PmtilesSourceSpec, SourceSpec } from "../types.js";
import {
  SOURCE_CAPABILITY_PRESETS,
  type SourceCapabilitySummary,
  type SourceLoader,
  type SourceValidationResult,
} from "./contract.js";

export type PMTilesRuntimeLoadPlanStatus = "not-applicable" | "ready" | "metadata-required" | "blocked";
export type PMTilesRuntimeSourceStatus = Exclude<PMTilesRuntimeLoadPlanStatus, "not-applicable">;

export interface CreatePMTilesRuntimeLoadPlanOptions {
  resourcePolicy?: ResourcePolicy;
  archivePolicy?: PMTilesArchivePolicy;
  archiveMetadata?: Record<string, PMTilesArchiveMetadata | undefined>;
  requireArchiveMetadata?: boolean;
}

export interface PMTilesRuntimeSourcePlan {
  sourceId: string;
  sourceType: "pmtiles";
  status: PMTilesRuntimeSourceStatus;
  url: string;
  layerIds: string[];
  sourceLayerIds: string[];
  diagnostics: Diagnostic[];
  capabilities: SourceCapabilitySummary;
  metadata?: PMTilesArchiveMetadata;
  requirements: {
    mapLibreVectorSource: true;
    sourceLayerMetadata: true;
    rangeRequests: true;
    worker: true;
    archiveMetadata: boolean;
    archiveParsing: false;
    featureQuery: false;
  };
}

export interface PMTilesRuntimeLoadPlan {
  status: PMTilesRuntimeLoadPlanStatus;
  sources: PMTilesRuntimeSourcePlan[];
  diagnostics: Diagnostic[];
  summary: {
    pmtilesSourceCount: number;
    readySourceCount: number;
    metadataRequiredSourceCount: number;
    blockedSourceCount: number;
  };
}

export class PMTilesSourceLoader implements SourceLoader {
  readonly sourceId: string;

  constructor(sourceId: string) {
    this.sourceId = sourceId;
  }

  validate(spec: SourceSpec, policy: ResourcePolicy = defaultResourcePolicy): SourceValidationResult {
    const sourcePath = `/sources/${escapePathSegment(this.sourceId)}`;
    if (spec.type !== "pmtiles") {
      const diagnostics: Diagnostic[] = [
        {
          severity: "error",
          code: DiagnosticCodes.CapabilityUnsupported,
          message: `PMTilesSourceLoader cannot validate source type "${spec.type}".`,
          path: `${sourcePath}/type`,
          relatedResources: [{ kind: "source", id: this.sourceId }],
        },
      ];
      return {
        status: "error",
        sourceId: this.sourceId,
        sourceType: spec.type,
        diagnostics,
      };
    }

    const diagnostics = validatePMTilesSourceSpec(this.sourceId, spec, policy);
    const hasError = diagnostics.some((diagnostic) => diagnostic.severity === "error");

    return {
      status: hasError ? "error" : "ready",
      sourceId: this.sourceId,
      sourceType: "pmtiles",
      diagnostics,
      ...(hasError ? {} : { capabilities: createPMTilesCapabilitySummary() }),
    };
  }

  getCapabilitySummary(): SourceCapabilitySummary {
    return createPMTilesCapabilitySummary();
  }
}

export function createPMTilesRuntimeLoadPlan(
  spec: MapSpec,
  options: CreatePMTilesRuntimeLoadPlanOptions = {},
): PMTilesRuntimeLoadPlan {
  const resourcePolicy = options.resourcePolicy ?? defaultResourcePolicy;
  const archivePolicy = options.archivePolicy ?? defaultPMTilesArchivePolicy;
  const sources: PMTilesRuntimeSourcePlan[] = [];

  for (const [sourceId, source] of Object.entries(spec.sources)) {
    if (source.type !== "pmtiles") continue;

    const metadata = options.archiveMetadata?.[sourceId];
    const diagnostics: Diagnostic[] = [];
    const loader = new PMTilesSourceLoader(sourceId);
    const validation = loader.validate(source, resourcePolicy);
    diagnostics.push(...validation.diagnostics);

    const referencedLayers = spec.layers
      .map((layer, index) => ({ layer, index }))
      .filter(({ layer }) => layer.source === sourceId);
    const sourceLayerIds = new Set<string>();

    for (const { layer, index } of referencedLayers) {
      const sourceLayerId = getSourceLayerId(layer);
      if (sourceLayerId) sourceLayerIds.add(sourceLayerId);

      if (requiresSourceLayerMetadata(layer) && !sourceLayerId) {
        diagnostics.push({
          severity: "error",
          code: DiagnosticCodes.LayerSourceIncompatible,
          message: `PMTiles vector layer "${layer.id}" requires metadata["source-layer"] for MapLibre delivery.`,
          path: `/layers/${index}/metadata/source-layer`,
          relatedResources: [
            { kind: "layer", id: layer.id },
            { kind: "source", id: sourceId },
          ],
          fix: {
            kind: "manual",
            confidence: "high",
            message: 'Add metadata: { "source-layer": "<tileset-layer-name>" } to the layer.',
          },
        });
      }

      if (layer.type === "raster") {
        diagnostics.push({
          severity: "error",
          code: DiagnosticCodes.CapabilityUnsupported,
          message:
            "PMTiles raster delivery is not supported by the current MapLibre MVP transformer; use vector PMTiles layers with source-layer metadata.",
          path: `/layers/${index}/type`,
          relatedResources: [
            { kind: "layer", id: layer.id },
            { kind: "source", id: sourceId },
          ],
        });
      }
    }

    if (metadata) {
      diagnostics.push(
        ...scopePMTilesArchiveDiagnostics(sourceId, validatePMTilesArchivePolicy(metadata, archivePolicy)),
      );
      if (!metadata.hasVectorTiles || metadata.tileType === "raster") {
        diagnostics.push({
          severity: "error",
          code: DiagnosticCodes.CapabilityUnsupported,
          message: "Current PMTiles runtime load plan supports vector PMTiles delivery only.",
          path: `/sources/${escapePathSegment(sourceId)}/archiveMetadata/tileType`,
          relatedResources: [{ kind: "source", id: sourceId }],
        });
      }
    } else if (options.requireArchiveMetadata) {
      diagnostics.push({
        severity: "warning",
        code: DiagnosticCodes.CapabilityUnsupported,
        message:
          "PMTiles archive metadata was not provided; validate archive byte budget and tile type before promoting this source beyond URL-compatible delivery.",
        path: `/sources/${escapePathSegment(sourceId)}/archiveMetadata`,
        relatedResources: [{ kind: "source", id: sourceId }],
      });
    }

    if (archivePolicy.allowRangeRequests === false) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityUrlBlocked,
        message:
          "PMTiles runtime delivery requires range requests, but PMTilesArchivePolicy.allowRangeRequests is false.",
        path: `/sources/${escapePathSegment(sourceId)}/archivePolicy/allowRangeRequests`,
        relatedResources: [{ kind: "source", id: sourceId }],
      });
    }

    const hasError = diagnostics.some((diagnostic) => diagnostic.severity === "error");
    const metadataRequired =
      !hasError &&
      options.requireArchiveMetadata === true &&
      diagnostics.some((diagnostic) => diagnostic.path?.endsWith("/archiveMetadata"));

    sources.push({
      sourceId,
      sourceType: "pmtiles",
      status: hasError ? "blocked" : metadataRequired ? "metadata-required" : "ready",
      url: source.url,
      layerIds: referencedLayers.map(({ layer }) => layer.id),
      sourceLayerIds: [...sourceLayerIds],
      diagnostics,
      capabilities: createPMTilesCapabilitySummary(metadata),
      ...(metadata ? { metadata } : {}),
      requirements: {
        mapLibreVectorSource: true,
        sourceLayerMetadata: true,
        rangeRequests: true,
        worker: true,
        archiveMetadata: options.requireArchiveMetadata === true,
        archiveParsing: false,
        featureQuery: false,
      },
    });
  }

  const diagnostics = sources.flatMap((source) => source.diagnostics);
  const readySourceCount = sources.filter((source) => source.status === "ready").length;
  const metadataRequiredSourceCount = sources.filter((source) => source.status === "metadata-required").length;
  const blockedSourceCount = sources.filter((source) => source.status === "blocked").length;

  return {
    status:
      sources.length === 0
        ? "not-applicable"
        : blockedSourceCount > 0
          ? "blocked"
          : metadataRequiredSourceCount > 0
            ? "metadata-required"
            : "ready",
    sources,
    diagnostics,
    summary: {
      pmtilesSourceCount: sources.length,
      readySourceCount,
      metadataRequiredSourceCount,
      blockedSourceCount,
    },
  };
}

function validatePMTilesSourceSpec(sourceId: string, source: PmtilesSourceSpec, policy: ResourcePolicy): Diagnostic[] {
  const sourcePath = `/sources/${escapePathSegment(sourceId)}`;
  const diagnostics = validateResourceUrl(source.url, `${sourcePath}/url`, policy);

  if (source.minzoom !== undefined && source.maxzoom !== undefined && source.minzoom > source.maxzoom) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: `PMTiles source "${sourceId}" minzoom (${source.minzoom}) must be less than or equal to maxzoom (${source.maxzoom}).`,
      path: `${sourcePath}/minzoom`,
      relatedResources: [{ kind: "source", id: sourceId }],
    });
  }

  return diagnostics;
}

function requiresSourceLayerMetadata(layer: LayerSpec): boolean {
  return (
    layer.type === "fill" ||
    layer.type === "line" ||
    layer.type === "circle" ||
    layer.type === "symbol-lite" ||
    layer.type === "fill-extrusion-lite"
  );
}

function getSourceLayerId(layer: LayerSpec): string | undefined {
  const value = layer.metadata?.["source-layer"];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function createPMTilesCapabilitySummary(metadata?: PMTilesArchiveMetadata): SourceCapabilitySummary {
  const preset = SOURCE_CAPABILITY_PRESETS.pmtiles ?? {
    sourceType: "pmtiles",
    supportsStreaming: true,
    supportsRandomAccess: true,
    requiresWorker: true,
  };
  return {
    ...preset,
    ...(metadata ? { estimatedByteSize: metadata.archiveBytes } : {}),
    metadata: {
      ...(preset.metadata ?? {}),
      delivery: "maplibre-vector-url",
      archiveParsing: false,
      featureQuery: false,
      ...(metadata
        ? {
            specVersion: metadata.specVersion,
            tileType:
              metadata.tileType ??
              (metadata.hasVectorTiles ? "vector" : metadata.hasRasterTiles ? "raster" : "unknown"),
            minZoom: metadata.minZoom,
            maxZoom: metadata.maxZoom,
            bounds: metadata.bounds,
          }
        : {}),
    },
  };
}

function scopePMTilesArchiveDiagnostics(sourceId: string, diagnostics: Diagnostic[]): Diagnostic[] {
  const sourcePath = `/sources/${escapePathSegment(sourceId)}/archiveMetadata`;
  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    path: diagnostic.path?.replace(/^\/pmtiles/, sourcePath) ?? sourcePath,
    relatedResources: [...(diagnostic.relatedResources ?? []), { kind: "source", id: sourceId }],
  }));
}
