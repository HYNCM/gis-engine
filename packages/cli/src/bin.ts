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
 *
 * Options:
 *   --template, -t   Template to use: static-html | vite-ts | mapspec (default: static-html)
 *   --provider, -p   AI provider profile id (default: mock)
 *   --generate, -g   Run the full AI generate pipeline instead of scaffolding
 *   --prompt         Prompt text for the generate pipeline (no raw prompt retained)
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
      prompt: config.prompt,
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
  if (existsSync(outDir)) {
    console.error(`Error: directory "${config.projectName}" already exists.`);
    process.exit(1);
  }

  const providerDiag = createProviderDiagnostics(config.provider);

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
    if (config.template === "vite-ts") {
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

Options:
  -t, --template   Template name (default: static-html)
  -p, --provider   AI provider profile id (default: mock)
  -g, --generate   Run AI generate pipeline instead of scaffolding
      --prompt     Prompt text for generate mode
      --dry-run    Preview files without writing
  -h, --help       Show help
  -v, --version    Print version

Examples:
  create-gis-map my-map                           Scaffold with static-html
  create-gis-map my-map -t vite-ts                Scaffold with Vite + TS
  create-gis-map my-map --generate                AI generate with mock provider
  create-gis-map my-map --generate -p deepseek    AI generate with deepseek
  create-gis-map my-map --generate --prompt "A map of NYC parks"
`);
}

function getVersion(): string {
  return "0.1.0";
}

// CLI entry
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
