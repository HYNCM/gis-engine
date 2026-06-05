#!/usr/bin/env node
/**
 * @gis-engine/cli — create-gis-map
 *
 * Scaffold a new GIS Engine map project from a template,
 * or run the full AI generate pipeline.
 *
 * Usage:
 *   npx create-gis-map <project-name> [options]
 *   npx create-gis-map <project-name> --template vite-ts
 *   npx create-gis-map <project-name> --generate [--provider mock] [--prompt "..."]
 *   npx create-gis-map <project-name> --generate -p deepseek --api-key sk-xxx --timeout 20000
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
 *   --dry-run        Preview files without writing
 *   --help, -h       Show this help message
 *   --version, -v    Print CLI version
 */

import { resolve, join } from "node:path";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { parseArgs } from "./config.js";
import { getTemplate, TEMPLATES } from "./templates/index.js";
import { createProviderDiagnostics } from "./provider.js";
import { generate } from "./generate.js";

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

  if (!config.projectName) {
    console.error("Error: <project-name> is required.\n");
    printHelp();
    process.exit(1);
  }

  // ── Generate pipeline mode ─────────────────────────────────────────
  if (config.generate) {
    const result = await generate({
      projectName: config.projectName,
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      prompt: config.prompt,
      apiKey: config.apiKey,
      timeout: config.timeout,
      template: config.template,
      dryRun: config.dryRun,
    });

    if (!result.validationValid) {
      console.warn("\n⚠ Generated spec has validation warnings. Check diagnostics.json for details.");
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
    model: config.model,
    baseUrl: config.baseUrl,
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
`);
}

function getVersion(): string {
  return "0.4.0";
}

// CLI entry — only run main() when executed directly (not when imported).
// Detect direct execution via import.meta.url matching process.argv[1].
const isDirectExecution =
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (isDirectExecution) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
