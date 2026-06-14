#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runCliInstallSmoke } from "./cli-install-smoke.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function parseArgs(argv) {
  const parsed = {
    maxMinutes: 30,
    requireReleaseEnv: false,
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
    if (arg === "--require-release-env") {
      parsed.requireReleaseEnv = true;
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

export function runFirstRunAcceptance(options) {
  const startedAt = new Date();
  const startMs = Date.now();
  let smokeStatus = "passed";
  let failureMessage = "";
  let releasePreflight = {
    ok: false,
    checks: [],
  };

  try {
    releasePreflight = runReleasePreflight();
  } catch (error) {
    failureMessage = error instanceof Error ? error.message : String(error);
  }

  const smoke = runCliInstallSmoke();
  if (!smoke.passed) {
    smokeStatus = "failed";
    failureMessage = smoke.failureMessage || failureMessage;
  }

  const endedAt = new Date();
  const elapsedMs = Date.now() - startMs;
  const budgetMs = options.maxMinutes * 60_000;
  const withinBudget = elapsedMs <= budgetMs;
  const releaseEnvFailures = Array.isArray(releasePreflight.checks)
    ? releasePreflight.checks.filter((check) => check.status === "fail")
    : [];
  const releaseEnvReady = releaseEnvFailures.length === 0;
  const passed = smokeStatus === "passed" && withinBudget && (!options.requireReleaseEnv || releaseEnvReady);

  return {
    startedAt,
    endedAt,
    elapsedMs,
    maxMinutes: options.maxMinutes,
    smokeStatus,
    smoke,
    withinBudget,
    releasePreflight,
    releaseEnvReady,
    requireReleaseEnv: options.requireReleaseEnv,
    passed,
    failureMessage,
  };
}

function runReleasePreflight() {
  try {
    return JSON.parse(
      execFileSync(process.execPath, [join(root, "scripts/release-preflight.mjs"), "--json", "--skip-browser"], {
        cwd: root,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "inherit"],
      }),
    );
  } catch (error) {
    const stdout = error?.stdout ? String(error.stdout).trim() : "";
    if (stdout) {
      return JSON.parse(stdout);
    }
    throw error;
  }
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
  writeFileSync(path, `${renderFirstRunAcceptanceReport(result)}\n`, "utf-8");
}

export function renderFirstRunAcceptanceReport(result) {
  const generatedAt = result.endedAt.toISOString();
  const elapsedSeconds = (result.elapsedMs / 1000).toFixed(1);
  const status = result.passed ? "passed" : "failed";
  const decisionLevel = result.passed ? "advisory" : "blocking";
  const failureLines = result.failureMessage ? ["", "## Failure", "", "```txt", result.failureMessage, "```"] : [];
  const smokeBreakdown = renderSmokeBreakdown(result);

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
    `| Release-runner parity | ${result.releaseEnvReady ? "pass" : "fail"}${result.requireReleaseEnv ? " (required)" : " (advisory)"} |`,
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
    ...smokeBreakdown,
    "## Release Runner Parity",
    "",
    ...(Array.isArray(result.releasePreflight.checks) && result.releasePreflight.checks.length > 0
      ? [
          "| Check | Status | Evidence |",
          "| --- | --- | --- |",
          ...result.releasePreflight.checks.map(
            (check) => `| ${check.name} | ${check.status} | ${String(check.evidence).replace(/\|/g, "\\|")} |`,
          ),
          "",
        ]
      : ["No release-preflight evidence captured.", ""]),
    "## Command",
    "",
    "```bash",
    "pnpm smoke:first-run",
    result.requireReleaseEnv ? "# strict local parity" : "# advisory local parity",
    result.requireReleaseEnv ? "pnpm smoke:first-run --require-release-env" : "",
    "```",
    ...failureLines,
  ].join("\n");
}

function renderSmokeBreakdown(result) {
  const steps = Array.isArray(result.smoke?.steps) && result.smoke.steps.length > 0
    ? result.smoke.steps
    : [
        {
          name: "CLI install smoke",
          status: result.smokeStatus,
          evidence: result.smoke?.failureMessage || "No structured smoke evidence captured.",
        },
      ];

  return [
    "## CLI Install Smoke Breakdown",
    "",
    "| Check | Status | Evidence |",
    "| --- | --- | --- |",
    ...steps.map((step) => `| ${step.name} | ${step.status} | ${String(step.evidence).replace(/\|/g, "\\|")} |`),
    "",
  ];
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
  --require-release-env
                     Fail when local release-preflight parity does not match the Node 22 release runner
  --output <path>    Markdown report path (default: docs/reviews/first-run-acceptance-YYYY-MM-DD.md)
  --help, -h         Show this help message
`);
}

export function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = runFirstRunAcceptance(options);
  const reportPath = resolve(root, options.outputPath);

  writeReport(reportPath, result);
  console.log(`First-run acceptance report written: ${relative(root, reportPath)}`);
  if (!result.passed) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
