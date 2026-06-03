/**
 * CLI generate command — full pipeline from prompt to evidence output.
 *
 * Pipeline:
 *   prompt hash → provider structured plan → planMapGenerationRequest()
 *   → createMapGenerationCommandSkeleton() → applyCommands()
 *   → validateSpec() → createGenerationEvidenceBundle()
 *   → write evidence files (no raw prompt retention)
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  planMapGenerationRequest,
  createMapGenerationCommandSkeleton,
  applyCommands,
  validateSpec,
} from "@gis-engine/engine";
import {
  createGenerationEvidenceBundle,
  normalizeWorkbenchProviderPlan,
} from "@gis-engine/ai";
import { createProviderDiagnostics } from "./provider.js";

export interface GenerateOptions {
  projectName: string;
  provider: string;
  model?: string;
  baseUrl?: string;
  prompt?: string;
  intentFile?: string;
  dryRun: boolean;
}

export interface GenerateResult {
  promptHash: string;
  planStatus: string;
  commandCount: number;
  validationValid: boolean;
  evidenceStatus: string;
  outputDir: string;
  files: string[];
}

/**
 * Hash a prompt string with SHA-256. The raw prompt is never retained.
 */
export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}

/**
 * Run the full generate pipeline.
 */
export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const outDir = resolve(process.cwd(), opts.projectName);
  const promptText = opts.prompt ?? "Create a map with GeoJSON points";
  const promptHash = hashPrompt(promptText);
  const traceId = `cli-${Date.now().toString(36)}`;

  console.log(`\n🗺  Generate Pipeline`);
  console.log(`   Project:    ${opts.projectName}`);
  console.log(`   Prompt hash: ${promptHash}`);
  console.log(`   Provider:    ${opts.provider}`);
  if (opts.model) console.log(`   Model:       ${opts.model}`);
  if (opts.baseUrl) console.log(`   Base URL:    ${opts.baseUrl}`);
  console.log(`   Trace:       ${traceId}`);

  // Step 1: Provider plan normalization
  console.log(`\n  [1/5] Provider plan normalization...`);
  const providerDiag = createProviderDiagnostics(opts.provider, {
    model: opts.model,
    baseUrl: opts.baseUrl,
  });

  const providerInput: Record<string, unknown> = {
    providerId: opts.provider,
    promptHash,
    traceId,
    intent: {
      targetDomains: ["feature-display"],
    },
  };

  const providerResult = normalizeWorkbenchProviderPlan(providerInput);
  if (!providerResult.ok) {
    console.error(`  ❌ Provider plan failed:`, providerResult.diagnostics);
    process.exit(1);
  }
  console.log(`  ✓ Provider plan: ${providerResult.result.provider.providerId} (${providerResult.result.plan.status})`);

  // Step 2: Plan map generation request
  console.log(`  [2/5] Planning generation request...`);
  const planInput = {
    promptHash,
    traceId,
    plannerId: `cli-${opts.provider}`,
    intent: {
      targetDomains: ["feature-display" as const],
    },
  };

  const plan = planMapGenerationRequest(planInput);
  console.log(`  ✓ Plan: ${plan.status}, ${plan.diagnostics.length} diagnostics`);

  // Step 3: Create command skeleton
  console.log(`  [3/5] Creating command skeleton...`);
  const skeleton = createMapGenerationCommandSkeleton(plan.request);
  console.log(`  ✓ Skeleton: ${skeleton.status}, ${skeleton.commands.length} commands`);

  // Step 4: Apply commands and validate
  console.log(`  [4/5] Applying commands and validating...`);
  const applied = applyCommands(skeleton.baseSpec, skeleton.commands, {
    collectTrace: true,
    traceId,
  });
  const validation = validateSpec(applied.spec);
  console.log(`  ✓ Applied: ${applied.results.length} results, valid=${validation.valid}`);
  console.log(`  ✓ Validation: ${validation.stats.sourceCount} sources, ${validation.stats.layerCount} layers`);

  // Step 5: Create evidence bundle
  console.log(`  [5/5] Creating evidence bundle...`);
  const evidenceInput = {
    promptHash,
    skeleton,
    planner: { plan },
  };

  const evidenceResult = await createGenerationEvidenceBundle(evidenceInput);
  if (evidenceResult.ok) {
    console.log(`  ✓ Evidence bundle created`);
  } else {
    console.warn(`  ⚠ Evidence bundle: ${evidenceResult.diagnostics.length} diagnostics`);
  }

  // Write output files
  const files: string[] = [];

  const deliverySummary = {
    promptHash,
    traceId,
    provider: opts.provider,
    providerDiagnostics: providerDiag.diagnostics,
    planStatus: plan.status,
    commandCount: skeleton.commands.length,
    validation: {
      valid: validation.valid,
      sourceCount: validation.stats.sourceCount,
      layerCount: validation.stats.layerCount,
    },
    evidenceStatus: evidenceResult.ok ? "ok" : "diagnostics",
    retainedRawPrompt: false,
    generatedAt: new Date().toISOString(),
  };

  if (!opts.dryRun) {
    mkdirSync(outDir, { recursive: true });

    // map.json — the generated MapSpec
    const mapPath = join(outDir, "map.json");
    writeFileSync(mapPath, JSON.stringify(applied.spec, null, 2) + "\n", "utf-8");
    files.push("map.json");

    // delivery-summary.json — evidence without raw prompt
    const summaryPath = join(outDir, "delivery-summary.json");
    writeFileSync(summaryPath, JSON.stringify(deliverySummary, null, 2) + "\n", "utf-8");
    files.push("delivery-summary.json");

    // evidence.json — full evidence bundle
    if (evidenceResult.ok) {
      const evidencePath = join(outDir, "evidence.json");
      writeFileSync(evidencePath, JSON.stringify(evidenceResult.result, null, 2) + "\n", "utf-8");
      files.push("evidence.json");
    }

    // diagnostics.json — all diagnostics from the pipeline
    const allDiagnostics = [
      ...plan.diagnostics,
      ...skeleton.diagnostics,
      ...validation.diagnostics,
    ];
    if (allDiagnostics.length > 0) {
      const diagPath = join(outDir, "diagnostics.json");
      writeFileSync(diagPath, JSON.stringify(allDiagnostics, null, 2) + "\n", "utf-8");
      files.push("diagnostics.json");
    }

    console.log(`\n📁 Output files written to ${outDir}:`);
    for (const f of files) {
      console.log(`  ✓ ${f}`);
    }
  } else {
    console.log(`\n📋 dry-run — no files written.`);
  }

  console.log(`\n✅ Generate complete.`);

  return {
    promptHash,
    planStatus: plan.status,
    commandCount: skeleton.commands.length,
    validationValid: validation.valid,
    evidenceStatus: evidenceResult.ok ? "ok" : "diagnostics",
    outputDir: outDir,
    files,
  };
}
