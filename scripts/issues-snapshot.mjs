#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
export const ISSUE_SNAPSHOT_PATH = "docs/planning/issues-snapshot.md";

function getRepoRevision(root = ROOT) {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

export function fetchIssues(options = {}) {
  const root = options.root ?? ROOT;
  const execute = options.execFileSync ?? execFileSync;

  try {
    const output = execute(
      "gh",
      [
        "issue",
        "list",
        "--state",
        "all",
        "--limit",
        "100",
        "--json",
        "number,title,state,labels,assignees,milestone,updatedAt,url",
      ],
      {
        cwd: root,
        encoding: "utf-8",
        env: options.env ?? process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const issues = JSON.parse(output);
    if (!Array.isArray(issues)) {
      throw new Error("GitHub Issues response must be an array");
    }
    return { available: true, source: "authenticated", issues };
  } catch (error) {
    return {
      available: false,
      source: "unavailable",
      issues: [],
      reason: error.stderr?.toString().trim() || error.message,
    };
  }
}

export function summarizeIssues(issues) {
  return {
    open: issues.filter((issue) => issue.state === "OPEN").length,
    closed: issues.filter((issue) => issue.state === "CLOSED").length,
    total: issues.length,
  };
}

function renderIssue(issue) {
  const labels = issue.labels?.map((label) => label.name).join(", ") || "-";
  const assignees = issue.assignees?.map((assignee) => `@${assignee.login}`).join(", ") || "-";
  const milestone = issue.milestone?.title || "-";
  return `| #${issue.number} | ${issue.state} | [${issue.title}](${issue.url}) | ${labels} | ${assignees} | ${milestone} | ${issue.updatedAt} |`;
}

export function renderIssueSnapshot(result, options = {}) {
  if (!result.available) {
    throw new Error(`GitHub Issues snapshot unavailable: ${result.reason || "unknown"}`);
  }

  const root = options.root ?? ROOT;
  const generatedAt = options.generatedAt ?? new Date();
  const evidenceRunId = options.evidenceRunId ?? `planning-evidence-${generatedAt.toISOString()}`;
  const summary = summarizeIssues(result.issues);
  const sourceUpdatedAt = result.issues
    .map((issue) => issue.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  const lines = [
    "---",
    "agent: orchestrator",
    "period: issue-snapshot",
    `generated_at: ${generatedAt.toISOString()}`,
    `repo_revision: "${options.repoRevision ?? getRepoRevision(root)}"`,
    "inputs:",
    `  - ${result.source === "fixture" ? "fixture-driven GitHub issue state" : "GitHub Issues API"}`,
    'owner: "@orchestrator"',
    "decision_level: info",
    `issue_source: ${result.source}`,
    `source_updated_at: ${sourceUpdatedAt ?? "unknown"}`,
    `evidence_run_id: ${evidenceRunId}`,
    "---",
    "",
    "# GitHub Issues Planning Snapshot",
    "",
    "> This file is generated from authenticated GitHub issue state or an explicit test fixture. Markdown planning files remain snapshots; GitHub Issues are the canonical task state once enabled.",
    "",
    "## Summary",
    "",
    `- Open issues: ${summary.open}`,
    `- Closed issues in snapshot: ${summary.closed}`,
    `- Total returned: ${summary.total}`,
    "",
    "## Issues",
    "",
    "| Issue | State | Title | Labels | Assignees | Milestone | Updated |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const issue of result.issues) {
    lines.push(renderIssue(issue));
  }

  return `${lines.join("\n")}\n`;
}

export function writeIssueSnapshot(content, options = {}) {
  const root = options.root ?? ROOT;
  const relativePath = options.outputPath ?? ISSUE_SNAPSHOT_PATH;
  const outputPath = join(root, relativePath);
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  mkdirSync(dirname(outputPath), { recursive: true });

  try {
    writeFileSync(temporaryPath, content, "utf-8");
    renameSync(temporaryPath, outputPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }

  return outputPath;
}

function parseArgs(args) {
  const options = { dryRun: false, fixturePath: null };
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--dry-run") options.dryRun = true;
    else if (args[index] === "--fixture" && args[index + 1]) options.fixturePath = args[++index];
  }
  return options;
}

function readFixture(path) {
  const parsed = JSON.parse(readFileSync(resolve(path), "utf8"));
  const issues = Array.isArray(parsed) ? parsed : parsed.issues;
  if (!Array.isArray(issues)) {
    throw new Error("Issue fixture must be an array or contain an issues array");
  }
  return { available: true, source: "fixture", issues };
}

export function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  let result;

  try {
    result = options.fixturePath ? readFixture(options.fixturePath) : fetchIssues();
  } catch (error) {
    result = { available: false, source: "unavailable", issues: [], reason: error.message };
  }

  if (!result.available) {
    console.error(`GitHub Issues snapshot unavailable; existing snapshot preserved. ${result.reason || "unknown"}`);
    return 2;
  }

  const content = renderIssueSnapshot(result);
  if (options.dryRun) {
    console.log(content);
    return 0;
  }

  writeIssueSnapshot(content);
  console.log(`Issues snapshot written: ${ISSUE_SNAPSHOT_PATH}`);
  return 0;
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  process.exitCode = main();
}
