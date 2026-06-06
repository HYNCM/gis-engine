#!/usr/bin/env node

/**
 * @gis-engine/cli — create-gis-map
 *
 * Scaffold a new GIS Engine map project from a template,
 * or run the full AI generate pipeline.
 *
 * Usage:
 *   npm exec --package @gis-engine/cli@latest -- create-gis-map <project-name> [options]
 *   npm exec --package @gis-engine/cli@latest -- create-gis-map <project-name> --template vite-ts
 *   npm exec --package @gis-engine/cli@latest -- create-gis-map <project-name> --generate [--provider mock] [--prompt "..."]
 *   npm exec --package @gis-engine/cli@latest -- create-gis-map <project-name> --generate -p deepseek --api-key sk-xxx --timeout 20000
 *   npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./map.json [--json]
 *
 * Options:
 *   --template, -t   Template to use: static-html | vite-ts | mapspec (default: static-html)
 *   --provider, -p   AI provider profile id (default: mock)
 *   --model          Model name for OpenAI-compatible provider
 *   --base-url       API base URL for OpenAI-compatible provider
 *   --generate, -g   Run the full AI generate pipeline instead of scaffolding
 *   --prompt         Prompt text for the generate pipeline (no raw prompt retained)
 *   --yes, -y        Skip directory-exists confirmation (overwrite)
 *   --api-key        API key for provider (overrides env var)
 *   --timeout        Provider request timeout in ms (default: 20000)
 *   --preflight      Validate and preflight a MapSpec JSON file
 *   --require-archive-metadata
 *                    Require PMTiles archive metadata for preflight success
 *   --pmtiles-metadata
 *                    PMTiles archive metadata input: <source-id>=<metadata.json>
 *   --json           Print preflight output as JSON
 *   --dry-run        Preview files without writing
 *   --help, -h       Show this help message
 *   --version, -v    Print CLI version
 */

import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./config.js";
import { generate } from "./generate.js";
import { formatPreflightText, preflightMapSpec } from "./preflight.js";
import { createProviderDiagnostics } from "./provider.js";
import { getTemplate, TEMPLATES } from "./templates/index.js";

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const config = parseArgs(argv);

  if (config.help) {
    printHelp();
    return;
  }

  if (config.version) {
    console.log(`create-gis-map v${getVersion()}`);
    return;
  }

  if (config.preflight) {
    const result = preflightMapSpec({
      filePath: config.preflight,
      requireArchiveMetadata: config.requireArchiveMetadata,
      pmtilesMetadata: config.pmtilesMetadata,
    });
    if (config.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      process.stdout.write(formatPreflightText(result));
    }
    if (!result.ok) process.exit(1);
    return;
  }

  if (!config.projectName) {
    console.error("Error: <project-name> is required.\n");
    printHelp();
    process.exit(1);
  }

  // ── Generate pipeline mode ─────────────────────────────────────────
  if (config.generate) {
    try {
      const result = await generate({
        projectName: config.projectName,
        provider: config.provider,
        ...(config.model !== undefined ? { model: config.model } : {}),
        ...(config.baseUrl !== undefined ? { baseUrl: config.baseUrl } : {}),
        ...(config.prompt !== undefined ? { prompt: config.prompt } : {}),
        ...(config.apiKey !== undefined ? { apiKey: config.apiKey } : {}),
        ...(config.timeout !== undefined ? { timeout: config.timeout } : {}),
        template: config.template,
        dryRun: config.dryRun,
      });

      if (!result.validationValid) {
        console.warn("\n⚠ Generated spec has validation warnings. Check diagnostics.json for details.");
      }
    } catch (error) {
      console.error(`\n❌ Generate pipeline failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
    return;
  }

  // ── Scaffold mode (default) ────────────────────────────────────────
  const template = getTemplate(config.template);
  if (!template) {
    console.error(`Error: unknown template "${config.template}".`);
    console.error(`Available templates: ${TEMPLATES.join(", ")}\n`);
    process.exit(1);
  }

  const outDir = resolve(process.cwd(), config.projectName);
  if (existsSync(outDir) && !config.yes) {
    console.error(`Error: directory "${config.projectName}" already exists. Use --yes to overwrite.`);
    process.exit(1);
  }

  const providerDiag = createProviderDiagnostics(config.provider, {
    ...(config.model !== undefined ? { model: config.model } : {}),
    ...(config.baseUrl !== undefined ? { baseUrl: config.baseUrl } : {}),
  });

  console.log(`\n📦 create-gis-map`);
  console.log(`   Project:  ${config.projectName}`);
  console.log(`   Template: ${config.template}`);
  console.log(`   Provider: ${config.provider} (${providerDiag.status})`);
  console.log(`   Output:   ${outDir}`);
  if (config.dryRun) {
    console.log(`   Mode:     dry-run (no files written)\n`);
  } else {
    console.log("");
  }

  const files = template.generate({
    projectName: config.projectName,
    provider: config.provider,
    cliVersion: getVersion(),
  });

  for (const file of files) {
    const filePath = join(outDir, file.path);
    if (config.dryRun) {
      console.log(`  [dry-run] would write ${file.path} (${file.content.length} bytes)`);
    } else {
      mkdirSync(resolve(filePath, ".."), { recursive: true });
      writeFileSync(filePath, file.content, "utf-8");
      console.log(`  ✓ ${file.path}`);
    }
  }

  if (!config.dryRun) {
    console.log(`\n✅ Project created at ${outDir}`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${config.projectName}`);
    if (config.template === "app" || config.template === "vite-ts") {
      console.log(`  npm install`);
      console.log(`  npm run dev`);
    } else if (config.template === "static-html") {
      console.log(`  open index.html`);
    } else {
      console.log(`  cat map.json`);
    }
  } else {
    console.log(`\n📋 dry-run complete — no files were written.`);
  }
}

