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
  generate: boolean;
  prompt?: string;
  dryRun: boolean;
  help: boolean;
  version: boolean;
}

const DEFAULTS: Omit<CliConfig, "projectName" | "prompt"> = {
  template: "static-html",
  provider: "mock",
  generate: false,
  dryRun: false,
  help: false,
  version: false,
};

interface FileConfig {
  template?: string;
  provider?: string;
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
  let generate = DEFAULTS.generate;
  let prompt: string | undefined;
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
    } else if (arg === "--generate" || arg === "-g") {
      generate = true;
      i++;
    } else if (arg === "--prompt") {
      prompt = argv[++i] ?? prompt;
      i++;
    } else if (arg.startsWith("--prompt=")) {
      prompt = arg.slice("--prompt=".length);
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

  return { projectName, template, provider, generate, prompt, dryRun, help, version };
}
