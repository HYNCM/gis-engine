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
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createGenerationEvidenceBundle,
  type ExampleAppDeliverySummary,
  normalizeWorkbenchProviderPlan,
} from "@gis-engine/ai";
import {
  applyCommands,
  buildEngineCapabilityMatrix,
  createMapGenerationCommandSkeleton,
  createSourceReadinessReport,
  validateSpec,
} from "@gis-engine/engine";
// `buildEvidenceRecord`/`canonicalHash` reach `node:crypto`, so they live on the engine's
// `./evidence` subpath and never on the browser-facing root barrel.
import { buildEvidenceRecord, canonicalHash, type EvidenceRecordCommand } from "@gis-engine/engine/evidence";
import { type PreflightResult, preflightMapSpec } from "./preflight.js";
import { CLI_API_KEY_ENVS, createProviderDiagnostics, readProviderApiKey, resolveProviderProfile } from "./provider.js";
import { callProvider, type ProviderConfidence } from "./provider-http.js";
import { type AppConfig, type AppTemplateContext, getTemplate, normalizeAppConfig } from "./templates/index.js";

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
 * Produces "sha256:<full-hex>" format matching provider-http hashPromptFull.
 * The raw prompt is never retained.
 */
export function hashPrompt(prompt: string): string {
  return `sha256:${createHash("sha256").update(prompt).digest("hex")}`;
}

function getCliVersion(): string {
  const require = createRequire(fileURLToPath(import.meta.url));
  return (require("../package.json") as { version: string }).version;
}

type DeliveryReviewSummary = {
  status: ExampleAppDeliverySummary["status"];
  acceptance: ExampleAppDeliverySummary["acceptance"];
  sections: ExampleAppDeliverySummary["sections"];
  sourceReadiness: {
    total: number;
    supported: number;
    readinessOnly: number;
    blocked: number;
    sources: ExampleAppDeliverySummary["sourceReadiness"];
  };
  sourcePromotionCandidates: NonNullable<ExampleAppDeliverySummary["sourcePromotionCandidates"]>;
  spatialQueryReadiness: ExampleAppDeliverySummary["spatialQueryReadiness"];
  confirmationRequired: boolean;
  confirmations: ExampleAppDeliverySummary["confirmations"];
  followUps: ExampleAppDeliverySummary["followUps"];
};

type PreflightReviewSummary = {
  ok: boolean;
  status: PreflightResult["status"];
  mode: PreflightResult["mode"];
  validation: {
    valid: boolean;
    sourceCount: number;
    layerCount: number;
    diagnosticCounts: PreflightResult["validation"]["diagnosticCounts"];
  };
  sourceReadiness: {
    status: PreflightResult["sourceReadiness"]["status"];
    summary: PreflightResult["sourceReadiness"]["summary"];
  };
  pmtiles: {
    status: PreflightResult["pmtiles"]["status"];
    summary: PreflightResult["pmtiles"]["summary"];
  };
  diagnostics: {
    count: number;
    error: number;
    warning: number;
    info: number;
  };
};

function summarizeDeliveryForReview(delivery: ExampleAppDeliverySummary): DeliveryReviewSummary {
  return {
    status: delivery.status,
    acceptance: delivery.acceptance,
    sections: delivery.sections,
    sourceReadiness: {
      total: delivery.sourceReadiness.length,
      supported: delivery.sourceReadiness.filter((source) => source.state === "supported").length,
      readinessOnly: delivery.sourceReadiness.filter((source) => source.state === "readiness-only").length,
      blocked: delivery.sourceReadiness.filter((source) => source.state === "blocked").length,
      sources: delivery.sourceReadiness,
    },
    sourcePromotionCandidates: delivery.sourcePromotionCandidates ?? [],
    spatialQueryReadiness: delivery.spatialQueryReadiness,
    confirmationRequired: delivery.confirmationRequired,
    confirmations: delivery.confirmations,
    followUps: delivery.followUps,
  };
}

