#!/usr/bin/env node
/**
 * Evolution Pattern & Pitfall Extractor
 *
 * 用法：
 *   node scripts/evolution-pattern-extractor.mjs [options]
 *
 * 选项：
 *   --month <YYYY-MM>    指定月份（默认为当前月）
 *   --dry-run            预览提取结果，不写文件
 *   --force              强制重新生成库（清除旧条目）
 *
 * 功能：
 *   - 扫描已完成任务的报告
 *   - 从"lessons learned"或任务描述中提取 pattern 和 pitfall
 *   - 自动去重和排序
 *   - 生成/更新 docs/planning/evolution-patterns.md 和 evolution-pitfalls.md
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

function getMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getGitSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

/**
 * 从报告内容中提取 YAML front matter 获取 agent 和 decision_level
 */
function parseFrontMatter(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};
  const fm = {};
  for (const line of fmMatch[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

/**
 * 提取 Markdown 表格行
 */
function extractTableRows(content, sectionHeader) {
  const sectionIdx = content.search(new RegExp(sectionHeader, "i"));
  if (sectionIdx === -1) return [];
  const section = content.slice(sectionIdx);
  const rows = [];
  const tableRegex = /\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g;
  let match;
  // 跳过表头行
  let headerSkipped = false;
  while ((match = tableRegex.exec(section)) !== null) {
    const cells = match[0]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (!headerSkipped) {
      headerSkipped = true;
      continue;
    }
    if (cells.length >= 2) {
      rows.push(cells);
    }
    // 限制提取距离，不超出当前 section
    if (rows.length > 20) break;
  }
  return rows;
}

/**
 * 从任务报告中提取 pattern 和 pitfall
 *
 * 提取策略：
 * - patterns: 来自架构评估中的最佳实践描述、成功的 gate 组合模式
 * - pitfalls: 来自 "Residual Risk"、"Known Issues"、阻塞发现
 */
function extractPatternsPitfalls(reportPath) {
  try {
    const content = readFileSync(reportPath, "utf-8");
    const fm = parseFrontMatter(content);
    const agent = fm.agent || "";
    const decisionLevel = fm.decision_level || "";
    const results = { patterns: [], pitfalls: [] };
    const shortPath = reportPath.replace(ROOT + "/", "");

    // ── Pattern 提取 ──

    // 1. 从架构评估中提取评分证据作为 pattern
    if (content.includes("架构") || content.includes("Architecture")) {
      const scoreRows = extractTableRows(
        content,
        "(?:架构|Architecture).*(?:评分|Assessment|Score)",
      );
      for (const row of scoreRows) {
        const score = parseFloat(row[1]);
        if (score >= 8.5 && row[0].length > 5) {
          results.patterns.push({
            title: `${row[0]}`,
            description: `架构评分 ${row[1]}/10。此项在评估中表现优异，代表已验证的设计模式。`,
            source: shortPath,
            score: score,
          });
        }
      }
    }

    // 2. 从 Evidence 表中提取 high-confidence 条目作为 pattern
    const evidenceRows = extractTableRows(content, "## Evidence");
    for (const row of evidenceRows) {
      const confidenceCell = row[row.length - 1] || "";
      if (/high/i.test(confidenceCell) && row[0].length > 10) {
        const description = row.slice(0, 3).join(" — ").slice(0, 250);
        results.patterns.push({
          title: row[0].slice(0, 80),
          description,
          source: shortPath,
          score: null,
        });
      }
    }

    // 3. 从 "Gate Output" 中提取全部通过的 gate 组合作为 pattern
    if (content.includes("Gate Output") || content.includes("门禁")) {
      const gateRows = extractTableRows(content, "(?:Gate Output|门禁)");
      const allPassed = gateRows.every((r) => /pass/i.test(r[1] || ""));
      if (allPassed && gateRows.length >= 5) {
        const gates = gateRows.map((r) => r[0]).join(", ");
        results.patterns.push({
          title: "全门禁通过组合",
          description: `在 ${shortPath} 中，以下门禁全部通过: ${gates}。此 gate 组合可视为 release-quality 门禁模板。`,
          source: shortPath,
          score: null,
        });
      }
    }

    // ── Pitfall 提取 ──

    // 1. "Residual Risk" 节
    const riskSection = content.match(
      /##\s+Residual Risk[\s\S]*?(?=\n##\s|\n---|\n\*{3}|$)/i,
    );
    if (riskSection) {
      const riskText = riskSection[0].slice(0, 400).trim();
      if (riskText.length > 30) {
        results.pitfalls.push({
          title: `Residual Risk: ${shortPath}`,
          description: riskText
            .replace(/^##\s+Residual Risk\s*/i, "")
            .slice(0, 350),
          source: shortPath,
        });
      }
    }

    // 2. 阻塞级发现（decision_level: blocking）
    if (/blocking/i.test(decisionLevel)) {
      const blockingFindings = content.match(
        /(?:###\s+\[P\d\].*?(?=\n###|\n---|\n\*{3}|$))/gs,
      );
      if (blockingFindings) {
        for (const finding of blockingFindings) {
          if (finding.length > 20) {
            results.pitfalls.push({
              title: `Blocking finding in ${shortPath}`,
              description: finding.slice(0, 350),
              source: shortPath,
            });
          }
        }
      }
    }

    // 3. "Known Issues" 或 "Technical Debt" 节
    const debtSection = content.match(
      /##\s+(?:Known Issues|Technical Debt|技术债务|已知问题)[\s\S]*?(?=\n##\s|\n---|$)/i,
    );
    if (debtSection && debtSection[0].length > 30) {
      results.pitfalls.push({
        title: `Tech debt: ${shortPath}`,
        description: debtSection[0].slice(0, 350),
        source: shortPath,
      });
    }

    return results;
  } catch (err) {
    console.warn(`  ⚠️ 无法从 ${reportPath} 提取: ${err.message}`);
    return { patterns: [], pitfalls: [] };
  }
}

/**
 * 去重：基于描述文本的前 80 个字符判断相似度
 */
function deduplicate(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item).slice(0, 80).replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 从 YAML front matter 或文件名推断报告的所属月份
 */
function getReportMonth(filePath, content) {
  // 1. 从 front matter 的 generated_at 提取
  const fm = parseFrontMatter(content);
  if (fm.generated_at) {
    const m = fm.generated_at.match(/^(\d{4}-\d{2})/);
    if (m) return m[1];
  }
  // 2. 从 period 提取（如 "2026-05-31" 或 "2026-W22"）
  if (fm.period) {
    const m = fm.period.match(/^(\d{4})/);
    if (m) {
      const year = m[1];
      // 如果是周格式，近似映射到月
      const weekMatch = fm.period.match(/^(\d{4})-W(\d{2})/);
      if (weekMatch) {
        // 近似：W1-W4 → 01, W5-W8 → 02, ...
        const week = parseInt(weekMatch[2]);
        const month = Math.min(12, Math.ceil(week / 4.34));
        return `${year}-${String(month).padStart(2, "0")}`;
      }
      const dateMatch = fm.period.match(/^(\d{4}-\d{2})/);
      if (dateMatch) return dateMatch[1];
    }
  }
  // 3. 从文件名推断（如 "xxx-2026-05-31.md"）
  const nameMatch = filePath.match(/(\d{4}-\d{2})/);
  if (nameMatch) return nameMatch[1];

  // 4. 回退到文件 mtime
  try {
    const stats = statSync(filePath);
    const mtime = new Date(stats.mtime);
    return `${mtime.getFullYear()}-${String(mtime.getMonth() + 1).padStart(2, "0")}`;
  } catch {
    return "unknown";
  }
}

/**
 * 扫描目录下所有报告文件，递归进入子目录。
 * monthFilter 是一个函数 (reportMonth) => boolean
 */
function scanDirectory(dir, monthFilter) {
  const allResults = { patterns: [], pitfalls: [] };
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const subResults = scanDirectory(entryPath, monthFilter);
        allResults.patterns.push(...subResults.patterns);
        allResults.pitfalls.push(...subResults.pitfalls);
      } else if (entry.name.endsWith(".md")) {
        if (
          entry.name === "REPORT_INDEX.md" ||
          entry.name === "README.md" ||
          entry.name.startsWith("evolution-")
        ) {
          continue;
        }
        try {
          const stats = statSync(entryPath);
          if (stats.size < 500) continue;
          const content = readFileSync(entryPath, "utf-8");
          const reportMonth = getReportMonth(entryPath, content);
          if (monthFilter(reportMonth)) {
            const extracted = extractPatternsPitfalls(entryPath);
            allResults.patterns.push(...extracted.patterns);
            allResults.pitfalls.push(...extracted.pitfalls);
          }
        } catch {
          // skip unreadable
        }
      }
    }
  } catch {
    // directory absent, skip
  }
  return allResults;
}

function getPrevMonth(monthStr) {
  const [year, month] = monthStr.split("-");
  const date = new Date(`${year}-${month}-01`);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 生成 patterns Markdown
 */
function generatePatternsMarkdown(patterns, monthStr) {
  const lines = [];

  lines.push("---");
  lines.push(`generated_at: ${new Date().toISOString()}`);
  lines.push(`repo_revision: "${getGitSha()}"`);
  lines.push(`month: ${monthStr}`);
  lines.push(`total_patterns: ${patterns.length}`);
  lines.push("---");
  lines.push("");
  lines.push("# Evolution Pattern Library");
  lines.push("");
  lines.push("此库记录从已完成任务和架构评估中自动提取的可复用设计模式。");
  lines.push("每个 pattern 包含已验证的方法及其证据来源。");
  lines.push("");

  if (patterns.length === 0) {
    lines.push("*本月尚未提取任何 pattern。*");
    lines.push("");
    lines.push("> 💡 当 review 报告中包含 high-confidence 的 Evidence 条目、");
    lines.push(
      "> 架构评估中包含 >= 8.5 分的维度、或存在全部通过的门禁组合时，",
    );
    lines.push("> 本提取器将自动收录。");
  } else {
    // 按 score 降序排列（有分的在前）
    const sorted = [...patterns].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0),
    );
    let patNum = 1;
    for (const pat of sorted) {
      const scoreTag = pat.score ? ` [评分 ${pat.score}/10]` : "";
      lines.push(
        `## PAT-${String(patNum).padStart(3, "0")}: ${pat.title}${scoreTag}`,
      );
      lines.push("");
      lines.push(`**提取自**: \`${pat.source}\``);
      lines.push("");
      lines.push(pat.description);
      lines.push("");
      patNum += 1;
    }
  }

  return lines.join("\n");
}

