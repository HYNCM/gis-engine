import { Ajv, type ErrorObject } from "ajv/dist/ajv.js";
import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic, MapSpec, SceneResourcePolicy, SceneView3DExtension, ValidationReport } from "../types.js";
import { MapSpecSchema, SceneView3DExtensionSchema } from "./schemas/index.js";
import { validateExpression } from "./expression-validator.js";
import { defaultResourcePolicy, validateResourcePolicy, validateResourceUrl, type ResourcePolicy } from "./resource-policy.js";

const ajv = new Ajv({ allErrors: true, strict: false });
const validateMapSpecSchema = ajv.compile(MapSpecSchema);
const validateSceneView3DExtensionSchema = ajv.compile(SceneView3DExtensionSchema);

export function validateSpec(spec: unknown): ValidationReport {
  const diagnostics: Diagnostic[] = [];

  if (!validateMapSpecSchema(spec)) {
    diagnostics.push(...schemaErrorsToDiagnostics(validateMapSpecSchema.errors ?? []));
  }

  if (isMapSpecLike(spec)) {
    diagnostics.push(...validateSemanticRules(spec));
    diagnostics.push(...validateResourcePolicy(spec));
    diagnostics.push(...validateSceneView3DExtension(spec));
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

function validateSceneView3DExtension(spec: MapSpec): Diagnostic[] {
  const scene = spec.extensions?.scene3d;
  if (scene === undefined) return [];

  if (!validateSceneView3DExtensionSchema(scene)) {
    return scene3dSchemaErrorsToDiagnostics(validateSceneView3DExtensionSchema.errors ?? []);
  }

  const sceneExtension = scene as SceneView3DExtension;
  const resourcePolicy = toSceneResourcePolicy(sceneExtension.resourcePolicy);
  const diagnostics: Diagnostic[] = [];

  for (const [sourceId, source] of Object.entries(sceneExtension.sources ?? {})) {
    diagnostics.push(...validateResourceUrl(source.url, `/extensions/scene3d/sources/${escapePathSegment(sourceId)}/url`, resourcePolicy));
  }

  return diagnostics;
}

function scene3dSchemaErrorsToDiagnostics(errors: ErrorObject[]): Diagnostic[] {
  return errors.map((error) => ({
    severity: "error",
    code: schemaKeywordToCode(error),
    message: error.message ?? "SceneView3D extension schema validation failed",
    path: `/extensions/scene3d${error.instancePath || ""}${additionalPropertyPath(error)}`
  }));
}

function additionalPropertyPath(error: ErrorObject): string {
  if (error.keyword !== "additionalProperties") return "";
  const additionalProperty = error.params.additionalProperty;
  return typeof additionalProperty === "string" ? `/${escapePathSegment(additionalProperty)}` : "";
}

function toSceneResourcePolicy(policy?: SceneResourcePolicy): ResourcePolicy {
  const scenePolicy: ResourcePolicy = {
    allowedSchemes: policy?.allowedSchemes ?? ["http:", "https:"],
    allowedHosts: policy?.allowedHosts ?? defaultResourcePolicy.allowedHosts
  };

  const allowRelativeUrls = policy?.allowRelativeUrls ?? defaultResourcePolicy.allowRelativeUrls;
  if (allowRelativeUrls !== undefined) scenePolicy.allowRelativeUrls = allowRelativeUrls;

  const allowedPathPrefixes = policy?.allowedPathPrefixes ?? defaultResourcePolicy.allowedPathPrefixes;
  if (allowedPathPrefixes !== undefined) scenePolicy.allowedPathPrefixes = allowedPathPrefixes;

  const timeoutMs = policy?.timeoutMs ?? defaultResourcePolicy.timeoutMs;
  if (timeoutMs !== undefined) scenePolicy.timeoutMs = timeoutMs;

  return scenePolicy;
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

  diagnostics.push(...validateViewAndCapabilityBoundary(spec));

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

    if (layer.type === "fill-extrusion-lite" && !hasFillExtrusionLiteGate(spec)) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        message:
          'Layer type "fill-extrusion-lite" is experimental and requires capabilities.experimental to include "fill-extrusion-lite" plus a 2.5D view request.',
        path: `${layerPath}/type`,
        relatedResources: [{ kind: "layer", id: layer.id }],
        fix: {
          kind: "manual",
          confidence: "medium",
          message: 'Set view.mode to "map2_5d" or request capabilities.dimensions ["2_5d"], then add "fill-extrusion-lite" to capabilities.experimental.'
        }
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

function validateViewAndCapabilityBoundary(spec: MapSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (spec.view.mode === "scene3d") {
    diagnostics.push(scene3dUnsupported("/view/mode"));
  }

  if (spec.capabilities?.renderer === "scene3d") {
    diagnostics.push(scene3dUnsupported("/capabilities/renderer"));
  }

  if (spec.capabilities?.dimensions?.includes("3d")) {
    diagnostics.push(scene3dUnsupported("/capabilities/dimensions"));
  }

  return diagnostics;
}

function scene3dUnsupported(path: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: "SceneView3D is reserved for a future capability-gated package and is not supported by the current v0.2 contract.",
    path,
    fix: {
      kind: "manual",
      confidence: "medium",
      message: 'Use "map2d" or "map2_5d" for current MapSpec documents, and keep SceneView3D fields under a documented extension until v1.0.'
    }
  };
}

function hasFillExtrusionLiteGate(spec: MapSpec): boolean {
  const requested2_5d = spec.view.mode === "map2_5d" || spec.capabilities?.dimensions?.includes("2_5d") === true;
  const enabledExperimental = spec.capabilities?.experimental?.includes("fill-extrusion-lite") === true;
  return requested2_5d && enabledExperimental;
}

function isLayerSourceCompatible(layerType: string, sourceType: string): boolean {
  if (layerType === "background") return true;
  if (layerType === "raster") return sourceType === "raster" || sourceType === "pmtiles";
  if (layerType === "fill" || layerType === "line" || layerType === "circle" || layerType === "symbol-lite" || layerType === "fill-extrusion-lite") {
    return sourceType === "geojson" || sourceType === "pmtiles" || sourceType === "vector";
  }
  return false;
}

function isMapSpecLike(value: unknown): value is MapSpec {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapSpec>;
  return candidate.version === "0.1" && Boolean(candidate.view) && Boolean(candidate.sources) && Array.isArray(candidate.layers);
}

function escapePathSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}
