import { Ajv, type ErrorObject } from "ajv/dist/ajv.js";
import { DiagnosticCodes, Scene3DStableRuntimeBlockerCodes, type Scene3DStableRuntimeBlockerCode } from "../diagnostics/codes.js";
import { applyCommands } from "../commands/applyCommands.js";
import { validateSpec } from "../spec/validate.js";
import {
  MapGenerationRequestSchema,
  type MapGenerationAnalysisOperation,
  type MapGenerationRequestFromSchema,
  type MapGenerationTargetDomain
} from "../spec/schemas/index.js";
import type { Diagnostic, MapCommand, MapSpec, SceneView3DExtension } from "../types.js";

export interface MapGenerationCommandSkeleton {
  status: "ready" | "blocked";
  targetDomains: MapGenerationTargetDomain[];
  baseSpec: MapSpec;
  spec: MapSpec;
  commands: MapCommand[];
  diagnostics: Diagnostic[];
  traceId: string;
}

const ajv = new Ajv({ allErrors: true, strict: false });
const validateGenerationRequest = ajv.compile(MapGenerationRequestSchema);

export function createMapGenerationCommandSkeleton(input: unknown): MapGenerationCommandSkeleton {
  const traceId = readString(input, "traceId") ?? "generation.map.r0";
  const fallbackBaseSpec = createBaseSpec(readString(input, "mapId"));

  if (!validateGenerationRequest(input)) {
    return blockedSkeleton({
      baseSpec: fallbackBaseSpec,
      diagnostics: toolInputErrorsToDiagnostics(validateGenerationRequest.errors ?? [], "Invalid map generation request."),
      targetDomains: ["feature-display"],
      traceId
    });
  }

  const request = input as MapGenerationRequestFromSchema;
  const targetDomains = [...(request.targetDomains ?? ["feature-display"])];
  const baseSpec = structuredClone((request.baseSpec ?? createBaseSpec(request.mapId)) as MapSpec);
  const baseValidation = validateSpec(baseSpec);

  if (!baseValidation.valid) {
    return blockedSkeleton({
      baseSpec,
      diagnostics: baseValidation.diagnostics,
      targetDomains,
      traceId
    });
  }

  const boundaryDiagnostics = generationBoundaryDiagnostics(request, targetDomains);
  const blockingBoundaryDiagnostics = boundaryDiagnostics.filter((diagnostic) => diagnostic.severity === "error");
  if (blockingBoundaryDiagnostics.length > 0) {
    return blockedSkeleton({
      baseSpec,
      diagnostics: boundaryDiagnostics,
      targetDomains,
      traceId
    });
  }

  const commands = buildGenerationCommands(request);
  if (commands.length === 0) {
    return {
      status: "ready",
      targetDomains,
      baseSpec,
      spec: structuredClone(baseSpec),
      commands,
      diagnostics: boundaryDiagnostics,
      traceId
    };
  }

  const applied = applyCommands(baseSpec, commands, { collectTrace: true, traceId });
  const commandDiagnostics = applied.results.flatMap((result) => result.diagnostics);
  const diagnostics = [...boundaryDiagnostics, ...commandDiagnostics];
  const status = diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "blocked" : "ready";

  return {
    status,
    targetDomains,
    baseSpec,
    spec: applied.spec,
    commands,
    diagnostics,
    traceId
  };
}

