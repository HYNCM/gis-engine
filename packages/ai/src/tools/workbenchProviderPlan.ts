import { DiagnosticCodes, planMapGenerationRequest, type Diagnostic, type MapGenerationPromptPlan } from "@gis-engine/engine";

export interface WorkbenchProviderConfidence {
  level: "low" | "medium" | "high";
  reasons: string[];
}

export interface WorkbenchProviderPlanInput {
  providerId?: string;
  promptHash?: string;
  traceId?: string;
  intent?: unknown;
  confidence?: WorkbenchProviderConfidence;
  rawPrompt?: unknown;
  prompt?: unknown;
  promptText?: unknown;
  javascript?: unknown;
  commands?: unknown;
  mapSpec?: unknown;
  patch?: unknown;
}

export interface WorkbenchProviderPlan {
  plan: MapGenerationPromptPlan;
  provider: {
    providerId: string;
    retainedRawPrompt: false;
    confidence?: WorkbenchProviderConfidence;
  };
}

export type WorkbenchProviderPlanResponse =
  | { ok: true; result: WorkbenchProviderPlan; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const forbiddenOutputFields = ["rawPrompt", "prompt", "promptText", "javascript", "commands", "mapSpec", "patch"] as const;

export function normalizeWorkbenchProviderPlan(input: WorkbenchProviderPlanInput): WorkbenchProviderPlanResponse {
  const forbidden = forbiddenOutputFields.filter((field) => hasOwn(input, field));
  if (forbidden.length > 0) {
    return { ok: false, diagnostics: [unsupportedProviderOutputDiagnostic(forbidden)] };
  }

  if (!input.promptHash || !input.intent) {
    return { ok: false, diagnostics: [unsupportedProviderOutputDiagnostic(input.promptHash ? ["intent"] : ["promptHash"])] };
  }

  const plan = planMapGenerationRequest({
    promptHash: input.promptHash,
    ...(input.traceId ? { traceId: input.traceId } : {}),
    plannerId: input.providerId ?? "workbench-provider",
    intent: input.intent
  });

  if (plan.status === "blocked") {
    return { ok: false, diagnostics: plan.diagnostics };
  }

  return {
    ok: true,
    result: {
      plan,
      provider: {
        providerId: input.providerId ?? "workbench-provider",
        retainedRawPrompt: false,
        ...(input.confidence ? { confidence: input.confidence } : {})
      }
    },
    diagnostics: []
  };
}

function unsupportedProviderOutputDiagnostic(fields: readonly string[]): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: "Provider output must use promptHash and structured intent before command creation.",
    path: "/providerOutput",
    fix: {
      kind: "manual",
      confidence: "high",
      message: `Remove unsupported provider field(s): ${fields.join(", ")}. Normalize model output into structured intent.`
    }
  };
}

function hasOwn(input: WorkbenchProviderPlanInput, field: (typeof forbiddenOutputFields)[number]): boolean {
  return Object.prototype.hasOwnProperty.call(input, field);
}
