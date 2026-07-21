#!/usr/bin/env node

import { readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { computeHealthMetrics, detectDataFlowAnomalies, generateDashboard } from "./dashboard-generator.mjs";
import { buildHandoffLedger, writeHandoffLedger } from "./handoff-ledger.mjs";
import {
  fetchIssues,
  ISSUE_SNAPSHOT_PATH,
  renderIssueSnapshot,
  summarizeIssues,
  writeIssueSnapshot,
} from "./issues-snapshot.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function buildEvidenceRunId(generatedAt) {
  return `planning-evidence-${generatedAt.toISOString().replace(/[-:.]/g, "")}`;
}

export function generatePlanningEvidence(options = {}) {
  const root = options.root ?? ROOT;
  const period = options.period ?? new Date().toISOString().slice(0, 10);
  const generatedAt = options.generatedAt ?? new Date();
  const evidenceRunId = options.evidenceRunId ?? buildEvidenceRunId(generatedAt);
  const issueResult = options.issueResult ?? fetchIssues({ root, env: options.env });

  if (!issueResult.available) {
    const error = new Error(
      `GitHub Issues snapshot unavailable; planning evidence preserved. ${issueResult.reason || "unknown"}`,
    );
    error.code = "ISSUE_SNAPSHOT_UNAVAILABLE";
    throw error;
  }

  const issueSummary = summarizeIssues(issueResult.issues);
  const issueSnapshot = { source: issueResult.source, ...issueSummary };
  const snapshot = renderIssueSnapshot(issueResult, { root, generatedAt, evidenceRunId });
  const ledger = buildHandoffLedger(root, { generatedAt, evidenceRunId, issueSnapshot });
  const metrics = computeHealthMetrics(root, generatedAt);
  const anomalies = detectDataFlowAnomalies(ledger);
  const dashboard = generateDashboard(metrics, anomalies, period, {
    root,
    generatedAt,
    evidenceRunId,
    issueSnapshot,
    ledger,
  });

  return {
    evidenceRunId,
    issueSummary,
    snapshot,
    ledger,
    dashboard,
  };
}

export function writePlanningEvidence(result, root = ROOT) {
  writeIssueSnapshot(result.snapshot, { root });
  writeHandoffLedger(result.ledger, root);
  writeIssueSnapshot(`${result.dashboard}\n`, {
    root,
    outputPath: "docs/planning/AGENT_HEALTH_DASHBOARD.md",
  });
}

function parseArgs(args) {
  const options = { dryRun: false, period: null, fixturePath: null, root: ROOT };
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--dry-run") options.dryRun = true;
    else if (args[index] === "--period" && args[index + 1]) options.period = args[++index];
    else if (args[index] === "--issues-fixture" && args[index + 1]) options.fixturePath = args[++index];
    else if (args[index] === "--root" && args[index + 1]) options.root = resolve(args[++index]);
  }
  return options;
}

function readIssueFixture(path) {
  const parsed = JSON.parse(readFileSync(resolve(path), "utf8"));
  const issues = Array.isArray(parsed) ? parsed : parsed.issues;
  if (!Array.isArray(issues)) {
    throw new Error("Issue fixture must be an array or contain an issues array");
  }
  return { available: true, source: "fixture", issues };
}

export function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);

  try {
    const result = generatePlanningEvidence({
      root: options.root,
      period: options.period ?? undefined,
      issueResult: options.fixturePath ? readIssueFixture(options.fixturePath) : undefined,
    });
    if (options.dryRun) {
      console.log(
        JSON.stringify(
          {
            evidence_run_id: result.evidenceRunId,
            issue_summary: result.issueSummary,
            handoff_statuses: result.ledger.flows.map(({ id, status }) => ({ id, status })),
            outputs: [
              ISSUE_SNAPSHOT_PATH,
              "docs/planning/handoff-ledger.json",
              "docs/planning/AGENT_HEALTH_DASHBOARD.md",
            ],
          },
          null,
          2,
        ),
      );
    } else {
      writePlanningEvidence(result, options.root);
      console.log(`Planning evidence written for run ${result.evidenceRunId}`);
    }
    return 0;
  } catch (error) {
    console.error(error.message);
    return error.code === "ISSUE_SNAPSHOT_UNAVAILABLE" ? 2 : 1;
  }
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  process.exitCode = main();
}
