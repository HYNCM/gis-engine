#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { classifyChangedFiles } from "./agent-framework.mjs";

const args = process.argv.slice(2);

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

const options = {
  base: readOption("--base"),
  head: readOption("--head") ?? "HEAD",
  run: args.includes("--run"),
  json: args.includes("--json"),
  summary: readOption("--summary"),
};

function gitChangedFiles() {
  const ranges = [];
  if (options.base) ranges.push(`${options.base}...${options.head}`);
  ranges.push("HEAD");
  ranges.push("HEAD~1..HEAD");

  let untracked = [];
  try {
    untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      encoding: "utf-8",
    })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    untracked = [];
  }

  for (const range of ranges) {
    try {
      const output = execFileSync("git", ["diff", "--name-only", range], {
        encoding: "utf-8",
      });
      const files = output
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const merged = [...new Set([...files, ...untracked])];
      if (merged.length > 0 || range === "HEAD") return merged;
    } catch {
      // Try the next range.
    }
  }
  return untracked;
}

function addGate(gates, command, reason) {
  if (!gates.has(command)) gates.set(command, new Set());
  gates.get(command).add(reason);
}

function fileMatches(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

export function buildPlan(files) {
  const gates = new Map();
  const classification = classifyChangedFiles(files);

  addGate(gates, "git diff --check", "whitespace and patch hygiene");

  if (classification.files.length === 0) {
    addGate(gates, "pnpm build:schema", "no diff detected; use conservative schema gate");
    addGate(gates, "pnpm check", "no diff detected; use conservative deterministic gate");
    return gates;
  }

  if (classification.docsOnly) {
    addGate(gates, "pnpm test:docs", "documentation-only change");
    addGate(gates, "node scripts/doc-generator.mjs links", "documentation link audit");
    return gates;
  }

  if (classification.docsTouched) {
    addGate(gates, "node scripts/doc-generator.mjs links", "documentation or coordination reference audit");
  }

  if (classification.requiresFrameworkChecks) {
    addGate(gates, "pnpm test:agent-framework", "agent coordination framework change");
  }

  addGate(gates, "pnpm build:schema", "non-doc change");

  if (files.some((file) => /^packages\/engine\/src\/spec\//.test(file))) {
    addGate(gates, "pnpm test:schema", "schema or validation change");
    addGate(gates, "pnpm test:schema-sync", "schema sync contract");
  }

  if (files.some((file) => /^packages\/engine\/src\/commands\//.test(file))) {
    addGate(gates, "pnpm test:commands", "command mutation contract");
    addGate(gates, "pnpm test:patch", "patch/replay behavior");
  }

  if (files.some((file) => /^packages\/engine\/src\/evidence\//.test(file) || /^tests\/evidence\//.test(file))) {
    addGate(gates, "pnpm test:evidence", "delivery evidence contract");
  }

  if (files.some((file) => /^packages\/ai\//.test(file))) {
    addGate(gates, "pnpm test:ai", "MCP and AI tool contract");
  }

  if (files.some((file) => /^packages\/cli\//.test(file))) {
    addGate(gates, "pnpm test:cli", "CLI behavior");
  }

  const workbenchTouched = files.some((file) =>
    fileMatches(file, [
      /^apps\/workbench\//,
      /^tests\/workbench\//,
      /^scripts\/workbench-/,
      /^packages\/cli\/src\/delivery\.ts$/,
    ]),
  );
  if (workbenchTouched) {
    addGate(gates, "pnpm workbench:build", "Workbench bundle");
    addGate(gates, "pnpm test:workbench", "Workbench behavior");
    addGate(gates, "pnpm test:workbench:security", "Workbench path, provider, export, and telemetry safety");
    addGate(gates, "pnpm test:workbench:e2e", "Workbench Mock-provider golden path");
    addGate(gates, "pnpm test:workbench:delivery", "Workbench install, build, preflight, and artifact hashes");
    addGate(gates, "pnpm test:resources", "Workbench data and external resource policy");
    addGate(
      gates,
      "GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual",
      "Workbench MapLibre 2D requires strict visual evidence",
    );
  }

  if (
    files.some((file) =>
      fileMatches(file, [/^packages\/scene3d/, /^packages\/scene3d-three-adapter\//, /^tests\/adapter\//]),
    )
  ) {
    addGate(gates, "pnpm test:adapter", "renderer adapter contract");
    addGate(gates, "pnpm test:release:scene3d", "SceneView3D release smoke gate");
  }

  if (
    files.some((file) =>
      fileMatches(file, [
        /^packages\/engine\/src\/spec\/resource-policy\.ts$/,
        /^tests\/resources\//,
        /^tests\/schema\/resource-policy\.test\.ts$/,
        /^examples\//,
      ]),
    )
  ) {
    addGate(gates, "pnpm test:resources", "resource policy or example surface");
  }

  if (files.some((file) => /^tests\/snapshot\//.test(file))) {
    addGate(gates, "pnpm test:snapshot:smoke", "snapshot behavior");
  }

  if (
    files.some((file) =>
      fileMatches(file, [
        /^packages\/engine\/src\/renderer\/maplibre\//,
        /^tests\/(?:adapter\/.*maplibre|e2e\/render-pipeline\.spec\.ts|snapshot\/visual\/maplibre-visual\.spec\.ts)/,
        /^scripts\/maplibre-compat-matrix\.mjs$/,
      ]),
    )
  ) {
    addGate(gates, "pnpm test:adapter", "MapLibre adapter contract");
    addGate(gates, "pnpm test:e2e:browser", "MapLibre browser integration");
    addGate(gates, "pnpm test:compat:maplibre", "exact-version MapLibre compatibility matrix");
    addGate(
      gates,
      "GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual",
      "MapLibre rendering changes require strict visual evidence",
    );
  }

  addGate(gates, "pnpm check", "full deterministic merge gate for non-doc changes");
  return gates;
}

function serializePlan(files, gates) {
  return {
    generated_at: new Date().toISOString(),
    decision: "planned",
    changed_files: files,
    gates: [...gates.entries()].map(([command, reasons]) => ({
      command,
      reasons: [...reasons],
      status: "planned",
      exit_code: null,
      duration_ms: null,
      diagnostics: [],
    })),
  };
}

export function buildGatePlan(files) {
  return serializePlan(files, buildPlan(files));
}

function defaultRunCommand(command) {
  // stdio is inherited so CI logs keep showing the gate output; only the outcome
  // (status, exit code, duration, diagnostic) is captured into the evidence.
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: "inherit" });
}

export function executePlan(plan, { runCommand = defaultRunCommand } = {}) {
  let failed = false;

  for (const [index, gate] of plan.gates.entries()) {
    if (failed) {
      gate.status = "not-run";
      continue;
    }

    const startedAt = Date.now();
    try {
      runCommand(gate.command);
      gate.status = "passed";
      gate.exit_code = 0;
    } catch (error) {
      failed = true;
      gate.status = "failed";
      gate.exit_code = Number.isInteger(error?.status) ? error.status : 1;
      gate.diagnostics = [
        {
          severity: "error",
          code: "GATE.COMMAND_FAILED",
          path: `/gates/${index}/command`,
          message: `${gate.command} exited with code ${gate.exit_code}.`,
        },
      ];
    } finally {
      gate.duration_ms = Date.now() - startedAt;
    }
  }

  plan.decision = failed ? "block" : "pass";
  return plan;
}

export function renderMarkdown(plan) {
  const executed = plan.gates.some((gate) => gate.status !== "planned");
  const lines = [
    "# Path-aware Gate Plan",
    "",
    `Generated: ${plan.generated_at}`,
    "",
    `gate_result: ${plan.decision}`,
    "",
    "## Changed Files",
    "",
  ];
  if (plan.changed_files.length === 0) {
    lines.push("- (none detected)");
  } else {
    for (const file of plan.changed_files) lines.push(`- \`${file}\``);
  }

  if (!executed) {
    lines.push(
      "",
      "> These gates were selected from the changed paths but have not been executed.",
      "> This is a plan, not gate evidence.",
    );
  }

  lines.push("", "## Gates", "", "| Command | Status | Exit | Duration | Reasons |", "| --- | --- | --- | --- | --- |");
  for (const gate of plan.gates) {
    lines.push(
      `| \`${gate.command}\` | ${gate.status} | ${gate.exit_code ?? "—"} | ${
        gate.duration_ms == null ? "—" : `${gate.duration_ms}ms`
      } | ${gate.reasons.join("; ")} |`,
    );
  }

  const failedGates = plan.gates.filter((gate) => gate.diagnostics.length > 0);
  if (failedGates.length > 0) {
    lines.push("", "## Diagnostics", "");
    for (const gate of failedGates) {
      for (const diagnostic of gate.diagnostics) {
        lines.push(`- \`${diagnostic.code}\` at \`${diagnostic.path}\`: ${diagnostic.message}`);
      }
    }
  }

  return lines.join("\n");
}

function main() {
  const plan = buildGatePlan(gitChangedFiles());

  if (options.run) executePlan(plan);

  if (options.summary) {
    writeFileSync(options.summary, `${renderMarkdown(plan)}\n`, "utf-8");
  }

  if (options.json) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(renderMarkdown(plan));
  }

  if (options.run) {
    process.exit(plan.decision === "block" ? 1 : 0);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
