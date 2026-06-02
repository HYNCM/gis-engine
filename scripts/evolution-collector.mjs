#!/usr/bin/env node
/**
 * Evolution Collector — 进化度量收集脚本
 *
 * 从 sprint 构件和 review 报告中收集 D1-D6 度量数据，
 * 生成进化账本周条目，检测异常并提取可复用的设计模式。
 *
 * 用法：
 *   node scripts/evolution-collector.mjs [options]
 *
 * 选项：
 *   --week W22          目标周（默认当前周）
 *   --dry-run           仅分析，不写入进化账本
 *   --anomaly-only      仅输出异常检测结果
 *   --patterns          仅提取设计模式和陷阱
 *
 * 退出码：
 *   0 - 成功，无异常
 *   1 - 警告：检测到异常（偏差率 > 1.0 或瓶颈复发）
 *   2 - 错误：无法读取必要的构件
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import generateEvolutionSnapshot from "./evolution-snapshot-generator.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── CLI 参数解析 ──
const args = process.argv.slice(2);
const options = {
  week: getCurrentWeek(),
  dryRun: args.includes("--dry-run"),
  anomalyOnly: args.includes("--anomaly-only"),
  patternsOnly: args.includes("--patterns"),
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--week" && args[i + 1]) {
    options.week = args[i + 1];
    i++;
  }
}

// ── 工具函数 ──

/** 获取当前 ISO 周（如 2026-W22） */
function getCurrentWeek() {
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

function getIsoWeekDatePatterns(week) {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) return [];

  const isoYear = Number.parseInt(match[1], 10);
  const isoWeek = Number.parseInt(match[2], 10);
  if (!Number.isInteger(isoYear) || !Number.isInteger(isoWeek)) {
    return [];
  }

  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (isoWeek - 1) * 7);

  const patterns = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    patterns.push(new RegExp(d.toISOString().slice(0, 10)));
  }
  return patterns;
}

/** 安全读取文件，不存在返回 null */
function safeRead(filePath) {
  try {
    return readFileSync(join(ROOT, filePath), "utf-8");
  } catch {
    return null;
  }
}

