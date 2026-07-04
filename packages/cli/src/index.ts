export { formatVerifyArtifactsText, type VerifyArtifactsResult, verifyArtifacts } from "./artifacts.js";
export { main } from "./bin.js";
export { type CliConfig, parseArgs } from "./config.js";
export { type GenerateOptions, type GenerateResult, generate, hashPrompt } from "./generate.js";
export {
  formatLintText,
  type LintDiagnosticCounts,
  type LintOptions,
  type LintResult,
  lintMapSpec,
} from "./lint.js";
export {
  formatPreflightText,
  type PreflightDiagnosticCounts,
  type PreflightOptions,
  type PreflightResult,
  preflightMapSpec,
} from "./preflight.js";
export {
  CLI_API_KEY_ENVS,
  createProviderDiagnostics,
  type ProviderDiagnostic,
  readProviderApiKey,
  resolveProviderProfile,
} from "./provider.js";
export {
  callProvider,
  DEFAULT_PROVIDER_BYTE_CAP,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  type ProviderCallDiagnostic,
  type ProviderCallInput,
  type ProviderCallResult,
  type ProviderConfidence,
  type ProviderOutput,
  type ProviderProfile,
} from "./provider-http.js";
export {
  type AppConfig,
  type AppType,
  type CommunityManifestValidationResult,
  type CommunityTemplateDescriptor,
  type CommunityTemplateFile,
  type CommunityTemplateGenerateResult,
  type CommunityTemplateListEntry,
  type CommunityTemplateManifest,
  type GeneratedFile,
  generateCommunityTemplate,
  getCommunityTemplate,
  getTemplate,
  isCommunityTemplateName,
  listCommunityTemplates,
  normalizeAppConfig,
  parseCommunityTemplateName,
  registerCommunityTemplate,
  TEMPLATES,
  type Template,
  type TemplateName,
  unregisterCommunityTemplate,
  validateCommunityManifest,
} from "./templates/index.js";
