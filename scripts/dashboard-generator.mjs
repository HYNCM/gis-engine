#!/usr/bin/env node
/**
 * Agent Health Dashboard Generator
 *
 * 用法：
 *   node scripts/dashboard-generator.mjs [options]
 *
 * 选项：
 *   --dry-run      预览输出，不写文件
 *   --period <str> 指定周期（默认：当前日期）
 *
 * 功能：
 *   - 扫描所有 agent 报告文件的时间戳和完整性
 *   - 计算执行健康指标（成功率、平均延迟）
 *   - 检测数据流异常（agent-to-agent handoff gaps）
 *   - 生成 docs/planning/AGENT_HEALTH_DASHBOARD.md
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { AGENT_REGISTRY } from "./agent-registry.mjs";
import { buildHandoffLedger, findLatestReport, writeHandoffLedger } from "./handoff-ledger.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DASHBOARD_AGENTS = ["orchestrator", "product", "quality", "builder", "docs"];

function getGitSha(root = ROOT) {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

function getDateStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 计算执行健康指标
 */
export function computeHealthMetrics(root = ROOT, now = new Date()) {
  const metrics = [];

  for (const name of DASHBOARD_AGENTS) {
    const def = AGENT_REGISTRY[name];
    const latest = findLatestReport(name, root);
    let status = "unknown";
    let ageDays = null;

    if (latest) {
      const refDate = latest.generatedAt;
      ageDays = (now - refDate) / 86400000;

      if (latest.evidenceKind === "template") status = "template-only";
      else if (def.cadence === "daily" && ageDays > 2) status = "overdue";
      else if (def.cadence === "weekly" && ageDays > 8) status = "overdue";
      else if (def.cadence === "ad-hoc") status = "ok";
      else if (ageDays < 1) status = "fresh";
      else status = "ok";
    } else {
      if (def.cadence === "ad-hoc")
        status = "ok"; // ad-hoc 不强制
      else status = "missing";
    }

    metrics.push({
      agent: name,
      period: def.cadence,
      lastFile: latest?.path || "—",
      lastRun: latest ? latest.generatedAt.toISOString() : "—",
      status,
      evidenceKind: latest?.evidenceKind ?? null,
      ageDays: ageDays ? Math.round(ageDays) : null,
    });
  }

  return metrics;
}

/**
 * 检测数据流异常
 */
export function detectDataFlowAnomalies(ledger) {
  return ledger.flows
    .filter((flow) => flow.status !== "consumed" && flow.status !== "idle")
    .map((flow) => ({
      flow: `${flow.from} → ${flow.to}`,
      description: `${flow.description} (${flow.id})`,
      issue: flow.note,
      severity: flow.severity,
    }));
}

/**
 * 生成 Dashboard Markdown
 */
