export { main } from "./bin.js";
export { parseArgs, type CliConfig } from "./config.js";
export { createProviderDiagnostics, type ProviderDiagnostic } from "./provider.js";
export { getTemplate, TEMPLATES, type Template, type TemplateName, type GeneratedFile } from "./templates/index.js";
export { generate, hashPrompt, type GenerateOptions, type GenerateResult } from "./generate.js";
