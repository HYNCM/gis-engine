/**
 * CLI configuration: args parsing, config file resolution, and priority chain.
 *
 * Priority: flags > env vars > ~/.gis-engine/config.json > defaults
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface CliConfig {
  projectName: string;
  template: string;
  provider: string;
  model?: string;
  baseUrl?: string;
  generate: boolean;
  prompt?: string;
  yes: boolean;
  dryRun: boolean;
  help: boolean;
  version: boolean;
}

const DEFAULTS: Omit<CliConfig, "projectName" | "prompt" | "model" | "baseUrl"> = {
  template: "static-html",
  provider: "mock",
  generate: false,
  yes: false,
  dryRun: false,
  help: false,
  version: false,
};

interface FileConfig {
  template?: string;
  provider?: string;
  model?: string;
  baseUrl?: string;
}

function loadFileConfig(): FileConfig {
  const configPath = join(homedir(), ".gis-engine", "config.json");
  if (!existsSync(configPath)) return {};
  try {
    const raw = readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as FileConfig;
  } catch {
    return {};
  }
}

export function parseArgs(argv: string[]): CliConfig {
  const fileConfig = loadFileConfig();

  let projectName = "";
  let template = fileConfig.template ?? DEFAULTS.template;
  let provider = fileConfig.provider ?? DEFAULTS.provider;
  let model = fileConfig.model;
  let baseUrl = fileConfig.baseUrl;
  let generate = DEFAULTS.generate;
  let prompt: string | undefined;
  let yes = DEFAULTS.yes;
  let dryRun = DEFAULTS.dryRun;
  let help = DEFAULTS.help;
  let version = DEFAULTS.version;

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      help = true;
      i++;
    } else if (arg === "--version" || arg === "-v") {
      version = true;
      i++;
    } else if (arg === "--dry-run") {
      dryRun = true;
      i++;
    } else if (arg === "--yes" || arg === "--force" || arg === "-y") {
      yes = true;
      i++;
    } else if (arg === "--generate" || arg === "-g") {
      generate = true;
      i++;
    } else if (arg === "--prompt") {
      prompt = argv[++i] ?? prompt;
      i++;
    } else if (arg.startsWith("--prompt=")) {
      prompt = arg.slice("--prompt=".length);
      i++;
    } else if (arg === "--model") {
      model = argv[++i] ?? model;
      i++;
    } else if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length);
      i++;
    } else if (arg === "--base-url") {
      baseUrl = argv[++i] ?? baseUrl;
      i++;
    } else if (arg.startsWith("--base-url=")) {
      baseUrl = arg.slice("--base-url=".length);
      i++;
    } else if (arg === "--template" || arg === "-t") {
      template = argv[++i] ?? template;
      i++;
    } else if (arg === "--provider" || arg === "-p") {
      provider = argv[++i] ?? provider;
      i++;
    } else if (arg.startsWith("--template=")) {
      template = arg.slice("--template=".length);
      i++;
    } else if (arg.startsWith("--provider=")) {
      provider = arg.slice("--provider=".length);
      i++;
    } else if (!arg.startsWith("-") && !projectName) {
      projectName = arg;
      i++;
    } else {
      console.warn(`Warning: unknown argument "${arg}"`);
      i++;
    }
  }

  // Env vars override file config but are overridden by flags
  if (process.env.GIS_ENGINE_TEMPLATE && !argv.some(a => a.startsWith("--template") || a === "-t")) {
    template = process.env.GIS_ENGINE_TEMPLATE;
  }
  if (process.env.GIS_ENGINE_PROVIDER && !argv.some(a => a.startsWith("--provider") || a === "-p")) {
    provider = process.env.GIS_ENGINE_PROVIDER;
  }
  if (process.env.GIS_ENGINE_PROMPT && !argv.some(a => a.startsWith("--prompt"))) {
    prompt = process.env.GIS_ENGINE_PROMPT;
  }
  if (process.env.GIS_ENGINE_MODEL && !argv.some(a => a.startsWith("--model"))) {
    model = process.env.GIS_ENGINE_MODEL;
  }
  if (process.env.GIS_ENGINE_BASE_URL && !argv.some(a => a.startsWith("--base-url"))) {
    baseUrl = process.env.GIS_ENGINE_BASE_URL;
  }

  return { projectName, template, provider, model, baseUrl, generate, prompt, yes, dryRun, help, version };
}
