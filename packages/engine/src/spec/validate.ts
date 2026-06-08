import type { ErrorObject } from "ajv";
import { Ajv } from "ajv";
import {
  DiagnosticCodes,
  type Scene3DStableRuntimeBlockerCode,
  Scene3DStableRuntimeBlockerCodes,
} from "../diagnostics/codes.js";
import type { Diagnostic, MapSpec, SceneResourcePolicy, SceneView3DExtension, ValidationReport } from "../types.js";
import { validateExpression, validateFilterExpression } from "./expression-validator.js";
import { escapePathSegment } from "./patch/path.js";
import {
  defaultResourcePolicy,
  type ResourcePolicy,
  validateResourcePolicy,
  validateResourceUrl,
} from "./resource-policy.js";
import { MapSpecSchema, SceneView3DExtensionSchema } from "./schemas/index.js";

const ajv = new Ajv({ allErrors: true, strict: true });
const validateMapSpecSchema = ajv.compile(MapSpecSchema);
const validateSceneView3DExtensionSchema = ajv.compile(SceneView3DExtensionSchema);

export function validateSpec(spec: unknown, options?: { resourcePolicy?: ResourcePolicy }): ValidationReport {
  const diagnostics: Diagnostic[] = [];

  if (!validateMapSpecSchema(spec)) {
    diagnostics.push(...schemaErrorsToDiagnostics(validateMapSpecSchema.errors ?? []));
  }

  if (isMapSpecLike(spec)) {
    diagnostics.push(...validateSemanticRules(spec));
    diagnostics.push(...validateResourcePolicy(spec, options?.resourcePolicy));
    diagnostics.push(...validateSceneView3DExtension(spec));
  }

  return {
    valid: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
    diagnostics,
    stats: {
      sourceCount: isMapSpecLike(spec) ? Object.keys(spec.sources).length : 0,
      layerCount: isMapSpecLike(spec) ? spec.layers.length : 0,
      visibleLayerCount: isMapSpecLike(spec)
        ? spec.layers.filter((layer) => layer.layout?.visibility !== "none").length
        : 0,
    },
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
    diagnostics.push(
      ...validateResourceUrl(
        source.url,
        `/extensions/scene3d/sources/${escapePathSegment(sourceId)}/url`,
        resourcePolicy,
      ),
    );
  }

  diagnostics.push(...validateSceneLayerReferences(sceneExtension));

  return diagnostics;
}

function validateSceneLayerReferences(sceneExtension: SceneView3DExtension): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const layerIds = new Set<string>();

  for (const [index, layer] of (sceneExtension.layers ?? []).entries()) {
    const layerPath = `/extensions/scene3d/layers/${index}`;

    if (layerIds.has(layer.id)) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerDuplicateId,
        message: `Scene layer id "${layer.id}" is duplicated.`,
        path: `${layerPath}/id`,
        relatedResources: [{ kind: "layer", id: layer.id }],
      });
    }
    layerIds.add(layer.id);

    if (!sceneExtension.sources?.[layer.source]) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SourceNotFound,
        message: `Scene layer "${layer.id}" references missing scene source "${layer.source}".`,
        path: `${layerPath}/source`,
        relatedResources: [
          { kind: "layer", id: layer.id },
          { kind: "source", id: layer.source },
        ],
        fix: {
          kind: "manual",
          confidence: "medium",
          message: "Add the missing scene source or update the scene layer source id.",
        },
      });
    }
  }

  return diagnostics;
}