function summarizePreflightForReview(preflight: PreflightResult): PreflightReviewSummary {
  const diagnostics = countPreflightDiagnostics(preflight.diagnostics);

  return {
    ok: preflight.ok,
    status: preflight.status,
    mode: preflight.mode,
    validation: {
      valid: preflight.validation.valid,
      sourceCount: preflight.validation.stats.sourceCount,
      layerCount: preflight.validation.stats.layerCount,
      diagnosticCounts: preflight.validation.diagnosticCounts,
    },
    sourceReadiness: {
      status: preflight.sourceReadiness.status,
      summary: preflight.sourceReadiness.summary,
    },
    pmtiles: {
      status: preflight.pmtiles.status,
      summary: preflight.pmtiles.summary,
    },
    diagnostics,
  };
}

function countPreflightDiagnostics(diagnostics: PreflightResult["diagnostics"]): PreflightReviewSummary["diagnostics"] {
  return diagnostics.reduce(
    (counts, diagnostic) => ({
      count: counts.count + 1,
      error: counts.error + (diagnostic.severity === "error" ? 1 : 0),
      warning: counts.warning + (diagnostic.severity === "warning" ? 1 : 0),
      info: counts.info + (diagnostic.severity === "info" ? 1 : 0),
    }),
    { count: 0, error: 0, warning: 0, info: 0 },
  );
}

type DeliverySummaryReviewInput = {
  promptHash: string;
  traceId: string;
  provider: string;
  planStatus: string;
  commandCount: number;
  validation: {
    valid: boolean;
    sourceCount: number;
    layerCount: number;
  };
  evidenceStatus: string;
  retainedRawPrompt: boolean;
  generatedAt: string;
  preflight: PreflightReviewSummary;
  delivery?: DeliveryReviewSummary;
};

type GeneratedArtifactRole =
  | "mapspec"
  | "preflight"
  | "delivery-summary"
  | "review"
  | "evidence"
  | "diagnostics"
  | "app";

type GeneratedArtifactManifestEntry = {
  path: string;
  role: GeneratedArtifactRole;
  required: boolean;
  bytes: number;
  sha256: string;
};

type GeneratedArtifactManifest = {
  schemaVersion: "gis-engine.generate-artifact-manifest.v1";
  generatedAt: string;
  projectName: string;
  provider: string;
  promptHash: string;
  traceId: string;
  retainedRawPrompt: false;
  artifactCount: number;
  requiredReviewFiles: string[];
  files: GeneratedArtifactManifestEntry[];
};

const REQUIRED_REVIEW_FILES = [
  "map.json",
  "preflight.json",
  "delivery-summary.json",
  "REVIEW.md",
  "evidence.json",
] as const;

function classifyGeneratedArtifact(path: string): GeneratedArtifactRole {
  if (path === "map.json") return "mapspec";
  if (path === "preflight.json") return "preflight";
  if (path === "delivery-summary.json") return "delivery-summary";
  if (path === "REVIEW.md") return "review";
  if (path === "evidence.json") return "evidence";
  // The record is only third-party verifiable if the recomputation tool that ships beside it is
  // hashed by the record too, so it enters `files` as an artifact rather than as scaffold.
  if (path === "evidence-verifier.mjs") return "evidence";
  if (path === "diagnostics.json") return "diagnostics";
  return "app";
}

