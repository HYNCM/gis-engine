#!/usr/bin/env node
/**
 * Agent Runner — 智能体调用脚本
 *
 * 用法：
 *   node scripts/agent-runner.mjs <agent-name> [options]
 *
 * 示例：
 *   node scripts/agent-runner.mjs quality --period 2026-06-03
 *   node scripts/agent-runner.mjs orchestrator --week 2026-W23
 *   node scripts/agent-runner.mjs all --daily
 *
 * 此脚本封装了智能体的标准调用流程：
 *   1. 生成标准化的 YAML front matter
 *   2. 运行关联的测试/检查门禁
 *   3. 生成输出报告到指定路径
 *   4. 返回退出码（0=通过，1=警告，2=阻断）
 */

import { execSync } from "node:child_process";
import { closeSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractTaskIds, validateAutomationReportContent, validatePlanningConsistency } from "./agent-framework.mjs";
import {
  AGENT_REGISTRY,
  getAgentOutput,
  listAgentEntries,
  listAgentNames,
  resolveAgentName,
} from "./agent-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── 辅助函数 ──

/** 获取当前日期字符串 */
function getDateStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** 获取当前周字符串 */
function getWeekStr() {
  const d = new Date();
  const utcDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
    return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
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
          throw new Error(`Could not acquire planning lock for ${relativeFilePath} after ${attempt} attempts`);
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

  /** 从 Markdown 文件中提取任务 ID */
  extractTaskIdsFromFile(filePath) {
    try {
      const content = readFileSync(filePath, "utf-8");
      return extractTaskIds(content);
    } catch (err) {
      console.warn(`  ⚠️ 无法解析文件 ${filePath}:`, err.message);
      return { taskIds: [], parseError: err.message };
    }
  }

  /**
   * 验证规划状态的一致性
   * 检查 task-burndown.md 和 dependency-graph.md 中的任务 ID 集合是否匹配。
   */
  validateConsistency(dryRun = false) {
    const burndownPath = join(this.root, "docs/planning/task-burndown.md");
    const depGraphPath = join(this.root, "docs/planning/dependency-graph.md");

    try {
      const burndownContent = readFileSync(burndownPath, "utf-8");
      const depGraphContent = readFileSync(depGraphPath, "utf-8");
      const { valid, issues } = validatePlanningConsistency(burndownContent, depGraphContent);

      if (issues.length > 0) {
        if (!dryRun) {
          console.warn("  ⚠️ 规划状态一致性检查发现问题:");
          for (const issue of issues) {
            const icon = issue.severity === "error" ? "❌" : "⚠️";
            console.warn(`    ${icon} [${issue.code}] ${issue.message}`);
          }
        }
      }

      return { valid, issues };
    } catch (err) {
      console.warn(`  ⚠️ 一致性检查失败: ${err.message}`);
      return {
        valid: false,
        issues: [{ severity: "error", code: "PLANNING_CONSISTENCY_CHECK_FAILED", message: err.message }],
      };
    }
  }
}

// ── 健康检查 ──

/** Agent 健康检查器 */
class HealthCheck {
  constructor(rootPath) {
    this.root = rootPath;
  }

  /**
   * 检查指定 agent 的输入文件是否齐全
   * @returns {{ ok: boolean, missing: string[] }}
   */
  validateInputs(agentName) {
    const missing = [];
    const resolvedName = resolveAgentName(agentName);
    const agentDef = AGENT_REGISTRY[resolvedName];
    if (!agentDef) return { ok: true, missing: [] };

    const requiredInputs = {
      orchestrator: ["docs/planning", "docs/research", "docs/reviews"],
      product: ["docs/research"],
      quality: ["packages", "tests", "docs/reviews"],
      builder: ["packages/engine", "packages/ai", "packages/scene3d-three-adapter", "tests"],
      docs: ["docs", "README.md", "CHANGELOG.md"],
    };

    const paths = requiredInputs[resolvedName] || [];
    for (const p of paths) {
      const fullPath = join(this.root, p);
      try {
        statSync(fullPath);
      } catch {
        missing.push(p);
      }
    }
    return { ok: missing.length === 0, missing };
  }

  /**
   * 检查报告输出格式是否符合标准
   */
  validateReportFormat(reportPath) {
    try {
      const content = readFileSync(reportPath, "utf-8");
      const { valid, issues } = validateAutomationReportContent(content);
      return { valid, issues };
    } catch {
      return { valid: false, issues: ["无法读取报告文件"] };
    }
  }

