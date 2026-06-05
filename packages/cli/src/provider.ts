/**
 * Provider diagnostics for CLI output.
 *
 * Validates the selected provider profile and returns safe diagnostics
 * without retaining raw credentials or server-only configuration.
 */

import type { ProviderProfile } from "./provider-http.js";

export interface ProviderDiagnostic {
  providerId: string;
  status: "ready" | "mock" | "unconfigured";
  mode: "mock" | "openai-compatible";
  model?: string;
  baseUrl?: string;
  diagnostics: string[];
}

const KNOWN_PROVIDERS = ["mock", "deepseek", "openai"] as const;

const DEFAULT_MODELS: Record<string, string> = {
  deepseek: "deepseek-chat",
  openai: "gpt-4o-mini",
};

const DEFAULT_BASE_URLS: Record<string, string> = {
  deepseek: "https://api.deepseek.com/v1",
  openai: "https://api.openai.com/v1",
};

export function createProviderDiagnostics(
  providerId: string,
  options?: { model?: string; baseUrl?: string }
): ProviderDiagnostic {
  const id = providerId.toLowerCase();
  const model = options?.model;
  const baseUrl = options?.baseUrl;

  if (id === "mock") {
    return {
      providerId: id,
      status: "mock",
      mode: "mock",
      diagnostics: [
        "MOCK.PLANNER_ACTIVE",
        "MOCK.DETERMINISTIC_OUTPUT",
        "MOCK.NO_EXTERNAL_CALLS",
      ],
    };
  }

  if (KNOWN_PROVIDERS.includes(id as typeof KNOWN_PROVIDERS[number])) {
    const resolvedModel = model ?? DEFAULT_MODELS[id];
    const resolvedBaseUrl = baseUrl ?? DEFAULT_BASE_URLS[id];
    const diagnostics: string[] = [];

    if (!model) diagnostics.push("PROVIDER.USING_DEFAULT_MODEL");
    if (!baseUrl) diagnostics.push("PROVIDER.USING_DEFAULT_BASE_URL");

    return {
      providerId: id,
      status: "unconfigured",
      mode: "openai-compatible",
      ...(resolvedModel !== undefined ? { model: resolvedModel } : {}),
      ...(resolvedBaseUrl !== undefined ? { baseUrl: resolvedBaseUrl } : {}),
      diagnostics: [
        ...diagnostics,
        "PROVIDER.CONFIG_REQUIRED",
        "PROVIDER.SERVER_ONLY",
      ],
    };
  }

  return {
    providerId: id,
    status: "unconfigured",
    mode: "openai-compatible",
    ...(model !== undefined ? { model } : {}),
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    diagnostics: [
      `PROVIDER.UNKNOWN_ID`,
      `PROVIDER.CONFIG_REQUIRED`,
    ],
  };
}

// ── Provider profile resolution ────────────────────────────────────────

/**
 * Maps known provider IDs to their API key environment variable.
 */
export const CLI_API_KEY_ENVS: Record<string, string> = {
  deepseek: "DEEPSEEK_API_KEY",
  openai: "OPENAI_API_KEY",
};

/**
 * Build a ProviderProfile from CLI config values.
 * Uses DEFAULT_MODELS / DEFAULT_BASE_URLS when not explicitly provided.
 */
export function resolveProviderProfile(
  providerId: string,
  options?: { model?: string; baseUrl?: string }
): ProviderProfile {
  const id = providerId.toLowerCase();
  return {
    id,
    model: options?.model ?? DEFAULT_MODELS[id] ?? "",
    baseUrl: options?.baseUrl ?? DEFAULT_BASE_URLS[id] ?? "",
  };
}

/**
 * Read the API key for a provider from environment variables.
 * Returns undefined if no key is configured.
 */
export function readProviderApiKey(providerId: string): string | undefined {
  const envKey = CLI_API_KEY_ENVS[providerId.toLowerCase()];
  if (!envKey) return undefined;
  const value = process.env[envKey];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
