export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

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

  profiles.push({
    id: "deepseek",
    label: "DeepSeek",
    protocol: "openai-chat-completions",
    baseUrl: env.GIS_WORKBENCH_DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL,
    model: env.GIS_WORKBENCH_DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL,
    apiKeyEnv: "DEEPSEEK_API_KEY",
    enabled: Boolean(env.DEEPSEEK_API_KEY),
    missingCredential: !env.DEEPSEEK_API_KEY
  });

  const customId = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_ID);
  if (customId) {
    const apiKeyEnv = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV) ?? "GIS_WORKBENCH_CUSTOM_API_KEY";
    profiles.push({
      id: customId,
      label: readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL) ?? customId,
      protocol: "openai-chat-completions",
      baseUrl: readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL) ?? "",
      model: readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL) ?? "",
      apiKeyEnv,
      enabled:
        Boolean(readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL)) &&
        Boolean(readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL)) &&
        Boolean(env[apiKeyEnv]),
      missingCredential: !env[apiKeyEnv]
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
