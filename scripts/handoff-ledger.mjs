#!/usr/bin/env node

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { classifyReportEvidence, extractFrontMatter, reportReferencesArtifact } from "./agent-framework.mjs";
import { AGENT_REGISTRY, HANDOFF_FLOWS } from "./agent-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LEDGER_PATH = "docs/planning/handoff-ledger.json";

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

function extractGeneratedAt(content) {
  const frontMatter = extractFrontMatter(content);
  if (!frontMatter?.generated_at) return null;
  const date = new Date(String(frontMatter.generated_at).replace(/^"|"$/g, ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

function discoverReports(agentName, root = ROOT) {
  const agentDef = AGENT_REGISTRY[agentName];
  if (!agentDef?.reportSearch) return [];

  const reports = [];
  for (const search of agentDef.reportSearch) {
    const dir = join(root, search.dir);
    if (!existsSync(dir)) continue;

    for (const file of readdirSync(dir)) {
      if (!search.pattern.test(file)) continue;
      const fullPath = join(dir, file);
      const stats = statSync(fullPath);
      const content = readFileSync(fullPath, "utf-8");
      const frontMatter = extractFrontMatter(content);
      const generatedAt = extractGeneratedAt(content) ?? stats.mtime;
      const item = {
        agent: agentName,
        path: relative(root, fullPath),
        generatedAt,
        mtime: stats.mtime,
        sha256: createHash("sha256").update(content).digest("hex"),
        content,
        inputs: Array.isArray(frontMatter?.inputs) ? frontMatter.inputs : [],
        evidenceKind: classifyReportEvidence(content, frontMatter),
      };
      reports.push(item);
    }
  }

  return reports.sort((left, right) => right.generatedAt.getTime() - left.generatedAt.getTime());
}

export function findLatestReport(agentName, root = ROOT, options = {}) {
  const reports = discoverReports(agentName, root);
  if (!options.evidenceKind) return reports[0] ?? null;
  return reports.find((report) => report.evidenceKind === options.evidenceKind) ?? null;
}

export function inspectSpecialistEvidence(agentName, root = ROOT, now = new Date()) {
  const reports = discoverReports(agentName, root);
  const specialist = reports.find((report) => report.evidenceKind === "specialist") ?? null;
  const latestTemplate = reports.find((report) => report.evidenceKind === "template") ?? null;
  const slaMaxHours = AGENT_REGISTRY[agentName]?.slaMaxHours ?? null;
  const ageHours = specialist ? (now - specialist.generatedAt) / 3600000 : null;
  let diagnostic = null;

  if (!specialist && latestTemplate) {
    diagnostic = {
      code: "EVIDENCE.TEMPLATE_NOT_SPECIALIST",
      message: `${agentName} latest artifact is template-only, not specialist evidence`,
      action: `@${agentName} must publish evidence_kind: specialist with evidence-backed analysis`,
      observedAt: latestTemplate.generatedAt,
    };
  } else if (!specialist) {
    diagnostic = {
      code: "EVIDENCE.SPECIALIST_MISSING",
      message: `${agentName} has no specialist evidence`,
      action: `@${agentName} must publish evidence_kind: specialist with evidence-backed analysis`,
      observedAt: null,
    };
  } else if (slaMaxHours && ageHours > slaMaxHours) {
    diagnostic = {
      code: "EVIDENCE.SPECIALIST_STALE",
      message: `${agentName} specialist evidence is ${ageHours.toFixed(1)}h old (SLA: ${slaMaxHours}h)`,
      action: `@${agentName} must refresh specialist evidence before the SLA or handoff can pass`,
      observedAt: specialist.generatedAt,
    };
  }

  return {
    report: specialist,
    latestArtifact: reports[0] ?? null,
    latestTemplate,
    ageHours,
    diagnostic,
  };
}

export function classifyFlow(flow, upstream, downstream, options = {}) {
  if (flow.required && options.upstreamDiagnostic) {
    return {
      status: "invalid-upstream",
      severity: "error",
      code: options.upstreamDiagnostic.code,
      note: options.upstreamDiagnostic.message ?? `${flow.from} specialist evidence cannot satisfy ${flow.id}`,
      action: options.upstreamDiagnostic.action,
    };
  }

  if (!upstream) {
    return flow.required
      ? {
          status: "missing-upstream",
          severity: "warning",
          note: `${flow.from} has no report artifact`,
        }
      : {
          status: "idle",
          severity: "info",
          note: `${flow.from} is ad-hoc and has no active handoff`,
        };
  }

  if (upstream.evidenceKind === "template") {
    return {
      status: "invalid-upstream",
      severity: flow.required ? "error" : "warning",
      note: `${flow.from} latest report is template-only and cannot satisfy ${flow.id}`,
    };
  }

  if (!downstream) {
    if (flow.required && options.downstreamDiagnostic) {
      return {
        status: "pending",
        severity: "error",
        code: options.downstreamDiagnostic.code,
        note: options.downstreamDiagnostic.message ?? `${flow.to} specialist evidence cannot consume ${flow.id}`,
        action: options.downstreamDiagnostic.action,
      };
    }
    return {
      status: "pending",
      severity: flow.required ? "error" : "warning",
      note: `${flow.to} has not consumed ${flow.from} evidence`,
    };
  }

  if (downstream.evidenceKind === "template") {
    return {
      status: "pending",
      severity: flow.required ? "error" : "warning",
      note: `${flow.to} latest report is template-only and cannot consume ${flow.id}`,
    };
  }

  if (flow.required && options.downstreamDiagnostic) {
    return {
      status: "pending",
      severity: "error",
      code: options.downstreamDiagnostic.code,
      note: options.downstreamDiagnostic.message ?? `${flow.to} specialist evidence cannot consume ${flow.id}`,
      action: options.downstreamDiagnostic.action,
    };
  }

  if (downstream.generatedAt < upstream.generatedAt) {
    return {
      status: "pending",
      severity: flow.required ? "error" : "warning",
      note: `${flow.to} report is older than ${flow.from} report`,
    };
  }

  const reference = reportReferencesArtifact(downstream, upstream);
  if (!reference.matched) {
    return {
      status: "pending",
      severity: flow.required ? "error" : "warning",
      note: `${flow.to} report does not cite ${upstream.path}`,
    };
  }

  return {
    status: "consumed",
    severity: "info",
    note: `${flow.to} report cites ${reference.matched}`,
  };
}

export function buildHandoffLedger(root = ROOT, options = {}) {
  const generatedDate = options.generatedAt ?? new Date();
  const generatedAt = generatedDate.toISOString();
  const flows = HANDOFF_FLOWS.map((flow) => {
    const upstreamEvidence = inspectSpecialistEvidence(flow.from, root, generatedDate);
    const downstreamEvidence = inspectSpecialistEvidence(flow.to, root, generatedDate);
    const upstream = upstreamEvidence.report;
    const downstream = downstreamEvidence.report;
    const state = classifyFlow(flow, upstream, downstream, {
      upstreamDiagnostic: upstreamEvidence.diagnostic,
      downstreamDiagnostic: downstreamEvidence.diagnostic,
    });

    return {
      id: flow.id,
      from: flow.from,
      to: flow.to,
      description: flow.description,
      required: flow.required,
      status: state.status,
      severity: state.severity,
      code: state.code ?? null,
      note: state.note,
      action: state.action ?? null,
      upstream: upstream
        ? {
            path: upstream.path,
            generated_at: upstream.generatedAt.toISOString(),
            sha256: upstream.sha256,
          }
        : null,
      downstream: downstream
        ? {
            path: downstream.path,
            generated_at: downstream.generatedAt.toISOString(),
            sha256: downstream.sha256,
          }
        : null,
      latest_upstream_template: upstreamEvidence.latestTemplate
        ? {
            path: upstreamEvidence.latestTemplate.path,
            generated_at: upstreamEvidence.latestTemplate.generatedAt.toISOString(),
            sha256: upstreamEvidence.latestTemplate.sha256,
          }
        : null,
      latest_downstream_template: downstreamEvidence.latestTemplate
        ? {
            path: downstreamEvidence.latestTemplate.path,
            generated_at: downstreamEvidence.latestTemplate.generatedAt.toISOString(),
            sha256: downstreamEvidence.latestTemplate.sha256,
          }
        : null,
    };
  });

  return {
    generated_at: generatedAt,
    repo_revision: getRepoRevision(root),
    source: "scripts/handoff-ledger.mjs",
    evidence_run_id: options.evidenceRunId ?? null,
    issue_snapshot: options.issueSnapshot ?? null,
    flows,
  };
}

export function writeHandoffLedger(ledger, root = ROOT) {
  const outputPath = join(root, LEDGER_PATH);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf-8");
  return outputPath;
}

function renderSummary(ledger) {
  const rows = ledger.flows.map((flow) => {
    const upstream = flow.upstream?.path ?? "-";
    const downstream = flow.downstream?.path ?? "-";
    return `| ${flow.id} | ${flow.from} -> ${flow.to} | ${flow.status} | ${flow.severity} | ${upstream} | ${downstream} |`;
  });
  return [
    "# Handoff Ledger",
    "",
    `Generated: ${ledger.generated_at}`,
    `Revision: ${ledger.repo_revision}`,
    "",
    "| HOC | Flow | Status | Severity | Upstream | Downstream |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const check = args.includes("--check");
  const markdown = args.includes("--markdown");
  const ledger = buildHandoffLedger(ROOT);

  if (markdown) {
    console.log(renderSummary(ledger));
  } else if (dryRun) {
    console.log(JSON.stringify(ledger, null, 2));
  } else {
    const outputPath = writeHandoffLedger(ledger, ROOT);
    console.log(`Handoff ledger written: ${relative(ROOT, outputPath)}`);
  }

  if (check && ledger.flows.some((flow) => flow.required && ["error", "warning"].includes(flow.severity))) {
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
