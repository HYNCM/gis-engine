import { Ajv, type ErrorObject } from "ajv/dist/ajv.js";
import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic, MapSpec, ValidationReport } from "../types.js";
import { MapSpecSchema } from "./schemas/index.js";
import { validateExpression } from "./expression-validator.js";
import { validateResourcePolicy } from "./resource-policy.js";

const ajv = new Ajv({ allErrors: true, strict: false });
const validateMapSpecSchema = ajv.compile(MapSpecSchema);

export function validateSpec(spec: unknown): ValidationReport {
  const diagnostics: Diagnostic[] = [];

  if (!validateMapSpecSchema(spec)) {
    diagnostics.push(...schemaErrorsToDiagnostics(validateMapSpecSchema.errors ?? []));
  }

  if (isMapSpecLike(spec)) {
    diagnostics.push(...validateSemanticRules(spec));
    diagnostics.push(...validateResourcePolicy(spec));
  }

  return {
    valid: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
    diagnostics,
    stats: {
      sourceCount: isMapSpecLike(spec) ? Object.keys(spec.sources).length : 0,
      layerCount: isMapSpecLike(spec) ? spec.layers.length : 0,
      visibleLayerCount: isMapSpecLike(spec) ? spec.layers.filter((layer) => layer.layout?.visibility !== "none").length : 0
    }
  };
}

function schemaErrorsToDiagnostics(errors: ErrorObject[]): Diagnostic[] {
  return errors.map((error) => ({
    severity: "error",
    code: schemaKeywordToCode(error),
    message: error.message ?? "MapSpec schema validation failed",
    path: error.instancePath || "/"
  }));
}

function schemaKeywordToCode(error: ErrorObject): Diagnostic["code"] {
  if (error.keyword === "additionalProperties") return DiagnosticCodes.SpecUnknownField;
  if (error.keyword === "required") return DiagnosticCodes.SpecMissingField;
  if (error.keyword === "type") return DiagnosticCodes.SpecInvalidType;
  if (error.keyword === "const" && error.instancePath === "/version") return DiagnosticCodes.SpecInvalidVersion;
  return DiagnosticCodes.SpecInvalidType;
}

function validateSemanticRules(spec: MapSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (spec.view.center) {
    const [lng, lat] = spec.view.center;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.GeoInvalidCoordinates,
        message: `Center coordinates [${lng}, ${lat}] are out of range. Longitude must be [-180, 180] and latitude must be [-90, 90].`,
        path: "/view/center"
      });
    }
  }

  const layerIds = new Set<string>();

  for (const [index, layer] of spec.layers.entries()) {
    const layerPath = `/layers/${index}`;

    if (layerIds.has(layer.id)) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerDuplicateId,
        message: `Layer id "${layer.id}" is duplicated.`,
        path: `${layerPath}/id`,
        relatedResources: [{ kind: "layer", id: layer.id }]
      });
    }

    layerIds.add(layer.id);

    if (layer.type !== "background" && !layer.source) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerSourceMissing,
        message: `Layer "${layer.id}" requires a source.`,
        path: `${layerPath}/source`,
        relatedResources: [{ kind: "layer", id: layer.id }]
      });
    }

    if (layer.source && !spec.sources[layer.source]) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SourceNotFound,
        message: `Layer "${layer.id}" references missing source "${layer.source}".`,
        path: `${layerPath}/source`,
        relatedResources: [
          { kind: "layer", id: layer.id },
          { kind: "source", id: layer.source }
        ],
        fix: {
          kind: "manual",
          confidence: "medium",
          message: "Add the missing source or update the layer source id."
        }
      });
    }

    const source = layer.source ? spec.sources[layer.source] : undefined;
    if (layer.source && source && !isLayerSourceCompatible(layer.type, source.type)) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerSourceIncompatible,
        message: `Layer "${layer.id}" of type "${layer.type}" is not compatible with source "${layer.source}" of type "${source.type}".`,
        path: `${layerPath}/source`,
        relatedResources: [
          { kind: "layer", id: layer.id },
          { kind: "source", id: layer.source }
        ]
      });
    }

    if (layer.paint) {
      for (const [key, value] of Object.entries(layer.paint)) {
        if (Array.isArray(value)) {
          diagnostics.push(...validateExpression(value, `${layerPath}/paint/${key}`));
        }
      }
    }

    if (layer.layout) {
      for (const [key, value] of Object.entries(layer.layout)) {
        if (Array.isArray(value)) {
          diagnostics.push(...validateExpression(value, `${layerPath}/layout/${key}`));
        }
      }
    }
  }

  return diagnostics;
}

function isLayerSourceCompatible(layerType: string, sourceType: string): boolean {
  if (layerType === "background") return true;
  if (layerType === "raster") return sourceType === "raster" || sourceType === "pmtiles";
  if (layerType === "fill" || layerType === "line" || layerType === "circle" || layerType === "symbol-lite" || layerType === "fill-extrusion-lite") {
    return sourceType === "geojson" || sourceType === "pmtiles";
  }
  return false;
}

function isMapSpecLike(value: unknown): value is MapSpec {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapSpec>;
  return candidate.version === "0.1" && Boolean(candidate.view) && Boolean(candidate.sources) && Array.isArray(candidate.layers);
}