/**
 * 生成 pitfalls Markdown
 */
function generatePitfallsMarkdown(pitfalls, monthStr) {
  const lines = [];

  lines.push("---");
  lines.push(`generated_at: ${new Date().toISOString()}`);
  lines.push(`repo_revision: "${getGitSha()}"`);
  lines.push(`month: ${monthStr}`);
  lines.push(`total_pitfalls: ${pitfalls.length}`);
  lines.push("---");
  lines.push("");
  lines.push("# Evolution Pitfall Library");
  lines.push("");
  lines.push(
    "此库记录从代码审查、架构评估和 Residual Risk 分析中提取的常见陷阱。",
  );
  lines.push("每个 pitfall 包含风险描述、来源和避免建议。");
  lines.push("");

  if (pitfalls.length === 0) {
    lines.push("*本月尚未提取任何 pitfall。*");
    lines.push("");
    lines.push("> 💡 当 review 报告中包含 Residual Risk 节、blocking 级发现、");
    lines.push("> 或 Technical Debt / Known Issues 节时，本提取器将自动收录。");
  } else {
    let pitNum = 1;
    for (const pit of pitfalls) {
      lines.push(`## PIT-${String(pitNum).padStart(3, "0")}: ${pit.title}`);
      lines.push("");
      lines.push(`**遇见于**: \`${pit.source}\``);
      lines.push("");
      lines.push(pit.description);
      lines.push("");
      pitNum += 1;
    }
  }

  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    month: getMonthStr(),
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--month" && args[i + 1]) {
      options.month = args[++i];
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
    }
  }

  const prevMonth = getPrevMonth(options.month);

  console.log(`🔬 Evolution Pattern & Pitfall Extractor`);
  console.log(`   月份: ${options.month} (含上月 ${prevMonth})`);
  console.log(`   仓库: ${ROOT}`);
  console.log(`   Git SHA: ${getGitSha()}`);
  console.log("");

  // 扫描多个目录（当月 + 上月）
  const scanDirs = [
    "docs/reviews",
    "docs/planning/feature-specs",
    "docs/archive",
  ];
  const monthFilter = (reportMonth) =>
    reportMonth === options.month || reportMonth === prevMonth;

  let allResults = { patterns: [], pitfalls: [] };

  for (const dir of scanDirs) {
    console.log(`📂 扫描 ${dir}...`);
    const results = scanDirectory(join(ROOT, dir), monthFilter);
    allResults.patterns.push(...results.patterns);
    allResults.pitfalls.push(...results.pitfalls);
  }

  // 去重
  const uniquePatterns = deduplicate(allResults.patterns, (p) => p.description);
  const uniquePitfalls = deduplicate(allResults.pitfalls, (p) => p.description);

  console.log(
    `   ✅ 提取 ${uniquePatterns.length} 个 pattern (去重前 ${allResults.patterns.length}), ${uniquePitfalls.length} 个 pitfall (去重前 ${allResults.pitfalls.length})`,
  );
  console.log("");

  if (!options.dryRun) {
    const patternsPath = join(ROOT, "docs/planning/evolution-patterns.md");
    const pitfallsPath = join(ROOT, "docs/planning/evolution-pitfalls.md");

    mkdirSync(dirname(patternsPath), { recursive: true });

    const patternsMarkdown = generatePatternsMarkdown(
      uniquePatterns,
      options.month,
    );
    writeFileSync(patternsPath, patternsMarkdown, "utf-8");
    console.log(`   📄 已生成 Pattern 库: ${patternsPath}`);

    const pitfallsMarkdown = generatePitfallsMarkdown(
      uniquePitfalls,
      options.month,
    );
    writeFileSync(pitfallsPath, pitfallsMarkdown, "utf-8");
    console.log(`   📄 已生成 Pitfall 库: ${pitfallsPath}`);

    // 列出提取到的 pattern 和 pitfall 概要
    if (uniquePatterns.length > 0) {
      console.log("");
      console.log("   📋 Patterns 概要:");
      for (const p of uniquePatterns.slice(0, 5)) {
        console.log(`      - ${p.title.slice(0, 60)}`);
      }
    }
    if (uniquePitfalls.length > 0) {
      console.log("");
      console.log("   ⚠️  Pitfalls 概要:");
      for (const p of uniquePitfalls.slice(0, 5)) {
        console.log(`      - ${p.title.slice(0, 60)}`);
      }
    }

    console.log("");
    console.log(`✅ Evolution Pattern & Pitfall Extractor 完成`);
  } else {
    console.log(`📄 (dry-run) 将生成:`);
    console.log(`   - ${join(ROOT, "docs/planning/evolution-patterns.md")}`);
    console.log(`   - ${join(ROOT, "docs/planning/evolution-pitfalls.md")}`);
    console.log("");
    console.log(`✅ Dry-run 完成（无文件修改）`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(`❌ 错误:`, err.message);
  process.exit(1);
});
