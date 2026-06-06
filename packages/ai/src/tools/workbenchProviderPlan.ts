import {
  type Diagnostic,
  DiagnosticCodes,
  type MapGenerationPromptPlan,
  planMapGenerationRequest,
} from "@gis-engine/engine";

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

const forbiddenOutputFields = [
  "rawPrompt",
  "prompt",
  "promptText",
  "javascript",
  "commands",
  "mapSpec",
  "patch",
] as const;

export function normalizeWorkbenchProviderPlan(input: WorkbenchProviderPlanInput): WorkbenchProviderPlanResponse {
  const providerId = normalizeProviderId(input.providerId);
  const promptHash = normalizePromptHash(input.promptHash);
  const traceId = normalizeTraceId(input.traceId);
  const forbidden = forbiddenOutputFields.filter((field) => hasOwn(input, field));
  if (forbidden.length > 0) {
    return { ok: false, diagnostics: [unsupportedProviderOutputDiagnostic(forbidden)] };
  }

  if (!promptHash || !input.intent) {
    return { ok: false, diagnostics: [unsupportedProviderOutputDiagnostic(promptHash ? ["intent"] : ["promptHash"])] };
  }

  const plan = planMapGenerationRequest({
    promptHash,
    ...(traceId ? { traceId } : {}),
    plannerId: providerId,
    intent: input.intent,
  });

  if (plan.status === "blocked") {
    return { ok: false, diagnostics: plan.diagnostics };
  }

  return {
    ok: true,
    result: {
      plan,
      provider: {
        providerId,
        retainedRawPrompt: false,
        ...(input.confidence ? { confidence: input.confidence } : {}),
      },
    },
    diagnostics: [],
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
      message: `Remove unsupported provider field(s): ${fields.join(", ")}. Normalize model output into structured intent.`,
    },
  };
}

function hasOwn(input: WorkbenchProviderPlanInput, field: (typeof forbiddenOutputFields)[number]): boolean {
  return Object.hasOwn(input, field);
}

function normalizeProviderId(providerId: string | undefined): string {
  if (!providerId) return "workbench-provider";
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(providerId) ? providerId : "workbench-provider";
}

function normalizePromptHash(promptHash: string | undefined): string | undefined {
  return promptHash && /^sha256:[A-Za-z0-9._:-]{1,96}$/.test(promptHash) ? promptHash : undefined;
}

function normalizeTraceId(traceId: string | undefined): string | undefined {
  return traceId && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(traceId) ? traceId : undefined;
}