function hashFileSha256(filePath: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(filePath)).digest("hex")}`;
}

function readEngineVersion(): string {
  try {
    const pkg = createRequire(import.meta.url).resolve("@gis-engine/engine/package.json");
    return (JSON.parse(readFileSync(pkg, "utf-8")) as { version: string }).version;
  } catch {
    return "unknown";
  }
}

function readPackageManagerVersion(): string {
  // pnpm sets npm_config_user_agent="pnpm/11.9.0 npm/? node/..."; spawning pnpm here
  // would add a process per generate run for a string we already have.
  const agent = process.env.npm_config_user_agent ?? "";
  return agent.match(/^pnpm\/([\d.]+)/)?.[1] ?? "unknown";
}

/**
 * The standalone verifier beside the record, so a third party needs nothing else to recompute.
 * `@gis-engine/engine` publishes it through its `exports` map; the source-tree fallback only has to
 * cover workspace runs that resolve through the repo layout before the package is packed.
 */
function resolveVerifierPath(): string {
  try {
    return createRequire(import.meta.url).resolve("@gis-engine/engine/evidence-verifier.mjs");
  } catch {
    // Workspace runs resolve through the source tree before the package is packed.
    return fileURLToPath(new URL("../../engine/dist/evidence-verifier.mjs", import.meta.url));
  }
}

function createArtifactManifest(input: {
  outDir: string;
  files: string[];
  projectName: string;
  provider: string;
  promptHash: string;
  traceId: string;
}): GeneratedArtifactManifest {
  const entries = input.files.map<GeneratedArtifactManifestEntry>((path) => {
    const filePath = join(input.outDir, path);
    return {
      path,
      role: classifyGeneratedArtifact(path),
      required: REQUIRED_REVIEW_FILES.includes(path as (typeof REQUIRED_REVIEW_FILES)[number]),
      bytes: statSync(filePath).size,
      sha256: hashFileSha256(filePath),
    };
  });

  return {
    schemaVersion: "gis-engine.generate-artifact-manifest.v1",
    generatedAt: new Date().toISOString(),
    projectName: input.projectName,
    provider: input.provider,
    promptHash: input.promptHash,
    traceId: input.traceId,
    retainedRawPrompt: false,
    artifactCount: entries.length,
    requiredReviewFiles: [...REQUIRED_REVIEW_FILES],
    files: entries,
  };
}

function markdownCell(value: unknown): string {
  return String(value ?? "--")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

function boolLabel(value: boolean): string {
  return value ? "yes" : "no";
}

function renderDeliverySections(delivery?: DeliveryReviewSummary): string {
  if (!delivery) return "- Delivery evidence bundle was not available. See `delivery-summary.json`.\n";

  const rows = delivery.sections.map(
    (section) =>
      `| ${markdownCell(section.id)} | ${markdownCell(section.status)} | ${section.blockerCount} | ${boolLabel(section.confirmationRequired)} | ${section.followUpCount} |`,
  );

  return ["| Section | Status | Blockers | Confirmation | Follow-ups |", "|---|---:|---:|---:|---:|", ...rows, ""].join(
    "\n",
  );
}

function renderSourceReadiness(delivery?: DeliveryReviewSummary): string {
  if (!delivery) return "- Delivery source-readiness evidence was not available.\n";

  const summary = delivery.sourceReadiness;
  const lines = [
    `- Total: ${summary.total}`,
    `- Supported: ${summary.supported}`,
    `- Readiness-only: ${summary.readinessOnly}`,
    `- Blocked: ${summary.blocked}`,
  ];

  if (summary.sources.length === 0) {
    lines.push("- Sources: none");
    return `${lines.join("\n")}\n`;
  }

  lines.push("");
  lines.push("| Source | Type | State | Query ready | Fixture evidence | Resource policy |");
  lines.push("|---|---|---|---:|---|---|");
  for (const source of summary.sources) {
    lines.push(
      `| ${markdownCell(source.sourceId)} | ${markdownCell(source.type)} | ${markdownCell(source.state)} | ${boolLabel(source.queryReady)} | ${source.fixtureEvidenceStatus ? `${boolLabel(source.fixtureEvidenceReady ?? false)} / ${source.fixtureEvidenceStatus}` : "n/a"} | ${markdownCell(source.resourcePolicy)} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function renderSourcePromotionCandidates(delivery?: DeliveryReviewSummary): string {
  if (!delivery || delivery.sourcePromotionCandidates.length === 0) return "- None\n";

  return `${delivery.sourcePromotionCandidates
    .map(
      (candidate) =>
        `- ${candidate.candidateId}: ${candidate.format} is ${candidate.state}; target ${candidate.target}; exit condition: ${candidate.exitCondition}; sources: ${candidate.sourceIds.join(", ")}`,
    )
    .join("\n")}\n`;
}

function renderConfirmations(delivery?: DeliveryReviewSummary): string {
  if (!delivery || delivery.confirmations.length === 0) return "- None\n";

  return `${delivery.confirmations
    .map(
      (confirmation) =>
        `- ${confirmation.reason}: ${confirmation.required ? "required" : "not required"} for ${confirmation.target}`,
    )
    .join("\n")}\n`;
}

