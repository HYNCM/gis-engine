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
  apiKey?: string;
  timeout?: number;
  generate: boolean;
  prompt?: string;
  yes: boolean;
  dryRun: boolean;
  help: boolean;
  version: boolean;
}

const DEFAULTS: Omit<CliConfig, "projectName" | "prompt" | "model" | "baseUrl" | "apiKey" | "timeout"> = {
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
  apiKey?: string;
  timeout?: number;
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
  let apiKey = fileConfig.apiKey;
  let timeout = fileConfig.timeout;
  let generate = DEFAULTS.generate;
  let prompt: string | undefined;
  let yes = DEFAULTS.yes;
  let dryRun = DEFAULTS.dryRun;
  let help = DEFAULTS.help;
  let version = DEFAULTS.version;

  function nextValue(flag: string): string {
    const value = argv[++i];
    if (value === undefined || value.startsWith("-")) {
      console.error(`Error: ${flag} requires a value.\n`);
      help = true;
      return "";
    }
    return value;
  }

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (!arg) break;

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
      prompt = nextValue("--prompt") || prompt;
      i++;
    } else if (arg.startsWith("--prompt=")) {
      prompt = arg.slice("--prompt=".length);
      i++;
    } else if (arg === "--model") {
      model = nextValue("--model") || model;
      i++;
    } else if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length);
      i++;
    } else if (arg === "--base-url") {
      baseUrl = nextValue("--base-url") || baseUrl;
      i++;
    } else if (arg.startsWith("--base-url=")) {
      baseUrl = arg.slice("--base-url=".length);
      i++;
    } else if (arg === "--api-key") {
      apiKey = nextValue("--api-key") || apiKey;
      i++;
    } else if (arg.startsWith("--api-key=")) {
      apiKey = arg.slice("--api-key=".length);
      i++;
    } else if (arg === "--timeout") {
      const raw = argv[++i];
      if (raw === undefined || raw.startsWith("-")) {
        console.error(`Error: --timeout requires a value.\n`);
        help = true;
      } else {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > 0) timeout = parsed;
      }
      i++;
    } else if (arg.startsWith("--timeout=")) {
      const parsed = Number(arg.slice("--timeout=".length));
      if (Number.isFinite(parsed) && parsed > 0) timeout = parsed;
      i++;
    } else if (arg === "--template" || arg === "-t") {
      template = nextValue("--template") || template;
      i++;
    } else if (arg === "--provider" || arg === "-p") {
      provider = nextValue("--provider") || provider;
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
  if (process.env.GIS_ENGINE_API_KEY && !argv.some(a => a.startsWith("--api-key"))) {
    apiKey = process.env.GIS_ENGINE_API_KEY;
  }
  if (process.env.GIS_ENGINE_TIMEOUT && !argv.some(a => a.startsWith("--timeout"))) {
    const parsed = Number(process.env.GIS_ENGINE_TIMEOUT);
    if (Number.isFinite(parsed) && parsed > 0) timeout = parsed;
  }

  return {
    projectName,
    template,
    provider,
    ...(model !== undefined ? { model } : {}),
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    ...(apiKey !== undefined ? { apiKey } : {}),
    ...(timeout !== undefined ? { timeout } : {}),
    generate,
    ...(prompt !== undefined ? { prompt } : {}),
    yes,
    dryRun,
    help,
    version,
  };
}
