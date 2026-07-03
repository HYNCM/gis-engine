#!/usr/bin/env node
/**
 * Doc Generator — 自动文档生成器
 *
 * 从代码和测试构件自动生成/更新以下文档：
 *   1. CHANGELOG.md（从 git log 提取）
 *   2. 支持的 feature matrix（从测试和 schema 提取）
 *   3. API 文档骨架（从 TypeBox schema 提取）
 *   4. 文档交叉引用完整性报告
 *
 * 用法：
 *   node scripts/doc-generator.mjs [target]
 *
 * 目标：
 *   changelog  - 生成 CHANGELOG.md 条目
 *   features   - 生成 feature matrix 审计报告
 *   api        - 从 schema 生成 API 文档骨架
 *   links      - 检查并报告文档交叉引用完整性
 *   all        - 运行以上全部
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── 工具函数 ──

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: "pipe",
      ...opts,
    }).trim();
  } catch (err) {
    if (opts.ignoreError) return "";
    throw err;
  }
}

function getDate() {
  return new Date().toISOString().slice(0, 10);
}

function findFiles(dir, pattern) {
  const results = [];
  try {
    const entries = readdirSync(join(ROOT, dir), { recursive: true });
    for (const entry of entries) {
      if (entry.match(pattern)) {
        results.push(join(dir, entry));
      }
    }
  } catch {
    // directory might not exist
  }
  return results;
}

function isArchivedDocIssue(issue) {
  return issue.source.includes("/archive/");
}

// ── Changelog 生成器 ──

function generateChangelog() {
  console.log("📝 生成 CHANGELOG 条目...");

  // 获取自上次 tag 以来的 commits
  const lastTag = run("git describe --tags --abbrev=0 2>/dev/null || echo ''", {
    ignoreError: true,
  });
  const range = lastTag ? `${lastTag}..HEAD` : "HEAD~30..HEAD";

  const commits = run(`git log ${range} --oneline --no-merges`, {
    ignoreError: true,
  });

  if (!commits) {
    console.log("   没有新 commits");
    return;
  }

  const lines = commits.split("\n").filter(Boolean);

  // 分类 commits
  const categories = {
    feat: [],
    fix: [],
    docs: [],
    refactor: [],
    test: [],
    chore: [],
  };

  for (const line of lines) {
    const match = line.match(/^[a-f0-9]+\s+(feat|fix|docs|refactor|test|chore)(\(.*?\))?:\s*(.+)/);
    if (match) {
      const [, type, scope, msg] = match;
      const scopeStr = scope ? `**${scope.slice(1, -1)}**: ` : "";
      categories[type].push(`- ${scopeStr}${msg}`);
    } else {
      categories.chore.push(`- ${line.slice(10)}`);
    }
  }

  // 生成 changelog 条目
  let changelog = "";

  if (categories.feat.length > 0) {
    changelog += "### Features\n\n";
    changelog += `${categories.feat.join("\n")}\n\n`;
  }
  if (categories.fix.length > 0) {
    changelog += "### Bug Fixes\n\n";
    changelog += `${categories.fix.join("\n")}\n\n`;
  }
  if (categories.docs.length > 0) {
    changelog += "### Documentation\n\n";
    changelog += `${categories.docs.join("\n")}\n\n`;
  }
  if (categories.refactor.length > 0) {
    changelog += "### Refactoring\n\n";
    changelog += `${categories.refactor.join("\n")}\n\n`;
  }
  if (categories.test.length > 0) {
    changelog += "### Tests\n\n";
    changelog += `${categories.test.join("\n")}\n\n`;
  }

  console.log(
    `   找到 ${lines.length} commits (feat:${categories.feat.length}, fix:${categories.fix.length}, docs:${categories.docs.length})`,
  );

  return changelog;
}

// ── Feature Matrix 生成器 ──

function generateFeatureMatrix() {
  console.log("📊 生成 Feature Matrix...");

  const features = [];

  // 从测试文件推断 feature 状态
  const testDirs = [
    { dir: "tests/schema", feature: "Schema Validation" },
    { dir: "tests/commands", feature: "Command System" },
    { dir: "tests/patch", feature: "JSON Patch" },
    { dir: "tests/runtime", feature: "Map Runtime" },
    { dir: "tests/adapter", feature: "Renderer Adapters" },
    { dir: "tests/ai", feature: "MCP / AI Tools" },
    { dir: "tests/snapshot", feature: "Snapshot Harness" },
    { dir: "tests/resources", feature: "Resource Policy" },
    { dir: "tests/perf", feature: "Performance" },
    { dir: "tests/examples", feature: "Examples" },
  ];

  for (const { dir, feature } of testDirs) {
    const fullPath = join(ROOT, dir);
    if (existsSync(fullPath)) {
      const files = readdirSync(fullPath, { recursive: true }).filter((f) => f.endsWith(".test.ts"));
      features.push({
        feature,
        status: files.length > 0 ? "✅ tested" : "⚠️ no tests",
        testCount: files.length,
      });
    }
  }

  // 检查 examples
  const exampleDirs = existsSync(join(ROOT, "examples"))
    ? readdirSync(join(ROOT, "examples"), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  for (const ex of exampleDirs) {
    features.push({
      feature: `Example: ${ex}`,
      status: "✅ exists",
      testCount: 0,
    });
  }

  // 生成 markdown 表格。不要覆盖人工维护的 supported-feature-matrix.md；
  // 那份文件是发布契约，自动化只提供审计输入。
  let md = "## Feature Matrix Audit (Auto-generated)\n\n";
  md += `> 自动生成于 ${getDate()}，基于测试覆盖和示例目录。\n\n`;
  md += "| Feature | Status | Test Files |\n";
  md += "| --- | --- | ---: |\n";
  for (const f of features) {
    md += `| ${f.feature} | ${f.status} | ${f.testCount} |\n`;
  }

  return md;
}

// ── API 文档骨架生成器 ──

function generateApiDocSkeleton() {
  console.log("🔧 生成 API 文档骨架...");

  const packages = ["engine", "ai", "scene3d", "scene3d-three-adapter"];
  let md = "## API Documentation Skeleton (Auto-generated)\n\n";
  md += `> 自动生成于 ${getDate()}，基于包导出。\n\n`;

  for (const pkg of packages) {
    const indexPath = join(ROOT, "packages", pkg, "src", "index.ts");
    if (!existsSync(indexPath)) continue;

    const content = readFileSync(indexPath, "utf-8");
    const exports = [];
    const exportRegex = /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    if (exports.length > 0) {
      md += `### @gis-engine/${pkg}\n\n`;
      md += "| Export | Kind |\n";
      md += "| --- | --- |\n";
      for (const exp of exports) {
        md += `| \`${exp}\` | - |\n`;
      }
      md += "\n";
    }
  }

  return md;
}

// ── 文档交叉引用检查 ──

function checkDocLinks() {
  console.log("🔗 检查文档交叉引用...");

  const issues = [];
  const docFiles = findFiles("docs", /\.md$/);

  for (const docFile of docFiles) {
    const fullPath = join(ROOT, docFile);
    const content = readFileSync(fullPath, "utf-8");

    // 查找相对链接 [...](./path)
    const linkRegex = /\[([^\]]+)\]\(\.\/([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [_fullMatch, label, target] = match;
      const docDir = dirname(docFile);
      const resolvedPath = join(ROOT, docDir, target);

      if (!existsSync(resolvedPath)) {
        issues.push({
          source: docFile,
          label,
          target,
          resolvedPath,
        });
      }
    }
  }

  let report = "## 文档交叉引用完整性报告\n\n";
  report += `> 自动生成于 ${getDate()}\n\n`;

  const activeIssues = issues.filter((issue) => !isArchivedDocIssue(issue));
  const archiveIssues = issues.filter(isArchivedDocIssue);

  if (activeIssues.length === 0) {
    report += "✅ 所有活动文档交叉引用完整。\n";
  } else {
    report += `❌ 发现 ${activeIssues.length} 个活动文档损坏引用：\n\n`;
    report += "| 源文件 | 标签 | 目标 |\n";
    report += "| --- | --- | --- |\n";
    for (const issue of activeIssues) {
      report += `| ${issue.source} | ${issue.label} | ${issue.target} |\n`;
    }
  }

  if (archiveIssues.length > 0) {
    report += `\n⚠️ 忽略 ${archiveIssues.length} 个归档文档历史引用：\n\n`;
    report += "| 归档源文件 | 标签 | 目标 |\n";
    report += "| --- | --- | --- |\n";
    for (const issue of archiveIssues) {
      report += `| ${issue.source} | ${issue.label} | ${issue.target} |\n`;
    }
  }

  return { report, issues };
}

// ── 主逻辑 ──

async function main() {
  const target = process.argv[2] || "all";

  console.log("📚 Doc Generator 启动\n");

  const outputs = [];

  if (target === "changelog" || target === "all") {
    const changelog = generateChangelog();
    if (changelog) {
      outputs.push({
        file: "CHANGELOG.new.md",
        content: `## Unreleased (${getDate()})\n\n${changelog}`,
        description: "CHANGELOG 条目",
      });
    }
  }

  if (target === "features" || target === "all") {
    const matrix = generateFeatureMatrix();
    outputs.push({
      file: "docs/reviews/feature-matrix-audit.md",
      content: matrix,
      description: "Feature Matrix Audit",
    });
  }

  if (target === "api" || target === "all") {
    const apiDoc = generateApiDocSkeleton();
    outputs.push({
      file: "docs/spec/api-reference-skeleton.md",
      content: apiDoc,
      description: "API 文档骨架",
    });
  }

  if (target === "links" || target === "all") {
    const { report, issues } = checkDocLinks();
    outputs.push({
      file: "docs/reviews/doc-link-audit.md",
      content: report,
      description: "文档引用审计",
    });

    // Separate active docs issues from archive issues
    const activeBrokenLinks = issues.filter((issue) => !isArchivedDocIssue(issue));
    const archiveBrokenLinks = issues.filter(isArchivedDocIssue);

    // Archive broken links are warnings only
    if (archiveBrokenLinks.length > 0) {
      console.warn(`\n⚠️  ${archiveBrokenLinks.length} broken links in archive (ignored):`);
      for (const l of archiveBrokenLinks) {
        console.warn(`  ${l.source} → ${l.target}`);
      }
    }

    // Active docs broken links are errors
    if (activeBrokenLinks.length > 0) {
      console.error(`\n❌ ${activeBrokenLinks.length} broken links in active docs (non-archive):`);
      for (const l of activeBrokenLinks) {
        console.error(`  ${l.source} → ${l.target}`);
      }
      // Write the audit report before exiting
      for (const output of outputs) {
        const outputPath = join(ROOT, output.file);
        mkdirSync(dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, output.content, "utf-8");
        console.log(`   ✅ ${output.description} -> ${output.file}`);
      }
      process.exit(1);
    }
  }

  // 写入输出文件
  for (const output of outputs) {
    const outputPath = join(ROOT, output.file);
    mkdirSync(dirname(outputPath), { recursive: true });

    // 如果文件已存在且不是 CHANGELOG.new，追加而非覆盖
    if (existsSync(outputPath) && !output.file.endsWith(".new.md")) {
      writeFileSync(outputPath, output.content, "utf-8");
    } else {
      writeFileSync(outputPath, output.content, "utf-8");
    }

    console.log(`   ✅ ${output.description} -> ${output.file}`);
  }

  console.log("\n✅ Doc Generator 完成");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Doc Generator 异常:", err.message);
  process.exit(1);
});
