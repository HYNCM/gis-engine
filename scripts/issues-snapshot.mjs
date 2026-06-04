#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_PATH = "docs/planning/issues-snapshot.md";

function getRepoRevision() {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: ROOT,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function fetchIssues() {
  try {
    const output = execFileSync(
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
      { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { available: true, issues: JSON.parse(output) };
  } catch (error) {
    return {
      available: false,
      issues: [],
      reason: error.stderr?.toString().trim() || error.message,
    };
  }
}

function renderIssue(issue) {
  const labels = issue.labels?.map((label) => label.name).join(", ") || "-";
  const assignees =
    issue.assignees?.map((assignee) => `@${assignee.login}`).join(", ") || "-";
  const milestone = issue.milestone?.title || "-";
  return `| #${issue.number} | ${issue.state} | [${issue.title}](${issue.url}) | ${labels} | ${assignees} | ${milestone} | ${issue.updatedAt} |`;
}

function renderSnapshot(result) {
  const generatedAt = new Date().toISOString();
  const lines = [
    "---",
    "agent: orchestrator",
    "period: issue-snapshot",
    `generated_at: ${generatedAt}`,
    `repo_revision: "${getRepoRevision()}"`,
    "inputs:",
    "  - GitHub Issues API",
    'owner: "@orchestrator"',
    "decision_level: info",
    "---",
    "",
    "# GitHub Issues Planning Snapshot",
    "",
    "> This file is generated from GitHub Issues when `gh issue list` is available. Markdown planning files remain snapshots; GitHub Issues are the canonical task state once enabled.",
    "",
  ];

  if (!result.available) {
    lines.push("## Status", "");
    lines.push("- GitHub Issues snapshot unavailable in this environment.");
    lines.push(`- Reason: ${result.reason || "unknown"}`);
    return lines.join("\n");
  }

  const open = result.issues.filter((issue) => issue.state === "OPEN").length;
  const closed = result.issues.filter((issue) => issue.state === "CLOSED").length;

  lines.push("## Summary", "");
  lines.push(`- Open issues: ${open}`);
  lines.push(`- Closed issues in snapshot: ${closed}`);
  lines.push(`- Total returned: ${result.issues.length}`);
  lines.push("");
  lines.push("## Issues", "");
  lines.push(
    "| Issue | State | Title | Labels | Assignees | Milestone | Updated |",
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const issue of result.issues) {
    lines.push(renderIssue(issue));
  }

  return lines.join("\n");
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const result = fetchIssues();
  const content = `${renderSnapshot(result)}\n`;

  if (dryRun) {
    console.log(content);
    return;
  }

  const outputPath = join(ROOT, OUTPUT_PATH);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, "utf-8");
  console.log(`Issues snapshot written: ${OUTPUT_PATH}`);
}

main();
