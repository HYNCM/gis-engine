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

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── SLA 定义 (v2.0: 11→5 agents) ──
const SLA_DEFS = {
  orchestrator: {
    agent: "orchestrator",
    description: "orchestrator 周报",
    cadence: "weekly",
    maxLatencyHours: 48,
    dir: "docs/planning",
    file: "weekly-digest.md",
    p0Action: "auto-escalate to @product for interim roadmap",
  },
  product: {
    agent: "product",
    description: "竞品分析 + 路线图",
    cadence: "weekly",
    maxLatencyHours: 48,
    dir: "docs/research",
    filePattern: /competitor-updates-.*\.md/,
    p0Action:
      "skip this week's competitor update; orchestrator uses last available",
  },
  quality: {
    agent: "quality",
    description: "代码审查 + 质量门禁",
    cadence: "daily",
    maxLatencyHours: 24,
    dir: "docs/reviews",
    filePattern: /quality-gate-.*\.md/,
    p0Action: "block all merges until quality runs",
  },
  builder: {
    agent: "builder",
    description: "实现 + 测试 (ad-hoc)",
    cadence: "ad-hoc",
    maxLatencyHours: 0, // no SLA for ad-hoc
    dir: "docs/reviews",
    filePattern: /builder-evidence-.*\.md/,
    p0Action: "no SLA escalation for ad-hoc agent",
  },
  docs: {
    agent: "docs",
    description: "文档审计",
    cadence: "weekly",
    maxLatencyHours: 72,
    dir: "docs/reviews",
    filePattern: /documentation-audit-.*\.md/,
    p0Action: "skip this week; docs-audit is non-blocking",
  },
};

function getDateStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 查找 agent 最新报告
 */
function findLatestReport(slaDef) {
  const dir = join(ROOT, slaDef.dir);
  try {
    const files = readdirSync(dir);
    let latest = null;
    let latestTime = 0;

    for (const file of files) {
      let match = false;
      if (slaDef.file && file === slaDef.file) match = true;
      else if (slaDef.filePattern && slaDef.filePattern.test(file))
        match = true;
      if (!match) continue;

      try {
        const stats = statSync(join(dir, file));
        if (stats.mtimeMs > latestTime) {
          latestTime = stats.mtimeMs;
          latest = { file, mtime: stats.mtime };
        }
      } catch {
        /* skip */
      }
    }

    // 如果有 YAML front matter generated_at，用那个时间
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
        /* use mtime */
      }
    }

    return latest;
  } catch {
    return null;
  }
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

  const violations = [];
  const criticals = [];
  const now = new Date();

  for (const [name, sla] of Object.entries(SLA_DEFS)) {
    const latest = findLatestReport(sla);
    if (!latest) {
      violations.push({
        agent: name,
        severity: "critical",
        message: `${sla.description}: 无报告产出`,
        action: sla.p0Action,
      });
      criticals.push(name);
      continue;
    }

    const refDate = latest.generatedAt || latest.mtime;
    const ageHours = (now - refDate) / 3600000;

    if (ageHours > sla.maxLatencyHours * 2) {
      violations.push({
        agent: name,
        severity: "critical",
        message: `${sla.description}: 逾期 ${ageHours.toFixed(1)}h (SLA: ${sla.maxLatencyHours}h)`,
        action: sla.p0Action,
        lastRun: refDate.toISOString(),
      });
      criticals.push(name);
    } else if (ageHours > sla.maxLatencyHours) {
      violations.push({
        agent: name,
        severity: "warning",
        message: `${sla.description}: 接近超时 ${ageHours.toFixed(1)}h (SLA: ${sla.maxLatencyHours}h)`,
        action: "monitor; escalate if >2x SLA",
        lastRun: refDate.toISOString(),
      });
    }
  }

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

main();