function renderFollowUps(delivery?: DeliveryReviewSummary): string {
  if (!delivery || delivery.followUps.length === 0) return "- None\n";

  return `${delivery.followUps
    .map(
      (followUp) =>
        `- ${followUp.id} (${followUp.owner}): ${followUp.reason}; target artifact: ${followUp.targetArtifact}`,
    )
    .join("\n")}\n`;
}

function renderReviewMarkdown(summary: DeliverySummaryReviewInput): string {
  const delivery = summary.delivery;
  const acceptanceState = delivery?.acceptance.state ?? delivery?.status ?? "unavailable";
  const preflightDiagnostics = summary.preflight.diagnostics;
  const preflightSourceSummary = summary.preflight.sourceReadiness.summary;
  const pmtilesSummary = summary.preflight.pmtiles.summary;
  const spatial = delivery?.spatialQueryReadiness;

  return `# Generated Map Review

## Acceptance

- Generated at: ${summary.generatedAt}
- Provider: ${summary.provider}
- Trace: ${summary.traceId}
- Prompt hash: ${summary.promptHash}
- Raw prompt retained: ${boolLabel(summary.retainedRawPrompt)}
- Delivery state: ${acceptanceState}
- Evidence status: ${summary.evidenceStatus}
- Preflight status: ${summary.preflight.status}
- Preflight ok: ${boolLabel(summary.preflight.ok)}
- Validation: ${summary.validation.valid ? "valid" : "invalid"} (${summary.validation.sourceCount} source(s), ${summary.validation.layerCount} layer(s))
- Commands applied: ${summary.commandCount}
- Plan status: ${summary.planStatus}
- Diagnostics: ${preflightDiagnostics.error} error(s), ${preflightDiagnostics.warning} warning(s), ${preflightDiagnostics.info} info item(s)

## Delivery Sections

${renderDeliverySections(delivery)}

## Source Readiness

${renderSourceReadiness(delivery)}

## Preflight Details

- Source readiness: ${summary.preflight.sourceReadiness.status} (${preflightSourceSummary.supportedSourceCount} supported, ${preflightSourceSummary.readinessOnlySourceCount} readiness-only, ${preflightSourceSummary.blockedSourceCount} blocked)
- PMTiles load plan: ${summary.preflight.pmtiles.status} (${pmtilesSummary.readySourceCount} ready, ${pmtilesSummary.metadataRequiredSourceCount} metadata-required, ${pmtilesSummary.blockedSourceCount} blocked)

## Spatial Query

- Requested: ${boolLabel(spatial?.requested ?? false)}
- State: ${spatial?.state ?? "unavailable"}
- Status: ${spatial?.status ?? "unavailable"}

## Source Promotion Candidates

${renderSourcePromotionCandidates(delivery)}

## Required Confirmations

${renderConfirmations(delivery)}

## Follow-ups

${renderFollowUps(delivery)}

## Review Files

- \`map.json\`: generated MapSpec.
- \`preflight.json\`: full preflight diagnostics and source-readiness details.
- \`delivery-summary.json\`: compact delivery and preflight summary for CI and reviewers.
- \`REVIEW.md\`: this human-readable review handoff.
- \`artifact-manifest.json\`: generated file list with roles, sizes, and sha256 hashes.
- \`evidence.json\`: full generation evidence bundle when evidence creation succeeds.
- \`diagnostics.json\`: written only when pipeline diagnostics are present.
`;
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
    // Mock: deterministic, no HTTP call. The `view` declaration is not decoration — an
    // `EvidenceRecord` requires at least one command (`evidence-record.v0.1` keeps `commands`
    // `minItems: 1`), and `buildGenerationCommands` only emits a command for a request field that
    // carries content. Without it the mock planner yields zero commands, so the very path every
    // `tests/cli` case and the offline smoke run uses could not produce a record at all.
    // `mode: "map2d"` is chosen because it matches the base spec the skeleton builds, so the
    // resulting `gen-set-view` command attests the viewport the run already had instead of
    // changing the generated map.
    intent = { targetDomains: ["feature-display"], view: { mode: "map2d" } };
    console.log(`  ✓ Mock provider: deterministic intent`);
  } else {
    // Real provider: HTTP call
    const profile = resolveProviderProfile(opts.provider, {
      ...(opts.model !== undefined ? { model: opts.model } : {}),
      ...(opts.baseUrl !== undefined ? { baseUrl: opts.baseUrl } : {}),
    });
    const apiKey = opts.apiKey ?? readProviderApiKey(opts.provider);
    if (!apiKey) {
      const envKey = CLI_API_KEY_ENVS[opts.provider.toLowerCase()] ?? `${opts.provider.toUpperCase()}_API_KEY`;
      throw new Error(
        `No API key found for provider "${opts.provider}". Set ${envKey} or pass --api-key before rerunning generate.`,
      );
    }

    const providerResult = await callProvider({
      profile,
      apiKey,
      message: promptText,
      ...(opts.timeout !== undefined ? { timeoutMs: opts.timeout } : {}),
    });

    if (!providerResult.ok) {
      const messages = providerResult.diagnostics.map((d) => `[${d.code}] ${d.message}`).join("; ");
      throw new Error(`Provider "${opts.provider}" call failed: ${messages}`);
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
    ...(opts.model !== undefined ? { model: opts.model } : {}),
    ...(opts.baseUrl !== undefined ? { baseUrl: opts.baseUrl } : {}),
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
    const messages = providerResult.diagnostics.map((d) => `[${d.code}] ${d.message}`).join("; ");
    throw new Error(`Provider plan normalization failed: ${messages}`);
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
    const appType = intentAppType === "dashboard" || intentAppType === "locator" ? intentAppType : "explorer";
    const intentComponents = Array.isArray(intentAppConfig?.components)
      ? intentAppConfig.components.filter((component): component is string => typeof component === "string")
      : undefined;
    appConfig = normalizeAppConfig(
      {
        appType,
        title: typeof intentAppConfig?.title === "string" ? intentAppConfig.title : opts.projectName,
        description:
          typeof intentAppConfig?.description === "string"
            ? intentAppConfig.description
            : `Interactive ${appType} map application`,
        ...(intentComponents !== undefined ? { components: intentComponents } : {}),
      },
      {
        projectName: opts.projectName,
        description: `Interactive ${appType} map application`,
      },
    );
  }

  const deliverySummaryBase = {
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
    ...(evidenceResult.ok ? { delivery: summarizeDeliveryForReview(evidenceResult.result.delivery) } : {}),
    ...(providerConfidence ? { confidence: providerConfidence } : {}),
    ...(appConfig ? { appConfig } : {}),
    retainedRawPrompt: false,
    generatedAt: new Date().toISOString(),
  };

  if (!opts.dryRun) {
    mkdirSync(outDir, { recursive: true });

    // map.json — the generated MapSpec
    const mapPath = join(outDir, "map.json");
    writeFileSync(mapPath, `${JSON.stringify(applied.spec, null, 2)}\n`, "utf-8");
    files.push("map.json");

    // preflight.json — generated MapSpec delivery preflight without network, worker, or archive parser side effects
    const preflightResult = preflightMapSpec({ filePath: mapPath });
    const preflightPath = join(outDir, "preflight.json");
    writeFileSync(preflightPath, `${JSON.stringify(preflightResult, null, 2)}\n`, "utf-8");
    files.push("preflight.json");
    console.log(`  ✓ Preflight: ${preflightResult.status}`);

    // delivery-summary.json — evidence without raw prompt
    const deliverySummary = {
      ...deliverySummaryBase,
      preflight: summarizePreflightForReview(preflightResult),
    };
    const summaryPath = join(outDir, "delivery-summary.json");
    writeFileSync(summaryPath, `${JSON.stringify(deliverySummary, null, 2)}\n`, "utf-8");
    files.push("delivery-summary.json");

    // REVIEW.md - human-readable handoff derived from delivery-summary.json fields
    const reviewPath = join(outDir, "REVIEW.md");
    writeFileSync(reviewPath, renderReviewMarkdown(deliverySummary), "utf-8");
    files.push("REVIEW.md");

    // diagnostics.json — all diagnostics from the pipeline
    const allDiagnostics = [...plan.diagnostics, ...skeleton.diagnostics, ...validation.diagnostics];
    if (allDiagnostics.length > 0) {
      const diagPath = join(outDir, "diagnostics.json");
      writeFileSync(diagPath, `${JSON.stringify(allDiagnostics, null, 2)}\n`, "utf-8");
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
          cliVersion: getCliVersion(),
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

    // evidence-verifier.mjs ships beside the record so a third party needs nothing else.
    const verifierTarget = join(outDir, "evidence-verifier.mjs");
    copyFileSync(resolveVerifierPath(), verifierTarget);
    files.push("evidence-verifier.mjs");

    const commandById = new Map(skeleton.commands.map((command) => [command.id, command]));
    const evidenceCommands: EvidenceRecordCommand[] = applied.results.map((result) => {
      const command = commandById.get(result.commandId);
      if (!command) throw new Error(`Command ${result.commandId} missing from generation skeleton.`);

      return {
        command,
        outcome: result.status,
        diagnostics: result.diagnostics,
        inversePatchHash: canonicalHash(result.inversePatch ?? []),
        ...(result.baseRevision ? { baseRevision: result.baseRevision } : {}),
        ...(result.nextRevision ? { nextRevision: result.nextRevision } : {}),
      };
    });

    const evidenceRecord = buildEvidenceRecord({
      project: {
        id: opts.projectName,
        baseRevision: applied.results[0]?.baseRevision ?? "initial",
        revision: applied.results[applied.results.length - 1]?.nextRevision ?? "initial",
      },
      origin: {
        actor: `provider:${opts.provider}`,
        providerKind: "cli-generate",
        promptHash,
      },
      commands: evidenceCommands,
      spec: {
        beforeHash: canonicalHash(skeleton.baseSpec),
        afterHash: canonicalHash(applied.spec),
        diffHash: canonicalHash(applied.results.flatMap((result) => result.changedPaths)),
      },
      artifacts: files.map((path) => ({
        path,
        role: classifyGeneratedArtifact(path),
        bytes: statSync(join(outDir, path)).size,
        sha256: hashFileSha256(join(outDir, path)),
      })),
      capabilities: buildEngineCapabilityMatrix({ readiness: createSourceReadinessReport(applied.spec).sources }),
      toolchain: {
        engineVersion: readEngineVersion(),
        nodeMajor: process.versions.node.split(".")[0] ?? "unknown",
        pnpmVersion: readPackageManagerVersion(),
      },
      issuer: "gis-engine-cli",
      issuedAt: new Date().toISOString(),
    });

    if (!evidenceRecord.ok) {
      rmSync(outDir, { recursive: true, force: true });
      console.error(`Evidence record rejected:\n${JSON.stringify(evidenceRecord.diagnostics, null, 2)}`);
      process.exitCode = 1;
      return {
        promptHash,
        planStatus: plan.status,
        commandCount: skeleton.commands.length,
        validationValid: validation.valid,
        evidenceStatus: "rejected",
        outputDir: outDir,
        files: [],
      };
    }

    // The record↔bundle link is deliberately not written here: `generate()` returns `GenerateResult`,
    // which carries no bundle, and `delivery-summary.json` was already hashed into the record, so a
    // bundle field set at this point would be unreachable by every consumer. The link lives in
    // `evidence.json`'s own `recordId`, which `artifact-manifest.json` hashes byte-for-byte and
    // `verifyArtifacts` cross-checks against the file set. A producer that holds both objects (the AI
    // path, Task 9's workbench receipt) sets the bundle's optional `recordId` itself.

    const evidencePath = join(outDir, "evidence.json");
    writeFileSync(evidencePath, `${JSON.stringify(evidenceRecord.record, null, 2)}\n`, "utf-8");
    files.push("evidence.json");

    // artifact-manifest.json - hashes and roles for all generated files written before the manifest itself
    const artifactManifest = createArtifactManifest({
      outDir,
      files,
      projectName: opts.projectName,
      provider: opts.provider,
      promptHash,
      traceId,
    });
    const artifactManifestPath = join(outDir, "artifact-manifest.json");
    writeFileSync(artifactManifestPath, `${JSON.stringify(artifactManifest, null, 2)}\n`, "utf-8");
    files.push("artifact-manifest.json");

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
