#!/usr/bin/env node
/**
 * Agent Runner — 智能体调用脚本
 *
 * 用法：
 *   node scripts/agent-runner.mjs <agent-name> [options]
 *
 * 示例：
 *   node scripts/agent-runner.mjs code-reviewer --period 2026-05-24
 *   node scripts/agent-runner.mjs coordinator --week 2026-W22
 *   node scripts/agent-runner.mjs all --daily
 *
 * 此脚本封装了智能体的标准调用流程：
 *   1. 生成标准化的 YAML front matter
 *   2. 运行关联的测试/检查门禁
 *   3. 生成输出报告到指定路径
 *   4. 返回退出码（0=通过，1=警告，2=阻断）
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── 智能体注册表 ──
const AGENT_REGISTRY = {
  coordinator: {
    role: "chief planning and orchestration agent",
    period: "weekly",
    outputDir: "docs/planning",
    outputFile: "weekly-digest.md",
    gates: [], // coordinator 不直接跑测试，而是汇总
    decisionLevel: "advisory",
  },
  "competitive-intel": {
    role: "evidence-first competitor and standards analyst",
    period: "weekly",
    outputDir: "docs/research",
    outputFile: (period) => `competitor-updates-${period}.md`,
    gates: [],
    decisionLevel: "advisory",
  },
  "code-reviewer": {
    role: "daily diff and PR auditor",
    period: "daily",
    outputDir: "docs/reviews",
    outputFile: (period) => `daily-audit-${period}.md`,
    gates: ["pnpm build:schema", "pnpm check"],
    decisionLevel: "blocking",
  },
  "product-strategist": {
    role: "roadmap and feature-priority owner",
    period: "monthly",
    outputDir: "docs/planning",
    outputFile: "monthly-roadmap.md",
    gates: [],
    decisionLevel: "advisory",
  },
  "task-distributor": {
    role: "planning-to-execution decomposition agent",
    period: "weekly",
    outputDir: "docs/planning",
    outputFile: "task-burndown.md",
    gates: [],
    decisionLevel: "advisory",
  },
  "quality-guardian": {
    role: "final merge and release gate",
    period: "daily",
    outputDir: "docs/reviews",
    outputFile: (period) => `quality-gate-${period}.md`,
    gates: [
      "pnpm build:schema",
      "pnpm check",
      "pnpm test:snapshot:smoke",
      "pnpm test:release:scene3d",
    ],
    decisionLevel: "blocking",
  },
  "docs-agent": {
    role: "documentation ledger and release notes",
    period: "weekly",
    outputDir: "docs/reviews",
    outputFile: (period) => `documentation-audit-${period}.md`,
    gates: [],
    decisionLevel: "advisory",
  },
  "adapter-agent": {
    role: "renderer adapter implementation",
    period: "ad-hoc",
    outputDir: "docs/reviews",
    outputFile: (period) => `adapter-report-${period}.md`,
    gates: [
      "pnpm --filter @gis-engine/scene3d-three-adapter build",
      "pnpm test:adapter",
    ],
    decisionLevel: "advisory",
  },
  "qa-agent": {
    role: "visual evidence and release runner",
    period: "ad-hoc",
    outputDir: "docs/reviews",
    outputFile: (period) => `qa-evidence-${period}.md`,
    gates: [
      "pnpm test:snapshot:visual",
      "pnpm test:release:scene3d",
      "pnpm test:perf:nightly",
    ],
    decisionLevel: "advisory",
  },
  "ai-agent": {
    role: "MCP tools and AI contracts",
    period: "ad-hoc",
    outputDir: "docs/reviews",
    outputFile: (period) => `ai-contract-audit-${period}.md`,
    gates: ["pnpm test:ai"],
    decisionLevel: "advisory",
  },
  "engine-agent": {
    role: "public schemas, commands, diagnostics",
    period: "ad-hoc",
    outputDir: "docs/reviews",
    outputFile: (period) => `engine-contract-delta-${period}.md`,
    gates: [
      "pnpm build:schema",
      "pnpm test:schema",
      "pnpm test:schema-sync",
      "pnpm test:commands",
      "pnpm test:patch",
      "pnpm test:runtime",
    ],
    decisionLevel: "advisory",
  },
};

// ── 辅助函数 ──

/** 获取当前日期字符串 */
function getDateStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** 获取当前周字符串 */
function getWeekStr() {
  const d = new Date();
  const year = d.getFullYear();
  // ISO week number
  const start = new Date(year, 0, 1);
  const diff = d - start;
  const week = Math.ceil(
    ((diff / 86400000) + start.getDay() + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** 获取当前月字符串 */
function getMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 获取 Git SHA */
function getGitSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

/** 生成 YAML front matter */
function generateFrontMatter(agentName, agentDef, period) {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return [
    "---",
    `agent: ${agentName}`,
    `period: ${period}`,
    `generated_at: ${now}`,
    `repo_revision: "${getGitSha()}"`,
    `inputs:`,
    `  - AGENTS.md`,
    `  - README.md`,
    `owner: "@${agentName}"`,
    `decision_level: ${agentDef.decisionLevel}`,
    "---",
    "",
  ].join("\n");
}

/** 运行门禁命令 */
function runGates(gates) {
  const results = [];
  for (const gate of gates) {
    try {
      const output = execSync(gate, {
        cwd: ROOT,
        encoding: "utf-8",
        stdio: "pipe",
        timeout: 120_000,
      });
      results.push({ gate, status: "passed", output: output.slice(-500) });
    } catch (err) {
      results.push({
        gate,
        status: "failed",
        output: err.stderr?.slice(-500) || err.message,
      });
    }
  }
  return results;
}

/** 生成报告内容 */
function generateReport(agentName, agentDef, period, gateResults) {
  const lines = [generateFrontMatter(agentName, agentDef, period)];

  lines.push(`# ${agentDef.role}: ${period}`);
  lines.push("");
  lines.push(`## 执行摘要`);
  lines.push("");
  lines.push(
    `> ⚠️ 此报告由 agent-runner 自动生成模板。请由 **${agentName}** 智能体审查并填充实质内容。`
  );
  lines.push("");

  if (gateResults && gateResults.length > 0) {
    lines.push("## 门禁结果");
    lines.push("");
    lines.push("| Gate | Status |");
    lines.push("| --- | --- |");
    for (const r of gateResults) {
      lines.push(`| \`${r.gate}\` | ${r.status === "passed" ? "✅" : "❌"} |`);
    }
    lines.push("");
  }

  lines.push("## 发现与建议");
  lines.push("");
  lines.push("<!-- 待智能体填充 -->");
  lines.push("");

  lines.push("## 下游交接");
  lines.push("");
  lines.push("<!-- 待智能体填充 -->");
  lines.push("");

  return lines.join("\n");
}

// ── 主逻辑 ──

async function main() {
  const args = process.argv.slice(2);
  const agentName = args[0];

  if (!agentName || agentName === "--help" || agentName === "-h") {
    console.log(`
Agent Runner — GIS Engine 多智能体调用脚本

用法: node scripts/agent-runner.mjs <agent-name> [options]

可用智能体:
  ${Object.keys(AGENT_REGISTRY).join("\n  ")}

选项:
  --period <str>   指定周期 (如 2026-05-24, 2026-W22, 2026-05)
  --dry-run        仅生成报告模板，不运行门禁
  --all            运行所有智能体（与 --daily / --weekly 搭配使用）
  --daily          筛选每日智能体
  --weekly         筛选每周智能体

示例:
  node scripts/agent-runner.mjs code-reviewer --period 2026-05-24
  node scripts/agent-runner.mjs coordinator --period 2026-W22
  node scripts/agent-runner.mjs all --daily
`);
    process.exit(0);
  }

  // 解析选项
  const options = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--period" && args[i + 1]) {
      options.period = args[++i];
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else if (args[i] === "--all") {
      options.all = true;
    } else if (args[i] === "--daily") {
      options.daily = true;
    } else if (args[i] === "--weekly") {
      options.weekly = true;
    }
  }

  // 确定要运行的智能体列表
  let agentsToRun = [];
  if (agentName === "all" || options.all) {
    // 按当前周期筛选
    let periodType = "all";
    if (options.daily) periodType = "daily";
    else if (options.weekly) periodType = "weekly";
    agentsToRun = Object.entries(AGENT_REGISTRY).filter(
      ([, def]) => periodType === "all" || def.period === periodType
    );
  } else {
    const def = AGENT_REGISTRY[agentName];
    if (!def) {
      console.error(`❌ 未知智能体: ${agentName}`);
      console.error(`   可用: ${Object.keys(AGENT_REGISTRY).join(", ")}`);
      process.exit(1);
    }
    agentsToRun = [[agentName, def]];
  }

  console.log(`🚀 Agent Runner 启动`);
  console.log(`   仓库: ${ROOT}`);
  console.log(`   Git SHA: ${getGitSha()}`);
  console.log(`   时间: ${new Date().toISOString()}`);
  console.log("");

  let hasBlockingFailure = false;

  for (const [name, def] of agentsToRun) {
    // 确定周期
    let period = options.period;
    if (!period) {
      if (def.period === "daily") period = getDateStr();
      else if (def.period === "weekly") period = getWeekStr();
      else if (def.period === "monthly") period = getMonthStr();
      else period = getDateStr();
    }

    console.log(`📋 运行智能体: ${name}`);
    console.log(`   角色: ${def.role}`);
    console.log(`   周期: ${period}`);

    // 运行门禁
    let gateResults = null;
    if (!options.dryRun && def.gates.length > 0) {
      console.log(`   运行门禁 (${def.gates.length} 项)...`);
      gateResults = runGates(def.gates);
      for (const r of gateResults) {
        const icon = r.status === "passed" ? "✅" : "❌";
        console.log(`     ${icon} ${r.gate}`);
        if (def.decisionLevel === "blocking" && r.status === "failed") {
          hasBlockingFailure = true;
        }
      }
    }

    // 生成报告
    const report = generateReport(name, def, period, gateResults);

    // 写入输出文件（dry-run 模式下不覆盖已有内容）
    const outputFile =
      typeof def.outputFile === "function" ? def.outputFile(period) : def.outputFile;
    const outputPath = join(ROOT, def.outputDir, outputFile);
    if (options.dryRun && existsSync(outputPath)) {
      console.log(`   📄 (dry-run) 跳过已有文件: ${outputPath}`);
    } else {
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, report, "utf-8");
      console.log(`   📄 报告已生成: ${outputPath}`);
    }
    console.log("");
  }

  if (hasBlockingFailure) {
    console.log("🔴 存在阻断级门禁失败");
    process.exit(2);
  }

  console.log("✅ Agent Runner 完成");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Agent Runner 异常:", err.message);
  process.exit(1);
});
