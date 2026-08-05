#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const LABELS = [
  ["agent-escalation", "Agent workflow escalation", "D73A4A"],
  ["automation", "Automation infrastructure", "5319E7"],
];

function validateIncidentInput(workflow, failedRunId) {
  if (!String(workflow ?? "").trim()) throw new Error("workflow name is required");
  if (!/^\d+$/.test(String(failedRunId ?? ""))) throw new Error("failed run id must contain digits only");
}

export function buildIncidentMarker(workflow, failedRunId) {
  validateIncidentInput(workflow, failedRunId);
  return `<!-- agent-recovery:${encodeURIComponent(workflow)}:${failedRunId} -->`;
}

export function buildIncidentBody({ workflow, failedRunId, runUrl }) {
  const marker = buildIncidentMarker(workflow, failedRunId);
  const runLink = runUrl ? `[Open failed run](${runUrl})` : "Inspect the failed run in GitHub Actions.";
  return `${marker}
## Agent Workflow Failure Detected

- Workflow: \`${workflow}\`
- Failed run databaseId: \`${failedRunId}\`
- Run: ${runLink}

## Required Action

1. @orchestrator reviews the failed run and assigns an owner.
2. Apply and verify the fix without weakening deterministic gates.
3. Monitor a successful replacement run before closing this incident.
`;
}

function defaultRunGh(args) {
  const result = spawnSync("gh", args, { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    const error = new Error(`gh ${args.slice(0, 2).join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
    error.code = "RECOVERY.GH_FAILED";
    throw error;
  }
  return { stdout: result.stdout ?? "", stderr: result.stderr ?? "", status: result.status };
}

function runChecked(runGh, args) {
  const result = runGh(args) ?? {};
  if (result.status !== undefined && result.status !== 0) {
    const error = new Error(`gh ${args.slice(0, 2).join(" ")} failed: ${String(result.stderr ?? "").trim()}`);
    error.code = "RECOVERY.GH_FAILED";
    throw error;
  }
  return result;
}

function ensureLabels(runGh) {
  for (const [name, description, color] of LABELS) {
    try {
      runChecked(runGh, ["label", "create", name, "--description", description, "--color", color, "--force"]);
    } catch (error) {
      console.warn(`warning: could not ensure ${name} label: ${error.message}`);
    }
  }
}

export function reconcileRecoveryIncident(input, options = {}) {
  const { workflow, failedRunId, runUrl } = input;
  validateIncidentInput(workflow, failedRunId);
  const runGh = options.runGh ?? defaultRunGh;
  const marker = buildIncidentMarker(workflow, failedRunId);
  const title = `Agent Escalation: ${workflow} run ${failedRunId}`;
  const body = buildIncidentBody({ workflow, failedRunId, runUrl });
  const listResult = runChecked(runGh, [
    "issue",
    "list",
    "--state",
    "all",
    "--limit",
    "1000",
    "--json",
    "number,state,title,body,url",
  ]);
  const issues = JSON.parse(listResult.stdout || "[]");
  const canonical = issues
    .filter((issue) => String(issue.body ?? "").includes(marker))
    .sort((left, right) => Number(left.number) - Number(right.number))[0];

  ensureLabels(runGh);

  if (!canonical) {
    const created = runChecked(runGh, [
      "issue",
      "create",
      "--title",
      title,
      "--body",
      body,
      "--label",
      "agent-escalation",
      "--label",
      "automation",
    ]);
    return { action: "created", marker, url: String(created.stdout ?? "").trim() };
  }

  let action = "updated";
  if (String(canonical.state).toUpperCase() === "CLOSED") {
    runChecked(runGh, ["issue", "reopen", String(canonical.number)]);
    action = "reopened";
  }
  runChecked(runGh, [
    "issue",
    "edit",
    String(canonical.number),
    "--title",
    title,
    "--add-label",
    "agent-escalation",
    "--add-label",
    "automation",
  ]);
  runChecked(runGh, [
    "issue",
    "comment",
    String(canonical.number),
    "--body",
    `${marker}\nRecovery monitor observed this failed run again. ${runUrl ? `Run: ${runUrl}` : ""}`.trim(),
  ]);
  return { action, marker, issueNumber: canonical.number, url: canonical.url ?? null };
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--workflow" && args[index + 1]) parsed.workflow = args[++index];
    else if (args[index] === "--run-id" && args[index + 1]) parsed.failedRunId = args[++index];
    else if (args[index] === "--run-url" && args[index + 1]) parsed.runUrl = args[++index];
    else throw new Error(`unknown or incomplete argument: ${args[index]}`);
  }
  return parsed;
}

function main() {
  const result = reconcileRecoveryIncident(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`${error.code ?? "RECOVERY.INVALID_INPUT"}: ${error.message}`);
    process.exit(1);
  }
}
