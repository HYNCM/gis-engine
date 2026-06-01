export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

export function buildProviderProfiles(env = process.env) {
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
  profiles.push({
    id: "deepseek",
    label: "DeepSeek",
    protocol: "openai-chat-completions",
    baseUrl: readNonEmpty(env.GIS_WORKBENCH_DEEPSEEK_BASE_URL) ?? DEFAULT_DEEPSEEK_BASE_URL,
    model: readNonEmpty(env.GIS_WORKBENCH_DEEPSEEK_MODEL) ?? DEFAULT_DEEPSEEK_MODEL,
    apiKeyEnv: "DEEPSEEK_API_KEY",
    enabled: Boolean(deepSeekApiKey),
    missingCredential: !deepSeekApiKey
  });

  const customId = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_ID);
  if (customId) {
    const apiKeyEnv = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV) ?? "GIS_WORKBENCH_CUSTOM_API_KEY";
    const baseUrl = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL);
    const model = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL);
    const apiKey = readNonEmpty(env[apiKeyEnv]);
    profiles.push({
      id: customId,
      label: readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL) ?? customId,
      protocol: "openai-chat-completions",
      baseUrl: baseUrl ?? "",
      model: model ?? "",
      apiKeyEnv,
      enabled: Boolean(baseUrl) && Boolean(model) && Boolean(apiKey),
      missingCredential: !apiKey
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

function readNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
