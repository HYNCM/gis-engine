const TASK_ID_PATTERN = /^TASK-\d{4}W\d{2}(?:-[A-Z0-9]+)*-\d{3}$/;
const TASK_TOKEN_PATTERN = /TASK-[A-Z0-9-]+/g;

const DOCS_ONLY_PATTERNS = [/^docs\//, /^README\.md$/, /^CHANGELOG\.md$/];
const AUTOMATION_PATTERNS = [
  /^scripts\//,
  /^\.github\/workflows\//,
  /^\.github\/actions\//,
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
];
const COORDINATION_PATTERNS = [
  /^AGENTS\.md$/,
  /^docs\/planning\/(?:agent-handoff-contracts|evolution-framework|evolution-ledger|evolution-patterns|evolution-pitfalls|task-burndown|dependency-graph|weekly-digest|monthly-roadmap|issues-snapshot|AGENT_HEALTH_DASHBOARD)\.(?:md|json)$/,
];

function normalizePath(file) {
  return String(file ?? "").replace(/\\/g, "/");
}

function matchesAny(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

function stripQuotes(value) {
  const trimmed = String(value ?? "").trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function isDocsPath(file) {
  const path = normalizePath(file);
  return matchesAny(path, DOCS_ONLY_PATTERNS);
}

export function isAutomationPath(file) {
  const path = normalizePath(file);
  return matchesAny(path, AUTOMATION_PATTERNS);
}

export function isCoordinationPath(file) {
  const path = normalizePath(file);
  return matchesAny(path, COORDINATION_PATTERNS);
}

export function classifyChangedFiles(files = []) {
  const normalized = files.map(normalizePath).filter(Boolean);
  const docsTouched = normalized.some((file) => isDocsPath(file) || isCoordinationPath(file));
  const automationTouched = normalized.some((file) => isAutomationPath(file));
  const coordinationTouched = normalized.some((file) => isCoordinationPath(file));
  const docsOnly =
    normalized.length > 0 &&
    normalized.every((file) => isDocsPath(file) && !isAutomationPath(file) && !isCoordinationPath(file));

  return {
    files: normalized,
    docsOnly,
    docsTouched,
    automationTouched,
    coordinationTouched,
    requiresFrameworkChecks: automationTouched || coordinationTouched,
  };
}

export function extractFrontMatter(content) {
  const text = String(content ?? "");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const lines = match[1].split(/\r?\n/);
  const frontMatter = {};
  let listKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const listMatch = rawLine.match(/^\s*-\s+(.*)$/);
    if (listMatch && listKey) {
      frontMatter[listKey].push(stripQuotes(listMatch[1]));
      continue;
    }

    listKey = null;
    const keyMatch = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;

    const [, key, rawValue] = keyMatch;
    if (rawValue === "") {
      frontMatter[key] = [];
      listKey = key;
      continue;
    }

    frontMatter[key] = stripQuotes(rawValue);
  }

  return frontMatter;
}

export function extractTaskIds(content) {
  const text = String(content ?? "");
  const rawTokens = [...new Set(text.match(TASK_TOKEN_PATTERN) ?? [])];
  const taskIds = rawTokens.filter((token) => TASK_ID_PATTERN.test(token));
  const invalidTokens = rawTokens.filter((token) => !TASK_ID_PATTERN.test(token));
  const parseError =
    invalidTokens.length > 0
      ? `Found TASK tokens that do not match the supported task id format: ${invalidTokens.slice(0, 3).join(", ")}`
      : taskIds.length === 0 && /\bTASK-/.test(text)
        ? "Found TASK tokens that do not match the supported task id format"
        : null;
  return { taskIds, parseError };
}

export function validatePlanningConsistency(burndownContent, dependencyGraphContent) {
  const burndown = extractTaskIds(burndownContent);
  const dependencyGraph = extractTaskIds(dependencyGraphContent);
  const issues = [];

  if (burndown.parseError) {
    issues.push({
      severity: "error",
      code: "TASK_PARSE_BURNDOWN_FAIL",
      message: burndown.parseError,
    });
  }

  if (dependencyGraph.parseError) {
    issues.push({
      severity: "error",
      code: "TASK_PARSE_DEPGRAPH_FAIL",
      message: dependencyGraph.parseError,
    });
  }

  if (issues.some((issue) => issue.severity === "error")) {
    return { valid: false, issues };
  }

  const burndownIds = new Set(burndown.taskIds);
  const dependencyIds = new Set(dependencyGraph.taskIds);

  for (const taskId of dependencyIds) {
    if (!burndownIds.has(taskId)) {
      issues.push({
        severity: "error",
        code: "TASK_IN_DEP_BUT_NOT_BURNDOWN",
        message: `任务 ${taskId} 在 dependency-graph.md 中出现但未在 task-burndown.md 中定义`,
      });
    }
  }

  for (const taskId of burndownIds) {
    if (!dependencyIds.has(taskId)) {
      issues.push({
        severity: "warning",
        code: "TASK_IN_BURNDOWN_BUT_NOT_DEP",
        message: `任务 ${taskId} 在 task-burndown.md 中但未在 dependency-graph.md 中出现`,
      });
    }
  }

  return { valid: issues.every((issue) => issue.severity !== "error"), issues };
}

export function validateAutomationReportContent(content) {
  const frontMatter = extractFrontMatter(content);
  const issues = [];

  if (!frontMatter) {
    return { valid: false, issues: ["缺少 YAML front matter"], frontMatter: null };
  }

  for (const key of ["agent", "period", "generated_at", "repo_revision", "owner", "decision_level"]) {
    if (!frontMatter[key]) {
      issues.push(`缺少 ${key} 字段`);
    }
  }

  if (!Array.isArray(frontMatter.inputs) || frontMatter.inputs.length === 0) {
    issues.push("缺少 inputs 列表");
  }

  if (frontMatter.decision_level !== "info") {
    issues.push(`自动生成报告必须保持 decision_level: info，当前为 ${frontMatter.decision_level ?? "missing"}`);
  }

  if (!/automation-generated/i.test(String(content ?? "")) && !/Automation Notice/.test(String(content ?? ""))) {
    issues.push("缺少自动化生成标识");
  }

  return { valid: issues.length === 0, issues, frontMatter };
}

export function reportReferencesArtifact(report, upstream) {
  const content = String(report?.content ?? report ?? "");
  const frontMatterInputs = Array.isArray(report?.inputs)
    ? report.inputs
    : Array.isArray(report?.frontMatter?.inputs)
      ? report.frontMatter.inputs
      : [];
  const searchSpace = [content, ...frontMatterInputs].join("\n");
  const artifactPath = normalizePath(upstream?.path ?? upstream ?? "");
  const basename = artifactPath.split("/").pop() || artifactPath;
  const candidates = [artifactPath, basename, upstream?.sha256].filter(Boolean);
  const matched = candidates.find((candidate) => searchSpace.includes(candidate));

  return {
    matched: matched ?? null,
    candidates,
  };
}