function buildGenerationCommands(request: MapGenerationRequestFromSchema): MapCommand[] {
  const commands: MapCommand[] = [];
  const commandBase = {
    version: "0.1" as const,
    author: { type: "agent" as const, name: "gis-engine-nla" },
    ...(request.createdAt ? { createdAt: request.createdAt } : {}),
    ...(request.promptHash ? { sourcePromptHash: request.promptHash } : {})
  };

  if (request.capabilities) {
    commands.push({
      ...commandBase,
      id: "gen-set-capabilities",
      type: "setCapabilities",
      reason: "Apply AI generation capability gates before adding map content.",
      capabilities: request.capabilities
    });
  }

  if (request.view) {
    commands.push({
      ...commandBase,
      id: "gen-set-view",
      type: "setView",
      reason: "Apply AI generation viewport intent.",
      view: request.view
    });
  }

  for (const [sourceId, source] of sortedEntries(request.sources ?? {})) {
    commands.push({
      ...commandBase,
      id: `gen-add-source-${sanitizeCommandPart(sourceId)}`,
      type: "addSource",
      reason: "Add AI generation source declaration.",
      sourceId,
      source
    });
  }

  for (const layer of request.layers ?? []) {
    commands.push({
      ...commandBase,
      id: `gen-add-layer-${sanitizeCommandPart(layer.id)}`,
      type: "addLayer",
      reason: "Add AI generation layer declaration.",
      layer
    });
  }

  for (const styleEdit of request.styleEdits ?? []) {
    if (styleEdit.paint) {
      commands.push({
        ...commandBase,
        id: `gen-set-paint-${sanitizeCommandPart(styleEdit.layerId)}`,
        type: "setPaint",
        reason: "Apply AI generation paint style edit.",
        layerId: styleEdit.layerId,
        paint: styleEdit.paint
      });
    }
    if (styleEdit.layout) {
      commands.push({
        ...commandBase,
        id: `gen-set-layout-${sanitizeCommandPart(styleEdit.layerId)}`,
        type: "setLayout",
        reason: "Apply AI generation layout style edit.",
        layerId: styleEdit.layerId,
        layout: styleEdit.layout
      });
    }
  }

  if (request.interactions) {
    commands.push({
      ...commandBase,
      id: "gen-set-interactions",
      type: "setInteractions",
      reason: "Apply AI generation interaction affordances.",
      interactions: request.interactions
    });
  }

  if (request.scene3d) {
    commands.push({
      ...commandBase,
      id: "gen-set-scene-camera",
      type: "setSceneCamera",
      reason: "Attach extension-only SceneView3D camera evidence without enabling stable scene3d view mode.",
      camera: request.scene3d.camera
    });

    for (const [sourceId, source] of sortedEntries(request.scene3d.sources ?? {})) {
      commands.push({
        ...commandBase,
        id: `gen-add-scene-source-${sanitizeCommandPart(sourceId)}`,
        type: "addSceneSource",
        reason: "Attach extension-only SceneView3D source evidence.",
        sourceId,
        source
      });
    }

    for (const layer of request.scene3d.layers ?? []) {
      commands.push({
        ...commandBase,
        id: `gen-add-scene-layer-${sanitizeCommandPart(layer.id)}`,
        type: "addSceneLayer",
        reason: "Attach extension-only SceneView3D layer evidence.",
        layer
      });
    }
  }

  return commands;
}

function generationBoundaryDiagnostics(request: MapGenerationRequestFromSchema, targetDomains: MapGenerationTargetDomain[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  diagnostics.push(...styleEditDiagnostics(request));
  diagnostics.push(...analysisDiagnostics(request, targetDomains));

  if (targetDomains.includes("spatial-analysis") && !request.analysis?.operations) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "Spatial-analysis generation is readiness-only; buffer, overlay, routing, and aggregation commands are not public yet.",
      path: "/targetDomains",
      fix: {
        kind: "manual",
        confidence: "medium",
        message: "Use get_context_summary and adapter query capabilities for read-only analysis planning until geoprocessing commands are added."
      }
    });
  }

  if (targetDomains.includes("scene-browsing") && !request.scene3d) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "Scene browsing generation requires an extensions.scene3d payload; stable scene3d view mode is not a fallback.",
      path: "/scene3d",
      fix: {
        kind: "manual",
        confidence: "high",
        message: "Provide scene3d camera, sources, and layers under the extension-only scene3d request field."
      }
    });
  }

  if (request.view?.mode === "scene3d") {
    diagnostics.push(stableScene3DBlockedDiagnostic("/view/mode", Scene3DStableRuntimeBlockerCodes.ViewMode));
  }

  if (request.capabilities?.renderer === "scene3d") {
    diagnostics.push(stableScene3DBlockedDiagnostic("/capabilities/renderer", Scene3DStableRuntimeBlockerCodes.Renderer));
  }

  if (request.capabilities?.dimensions?.includes("3d")) {
    diagnostics.push(stableScene3DBlockedDiagnostic("/capabilities/dimensions", Scene3DStableRuntimeBlockerCodes.Dimensions));
  }

  diagnostics.push(...unsupportedScene3DCommandDiagnostics(request.scene3d));
  return diagnostics;
}

