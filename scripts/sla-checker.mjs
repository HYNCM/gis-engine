#!/usr/bin/env node
/**
 * SLA Enforcement Checker
 *
 * 用法：
 *   node scripts/sla-checker.mjs [options]
 *
 * 选项：
 *   --dry-run      仅检查不创建 issue
 *   --period <str> 指定日期（默认：今天）
 *
 * 功能：
 *   - 检查所有 agent 的 SLA 合规性
 *   - 对违规的 agent 生成告警
 *   - 输出退出码：0=全部合规, 1=存在违规, 2=存在 P0 阻断
 */

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { AGENT_REGISTRY } from "./agent-registry.mjs";
import { findLatestReport } from "./handoff-ledger.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SLA_ACTIONS = {
  orchestrator: "auto-escalate to @product for interim roadmap",
  product: "orchestrator uses last available sourced report",
  quality: "block merges until quality runs",
  docs: "run docs audit or explicitly waive non-doc changes",
};

function getDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export function collectSlaViolations(root = ROOT, now = new Date()) {
  const violations = [];
  const criticals = [];

  for (const [name, agentDef] of Object.entries(AGENT_REGISTRY)) {
    if (!agentDef.slaMaxHours) continue;

    const description = `${name} ${agentDef.cadence} report`;
    const latest = findLatestReport(name, root);
    if (!latest) {
      violations.push({
        agent: name,
        severity: "critical",
        message: `${description}: 无报告产出`,
        action: SLA_ACTIONS[name] ?? "manual orchestrator review",
      });
      criticals.push(name);
      continue;
    }

    if (latest.evidenceKind === "template") {
      violations.push({
        agent: name,
        severity: "critical",
        message: `${description}: latest artifact is template-only specialist evidence`,
        action: SLA_ACTIONS[name] ?? "manual orchestrator review",
        lastRun: latest.generatedAt.toISOString(),
      });
      criticals.push(name);
      continue;
    }

    const refDate = latest.generatedAt;
    const ageHours = (now - refDate) / 3600000;

    if (ageHours > agentDef.slaMaxHours * 2) {
      violations.push({
        agent: name,
        severity: "critical",
        message: `${description}: 逾期 ${ageHours.toFixed(1)}h (SLA: ${agentDef.slaMaxHours}h)`,
        action: SLA_ACTIONS[name] ?? "manual orchestrator review",
        lastRun: refDate.toISOString(),
      });
      criticals.push(name);
    } else if (ageHours > agentDef.slaMaxHours) {
      violations.push({
        agent: name,
        severity: "warning",
        message: `${description}: 接近超时 ${ageHours.toFixed(1)}h (SLA: ${agentDef.slaMaxHours}h)`,
        action: "monitor; escalate if >2x SLA",
        lastRun: refDate.toISOString(),
      });
    }
  }

  return { violations, criticals };
}

function main() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let period = getDateStr();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") dryRun = true;
    else if (args[i] === "--period" && args[i + 1]) period = args[++i];
  }

  console.log(`🔍 SLA Enforcement Checker — ${period}`);
  console.log("");

  const { violations, criticals } = collectSlaViolations();

  if (violations.length > 0) {
    console.log(`⚠️  检测到 ${violations.length} 个 SLA 违规:`);
    console.log("");
    for (const v of violations) {
      const icon = v.severity === "critical" ? "🔴" : "🟡";
      console.log(`   ${icon} [${v.severity.toUpperCase()}] @${v.agent}`);
      console.log(`      ${v.message}`);
      console.log(`      Action: ${v.action}`);
      if (v.lastRun) console.log(`      Last: ${v.lastRun}`);
      console.log("");
    }

    if (!dryRun && criticals.length > 0) {
      console.log(`🚨 ${criticals.length} 个 agent 达到 critical SLA 违规`);
      console.log(`   需要 orchestrator 人工介入`);
    }
  } else {
    console.log(`✅ 所有 agent 均在 SLA 范围内`);
  }

  console.log("");
  console.log(`✅ SLA Enforcement Checker 完成`);

  if (criticals.length > 0) process.exit(2);
  if (violations.length > 0) process.exit(1);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
