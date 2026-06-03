/**
 * Provider diagnostics for CLI output.
 *
 * Validates the selected provider profile and returns safe diagnostics
 * without retaining raw credentials or server-only configuration.
 */

export interface ProviderDiagnostic {
  providerId: string;
  status: "ready" | "mock" | "unconfigured";
  mode: "mock" | "openai-compatible";
  diagnostics: string[];
}

const KNOWN_PROVIDERS = ["mock", "deepseek", "openai"] as const;

export function createProviderDiagnostics(providerId: string): ProviderDiagnostic {
  const id = providerId.toLowerCase();

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
    return {
      providerId: id,
      status: "unconfigured",
      mode: "openai-compatible",
      diagnostics: [
        `PROVIDER.CONFIG_REQUIRED`,
        `PROVIDER.BASE_URL_REQUIRED`,
        `PROVIDER.SERVER_ONLY`,
      ],
    };
  }

  return {
    providerId: id,
    status: "unconfigured",
    mode: "openai-compatible",
    diagnostics: [
      `PROVIDER.UNKNOWN_ID`,
      `PROVIDER.CONFIG_REQUIRED`,
    ],
  };
}
