/**
 * CLI generate command — full pipeline from prompt to evidence output.
 *
 * Pipeline:
 *   1. Resolve provider intent (HTTP call for real providers, deterministic for mock)
 *   2. Provider plan normalization (normalizeWorkbenchProviderPlan)
 *   3. Create command skeleton (createMapGenerationCommandSkeleton)
 *   4. Apply commands and validate (applyCommands + validateSpec)
 *   5. Create evidence bundle (createGenerationEvidenceBundle)
 *   → write evidence files (no raw prompt retention)
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  createMapGenerationCommandSkeleton,
  applyCommands,
  validateSpec,
} from "@gis-engine/engine";
import {
  createGenerationEvidenceBundle,
  normalizeWorkbenchProviderPlan,
} from "@gis-engine/ai";
import {
  createProviderDiagnostics,
  resolveProviderProfile,
  readProviderApiKey,
  CLI_API_KEY_ENVS,
} from "./provider.js";
import {
  callProvider,
  type ProviderConfidence,
} from "./provider-http.js";
import {
  getTemplate,
  type AppTemplateContext,
  type AppConfig,
  normalizeAppConfig,
} from "./templates/index.js";

export interface GenerateOptions {
  projectName: string;
  provider: string;
  model?: string;
  baseUrl?: string;
  prompt?: string;
  apiKey?: string;
  timeout?: number;
  template?: string;
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
 * Hash a prompt string with SHA-256.
 * Produces "sha256:<32-hex>" format compatible with normalizeWorkbenchProviderPlan.
 * The raw prompt is never retained.
 */
export function hashPrompt(prompt: string): string {
  return `sha256:${createHash("sha256").update(prompt).digest("hex").slice(0, 32)}`;
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
  if (opts.timeout) console.log(`   Timeout:     ${opts.timeout}ms`);
  console.log(`   Trace:       ${traceId}`);

  // Step 1: Resolve provider intent
  console.log(`\n  [1/5] Resolving provider intent...`);

  let intent: Record<string, unknown>;
  let providerConfidence: ProviderConfidence | undefined;

  if (opts.provider === "mock") {
    // Mock: deterministic, no HTTP call
    intent = { targetDomains: ["feature-display"] };
    console.log(`  ✓ Mock provider: deterministic intent`);
  } else {
    // Real provider: HTTP call
    const profile = resolveProviderProfile(opts.provider, {
      model: opts.model,
      baseUrl: opts.baseUrl,
    });
    const apiKey = opts.apiKey ?? readProviderApiKey(opts.provider);
    if (!apiKey) {
      const envKey = CLI_API_KEY_ENVS[opts.provider.toLowerCase()] ?? `${opts.provider.toUpperCase()}_API_KEY`;
      console.error(`  ❌ No API key found. Set ${envKey} environment variable or pass --api-key.`);
      process.exit(1);
    }

    const providerResult = await callProvider({
      profile,
      apiKey,
      message: promptText,
      timeoutMs: opts.timeout,
    });

    if (!providerResult.ok) {
      console.error(`  ❌ Provider call failed:`);
      for (const d of providerResult.diagnostics) {
        console.error(`    [${d.code}] ${d.message}`);
      }
      process.exit(1);
    }

    intent = providerResult.providerOutput.intent;
    providerConfidence = providerResult.providerOutput.confidence;
    console.log(`  ✓ Provider: ${profile.id} (${profile.model})`);
    if (providerConfidence) {
      console.log(`  ✓ Confidence: ${providerConfidence.level} (${providerConfidence.reasons.length} reasons)`);
    }
  }

  // Step 2: Provider plan normalization
  console.log(`  [2/5] Provider plan normalization...`);
  const providerDiag = createProviderDiagnostics(opts.provider, {
    model: opts.model,
    baseUrl: opts.baseUrl,
  });

  const providerInput: Record<string, unknown> = {
    providerId: opts.provider,
    promptHash,
    traceId,
    intent,
    ...(providerConfidence ? { confidence: providerConfidence } : {}),
  };

  const providerResult = normalizeWorkbenchProviderPlan(providerInput);
  if (!providerResult.ok) {
    console.error(`  ❌ Provider plan failed:`, providerResult.diagnostics);
    process.exit(1);
  }

  const plan = providerResult.result.plan;
  console.log(`  ✓ Provider plan: ${providerResult.result.provider.providerId} (${plan.status})`);

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
    planner: {
      plan,
      ...(providerConfidence ? { confidence: providerConfidence } : {}),
    },
  };

  const evidenceResult = await createGenerationEvidenceBundle(evidenceInput);
  if (evidenceResult.ok) {
    console.log(`  ✓ Evidence bundle created`);
  } else {
    console.warn(`  ⚠ Evidence bundle: ${evidenceResult.diagnostics.length} diagnostics`);
  }

  // Write output files
  const files: string[] = [];

  // Extract app config from provider intent (if available)
  let appConfig: AppConfig | undefined;
  const intentAppType = intent.appType as string | undefined;
  const intentAppConfig = intent.appConfig as Record<string, unknown> | undefined;

  if (intentAppType || opts.template === "app") {
    const appType = (intentAppType === "dashboard" || intentAppType === "locator")
      ? intentAppType
      : "explorer";
    const intentComponents = Array.isArray(intentAppConfig?.components)
      ? intentAppConfig.components.filter((component): component is string => typeof component === "string")
      : undefined;
    appConfig = normalizeAppConfig({
      appType,
      title: typeof intentAppConfig?.title === "string" ? intentAppConfig.title : opts.projectName,
      description: typeof intentAppConfig?.description === "string"
        ? intentAppConfig.description
        : `Interactive ${appType} map application`,
      components: intentComponents,
    }, {
      projectName: opts.projectName,
      description: `Interactive ${appType} map application`,
    });
  }

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
    ...(providerConfidence ? { confidence: providerConfidence } : {}),
    ...(appConfig ? { appConfig } : {}),
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

    // App template: render full interactive application
    const templateName = opts.template === "static-html" && appConfig ? "app" : opts.template;
    if (templateName && templateName !== "mapspec") {
      const template = getTemplate(templateName);
      if (template) {
        const templateCtx: AppTemplateContext = {
          projectName: opts.projectName,
          provider: opts.provider,
          cliVersion: "0.4.0",
          ...(appConfig ? { appConfig } : {}),
        };
        const templateFiles = template.generate(templateCtx);
        for (const file of templateFiles) {
          // map.json is already written with the AI-generated spec; skip template placeholder
          if (file.path === "map.json") continue;
          const filePath = join(outDir, file.path);
          mkdirSync(resolve(filePath, ".."), { recursive: true });
          writeFileSync(filePath, file.content, "utf-8");
          files.push(file.path);
        }
        console.log(`  ✓ App template: ${templateName} (${templateFiles.length} files)`);
      }
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
