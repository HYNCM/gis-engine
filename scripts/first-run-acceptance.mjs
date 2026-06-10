#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArgs(process.argv.slice(2));
const startedAt = new Date();
const startMs = Date.now();
let smokeStatus = "passed";
let failureMessage = "";

try {
  execFileSync(process.execPath, [join(root, "scripts/cli-install-smoke.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
} catch (error) {
  smokeStatus = "failed";
  failureMessage = error instanceof Error ? error.message : String(error);
}

const endedAt = new Date();
const elapsedMs = Date.now() - startMs;
const budgetMs = options.maxMinutes * 60_000;
const withinBudget = elapsedMs <= budgetMs;
const passed = smokeStatus === "passed" && withinBudget;
const reportPath = resolve(root, options.outputPath);

writeReport(reportPath, {
  startedAt,
  endedAt,
  elapsedMs,
  maxMinutes: options.maxMinutes,
  smokeStatus,
  withinBudget,
  passed,
  failureMessage,
});

console.log(`First-run acceptance report written: ${relative(root, reportPath)}`);
if (!passed) process.exit(1);

function parseArgs(argv) {
  const parsed = {
    maxMinutes: 30,
    outputPath: `docs/reviews/first-run-acceptance-${new Date().toISOString().slice(0, 10)}.md`,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--max-minutes") {
      parsed.maxMinutes = parsePositiveNumber(argv[index + 1], "--max-minutes");
      index += 1;
      continue;
    }
    if (arg.startsWith("--max-minutes=")) {
      parsed.maxMinutes = parsePositiveNumber(arg.slice("--max-minutes=".length), "--max-minutes");
      continue;
    }
    if (arg === "--output") {
      parsed.outputPath = requireValue(argv[index + 1], "--output");
      index += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      parsed.outputPath = requireValue(arg.slice("--output=".length), "--output");
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return parsed;
}

function parsePositiveNumber(value, flag) {
  const raw = requireValue(value, flag);
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${flag} must be a positive number.`);
  }
  return number;
}

function requireValue(value, flag) {
  if (value === undefined || value.length === 0) throw new Error(`${flag} requires a value.`);
  return value;
}

function writeReport(path, result) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${renderReport(result)}\n`, "utf-8");
}

function renderReport(result) {
  const generatedAt = result.endedAt.toISOString();
  const elapsedSeconds = (result.elapsedMs / 1000).toFixed(1);
  const status = result.passed ? "passed" : "failed";
  const decisionLevel = result.passed ? "advisory" : "blocking";
  const failureLines = result.failureMessage ? ["", "## Failure", "", "```txt", result.failureMessage, "```"] : [];

  return [
    "---",
    "agent: builder",
    `period: ${generatedAt.slice(0, 10)}`,
    `generated_at: ${generatedAt}`,
    `repo_revision: "${getGitSha()}"`,
    "inputs:",
    "  - scripts/first-run-acceptance.mjs",
    "  - scripts/cli-install-smoke.mjs",
    "  - https://github.com/HYNCM/gis-engine/issues/9",
    'owner: "@builder"',
    `decision_level: ${decisionLevel}`,
    "---",
    "",
    "# W25 First-Run Acceptance",
    "",
    `Status: **${status}**`,
    "",
    "| Check | Evidence |",
    "| --- | --- |",
    `| Elapsed time | ${elapsedSeconds}s / ${result.maxMinutes}m budget |`,
    `| CLI install smoke | ${result.smokeStatus} |`,
    `| Time budget | ${result.withinBudget ? "within 30-minute first-run budget" : "exceeded first-run budget"} |`,
    "| Fresh consumer path | Packed local GA packages, installed in a temporary consumer project, scaffolded Vite TypeScript, and built the generated app |",
    "| Generated map review path | Mock provider generation, `map.json` preflight, artifact manifest verification, and required review files |",
    "| Prompt safety | `cli-install-smoke` asserts raw prompt text is not retained in generated files |",
    "",
    "## Required Review Files",
    "",
    "- `map.json`",
    "- `preflight.json`",
    "- `delivery-summary.json`",
    "- `REVIEW.md`",
    "",
    "## Command",
    "",
    "```bash",
    "pnpm smoke:first-run",
    "```",
    ...failureLines,
  ].join("\n");
}

function getGitSha() {
  try {
    return execSync("git rev-parse HEAD", { cwd: root, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function printHelp() {
  console.log(`
Usage: node scripts/first-run-acceptance.mjs [options]

Options:
  --max-minutes <n>  Acceptance budget in minutes (default: 30)
  --output <path>    Markdown report path (default: docs/reviews/first-run-acceptance-YYYY-MM-DD.md)
  --help, -h         Show this help message
`);
}
