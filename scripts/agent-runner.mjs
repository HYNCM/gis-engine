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
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  openSync,
  closeSync,
  unlinkSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── 智能体注册表 ──
const AGENT_REGISTRY = {
  coordinator: {
    role: "chief planning and orchestration agent",
    period: "weekly",
    modelPolicy: {
      tier: "frontier-planning",
      reasoningEffort: "high",
      routingNote:
        "Use for cross-agent conflict resolution, roadmap tradeoffs, and Go/No-go planning state.",
    },
    outputDir: "docs/planning",
    outputFile: "weekly-digest.md",
    gates: [], // coordinator 不直接跑测试，而是汇总
    gateDecisionLevel: "advisory",
  },
  "competitive-intel": {
    role: "evidence-first competitor and standards analyst",
    period: "weekly",
    modelPolicy: {
      tier: "frontier-research",
      reasoningEffort: "high",
      routingNote:
        "Use when dated external releases, standards, or dependency changes can alter roadmap priority.",
    },
    outputDir: "docs/research",
    outputFile: (period) => `competitor-updates-${period}.md`,
    gates: [],
    gateDecisionLevel: "advisory",
  },
  "code-reviewer": {
    role: "daily diff and PR auditor",
    period: "daily",
    modelPolicy: {
      tier: "coding-review",
      reasoningEffort: "high",
      routingNote:
        "Use for architecture, schema, diagnostics, resource-policy, and regression risk review.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `daily-audit-${period}.md`,
    gates: ["pnpm build:schema", "pnpm check"],
    gateDecisionLevel: "blocking",
  },
  "product-strategist": {
    role: "roadmap and feature-priority owner",
    period: "monthly",
    modelPolicy: {
      tier: "frontier-product",
      reasoningEffort: "medium",
      routingNote:
        "Use for product scoring, user-value tradeoffs, and next-sprint roadmap synthesis.",
    },
    outputDir: "docs/planning",
    outputFile: "monthly-roadmap.md",
    gates: [],
    gateDecisionLevel: "advisory",
  },
  "task-distributor": {
    role: "planning-to-execution decomposition agent",
    period: "weekly",
    modelPolicy: {
      tier: "planning-coding",
      reasoningEffort: "medium",
      routingNote:
        "Use for owner split, DAG updates, task sequencing, and serialized planning state.",
    },
    outputDir: "docs/planning",
    outputFile: "task-burndown.md",
    gates: [],
    gateDecisionLevel: "advisory",
  },
  "quality-guardian": {
    role: "final merge and release gate",
    period: "daily",
    modelPolicy: {
      tier: "frontier-quality",
      reasoningEffort: "high",
      routingNote:
        "Use for blocking merge/release gate decisions and waiver review.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `quality-gate-${period}.md`,
    gates: [
      "pnpm build:schema",
      "pnpm check",
      "pnpm test:snapshot:smoke",
      "pnpm test:release:scene3d",
    ],
    gateDecisionLevel: "blocking",
  },
  "docs-agent": {
    role: "documentation ledger and release notes",
    period: "weekly",
    cadences: ["daily", "weekly"],
    modelPolicy: {
      tier: "efficient-docs",
      reasoningEffort: "low",
      routingNote:
        "Use for documentation consistency, link audits, and release-note alignment after evidence exists.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `documentation-audit-${period}.md`,
    gates: [],
    gateDecisionLevel: "advisory",
  },
  "adapter-agent": {
    role: "renderer adapter implementation",
    period: "ad-hoc",
    modelPolicy: {
      tier: "coding-implementation",
      reasoningEffort: "high",
      routingNote:
        "Use for adapter-local implementation, renderer evidence APIs, and dependency-boundary work.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `adapter-report-${period}.md`,
    gates: [
      "pnpm --filter @gis-engine/scene3d-three-adapter build",
      "pnpm test:adapter",
    ],
    gateDecisionLevel: "advisory",
  },
  "qa-agent": {
    role: "visual evidence and release runner",
    period: "ad-hoc",
    modelPolicy: {
      tier: "coding-browser-qa",
      reasoningEffort: "medium",
      routingNote:
        "Use for deterministic smoke, browser visual evidence, fixtures, and release-runner reports.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `qa-evidence-${period}.md`,
    gates: [
      "pnpm test:snapshot:visual",
      "pnpm test:release:scene3d",
      "pnpm test:perf:nightly",
    ],
    gateDecisionLevel: "advisory",
  },
  "ai-agent": {
    role: "MCP tools and AI contracts",
    period: "ad-hoc",
    modelPolicy: {
      tier: "coding-ai-contract",
      reasoningEffort: "high",
      routingNote:
        "Use for MCP schemas, context summaries, output schemas, and AI-facing diagnostics.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `ai-contract-audit-${period}.md`,
    gates: ["pnpm test:ai"],
    gateDecisionLevel: "advisory",
  },
  "engine-agent": {
    role: "public schemas, commands, diagnostics",
    period: "ad-hoc",
    modelPolicy: {
      tier: "coding-contract",
      reasoningEffort: "high",
      routingNote:
        "Use for TypeBox schemas, commands, diagnostics, resource policy, and runtime contracts.",
    },
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
    gateDecisionLevel: "advisory",
  },
  "evolution-guardian": {
    role: "self-evolving ecosystem metrics collector (coordinator subset)",
    period: "weekly",
    reportAgent: "coordinator",
    owner: "@coordinator (evolution-guardian)",
    modelPolicy: {
      tier: "frontier-planning",
      reasoningEffort: "medium",
      routingNote:
        "Use for monthly evolution reviews: analyzing 4-week metric trends, auto-suggesting rule adjustments, calibrating estimation baselines and decision weights.",
    },
    outputDir: "docs/planning",
    outputFile: (period) => `evolution-review-${period}.md`,
    gates: [],
    gateDecisionLevel: "advisory",
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
  const utcDate = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
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

function sleep(ms) {
  if (typeof Atomics !== "undefined" && typeof SharedArrayBuffer !== "undefined") {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    return;
  }
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

function acquireRunLock(lockPath, { maxAttempts = 50, intervalMs = 100 } = {}) {
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      return openSync(lockPath, "wx", 0o600);
    } catch (err) {
      if (err.code !== "EEXIST") {
        throw err;
      }
      try {
        const stats = statSync(lockPath);
        const ageMs = Date.now() - stats.mtimeMs;
        if (ageMs > 5 * 60_000) {
          unlinkSync(lockPath);
          continue;
        }
      } catch {
        // ignore stale metadata errors
      }
      if (attempt >= maxAttempts) {
        throw new Error(`Could not acquire agent-runner lock at ${lockPath} after ${attempt} attempts`);
      }
      sleep(intervalMs);
    }
  }
}

function releaseRunLock(fd, lockPath) {
  try {
    closeSync(fd);
  } catch {
    // ignore close errors
  }
  try {
    unlinkSync(lockPath);
  } catch {
    // ignore cleanup failures
  }
}

// ── 规划状态管理 ──

/** 规划状态一致性管理器 */
class PlanningStateManager {
  constructor(rootPath) {
    this.root = rootPath;
    this.fileLocks = new Map();
  }

  /** 为规划文件获取文件级锁 */
  acquireFileLock(relativeFilePath, { maxAttempts = 30, intervalMs = 200 } = {}) {
    const lockPath = join(this.root, `${relativeFilePath}.lock`);
    let attempt = 0;
    while (true) {
      attempt += 1;
      try {
        const fd = openSync(lockPath, "wx", 0o600);
        this.fileLocks.set(relativeFilePath, { fd, lockPath });
        return lockPath;
      } catch (err) {
        if (err.code !== "EEXIST") {
          throw err;
        }
        try {
          const stats = statSync(lockPath);
          const ageMs = Date.now() - stats.mtimeMs;
          if (ageMs > 10 * 60_000) {
            unlinkSync(lockPath);
            continue;
          }
        } catch {
          // ignore stale metadata errors
        }
        if (attempt >= maxAttempts) {
          throw new Error(
            `Could not acquire planning lock for ${relativeFilePath} after ${attempt} attempts`,
          );
        }
        sleep(intervalMs);
      }
    }
  }

  /** 释放文件级锁 */
  releaseFileLock(relativeFilePath) {
    const lock = this.fileLocks.get(relativeFilePath);
    if (!lock) return;
    try {
      closeSync(lock.fd);
    } catch {
      // ignore
    }
    try {
      unlinkSync(lock.lockPath);
    } catch {
      // ignore
    }
    this.fileLocks.delete(relativeFilePath);
  }

  /** 从 Markdown 文件中提取任务 ID 和所有者 */
  extractTaskOwners(filePath) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const tasks = [];

      // 匹配 TASK-YYYY-NAME-NNN 模式，并尝试找到所有者信息
      const taskPattern = /TASK-\d{4}[A-Z]+-\d{3}/g;
      const ownerPattern = /owner[:\s]+`?@([\w-]+)`?/gi;

      let match;
      while ((match = taskPattern.exec(content)) !== null) {
        const taskId = match[0];
        // 简化：假设任务周围有所有者标记（实际应该用AST解析）
        tasks.push({
          id: taskId,
          position: match.index,
        });
      }

      return tasks;
    } catch (err) {
      console.warn(`  ⚠️ 无法解析文件 ${filePath}:`, err.message);
      return [];
    }
  }

  /**
   * 验证规划状态的一致性
   * 检查：
   * 1. task-burndown.md 和 dependency-graph.md 中的任务 ID 集合是否匹配
   * 2. 同一任务在不同文件中的所有者是否一致
   * 3. 依赖图中的所有任务是否在 burndown 中有定义
   */
  validateConsistency(dryRun = false) {
    const issues = [];
    const burndownPath = join(this.root, "docs/planning/task-burndown.md");
    const depGraphPath = join(this.root, "docs/planning/dependency-graph.md");

    try {
      // 提取任务 ID
      const burndownTasks = this.extractTaskOwners(burndownPath);
      const depGraphTasks = this.extractTaskOwners(depGraphPath);

      const burndownIds = new Set(burndownTasks.map((t) => t.id));
      const depGraphIds = new Set(depGraphTasks.map((t) => t.id));

      // 检查任务 ID 的一致性
      for (const taskId of depGraphIds) {
        if (!burndownIds.has(taskId)) {
          issues.push({
            severity: "error",
            code: "TASK_IN_DEP_BUT_NOT_BURNDOWN",
            message: `任务 ${taskId} 在 dependency-graph.md 中出现但未在 task-burndown.md 中定义`,
          });
        }
      }

      for (const taskId of burndownIds) {
        if (!depGraphIds.has(taskId)) {
          issues.push({
            severity: "warning",
            code: "TASK_IN_BURNDOWN_BUT_NOT_DEP",
            message: `任务 ${taskId} 在 task-burndown.md 中但未在 dependency-graph.md 中出现`,
          });
        }
      }

      if (issues.length > 0) {
        if (!dryRun) {
          console.warn("  ⚠️ 规划状态一致性检查发现问题:");
          for (const issue of issues) {
            const icon = issue.severity === "error" ? "❌" : "⚠️";
            console.warn(`    ${icon} [${issue.code}] ${issue.message}`);
          }
        }
      }

      return { valid: issues.every((i) => i.severity !== "error"), issues };
    } catch (err) {
      console.warn(`  ⚠️ 一致性检查失败: ${err.message}`);
      return { valid: true, issues: [] }; // 失败时不阻断
    }
  }
}

/** 自动化生成的报告只是机器证据/模板，不能声明 advisory 或 blocking。 */
function getReportDecisionLevel() {
  return "info";
}

/** 避免门禁输出破坏 Markdown 表格或详情块。 */
function formatGateOutput(output) {
  const trimmed = String(output || "").trim();
  if (!trimmed) {
    return "(no output captured)";
  }
  return trimmed.replace(/```/g, "'''");
}

/** 生成 YAML front matter */
function generateFrontMatter(agentName, agentDef, period, gateResults) {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const decisionLevel = getReportDecisionLevel();
  const reportAgent = agentDef.reportAgent ?? agentName;
  const owner = agentDef.owner ?? `@${agentName}`;
  return [
    "---",
    `agent: ${reportAgent}`,
    `period: ${period}`,
    `generated_at: ${now}`,
    `repo_revision: "${getGitSha()}"`,
    `inputs:`,
    `  - AGENTS.md`,
    `  - README.md`,
    `model_policy:`,
    `  tier: ${agentDef.modelPolicy?.tier ?? "default"}`,
    `  reasoning_effort: ${agentDef.modelPolicy?.reasoningEffort ?? "medium"}`,
    `  note: "${agentDef.modelPolicy?.routingNote ?? "Use the inherited automation model unless a task-specific override is approved."}"`,
    `owner: "${owner}"`,
    `decision_level: ${decisionLevel}`,
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
  const lines = [generateFrontMatter(agentName, agentDef, period, gateResults)];

  lines.push(`# ${agentDef.role}: ${period}`);
  lines.push("");
  lines.push("## Automation Notice");
  lines.push("");
  lines.push(
    `This file is automation-generated evidence/template output from \`scripts/agent-runner.mjs\`. It is not a completed ${agentName} specialist review.`,
  );
  lines.push(
    "Treat the front matter `decision_level` as `info`. CI exit codes and job status may indicate failed machine gates, but an agent or human must add substantive analysis before this report can support advisory, release, or merge decisions.",
  );
  lines.push(
    "The `model_policy` front matter is routing guidance for human/Codex orchestration; it does not make a report current, sourced, or merge-ready by itself.",
  );
  lines.push("");

  if (gateResults && gateResults.length > 0) {
    lines.push("## Machine Gate Evidence");
    lines.push("");
    lines.push("| Gate | Status |");
    lines.push("| --- | --- |");
    for (const r of gateResults) {
      lines.push(`| \`${r.gate}\` | ${r.status === "passed" ? "✅" : "❌"} |`);
    }
    lines.push("");
    lines.push("<details>");
    lines.push("<summary>Captured gate output excerpts</summary>");
    lines.push("");
    for (const r of gateResults) {
      lines.push(`### ${r.gate}`);
      lines.push("");
      lines.push(`Status: \`${r.status}\``);
      lines.push("");
      lines.push("```txt");
      lines.push(formatGateOutput(r.output));
      lines.push("```");
      lines.push("");
    }
    lines.push("</details>");
    lines.push("");
  } else {
    lines.push("## Machine Gate Evidence");
    lines.push("");
    lines.push(
      "No gates were run by this invocation. This report is template-only evidence.",
    );
    lines.push("");
  }

  lines.push("## Specialist Analysis Required");
  lines.push("");
  lines.push(
    "<!-- Add evidence-backed findings, impact, required actions, owners, and confidence before using this as an advisory or blocking agent report. -->",
  );
  lines.push("");

  lines.push("## Handoff Required");
  lines.push("");
  lines.push(
    "<!-- Add accepted follow-up tasks, downstream owners, and target artifacts after specialist review. -->",
  );
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
  --dry-run        预览报告目标，不运行门禁或写文件
  --all            运行所有智能体（与 --daily / --weekly 搭配使用）
  --daily          筛选每日 cadence 智能体（code-reviewer、quality-guardian、docs-agent）
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
  let periodType = "all";
  if (agentName === "all" || options.all) {
    // 按当前周期筛选
    if (options.daily) periodType = "daily";
    else if (options.weekly) periodType = "weekly";
    agentsToRun = Object.entries(AGENT_REGISTRY).filter(([, def]) => {
      if (periodType === "all") return true;
      return def.period === periodType || def.cadences?.includes(periodType);
    });
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
  let lockFd = null;
  const lockPath = join(ROOT, ".agent-runner.lock");

  if (!options.dryRun) {
    console.log(`   🔒 正在获取全局运行锁: ${lockPath}`);
    lockFd = acquireRunLock(lockPath);
    console.log(`   🔒 全局运行锁已获取`);
  }

  // 初始化规划状态管理器
  const planningMgr = new PlanningStateManager(ROOT);

  try {
    for (const [name, def] of agentsToRun) {
      // 确定周期
      let period = options.period;
      if (!period) {
        if (periodType === "daily" || def.period === "daily")
          period = getDateStr();
        else if (periodType === "weekly" || def.period === "weekly")
          period = getWeekStr();
        else if (def.period === "monthly") period = getMonthStr();
        else period = getDateStr();
      }

      console.log(`📋 运行智能体: ${name}`);
      console.log(`   角色: ${def.role}`);
      console.log(`   周期: ${period}`);
      console.log(
        `   模型路由: ${def.modelPolicy?.tier ?? "default"} / ${def.modelPolicy?.reasoningEffort ?? "medium"}`,
      );

      // 如果是 task-distributor，验证规划状态一致性
      if (name === "task-distributor") {
        console.log(`   🔍 验证规划状态一致性...`);
        const consistency = planningMgr.validateConsistency(options.dryRun);
        if (!consistency.valid) {
          console.warn(`   ⚠️ 规划状态一致性检查失败（非阻断）`);
        } else if (consistency.issues.length > 0) {
          console.warn(`   ⚠️ 检测到 ${consistency.issues.length} 个警告`);
        } else {
          console.log(`   ✅ 规划状态一致性检查通过`);
        }
      }

      // 运行门禁
      let gateResults = null;
      if (!options.dryRun && def.gates.length > 0) {
        console.log(`   运行门禁 (${def.gates.length} 项)...`);
        gateResults = runGates(def.gates);
        for (const r of gateResults) {
          const icon = r.status === "passed" ? "✅" : "❌";
          console.log(`     ${icon} ${r.gate}`);
          if (def.gateDecisionLevel === "blocking" && r.status === "failed") {
            hasBlockingFailure = true;
          }
        }
      }

      // 写入输出文件
      const outputFile =
        typeof def.outputFile === "function"
          ? def.outputFile(period)
          : def.outputFile;
      const outputPath = join(ROOT, def.outputDir, outputFile);
      if (options.dryRun) {
        console.log(`   📄 (dry-run) 将生成报告: ${outputPath}`);
      } else {
        const report = generateReport(name, def, period, gateResults);
        mkdirSync(dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, report, "utf-8");
        console.log(`   📄 报告已生成: ${outputPath}`);
      }
      console.log("");
    }
  } finally {
    if (lockFd !== null) {
      releaseRunLock(lockFd, lockPath);
      console.log(`   🔓 全局运行锁已释放`);
    }
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