function scene3dSchemaErrorsToDiagnostics(errors: ErrorObject[]): Diagnostic[] {
  return errors.map((error) => ({
    severity: "error",
    code: schemaKeywordToCode(error),
    message: error.message ?? "SceneView3D extension schema validation failed",
    path: `/extensions/scene3d${error.instancePath || ""}${additionalPropertyPath(error)}`,
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
    allowedHosts: policy?.allowedHosts ?? defaultResourcePolicy.allowedHosts,
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
    path: error.instancePath || "/",
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
        path: "/view/center",
      });
    }
  }

  if (spec.view.bounds) {
    const [west, south, east, north] = spec.view.bounds;
    if (west > east) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.GeoInvalidCoordinates,
        message: `View bounds west (${west}) must be less than or equal to east (${east}).`,
        path: "/view/bounds",
        fix: {
          kind: "manual",
          confidence: "high",
          message: "Ensure bounds are ordered as [west, south, east, north] with west <= east and south <= north.",
        },
      });
    }
    if (south > north) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.GeoInvalidCoordinates,
        message: `View bounds south (${south}) must be less than or equal to north (${north}).`,
        path: "/view/bounds",
        fix: {
          kind: "manual",
          confidence: "high",
          message: "Ensure bounds are ordered as [west, south, east, north] with west <= east and south <= north.",
        },
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
        relatedResources: [{ kind: "layer", id: layer.id }],
      });
    }

    layerIds.add(layer.id);

    if (layer.type !== "background" && !layer.source) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerSourceMissing,
        message: `Layer "${layer.id}" requires a source.`,
        path: `${layerPath}/source`,
        relatedResources: [{ kind: "layer", id: layer.id }],
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
          { kind: "source", id: layer.source },
        ],
        fix: {
          kind: "manual",
          confidence: "medium",
          message: "Add the missing source or update the layer source id.",
        },
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
          { kind: "source", id: layer.source },
        ],
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
          message:
            'Set view.mode to "map2_5d" or request capabilities.dimensions ["2_5d"], then add "fill-extrusion-lite" to capabilities.experimental.',
        },
      });
    }

    if (layer.minzoom !== undefined && layer.maxzoom !== undefined && layer.minzoom > layer.maxzoom) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerZoomRangeInvalid,
        message: `Layer "${layer.id}" minzoom (${layer.minzoom}) must be less than or equal to maxzoom (${layer.maxzoom}).`,
        path: `${layerPath}/minzoom`,
        relatedResources: [{ kind: "layer", id: layer.id }],
        fix: {
          kind: "manual",
          confidence: "high",
          message: "Choose a minzoom less than or equal to maxzoom, or reset the layer range to 0-24.",
        },
      });
    }

    if (layer.filter) {
      diagnostics.push(...validateFilterExpression(layer.filter, `${layerPath}/filter`));
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
    diagnostics.push(scene3dUnsupported("/view/mode", Scene3DStableRuntimeBlockerCodes.ViewMode));
  }

  if (spec.capabilities?.renderer === "scene3d") {
    diagnostics.push(scene3dUnsupported("/capabilities/renderer", Scene3DStableRuntimeBlockerCodes.Renderer));
  }

  if (spec.capabilities?.dimensions?.includes("3d")) {
    diagnostics.push(scene3dUnsupported("/capabilities/dimensions", Scene3DStableRuntimeBlockerCodes.Dimensions));
  }

  return diagnostics;
}

function scene3dUnsupported(path: string, blockerCode: Scene3DStableRuntimeBlockerCode): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    blockerCode,
    message:
      "SceneView3D stable runtime promotion is blocked until the W23 promotion readiness gate issues a go/no-go decision.",
    path,
    fix: {
      kind: "manual",
      confidence: "medium",
      message:
        'Keep "scene3d" fields under the documented extension boundary until the stable runtime gate explicitly approves promotion.',
    },
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
  if (
    layerType === "fill" ||
    layerType === "line" ||
    layerType === "circle" ||
    layerType === "symbol-lite" ||
    layerType === "fill-extrusion-lite"
  ) {
    return (
      sourceType === "geojson" || sourceType === "pmtiles" || sourceType === "geoparquet" || sourceType === "vector"
    );
  }
  return false;
}

function isMapSpecLike(value: unknown): value is MapSpec {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapSpec>;
  return (
    candidate.version === "0.1" &&
    Boolean(candidate.view) &&
    Boolean(candidate.sources) &&
    Array.isArray(candidate.layers)
  );
}