  /**
   * 检查所有已调度 agent 的报告是否齐全
   * @returns {{ ok: boolean, overdue: Array<{agent: string, expected: string, file: string}> }}
   */
  checkReportCoverage(dryRun = false) {
    const overdue = [];
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    for (const [name, def] of listAgentEntries()) {
      if (def.healthRequired === false) continue;
      let expectedFile;
      if (def.period === "daily") {
        expectedFile = getAgentOutput(def, todayStr).outputFile;
      } else if (def.period === "weekly") {
        expectedFile = getAgentOutput(def, getWeekStr()).outputFile;
      } else {
        continue; // ad-hoc agent 不强制
      }

      const { outputDir } = getAgentOutput(def, def.period === "daily" ? todayStr : getWeekStr());
      const reportPath = join(this.root, outputDir, expectedFile);
      try {
        const stats = statSync(reportPath);
        const ageDays = (now - stats.mtime) / 86400000;
        const maxAge = def.period === "daily" ? 2 : 8; // 每日 2 天、每周 8 天
        if (ageDays > maxAge) {
          overdue.push({
            agent: name,
            expected: expectedFile,
            file: reportPath,
            ageDays: Math.round(ageDays),
          });
        }
      } catch {
        overdue.push({
          agent: name,
          expected: expectedFile,
          file: reportPath,
          ageDays: null,
        });
      }
    }

    if (!dryRun && overdue.length > 0) {
      console.warn("  ⚠️ 报告覆盖检查发现问题:");
      for (const item of overdue) {
        const ageStr = item.ageDays ? ` (${item.ageDays} 天前)` : " (不存在)";
        console.warn(`    ⚠️ ${item.agent}: ${item.expected}${ageStr}`);
      }
    }

    return { ok: overdue.length === 0, overdue };
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
function generateFrontMatter(agentName, agentDef, period, _gateResults) {
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
export function generateReport(agentName, agentDef, period, gateResults) {
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
    lines.push("No gates were run by this invocation. This report is template-only evidence.");
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
  lines.push("<!-- Add accepted follow-up tasks, downstream owners, and target artifacts after specialist review. -->");
  lines.push("");

  return lines.join("\n");
}

// ── 主逻辑 ──

async function main() {
  const args = process.argv.slice(2);
  const rawAgentName = args[0];
  const agentName = resolveAgentName(rawAgentName);

  if (!rawAgentName || rawAgentName === "--help" || rawAgentName === "-h") {
    console.log(`
Agent Runner — GIS Engine 多智能体调用脚本

用法: node scripts/agent-runner.mjs <agent-name> [options]

可用智能体:
  ${listAgentNames().join("\n  ")}

旧别名:
  coordinator, task-distributor, competitive-intel, product-strategist,
  code-reviewer, quality-guardian, engine-agent, ai-agent, adapter-agent,
  qa-agent, docs-agent

选项:
  --period <str>   指定周期 (如 2026-05-24, 2026-W22, 2026-05)
  --dry-run        预览报告目标，不运行门禁或写文件
  --all            运行所有智能体（与 --daily / --weekly 搭配使用）
  --daily          筛选每日 cadence 智能体（quality、docs）
  --weekly         筛选每周智能体

示例:
  node scripts/agent-runner.mjs quality --period 2026-06-03
  node scripts/agent-runner.mjs orchestrator --period 2026-W23
  node scripts/agent-runner.mjs all --daily
`);
    process.exit(0);
  }

  if (rawAgentName !== agentName && rawAgentName !== "all") {
    console.warn(`⚠️ 旧智能体入口 ${rawAgentName} 已映射到 ${agentName}，请迁移到新 5-agent 命名。`);
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
    agentsToRun = listAgentEntries().filter(([, def]) => {
      if (periodType === "all") return true;
      return def.period === periodType || def.cadences?.includes(periodType);
    });
  } else {
    const def = AGENT_REGISTRY[agentName];
    if (!def) {
      console.error(`❌ 未知智能体: ${rawAgentName}`);
      console.error(`   可用: ${listAgentNames().join(", ")}`);
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

  // 初始化规划状态管理器和健康检查
  const planningMgr = new PlanningStateManager(ROOT);
  const healthChecker = new HealthCheck(ROOT);

  try {
    // 批量运行时先执行健康检查
    if (agentsToRun.length > 1) {
      console.log(`🏥 运行 Agent 健康检查...`);
      const coverage = healthChecker.checkReportCoverage(options.dryRun);
      if (coverage.overdue.length > 0) {
        console.warn(`   ⚠️ ${coverage.overdue.length} 个报告逾期或缺失`);
      } else {
        console.log(`   ✅ 所有定期报告齐全`);
      }
      console.log("");
    }

    for (const [name, def] of agentsToRun) {
      // 确定周期
      let period = options.period;
      if (!period) {
        if (periodType === "daily" || def.period === "daily") period = getDateStr();
        else if (periodType === "weekly" || def.period === "weekly") period = getWeekStr();
        else if (def.period === "monthly") period = getMonthStr();
        else period = getDateStr();
      }

      console.log(`📋 运行智能体: ${name}`);
      console.log(`   角色: ${def.role}`);
      console.log(`   周期: ${period}`);
      console.log(
        `   模型路由: ${def.modelPolicy?.tier ?? "default"} / ${def.modelPolicy?.reasoningEffort ?? "medium"}`,
      );

      // 如果是 orchestrator，验证规划状态一致性
      if (name === "orchestrator") {
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
      const { outputDir, outputFile } = getAgentOutput(def, period);
      const outputPath = join(ROOT, outputDir, outputFile);
      if (options.dryRun) {
        console.log(`   📄 (dry-run) 将生成报告: ${outputPath}`);
      } else {
        const report = generateReport(name, def, period, gateResults);
        const reportValidation = validateAutomationReportContent(report);
        if (!reportValidation.valid) {
          throw new Error(`Generated report failed validation for ${name}: ${reportValidation.issues.join("; ")}`);
        }
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("❌ Agent Runner 异常:", err.message);
    process.exit(1);
  });
}
