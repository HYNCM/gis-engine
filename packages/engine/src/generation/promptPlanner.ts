import { Ajv, type ErrorObject } from "ajv/dist/ajv.js";
import { DiagnosticCodes } from "../diagnostics/codes.js";
import {
  MapGenerationPromptPlannerInputSchema,
  MapGenerationRequestSchema,
  type MapGenerationPromptPlannerInputFromSchema,
  type MapGenerationRequestFromSchema
} from "../spec/schemas/index.js";
import type { Diagnostic } from "../types.js";

export interface MapGenerationPromptPlan {
  status: "ready" | "blocked";
  traceId: string;
  request: MapGenerationRequestFromSchema;
  diagnostics: Diagnostic[];
  provenance: {
    plannerId: string;
    promptHash: string;
    retainedRawPrompt: false;
    acceptedIntentFields: string[];
    unsupportedIntentFields: string[];
  };
}

const ajv = new Ajv({ allErrors: true, strict: false });
const validatePlannerInput = ajv.compile(MapGenerationPromptPlannerInputSchema);
const validateGenerationRequest = ajv.compile(MapGenerationRequestSchema);

const rawPromptFields = ["prompt", "rawPrompt", "promptText"] as const;

export function planMapGenerationRequest(input: unknown): MapGenerationPromptPlan {
  const promptHash = readString(input, "promptHash") ?? "invalid-prompt-hash";
  const traceId = readString(input, "traceId") ?? defaultTraceId(promptHash);
  const plannerId = readString(input, "plannerId") ?? "structured-intent-v0.1";
  const rawPromptDiagnostics = rawPromptRetentionDiagnostics(input);

  if (!validatePlannerInput(input) || rawPromptDiagnostics.length > 0) {
    const diagnostics = uniqueDiagnostics([
      ...rawPromptDiagnostics,
      ...toolInputErrorsToDiagnostics(validatePlannerInput.errors ?? [], "Invalid map generation prompt planner input.")
    ]);
    return blockedPlan({ diagnostics, plannerId, promptHash, traceId, unsupportedIntentFields: unsupportedFields(input, diagnostics) });
  }

  const typedInput = input as MapGenerationPromptPlannerInputFromSchema;
  const intent = typedInput.intent ?? {};
  const request: MapGenerationRequestFromSchema = {
    ...structuredClone(intent),
    promptHash: typedInput.promptHash,
    traceId,
    ...(typedInput.createdAt ? { createdAt: typedInput.createdAt } : {})
  };

  if (!validateGenerationRequest(request)) {
    const diagnostics = toolInputErrorsToDiagnostics(validateGenerationRequest.errors ?? [], "Invalid planned map generation request.");
    return {
      status: "blocked",
      traceId,
      request,
      diagnostics,
      provenance: {
        plannerId,
        promptHash: typedInput.promptHash,
        retainedRawPrompt: false,
        acceptedIntentFields: acceptedIntentFields(intent),
        unsupportedIntentFields: unsupportedFields(input, diagnostics)
      }
    };
  }

  return {
    status: "ready",
    traceId,
    request,
    diagnostics: [],
    provenance: {
      plannerId,
      promptHash: typedInput.promptHash,
      retainedRawPrompt: false,
      acceptedIntentFields: acceptedIntentFields(intent),
      unsupportedIntentFields: []
    }
  };
}

function blockedPlan(input: {
  diagnostics: Diagnostic[];
  plannerId: string;
  promptHash: string;
  traceId: string;
  unsupportedIntentFields: string[];
}): MapGenerationPromptPlan {
  return {
    status: "blocked",
    traceId: input.traceId,
    request: {
      promptHash: input.promptHash,
      traceId: input.traceId
    },
    diagnostics: input.diagnostics,
    provenance: {
      plannerId: input.plannerId,
      promptHash: input.promptHash,
      retainedRawPrompt: false,
      acceptedIntentFields: [],
      unsupportedIntentFields: input.unsupportedIntentFields
    }
  };
}

function rawPromptRetentionDiagnostics(input: unknown): Diagnostic[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) return [];
  const record = input as Record<string, unknown>;
  return rawPromptFields.flatMap((field): Diagnostic[] =>
    field in record
      ? [
          {
            severity: "error",
            code: DiagnosticCodes.SpecUnknownField,
            message: "Prompt planner inputs must use promptHash and structured intent; raw prompt text is not retained by default.",
            path: `/${field}`,
            fix: {
              kind: "manual",
              confidence: "high",
              message: "Hash the prompt outside the planner and pass structured intent fields instead."
            }
          }
        ]
      : []
  );
}

function toolInputErrorsToDiagnostics(errors: ErrorObject[], fallbackMessage: string): Diagnostic[] {
  return errors.map((error) => ({
    severity: "error",
    code: toolInputErrorToCode(error),
    message: error.message ?? fallbackMessage,
    path: (additionalPropertyPath(error) ?? error.instancePath) || "/"
  }));
}

function toolInputErrorToCode(error: ErrorObject): Diagnostic["code"] {
  if (error.keyword === "additionalProperties") return DiagnosticCodes.SpecUnknownField;
  if (error.keyword === "required") return DiagnosticCodes.SpecMissingField;
  return DiagnosticCodes.SpecInvalidType;
}

function additionalPropertyPath(error: ErrorObject): string | undefined {
  if (error.keyword !== "additionalProperties") return undefined;
  const field = (error.params as { additionalProperty?: string }).additionalProperty;
  if (!field) return undefined;
  return `${error.instancePath}/${field}`.replace(/^\/\//, "/");
}

function unsupportedFields(input: unknown, diagnostics: Diagnostic[]): string[] {
  const fromDiagnostics = diagnostics
    .map((diagnostic) => (diagnostic.path ?? "").split("/").filter(Boolean).at(-1))
    .filter((field): field is string => Boolean(field));
  const fromRawPrompt = rawPromptFields.filter((field) => inputHasOwnProperty(input, field));
  return unique([...fromDiagnostics, ...fromRawPrompt]).sort();
}

function acceptedIntentFields(intent: object): string[] {
  return Object.keys(intent).sort();
}

function readString(input: unknown, key: string): string | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function inputHasOwnProperty(input: unknown, key: string): boolean {
  return Boolean(input && typeof input === "object" && !Array.isArray(input) && Object.prototype.hasOwnProperty.call(input, key));
}

function defaultTraceId(promptHash: string): string {
  return `planner.${promptHash.replace(/[^a-zA-Z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown"}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function uniqueDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.code}:${diagnostic.path ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