/** 列出目录中匹配模式的文件 */
function listFiles(dir, pattern) {
  try {
    const fullPath = join(ROOT, dir);
    if (!existsSync(fullPath)) return [];
    return readdirSync(fullPath)
      .filter((f) => pattern.test(f))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

/** 从 markdown 中提取 YAML front matter */
function extractFrontMatter(content) {
  if (!content || !content.startsWith("---")) return {};
  const end = content.indexOf("---", 3);
  if (end === -1) return {};
  const yaml = content.slice(3, end).trim();
  const result = {};
  for (const line of yaml.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

/** 从 markdown 表格中提取任务数据 */
function extractTaskTable(content) {
  const tasks = [];
  if (!content) return tasks;

  // Find markdown tables with task-like headers
  const lines = content.split("\n");
  let inTable = false;
  let headers = [];
  let headerLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect table header with task columns
    if (
      line.startsWith("|") &&
      line.includes("id") &&
      line.includes("title") &&
      line.includes("status")
    ) {
      inTable = true;
      headers = line
        .split("|")
        .map((h) => h.trim())
        .filter(Boolean);
      headerLine = i;
      continue;
    }

    // Skip separator line
    if (inTable && line.startsWith("|") && /^[\|\s\-:]+$/.test(line)) {
      continue;
    }

    // Parse data rows
    if (inTable && line.startsWith("|") && line.includes("TASK-")) {
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      const task = {};
      for (let j = 0; j < Math.min(headers.length, cells.length); j++) {
        task[headers[j].toLowerCase()] = cells[j];
      }
      tasks.push(task);
      continue;
    }

    // Exit table on empty line or non-table content
    if (inTable && (!line.startsWith("|") || line === "")) {
      if (tasks.length > 0) break; // found tasks, stop
      inTable = false; // no tasks in this table, keep looking
    }
  }

  return tasks;
}

/** 从 sprint markdown 中查找 retrospective / lessons_learned 块 */
function extractRetrospective(content) {
  if (!content) return null;
  const retroMatch = content.match(
    /## Retrospective[\s\S]*?(?=\n## |\n---|\n$)/,
  );
  if (!retroMatch) return null;

  const retro = { lessons: [] };
  const section = retroMatch[0];

  // Extract estimation data
  const estPattern = /estimated_hours:\s*(\d+).*?actual_hours:\s*(\d+)/gs;
  let m;
  while ((m = estPattern.exec(section)) !== null) {
    retro.lessons.push({
      estimated: parseInt(m[1]),
      actual: parseInt(m[2]),
    });
  }

  return retro;
}

// ── D1: 估算准确度 ──
function collectEstimationAccuracy(tasks) {
  const results = [];
  let totalEstimated = 0;
  let totalActual = 0;
  let knownActualCount = 0;

  for (const task of tasks) {
    const complexity = (task.complexity || "S").toUpperCase();
    const estimated = complexityToHours(complexity);
    const actual = getTaskActualHours(task);
    const deviation =
      estimated > 0 && actual !== null
        ? Math.abs(estimated - actual) / estimated
        : null;
    results.push({
      id: task.id,
      complexity,
      estimated,
      actual,
      deviation,
    });

    totalEstimated += estimated;
    if (actual !== null) {
      totalActual += actual;
      knownActualCount++;
    }
  }

  const knownDeviations = results.filter((r) => r.deviation !== null);
  const avgDeviation =
    knownDeviations.length > 0
      ? knownDeviations.reduce((s, r) => s + r.deviation, 0) /
        knownDeviations.length
      : null;

  return {
    tasks: results,
    summary: {
      totalEstimated,
      totalActual,
      knownActualCount,
      unknownActualCount: results.length - knownActualCount,
      avgDeviation,
      count: results.length,
    },
    byComplexity: groupBy(results, "complexity", (items) => ({
      count: items.length,
      knownActualCount: items.filter((i) => i.deviation !== null).length,
      avgDeviation:
        items.filter((i) => i.deviation !== null).length > 0
          ? items
              .filter((i) => i.deviation !== null)
              .reduce((s, i) => s + i.deviation, 0) /
            items.filter((i) => i.deviation !== null).length
          : null,
    })),
  };
}

function complexityToHours(c) {
  const map = { S: 4, M: 12, L: 24, XL: 40 };
  return map[c] || 4;
}

function getTaskActualHours(task) {
  const candidates = [
    task.actual_hours,
    task["actual hours"],
    task.actual,
    task["actual h"],
  ];
  for (const candidate of candidates) {
    const hours = parseOptionalHours(candidate);
    if (hours !== null) return hours;
  }
  return null;
}

function parseOptionalHours(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized || normalized === "?" || /^n\/a$/i.test(normalized)) {
    return null;
  }
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  return Number.parseFloat(match[0]);
}

// ── D2: 瓶颈检测 ──
function detectBottlenecks(tasks, dependencyGraph) {
  const bottlenecks = [];
  const criticalPathTasks = tasks.filter(
    (t) => t.id && (t.priority === "P0" || t.critical_path === "true"),
  );

  // Check for single-owner blocking patterns
  const ownerBlockCount = {};
  for (const task of tasks) {
    if (task.status === "blocked" && task.owner) {
      const owners = task.owner.split(",").map((o) => o.trim());
      for (const owner of owners) {
        ownerBlockCount[owner] = (ownerBlockCount[owner] || 0) + 1;
      }
    }
  }

  for (const [owner, count] of Object.entries(ownerBlockCount)) {
    if (count >= 3) {
      bottlenecks.push({
        type: "single-owner-overload",
        owner,
        blockedTaskCount: count,
        suggestion: `考虑拆分 ${owner} 的职责或增加并行度`,
        severity: count >= 5 ? "critical" : "warning",
      });
    }
  }

  // Check critical path ratio
  const criticalRatio =
    tasks.length > 0 ? criticalPathTasks.length / tasks.length : 0;
  if (criticalRatio > 0.6) {
    bottlenecks.push({
      type: "high-critical-path-ratio",
      ratio: criticalRatio.toFixed(2),
      criticalCount: criticalPathTasks.length,
      totalCount: tasks.length,
      suggestion: "关键路径占比过高，建议减少串行依赖",
      severity: "warning",
    });
  }

  return bottlenecks;
}

// ── D3: 质量趋势 ──
function collectQualityTrends(reviewFiles) {
  const gateResults = { pass: 0, fail: 0, waiver: 0, total: 0 };
  const byCategory = {};
  const uniqueReviewFiles = [...new Set(reviewFiles)];

  for (const file of uniqueReviewFiles) {
    const content = safeRead(file);
    if (!content) continue;

    const fm = extractFrontMatter(content);
    const agent = fm.agent || "unknown";
    const rows = extractGateResultRows(content);
    if (rows.length === 0) continue;

    if (!byCategory[agent]) {
      byCategory[agent] = { pass: 0, fail: 0, waiver: 0, total: 0 };
    }

    for (const result of rows) {
      gateResults[result]++;
      gateResults.total++;
      byCategory[agent][result]++;
      byCategory[agent].total++;
    }
  }

  const firstPassRate =
    gateResults.total > 0
      ? ((gateResults.pass / gateResults.total) * 100).toFixed(1)
      : null;

  return {
    gateResults,
    byCategory,
    firstPassRate: firstPassRate === null ? "N/A" : `${firstPassRate}%`,
  };
}

function extractGateResultRows(content) {
  const results = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const headerLine = lines[i].trim();
    if (!headerLine.startsWith("|")) continue;

    const headers = splitMarkdownRow(headerLine).map((h) => h.toLowerCase());
    const gateIndex = headers.findIndex((h) => ["gate", "command"].includes(h));
    const resultIndex = headers.findIndex(
      (h) => h === "result" || h === "status",
    );
    if (gateIndex === -1 || resultIndex === -1) continue;

    let rowIndex = i + 1;
    if (
      lines[rowIndex]?.trim().startsWith("|") &&
      /^[\|\s\-:]+$/.test(lines[rowIndex].trim())
    ) {
      rowIndex++;
    }

    while (rowIndex < lines.length) {
      const row = lines[rowIndex].trim();
      if (!row.startsWith("|")) break;
      const cells = splitMarkdownRow(row);
      const result = normalizeGateResult(cells[resultIndex]);
      if (result) {
        results.push(result);
      }
      rowIndex++;
    }
  }

  return results;
}

function splitMarkdownRow(row) {
  return row
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function normalizeGateResult(cell) {
  const value = String(cell || "")
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .trim();
  if (!value) return null;
  if (value.includes("waiver") || value.includes("waived")) return "waiver";
  if (value.includes("conditional pass")) return "waiver";
  if (/^(✅\s*)?(pass|passed|green|ok)\b/.test(value) || value === "✅") {
    return "pass";
  }
  if (
    /^(❌\s*)?(fail|failed|blocked|block|red)\b/.test(value) ||
    value === "❌"
  ) {
    return "fail";
  }
  return null;
}

function normalizeOwner(owner) {
  return owner.trim().replace(/`/g, "").replace(/^@/, "");
}

// ── D4: 知识提取 ──
function extractPatterns(sprintContent) {
  const patterns = [];
  const pitfalls = [];

  if (!sprintContent) return { patterns, pitfalls };

  // Look for explicit pattern and pitfall declarations in YAML code blocks.
  const yamlBlocks = sprintContent.match(/```yaml[\s\S]*?```/g);
  if (yamlBlocks) {
    for (const block of yamlBlocks) {
      if (block.includes("pattern_id:")) {
        patterns.push(parsePatternBlock(block));
      }
      if (block.includes("pitfall_id:")) {
        pitfalls.push(parsePatternBlock(block));
      }
    }
  }

  // Also scan for implicit patterns from section headers
  const designDecisions = sprintContent.match(
    /## (?:Design Decision|Architecture Note)[\s\S]*?(?=\n## |\n---|\n$)/g,
  );
  if (designDecisions) {
    for (const dd of designDecisions) {
      patterns.push({
        source: "design-decision",
        description: dd
          .replace(/^## .*\n/, "")
          .trim()
          .slice(0, 200),
      });
    }
  }

  return { patterns, pitfalls };
}

function parsePatternBlock(block) {
  const lines = block
    .replace(/```yaml\n?|```/g, "")
    .trim()
    .split("\n");
  const result = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

// ── D5: 动态职责分布 ──
function collectResponsibilityDistribution(tasks) {
  const distribution = {};
  let total = 0;

  for (const task of tasks) {
    if (!task.owner) continue;
    const owners = task.owner.split(",").map(normalizeOwner).filter(Boolean);
    for (const owner of owners) {
      distribution[owner] = (distribution[owner] || 0) + 1;
      total++;
    }
  }

  const percentages = {};
  for (const [owner, count] of Object.entries(distribution)) {
    percentages[owner] =
      total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%";
  }

  return { distribution, percentages, total };
}

// ── D6: 决策权重评估 ──
function evaluateDecisionWeights(sprintContent) {
  // Extract priority scores from sprint docs
  const priorities = [];
  const priorityPattern = /priority\s*=\s*[\s\S]*?(\d+\.?\d*)/g;
  const matches = sprintContent ? sprintContent.matchAll(priorityPattern) : [];

  for (const match of matches) {
    priorities.push(parseFloat(match[1]));
  }

  return {
    scoresObserved: priorities.length,
    avgPriorityScore:
      priorities.length > 0
        ? (priorities.reduce((a, b) => a + b, 0) / priorities.length).toFixed(2)
        : "N/A",
  };
}

// ── 辅助：groupBy ──
function groupBy(array, key, aggregate) {
  const groups = {};
  for (const item of array) {
    const k = item[key] || "unknown";
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
  }
  const result = {};
  for (const [k, items] of Object.entries(groups)) {
    result[k] = aggregate(items);
  }
  return result;
}

function formatMetric(value) {
  return value === null || value === undefined ? "N/A" : value.toFixed(2);
}

function getRepoRevision() {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: ROOT,
      encoding: "utf-8",
    }).trim();
  } catch (error) {
    return "unknown";
  }
}

// ── 主流程 ──
function main() {
  console.log(`🔬 Evolution Collector — ${options.week}`);
  console.log("");

  // 1. 扫描 sprint 和 review 文件
  const planDir = "docs/planning";
  const reviewDir = "docs/reviews";

  const sprintFiles = listFiles(
    planDir,
    new RegExp(`sprint-${options.week}`, "i"),
  );
  const reviewFiles = [
    ...listFiles(reviewDir, new RegExp(`${options.week}`, "i")),
    ...getIsoWeekDatePatterns(options.week).flatMap((pattern) =>
      listFiles(reviewDir, pattern),
    ),
  ];

  console.log(`📂 找到 ${sprintFiles.length} 个 sprint 文件`);
  console.log(`📂 找到 ${reviewFiles.length} 个 review 文件`);

  // 2. 提取任务数据
  let allTasks = [];
  let allSprintContent = "";

  for (const file of sprintFiles) {
    const content = safeRead(file);
    if (!content) continue;
    allSprintContent += content + "\n";
    const tasks = extractTaskTable(content);
    allTasks = allTasks.concat(tasks);
  }

  console.log(`📊 提取到 ${allTasks.length} 个任务`);

  // Also check burndown
  const burndownContent = safeRead("docs/planning/task-burndown.md");
  if (burndownContent) {
    const burndownTasks = extractTaskTable(burndownContent);
    // Merge, avoiding duplicates by id
    const existingIds = new Set(allTasks.map((t) => t.id));
    for (const bt of burndownTasks) {
      if (!existingIds.has(bt.id)) {
        allTasks.push(bt);
        existingIds.add(bt.id);
      }
    }
    console.log(`📊 合并后总计 ${allTasks.length} 个任务`);
  }

  // 3. 收集 D1-D6 度量
  const d1 = collectEstimationAccuracy(allTasks);
  const d2 = detectBottlenecks(allTasks, null);
  const d3 = collectQualityTrends(reviewFiles);
  const d4 = extractPatterns(allSprintContent);
  const d5 = collectResponsibilityDistribution(allTasks);
  const d6 = evaluateDecisionWeights(allSprintContent);

  // 4. 输出结果
  if (options.patternsOnly) {
    console.log("\n## 提取的设计模式\n");
    for (const p of d4.patterns) {
      console.log(
        `- ${p.pattern_id || p.source}: ${p.description || p.name || "(未命名)"}`,
      );
    }
    console.log("\n## 提取的陷阱\n");
    for (const p of d4.pitfalls) {
      console.log(
        `- ${p.pitfall_id || "未知"}: ${p.description || "(无描述)"}`,
      );
    }
    return 0;
  }

  if (options.anomalyOnly) {
    let anomalyCount = 0;
    if (d1.summary.avgDeviation !== null && d1.summary.avgDeviation > 1.0) {
      console.log(
        `⚠️ 估算偏差率异常: ${formatMetric(d1.summary.avgDeviation)}`,
      );
      anomalyCount++;
    }
    for (const b of d2) {
      console.log(`⚠️ 瓶颈: [${b.severity}] ${b.type} - ${b.suggestion}`);
      anomalyCount++;
    }
    if (d3.firstPassRate && parseFloat(d3.firstPassRate) < 70) {
      console.log(`⚠️ 门禁首次通过率低: ${d3.firstPassRate}`);
      anomalyCount++;
    }
    return anomalyCount > 0 ? 1 : 0;
  }

  // Full report
  console.log("\n═══════════════════════════════════════════");
  console.log("  Evolution Metrics Report");
  console.log("═══════════════════════════════════════════\n");

  console.log("## D1: 估算准确度");
  console.log(`  任务数: ${d1.summary.count}`);
  console.log(
    `  实际工时已知/未知: ${d1.summary.knownActualCount}/${d1.summary.unknownActualCount}`,
  );
  console.log(`  平均偏差率: ${formatMetric(d1.summary.avgDeviation)}`);
  for (const [complexity, data] of Object.entries(d1.byComplexity)) {
    console.log(
      `  ${complexity}: ${data.count} 任务, ${data.knownActualCount} 个有实际工时, 平均偏差 ${formatMetric(data.avgDeviation)}`,
    );
  }

  console.log("\n## D2: 瓶颈检测");
  if (d2.length === 0) {
    console.log("  ✅ 未检测到瓶颈");
  } else {
    for (const b of d2) {
      console.log(`  [${b.severity}] ${b.type}: ${b.suggestion}`);
    }
  }

  console.log("\n## D3: 质量趋势");
  console.log(`  首次通过率: ${d3.firstPassRate}`);
  console.log(
    `  通过: ${d3.gateResults.pass}, 失败: ${d3.gateResults.fail}, 豁免: ${d3.gateResults.waiver}`,
  );

  console.log("\n## D4: 知识积累");
  console.log(`  新模式: ${d4.patterns.length}`);
  console.log(`  新陷阱: ${d4.pitfalls.length}`);

  console.log("\n## D5: 职责分布");
  for (const [owner, pct] of Object.entries(d5.percentages)) {
    console.log(`  ${owner}: ${d5.distribution[owner]} 任务 (${pct})`);
  }

  console.log("\n## D6: 决策权重");
  console.log(`  观察到 ${d6.scoresObserved} 个优先级评分`);
  if (d6.avgPriorityScore !== "N/A") {
    console.log(`  平均优先级: ${d6.avgPriorityScore}`);
  }

  // 5. 检查异常
  let anomalies = 0;
  if (d1.summary.avgDeviation !== null && d1.summary.avgDeviation > 1.0) {
    anomalies++;
  }
  if (d2.some((b) => b.severity === "critical")) anomalies++;
  if (d3.firstPassRate && parseFloat(d3.firstPassRate) < 70) anomalies++;

  console.log(`\n${anomalies > 0 ? "⚠️" : "✅"} 检测到 ${anomalies} 个异常`);

  // 6. 如果不是 dry-run，生成进化账本条目的追加内容
  if (!options.dryRun) {
    const ledgerPath = join(ROOT, "docs/planning/evolution-ledger.md");
    const existingLedger = safeRead("docs/planning/evolution-ledger.md") || "";

    const newEntry = generateLedgerEntry(options.week, {
      d1,
      d2,
      d3,
      d4,
      d5,
      d6,
    });

    if (!existingLedger.includes(`### ${options.week}`)) {
      mkdirSync(dirname(ledgerPath), { recursive: true });
      const base = existingLedger.replace(/\s*$/, "\n");
      const updatedLedger = `${base}${newEntry.trimStart()}`;
      writeFileSync(
        ledgerPath,
        updatedLedger.endsWith("\n") ? updatedLedger : `${updatedLedger}\n`,
        "utf-8",
      );
      console.log(`\n📝 已追加 ${options.week} 周条目到进化账本`);
    } else {
      console.log(`\n📝 ${options.week} 条目已存在于进化账本中`);
    }

    const generatedAt = new Date().toISOString();
    const repoRevision = getRepoRevision();
    const snapshotResult = generateEvolutionSnapshot(
      options.week,
      {
        d1,
        d2,
        d3,
        d4,
        d5,
        d6,
        generatedAt,
        repoRevision,
      },
      options.dryRun,
    );

    if (snapshotResult && snapshotResult.path) {
      console.log(`✅ 已生成 Evolution Snapshot: ${snapshotResult.path}`);
    }
  }

  return anomalies > 0 ? 1 : 0;
}

function generateLedgerEntry(week, metrics) {
  const { d1, d2, d3, d4, d5, d6 } = metrics;

  let entry = `\n### ${week}\n\n`;
  entry += `> 本条目由 \`scripts/evolution-collector.mjs\` 自动生成，作为 orchestrator/evolution-guardian 的度量输入。补充实际工时、人工复核和影响判断前，不得用于规则调整或 blocking 决策。\n\n`;

  // D1
  entry += `#### D1：估算准确度\n\n`;
  entry += `| 指标 | 值 |\n|---|---|\n`;
  entry += `| 任务数 | ${d1.summary.count} |\n`;
  entry += `| 实际工时已知 / 未知 | ${d1.summary.knownActualCount} / ${d1.summary.unknownActualCount} |\n`;
  entry += `| 平均偏差率 | ${formatMetric(d1.summary.avgDeviation)} |\n`;
  for (const [c, data] of Object.entries(d1.byComplexity)) {
    entry += `| ${c} 平均偏差 | ${formatMetric(data.avgDeviation)} (${data.knownActualCount}/${data.count} 有实际工时) |\n`;
  }

  // D2
  entry += `\n#### D2：瓶颈检测\n\n`;
  if (d2.length === 0) {
    entry += `✅ 未检测到瓶颈。\n`;
  } else {
    for (const b of d2) {
      entry += `- **[${b.severity}]** ${b.type}: ${b.suggestion}\n`;
    }
  }

  // D3
  entry += `\n#### D3：质量趋势\n\n`;
  entry += `| 指标 | 值 |\n|---|---|\n`;
  entry += `| 首次通过率 | ${d3.firstPassRate} |\n`;
  entry += `| 通过 / 失败 / 豁免 | ${d3.gateResults.pass} / ${d3.gateResults.fail} / ${d3.gateResults.waiver} |\n`;

  // D4
  entry += `\n#### D4：知识积累\n\n`;
  entry += `- 新模式: ${d4.patterns.length}\n`;
  entry += `- 新陷阱: ${d4.pitfalls.length}\n`;

  // D5
  entry += `\n#### D5：职责分布\n\n`;
  for (const [owner, pct] of Object.entries(d5.percentages)) {
    entry += `- ${owner}: ${d5.distribution[owner]} 任务 (${pct})\n`;
  }

  // D6
  entry += `\n#### D6：决策权重\n\n`;
  entry += `- 观察到的优先级评分: ${d6.scoresObserved}\n`;
  entry += `- 平均优先级: ${d6.avgPriorityScore}\n`;

  return entry;
}

// ── 执行 ──
const exitCode = main();
process.exit(exitCode);
