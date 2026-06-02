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
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Agent 注册表 (v2.0: 11→5 agents, 与 agent-runner.mjs 保持同步) ──
const AGENTS = {
  orchestrator: {
    period: "weekly",
    dir: "docs/planning",
    file: "weekly-digest.md",
    cadence: "weekly",
  },
  product: {
    period: "weekly",
    dir: "docs/research",
    filePattern: /competitor-updates-.*\.md/,
    cadence: "weekly",
  },
  quality: {
    period: "daily",
    dir: "docs/reviews",
    filePattern: /quality-gate-.*\.md/,
    cadence: "daily",
  },
  builder: {
    period: "ad-hoc",
    dir: "docs/reviews",
    filePattern: /builder-evidence-.*\.md/,
    cadence: "ad-hoc",
  },
  docs: {
    period: "weekly",
    dir: "docs/reviews",
    filePattern: /documentation-audit-.*\.md/,
    cadence: "weekly",
  },
};

// ── 数据流定义 (v2.0: HOC-N1/N2/N3) ──
const DATA_FLOWS = [
  {
    from: "product",
    to: "orchestrator",
    description: "竞品报告 + 优先级 → 周报规划 (HOC-N1)",
  },
  {
    from: "builder",
    to: "quality",
    description: "实现证据 + 测试结果 → 门禁 (HOC-N2)",
  },
  {
    from: "quality",
    to: "orchestrator",
    description: "门禁通过/阻断 → 发布就绪 (HOC-N3)",
  },
];

function getGitSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT })
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
 * 查找 agent 的最新报告文件
 */
function findLatestReport(agentName, agentDef) {
  const dir = join(ROOT, agentDef.dir);
  try {
    const files = readdirSync(dir);
    let latest = null;
    let latestTime = 0;

    for (const file of files) {
      let match = false;
      if (agentDef.file && file === agentDef.file) {
        match = true;
      } else if (agentDef.filePattern && agentDef.filePattern.test(file)) {
        match = true;
      }
      if (!match) continue;

      try {
        const stats = statSync(join(dir, file));
        if (stats.mtimeMs > latestTime) {
          latestTime = stats.mtimeMs;
          latest = { file, mtime: stats.mtime, size: stats.size };
        }
      } catch {
        /* skip */
      }
    }

    // 如果有 YAML front matter，用 generated_at 修正时间
    if (latest) {
      try {
        const content = readFileSync(join(dir, latest.file), "utf-8");
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (fmMatch) {
          const genMatch = fmMatch[1].match(/generated_at:\s*(.+)/);
          if (genMatch) {
            const genDate = new Date(genMatch[1].trim());
            if (!isNaN(genDate.getTime())) {
              latest.generatedAt = genDate;
            }
          }
        }
      } catch {
        /* use file mtime */
      }
    }

    return latest;
  } catch {
    return null;
  }
}

/**
 * 计算执行健康指标
 */
function computeHealthMetrics() {
  const metrics = [];

  for (const [name, def] of Object.entries(AGENTS)) {
    const latest = findLatestReport(name, def);
    const now = new Date();
    let status = "unknown";
    let ageDays = null;

    if (latest) {
      const refDate = latest.generatedAt || latest.mtime;
      ageDays = (now - refDate) / 86400000;

      if (def.cadence === "daily" && ageDays > 2) status = "overdue";
      else if (def.cadence === "weekly" && ageDays > 8) status = "overdue";
      else if (def.cadence === "monthly" && ageDays > 35) status = "overdue";
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
      lastFile: latest?.file || "—",
      lastRun: latest
        ? (latest.generatedAt || latest.mtime).toISOString()
        : "—",
      status,
      ageDays: ageDays ? Math.round(ageDays) : null,
    });
  }

  return metrics;
}

/**
 * 检测数据流异常
 */
function detectDataFlowAnomalies() {
  const anomalies = [];

  for (const flow of DATA_FLOWS) {
    const fromDef = AGENTS[flow.from];
    const toDef = AGENTS[flow.to];
    if (!fromDef || !toDef) continue;

    const fromReport = findLatestReport(flow.from, fromDef);
    const toReport = findLatestReport(flow.to, toDef);

    if (!fromReport && fromDef.cadence !== "ad-hoc") {
      anomalies.push({
        flow: `${flow.from} → ${flow.to}`,
        description: flow.description,
        issue: `${flow.from} 无报告产出`,
        severity: "warning",
      });
      continue;
    }
    if (!toReport && toDef.cadence !== "ad-hoc") {
      anomalies.push({
        flow: `${flow.from} → ${flow.to}`,
        description: flow.description,
        issue: `${flow.to} 无报告产出`,
        severity: "warning",
      });
      continue;
    }

    // 检查时序：to 不应早于 from（允许 1 天容差）
    if (fromReport && toReport) {
      const fromDate = fromReport.generatedAt || fromReport.mtime;
      const toDate = toReport.generatedAt || toReport.mtime;
      if (toDate < fromDate && fromDate - toDate > 86400000) {
        anomalies.push({
          flow: `${flow.from} → ${flow.to}`,
          description: flow.description,
          issue: `下游报告早于上游 (${flow.to}: ${toDate.toISOString().slice(0, 10)} < ${flow.from}: ${fromDate.toISOString().slice(0, 10)})`,
          severity: "error",
        });
      }
    }
  }

  return anomalies;
}