export function generateDashboard(metrics, anomalies, period, options = {}) {
  const generatedAt = options.generatedAt ?? new Date();
  const root = options.root ?? ROOT;
  const evidenceRunId = options.evidenceRunId ?? null;
  const issueSnapshot = options.issueSnapshot ?? null;
  const ledger = options.ledger ?? null;
  const lines = [];

  lines.push("---");
  lines.push(`generated_at: ${generatedAt.toISOString()}`);
  lines.push(`repo_revision: "${getGitSha(root)}"`);
  lines.push(`period: ${period}`);
  lines.push("agent: orchestrator");
  lines.push("decision_level: info");
  if (evidenceRunId) lines.push(`evidence_run_id: ${evidenceRunId}`);
  lines.push("---");
  lines.push("");
  lines.push(`# Agent Health Dashboard (as of ${period})`);
  lines.push("");
  lines.push("> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。");
  lines.push("> 状态为自动化推断，需 orchestrator 审查后确认。");
  lines.push("");

  if (issueSnapshot && ledger) {
    const requiredFlows = ledger.flows.filter((flow) => flow.required);
    const consumedFlows = requiredFlows.filter((flow) => flow.status === "consumed");
    lines.push("## Planning Evidence");
    lines.push("");
    lines.push("| Issue Source | Open | Closed | Total | Required Handoffs |");
    lines.push("| --- | ---: | ---: | ---: | --- |");
    lines.push(
      `| ${issueSnapshot.source} | ${issueSnapshot.open} | ${issueSnapshot.closed} | ${issueSnapshot.total} | ${consumedFlows.length}/${requiredFlows.length} consumed |`,
    );
    lines.push("");
  }

  // ── 执行健康 ──
  lines.push("## Execution Health");
  lines.push("");
  lines.push("| Agent | Cadence | Last Report | Last Run | Status | Age |");
  lines.push("| --- | --- | --- | --- | --- | --- |");

  const statusIcon = {
    fresh: "🟢",
    ok: "🟢",
    overdue: "🔴",
    "template-only": "🔴",
    missing: "🔴",
    unknown: "⚪",
  };

  for (const m of metrics) {
    const icon = statusIcon[m.status] || "⚪";
    const ageStr = m.ageDays !== null ? `${m.ageDays}d` : "—";
    lines.push(
      `| @${m.agent} | ${m.period} | ${m.lastFile} | ${m.lastRun.slice(0, 10)} | ${icon} ${m.status} | ${ageStr} |`,
    );
  }

  lines.push("");

  // ── 数据流健康 ──
  lines.push("## Data Flow Health");
  lines.push("");

  if (anomalies.length === 0) {
    lines.push("✅ 所有 agent-to-agent 数据流时序正常。");
  } else {
    lines.push("| Flow | Issue | Severity |");
    lines.push("| --- | --- | --- |");
    for (const a of anomalies) {
      const icon = a.severity === "error" ? "🔴" : "🟡";
      lines.push(`| ${a.flow}<br/>*${a.description}* | ${a.issue} | ${icon} ${a.severity} |`);
    }
  }

  lines.push("");

  // ── SLA 合规 ──
  lines.push("## SLA Compliance");
  lines.push("");
  lines.push("| Agent | SLA | Max Latency | Current | Status |");
  lines.push("| --- | --- | --- | --- | --- |");

  for (const m of metrics) {
    const agentDef = AGENT_REGISTRY[m.agent];
    if (!agentDef?.slaMaxHours) continue;
    const maxDays = agentDef.slaMaxHours / 24;
    const desc = agentDef.cadence === "daily" ? "每日 00:00 UTC" : "周一 00:00 UTC";
    const compliant = m.evidenceKind !== "template" && m.ageDays !== null && m.ageDays <= maxDays;
    const icon = compliant ? "✅" : "❌";
    const ageStr = m.ageDays !== null ? `${m.ageDays}d` : "missing";
    lines.push(`| @${m.agent} | ${desc} | ${maxDays}d | ${ageStr} | ${icon} ${compliant ? "compliant" : "breach"} |`);
  }

  lines.push("");
  lines.push("> ℹ️ ad-hoc agent (builder) 无固定 SLA。");

  lines.push("");

  // ── Action Items ──
  lines.push("## Action Items");
  lines.push("");

  const actionItems = [];

  for (const m of metrics) {
    if (m.status === "missing") {
      actionItems.push(`- [ ] **@${m.agent}**: 无任何报告产出 → 确认 agent 是否已激活`);
    } else if (m.status === "template-only") {
      actionItems.push(`- [ ] **@${m.agent}**: 最新产物仅为模板 → 补充 specialist evidence`);
    } else if (m.status === "overdue") {
      actionItems.push(`- [ ] **@${m.agent}**: 报告逾期 ${m.ageDays} 天 → 手动触发或检查 cron`);
    }
  }

  for (const a of anomalies) {
    actionItems.push(`- [ ] **${a.flow}**: ${a.issue} → 检查 handoff 时序`);
  }

  if (actionItems.length === 0) {
    actionItems.push("✅ 当前无待处理操作项。");
  }

  for (const item of actionItems) {
    lines.push(item);
  }

  lines.push("");

  // ── 统计 ──
  const okCount = metrics.filter((m) => m.status === "ok" || m.status === "fresh").length;
  const problemCount = metrics.filter(
    (m) => m.status === "overdue" || m.status === "missing" || m.status === "template-only",
  ).length;
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **健康 agent**: ${okCount}/${metrics.length}`);
  lines.push(`- **问题 agent**: ${problemCount}/${metrics.length}`);
  lines.push(`- **数据流异常**: ${anomalies.length}`);
  lines.push(`- **生成时间**: ${generatedAt.toISOString()}`);

  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let period = getDateStr();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") dryRun = true;
    else if (args[i] === "--period" && args[i + 1]) period = args[++i];
  }

  console.log(`📊 Agent Health Dashboard Generator`);
  console.log(`   日期: ${period}`);
  console.log(`   仓库: ${ROOT}`);
  console.log("");

  console.log(`🔍 计算执行健康指标...`);
  const metrics = computeHealthMetrics();

  console.log(`🔍 生成 handoff ledger...`);
  const ledger = buildHandoffLedger(ROOT);

  console.log(`🔍 检测数据流异常...`);
  const anomalies = detectDataFlowAnomalies(ledger);

  const okCount = metrics.filter((m) => m.status === "ok" || m.status === "fresh").length;
  const problemCount = metrics.filter(
    (m) => m.status === "overdue" || m.status === "missing" || m.status === "template-only",
  ).length;
  console.log(`   ✅ ${okCount} 健康, 🔴 ${problemCount} 问题, ⚠️ ${anomalies.length} 数据流异常`);
  console.log("");

  const dashboard = generateDashboard(metrics, anomalies, period);

  if (!dryRun) {
    const ledgerPath = writeHandoffLedger(ledger, ROOT);
    console.log(`📄 Handoff ledger 已生成: ${ledgerPath}`);
    const outputPath = join(ROOT, "docs/planning/AGENT_HEALTH_DASHBOARD.md");
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, dashboard, "utf-8");
    console.log(`📄 Dashboard 已生成: ${outputPath}`);
    console.log("");
  } else {
    console.log(`📄 (dry-run) 将生成: docs/planning/AGENT_HEALTH_DASHBOARD.md`);
    console.log("");
    console.log(dashboard.slice(0, 800));
    if (dashboard.length > 800) console.log("... (truncated)");
  }

  console.log(`✅ Agent Health Dashboard Generator 完成`);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`❌ 错误:`, err.message);
    process.exit(1);
  });
}
