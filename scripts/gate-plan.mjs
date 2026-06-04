#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

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

function buildPlan(files) {
  const gates = new Map();
  const docsPatterns = [
    /^docs\//,
    /^README\.md$/,
    /^CHANGELOG\.md$/,
    /^AGENTS\.md$/,
    /^\.github\/agent-templates\//,
  ];
  const docsOnly =
    files.length > 0 &&
    files.every((file) => fileMatches(file, docsPatterns) || /^\.github\//.test(file));

  addGate(gates, "git diff --check", "whitespace and patch hygiene");

  if (files.length === 0) {
    addGate(gates, "pnpm build:schema", "no diff detected; use conservative schema gate");
    addGate(gates, "pnpm check", "no diff detected; use conservative deterministic gate");
    return gates;
  }

  if (docsOnly) {
    addGate(gates, "pnpm test:docs", "documentation-only change");
    addGate(gates, "node scripts/doc-generator.mjs links", "documentation link audit");
    return gates;
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

  if (files.some((file) => /^packages\/ai\//.test(file))) {
    addGate(gates, "pnpm test:ai", "MCP and AI tool contract");
  }

  if (files.some((file) => /^packages\/cli\//.test(file))) {
    addGate(gates, "pnpm test:cli", "CLI behavior");
  }

  if (files.some((file) => /^apps\/studio\//.test(file))) {
    addGate(gates, "pnpm test:studio", "Studio behavior");
    addGate(gates, "pnpm studio:build", "Studio bundle");
  }

  if (
    files.some((file) =>
      fileMatches(file, [
        /^packages\/scene3d/,
        /^packages\/scene3d-three-adapter\//,
        /^tests\/adapter\//,
      ]),
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

  addGate(gates, "pnpm check", "full deterministic merge gate for non-doc changes");
  return gates;
}

function serializePlan(files, gates) {
  return {
    generated_at: new Date().toISOString(),
    changed_files: files,
    gates: [...gates.entries()].map(([command, reasons]) => ({
      command,
      reasons: [...reasons],
    })),
  };
}

function renderMarkdown(plan) {
  const lines = [
    "# Path-aware Gate Plan",
    "",
    `Generated: ${plan.generated_at}`,
    "",
    "## Changed Files",
    "",
  ];
  if (plan.changed_files.length === 0) {
    lines.push("- (none detected)");
  } else {
    for (const file of plan.changed_files) lines.push(`- \`${file}\``);
  }
  lines.push("", "## Gates", "", "| Command | Reasons |", "| --- | --- |");
  for (const gate of plan.gates) {
    lines.push(`| \`${gate.command}\` | ${gate.reasons.join("; ")} |`);
  }
  return lines.join("\n");
}

function runGates(plan) {
  let failed = false;
  for (const gate of plan.gates) {
    console.log(`\n$ ${gate.command}`);
    try {
      execSync(gate.command, { stdio: "inherit" });
    } catch {
      failed = true;
      break;
    }
  }
  return failed ? 1 : 0;
}

const files = gitChangedFiles();
const gates = buildPlan(files);
const plan = serializePlan(files, gates);

if (options.summary) {
  writeFileSync(options.summary, `${renderMarkdown(plan)}\n`, "utf-8");
}

if (options.json) {
  console.log(JSON.stringify(plan, null, 2));
} else {
  console.log(renderMarkdown(plan));
}

if (options.run) {
  process.exit(runGates(plan));
}