/**
 * 生成 Dashboard Markdown
 */
function generateDashboard(metrics, anomalies, period) {
  const lines = [];

  lines.push("---");
  lines.push(`generated_at: ${new Date().toISOString()}`);
  lines.push(`repo_revision: "${getGitSha()}"`);
  lines.push(`period: ${period}`);
  lines.push("agent: orchestrator");
  lines.push("decision_level: info");
  lines.push("---");
  lines.push("");
  lines.push(`# Agent Health Dashboard (as of ${period})`);
  lines.push("");
  lines.push(
    "> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。",
  );
  lines.push("> 状态为自动化推断，需 orchestrator 审查后确认。");
  lines.push("");

  // ── 执行健康 ──
  lines.push("## Execution Health");
  lines.push("");
  lines.push("| Agent | Cadence | Last Report | Last Run | Status | Age |");
  lines.push("| --- | --- | --- | --- | --- | --- |");

  const statusIcon = {
    fresh: "🟢",
    ok: "🟢",
    overdue: "🔴",
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
      lines.push(
        `| ${a.flow}<br/>*${a.description}* | ${a.issue} | ${icon} ${a.severity} |`,
      );
    }
  }

  lines.push("");

  // ── SLA 合规 ──
  lines.push("## SLA Compliance");
  lines.push("");
  lines.push("| Agent | SLA | Max Latency | Current | Status |");
  lines.push("| --- | --- | --- | --- | --- |");

  const slaDefs = {
    orchestrator: { maxDays: 8, desc: "周一 00:00 UTC" },
    product: { maxDays: 8, desc: "周一 00:00 UTC" },
    quality: { maxDays: 2, desc: "每日 00:00 UTC" },
    docs: { maxDays: 8, desc: "周一 00:00 UTC" },
  };

  for (const m of metrics) {
    const sla = slaDefs[m.agent];
    if (!sla) continue;
    const compliant = m.ageDays !== null && m.ageDays <= sla.maxDays;
    const icon = compliant ? "✅" : "❌";
    const ageStr = m.ageDays !== null ? `${m.ageDays}d` : "missing";
    lines.push(
      `| @${m.agent} | ${sla.desc} | ${sla.maxDays}d | ${ageStr} | ${icon} ${compliant ? "compliant" : "breach"} |`,
    );
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
      actionItems.push(
        `- [ ] **@${m.agent}**: 无任何报告产出 → 确认 agent 是否已激活`,
      );
    } else if (m.status === "overdue") {
      actionItems.push(
        `- [ ] **@${m.agent}**: 报告逾期 ${m.ageDays} 天 → 手动触发或检查 cron`,
      );
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
  const okCount = metrics.filter(
    (m) => m.status === "ok" || m.status === "fresh",
  ).length;
  const problemCount = metrics.filter(
    (m) => m.status === "overdue" || m.status === "missing",
  ).length;
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **健康 agent**: ${okCount}/${metrics.length}`);
  lines.push(`- **问题 agent**: ${problemCount}/${metrics.length}`);
  lines.push(`- **数据流异常**: ${anomalies.length}`);
  lines.push(`- **生成时间**: ${new Date().toISOString()}`);

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

  console.log(`🔍 检测数据流异常...`);
  const anomalies = detectDataFlowAnomalies();

  const okCount = metrics.filter(
    (m) => m.status === "ok" || m.status === "fresh",
  ).length;
  const problemCount = metrics.filter(
    (m) => m.status === "overdue" || m.status === "missing",
  ).length;
  console.log(
    `   ✅ ${okCount} 健康, 🔴 ${problemCount} 问题, ⚠️ ${anomalies.length} 数据流异常`,
  );
  console.log("");

  const dashboard = generateDashboard(metrics, anomalies, period);

  if (!dryRun) {
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

main().catch((err) => {
  console.error(`❌ 错误:`, err.message);
  process.exit(1);
});