function printHelp(): void {
  console.log(`
Usage: create-gis-map <project-name> [options]

Modes:
  scaffold     Create a project from a template (default)
  generate     Run the AI generate pipeline (--generate flag)
  preflight    Validate a MapSpec JSON file and PMTiles runtime load plan

Templates (scaffold mode):
  static-html   Standalone HTML file with inline GIS Engine (default)
  vite-ts       Vite + TypeScript project with GIS Engine
  mapspec       Minimal MapSpec JSON file only
  app           Full interactive map application (Vite + React + Tailwind)

Options:
  -t, --template   Template name (default: static-html)
  -p, --provider   AI provider profile id (default: mock)
      --model      Model name for OpenAI-compatible provider
      --base-url   API base URL for OpenAI-compatible provider
      --api-key    API key for provider (or set DEEPSEEK_API_KEY / OPENAI_API_KEY env)
      --timeout    Provider request timeout in ms (default: 20000)
  -g, --generate   Run AI generate pipeline instead of scaffolding
      --prompt     Prompt text for generate mode
      --preflight  Validate/preflight a MapSpec JSON file without writing files
      --require-archive-metadata
                   Require PMTiles archive metadata for preflight success
      --pmtiles-metadata
                   PMTiles archive metadata input: <source-id>=<metadata.json>
      --json       Print preflight output as JSON
  -y, --yes        Skip directory-exists check (overwrite)
      --dry-run    Preview files without writing
  -h, --help       Show help
  -v, --version    Print version

Examples:
  create-gis-map my-map                              Scaffold with static-html
  create-gis-map my-map -t vite-ts                   Scaffold with Vite + TS
  create-gis-map my-map -t app                       Scaffold interactive map app
  create-gis-map my-map -y                           Scaffold, overwrite if exists
  create-gis-map my-map --generate                   AI generate with mock provider
  create-gis-map my-map --generate -p deepseek       AI generate with deepseek
  create-gis-map my-map --generate -t app -p deepseek  AI generate interactive app
  create-gis-map my-map --generate --prompt "A map of NYC parks"
  create-gis-map --preflight ./map.json --json       Validate and preflight a MapSpec
  create-gis-map --preflight ./map.json --require-archive-metadata --pmtiles-metadata parcels=./parcels.metadata.json
`);
}

function getVersion(): string {
  const require = createRequire(fileURLToPath(import.meta.url));
  return (require("../package.json") as { version: string }).version;
}

export function isDirectCliExecution(entrypointUrl: string, argvPath: string | undefined): boolean {
  if (!argvPath) return false;

  let entrypointPath: string;
  try {
    entrypointPath = fileURLToPath(entrypointUrl);
  } catch {
    return false;
  }

  return normalizePath(resolveRealPath(entrypointPath)) === normalizePath(resolveRealPath(argvPath));
}

function resolveRealPath(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

// CLI entry — only run main() when executed directly (not when imported).
// npm/pnpm bin shims may execute a symlink, so compare real filesystem paths.
const isDirectExecution = typeof process !== "undefined" && isDirectCliExecution(import.meta.url, process.argv[1]);

if (isDirectExecution) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
