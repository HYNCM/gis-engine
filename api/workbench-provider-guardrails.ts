export type ServerlessEnv = Record<string, string | undefined>;

export type DeepSeekProviderProfile =
  | {
      ok: true;
      apiKey: string;
      baseUrl: string;
      model: string;
    }
  | {
      ok: false;
      code: "PROVIDER.UNAVAILABLE" | "PROVIDER.DISABLED" | "PROVIDER.BASE_URL_BLOCKED";
      message: string;
      disabledReason: "missing-credential" | "public-provider-disabled" | "unsafe-base-url";
    };

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

export function publicProviderProfiles(env: ServerlessEnv = process.env) {
  const deepseekKey = (env.DEEPSEEK_API_KEY ?? "").trim();
  const deepseekModel = (env.DEEPSEEK_MODEL ?? "").trim() || DEFAULT_DEEPSEEK_MODEL;
  const deepseek = resolveDeepSeekProvider(env);

  return [
    {
      id: "mock-ai",
      label: "Mock AI",
      protocol: "mock",
      enabled: true,
      missingCredential: false,
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      protocol: "openai-chat-completions",
      model: deepseekModel,
      enabled: deepseek.ok,
      missingCredential: !deepseekKey,
      ...(deepseek.ok ? {} : { disabledReason: deepseek.disabledReason }),
    },
  ];
}

export function resolveDeepSeekProvider(env: ServerlessEnv = process.env): DeepSeekProviderProfile {
  const apiKey = (env.DEEPSEEK_API_KEY ?? "").trim();
  if (!apiKey) {
    return {
      ok: false,
      code: "PROVIDER.UNAVAILABLE",
      disabledReason: "missing-credential",
      message: "DeepSeek API key not configured. Set DEEPSEEK_API_KEY.",
    };
  }

  if (!isPublicProviderEnabled(env)) {
    return {
      ok: false,
      code: "PROVIDER.DISABLED",
      disabledReason: "public-provider-disabled",
      message:
        "Serverless AI provider calls are disabled. Set GIS_ENGINE_ENABLE_PUBLIC_AI_PROVIDER=1 after configuring origin, quota, and abuse controls.",
    };
  }

  const baseUrl = (env.DEEPSEEK_BASE_URL ?? "").trim() || DEFAULT_DEEPSEEK_BASE_URL;
  const urlValidation = validateProviderBaseUrl(baseUrl);
  if (!urlValidation.ok) {
    return {
      ok: false,
      code: "PROVIDER.BASE_URL_BLOCKED",
      disabledReason: "unsafe-base-url",
      message: urlValidation.message,
    };
  }

  return {
    ok: true,
    apiKey,
    baseUrl: urlValidation.baseUrl,
    model: (env.DEEPSEEK_MODEL ?? "").trim() || DEFAULT_DEEPSEEK_MODEL,
  };
}

export function validateProviderBaseUrl(value: string): { ok: true; baseUrl: string } | { ok: false; message: string } {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, message: "Provider base URL must be an absolute URL." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, message: "Provider base URL must use HTTPS." };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (isBlockedHostname(hostname)) {
    return { ok: false, message: "Provider base URL must not target localhost, private, or link-local networks." };
  }

  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";
  return { ok: true, baseUrl: parsed.toString().replace(/\/+$/, "") };
}

function isPublicProviderEnabled(env: ServerlessEnv): boolean {
  const value = (env.GIS_ENGINE_ENABLE_PUBLIC_AI_PROVIDER ?? "").trim().toLowerCase();
  return value === "1" || value === "true";
}

function isBlockedHostname(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]"
  ) {
    return true;
  }

  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const octets = ipv4.slice(1).map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true;
  const [a, b] = octets;

  return (
    a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  );
}
