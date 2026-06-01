export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

export function buildProviderProfiles(env = process.env, options = {}) {
  const productMode = options.productMode ?? true;
  const profiles = [
    {
      id: "mock-ai",
      label: "Mock AI",
      protocol: "mock",
      model: "deterministic-mock",
      enabled: true,
      missingCredential: false
    }
  ];

  const deepSeekApiKey = readNonEmpty(env.DEEPSEEK_API_KEY);
  const deepSeekBaseUrl = readNonEmpty(env.GIS_WORKBENCH_DEEPSEEK_BASE_URL) ?? DEFAULT_DEEPSEEK_BASE_URL;
  const deepSeekResource = validateProviderBaseUrl(deepSeekBaseUrl, { productMode });
  profiles.push({
    id: "deepseek",
    label: "DeepSeek",
    protocol: "openai-chat-completions",
    baseUrl: deepSeekBaseUrl,
    model: readNonEmpty(env.GIS_WORKBENCH_DEEPSEEK_MODEL) ?? DEFAULT_DEEPSEEK_MODEL,
    apiKeyEnv: "DEEPSEEK_API_KEY",
    enabled: Boolean(deepSeekApiKey) && deepSeekResource.ok,
    missingCredential: !deepSeekApiKey,
    resourceStatus: deepSeekResource.ok ? "ready" : "blocked-resource",
    disabledDiagnostic: deepSeekResource.ok ? undefined : deepSeekResource.diagnostic
  });

  const customId = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_ID);
  if (customId) {
    const apiKeyEnv = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV) ?? "GIS_WORKBENCH_CUSTOM_API_KEY";
    const baseUrl = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL);
    const model = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL);
    const apiKey = readNonEmpty(env[apiKeyEnv]);
    const resource = validateProviderBaseUrl(baseUrl ?? "", { productMode });
    profiles.push({
      id: customId,
      label: readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL) ?? customId,
      protocol: "openai-chat-completions",
      baseUrl: baseUrl ?? "",
      model: model ?? "",
      apiKeyEnv,
      enabled: Boolean(baseUrl) && Boolean(model) && Boolean(apiKey) && resource.ok,
      missingCredential: !apiKey,
      resourceStatus: resource.ok ? "ready" : "blocked-resource",
      disabledDiagnostic: resource.ok ? undefined : resource.diagnostic
    });
  }

  return profiles;
}

export function publicProviderProfiles(profiles) {
  return profiles.map((profile) => ({
    id: profile.id,
    label: profile.label,
    protocol: profile.protocol,
    model: profile.model,
    enabled: profile.enabled,
    missingCredential: profile.missingCredential
  }));
}

export function resolveProviderProfile(profiles, providerId) {
  const selectedId = readNonEmpty(providerId) ?? "mock-ai";
  return profiles.find((profile) => profile.id === selectedId);
}

export function readProviderApiKey(profile, env = process.env) {
  if (!profile?.apiKeyEnv) return undefined;
  return readNonEmpty(env[profile.apiKeyEnv]);
}

export function providerDisabledDiagnostic(profile) {
  if (profile?.disabledDiagnostic) return profile.disabledDiagnostic;
  if (profile?.protocol && profile.protocol !== "mock" && profile.protocol !== "openai-chat-completions") {
    return {
      path: "/providerProfile",
      message: "Selected provider protocol is not supported."
    };
  }
  if (profile?.resourceStatus === "blocked-resource") {
    return {
      path: "/providerProfile/baseUrl",
      message: "Selected provider base URL is blocked by policy."
    };
  }
  if (!profile?.model) {
    return {
      path: "/providerProfile",
      message: "Selected provider model is not configured."
    };
  }
  if (profile?.missingCredential) {
    return {
      path: "/providerProfile",
      message: "Provider credential is not configured."
    };
  }
  return undefined;
}

export function validateProviderBaseUrl(baseUrl, options = {}) {
  const productMode = options.productMode ?? true;
  if (!baseUrl) {
    return diagnostic("/providerProfile", "Provider base URL is not configured.");
  }

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return diagnostic("/providerProfile/baseUrl", "Provider base URL must be an absolute URL.");
  }

  if (parsed.protocol !== "https:") {
    if (!productMode && parsed.protocol === "http:" && isLocalTestHost(parsed.hostname)) {
      return { ok: true };
    }
    return diagnostic("/providerProfile/baseUrl", "Provider base URL must use HTTPS.");
  }

  if (productMode && isBlockedProductHost(parsed.hostname)) {
    return diagnostic("/providerProfile/baseUrl", "Provider base URL host is blocked in product mode.");
  }

  return { ok: true };
}

function readNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function diagnostic(path, message) {
  return { ok: false, diagnostic: { path, message } };
}

function isBlockedProductHost(hostname) {
  const normalized = hostname.toLowerCase();
  return (
    isLocalTestHost(normalized) ||
    normalized === "0.0.0.0" ||
    normalized === "::" ||
    normalized === "[::]" ||
    normalized.startsWith("[fe80:") ||
    normalized.startsWith("[fc") ||
    normalized.startsWith("[fd") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("127.") ||
    normalized.startsWith("169.254.") ||
    normalized.startsWith("192.168.") ||
    isPrivate172(normalized)
  );
}

function isLocalTestHost(hostname) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}

function isPrivate172(hostname) {
  const match = /^172\.(\d{1,3})\./.exec(hostname);
  if (!match) return false;
  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}
