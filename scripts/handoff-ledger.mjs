#!/usr/bin/env node

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractFrontMatter, reportReferencesArtifact } from "./agent-framework.mjs";
import { AGENT_REGISTRY, HANDOFF_FLOWS } from "./agent-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LEDGER_PATH = "docs/planning/handoff-ledger.json";

function getRepoRevision(root = ROOT) {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: root,
      encoding: "utf-8",
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

export function findLatestReport(agentName, root = ROOT) {
  const agentDef = AGENT_REGISTRY[agentName];
  if (!agentDef?.reportSearch) return null;

  let latest = null;
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
      };
      if (!latest || item.generatedAt > latest.generatedAt) {
        latest = item;
      }
    }
  }

  return latest;
}

export function classifyFlow(flow, upstream, downstream) {
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

  if (!downstream) {
    return {
      status: "pending",
      severity: flow.required ? "error" : "warning",
      note: `${flow.to} has not consumed ${flow.from} evidence`,
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

export function buildHandoffLedger(root = ROOT) {
  const generatedAt = new Date().toISOString();
  const flows = HANDOFF_FLOWS.map((flow) => {
    const upstream = findLatestReport(flow.from, root);
    const downstream = findLatestReport(flow.to, root);
    const state = classifyFlow(flow, upstream, downstream);

    return {
      id: flow.id,
      from: flow.from,
      to: flow.to,
      description: flow.description,
      required: flow.required,
      status: state.status,
      severity: state.severity,
      note: state.note,
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
    };
  });

  return {
    generated_at: generatedAt,
    repo_revision: getRepoRevision(root),
    source: "scripts/handoff-ledger.mjs",
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