function styleEditDiagnostics(request: MapGenerationRequestFromSchema): Diagnostic[] {
  return (request.styleEdits ?? []).flatMap((styleEdit, index): Diagnostic[] =>
    styleEdit.paint || styleEdit.layout
      ? []
      : [
          {
            severity: "error",
            code: DiagnosticCodes.SpecMissingField,
            message: "Generation styleEdits entries require paint, layout, or both.",
            path: `/styleEdits/${index}`,
            relatedResources: [{ kind: "layer", id: styleEdit.layerId }],
            fix: {
              kind: "manual",
              confidence: "high",
              message: "Add a paint or layout object, or remove the empty style edit."
            }
          }
        ]
  );
}

function analysisDiagnostics(request: MapGenerationRequestFromSchema, targetDomains: MapGenerationTargetDomain[]): Diagnostic[] {
  if (!targetDomains.includes("spatial-analysis")) return [];
  return (request.analysis?.operations ?? []).flatMap((operation, index): Diagnostic[] =>
    isQueryReadinessOperation(operation)
      ? []
      : [
          {
            severity: "error",
            code: DiagnosticCodes.CapabilityUnsupported,
            message: `Spatial-analysis operation "${operation}" is not exposed as a public generation or MCP command yet.`,
            path: `/analysis/operations/${index}`,
            fix: {
              kind: "manual",
              confidence: "high",
              message: "Use point-query or bbox-query readiness, or wait for a future geoprocessing command contract."
            }
          }
        ]
  );
}

function isQueryReadinessOperation(operation: MapGenerationAnalysisOperation): boolean {
  return operation === "point-query" || operation === "bbox-query";
}

function unsupportedScene3DCommandDiagnostics(scene3d: SceneView3DExtension | undefined): Diagnostic[] {
  if (!scene3d) return [];
  const unsupportedFields = ["lights", "depth", "terrain", "snapshot", "resourcePolicy"] as const;

  return unsupportedFields.flatMap((field): Diagnostic[] =>
    scene3d[field] === undefined
      ? []
      : [
          {
            severity: "error",
            code: DiagnosticCodes.CapabilityUnsupported,
            message: `SceneView3D generation command skeletons currently support camera, sources, and layers only; "${field}" needs a future extension command.`,
            path: `/scene3d/${field}`,
            relatedResources: [{ kind: "schema", id: "sceneview3d" }],
            fix: {
              kind: "manual",
              confidence: "medium",
              message: "Keep this field in authored SceneView3D specs, or add a command contract before using it in generated command skeletons."
            }
          }
        ]
  );
}

function stableScene3DBlockedDiagnostic(path: string, blockerCode: Scene3DStableRuntimeBlockerCode): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    blockerCode,
    message: 'Stable view.mode: "scene3d" generation is blocked; use extensions.scene3d for extension-only scene browsing evidence.',
    path,
    fix: {
      kind: "manual",
      confidence: "high",
      message: 'Keep view.mode as "map2d" or "map2_5d" and place 3D browsing data under extensions.scene3d.'
    }
  };
}

function blockedSkeleton(input: {
  baseSpec: MapSpec;
  diagnostics: Diagnostic[];
  targetDomains: MapGenerationTargetDomain[];
  traceId: string;
}): MapGenerationCommandSkeleton {
  return {
    status: "blocked",
    targetDomains: input.targetDomains,
    baseSpec: input.baseSpec,
    spec: structuredClone(input.baseSpec),
    commands: [],
    diagnostics: input.diagnostics,
    traceId: input.traceId
  };
}

function createBaseSpec(mapId?: string): MapSpec {
  return {
    version: "0.1",
    ...(mapId ? { id: mapId } : {}),
    revision: "0",
    view: {
      mode: "map2d"
    },
    sources: {},
    layers: []
  };
}

function toolInputErrorsToDiagnostics(errors: ErrorObject[], fallbackMessage: string): Diagnostic[] {
  return errors.map((error) => ({
    severity: "error",
    code: toolInputErrorToCode(error),
    message: error.message ?? fallbackMessage,
    path: error.instancePath || "/"
  }));
}

function toolInputErrorToCode(error: ErrorObject): Diagnostic["code"] {
  if (error.keyword === "additionalProperties") return DiagnosticCodes.SpecUnknownField;
  if (error.keyword === "required") return DiagnosticCodes.SpecMissingField;
  if (error.keyword === "const" && error.instancePath.endsWith("/version")) return DiagnosticCodes.SpecInvalidVersion;
  return DiagnosticCodes.SpecInvalidType;
}

function sortedEntries<T>(record: Record<string, T>): Array<[string, T]> {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function readString(input: unknown, key: string): string | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function sanitizeCommandPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}
