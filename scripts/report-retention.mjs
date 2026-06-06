#!/usr/bin/env node

import { readdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const REVIEW_DIR = join(ROOT, "docs/reviews");
const KEEP_COUNT = Number.parseInt(process.argv.find((arg) => arg.startsWith("--keep="))?.split("=")[1] ?? "7", 10);
const apply = process.argv.includes("--apply");

const REPORT_CLASSES = [
  { name: "daily audits", pattern: /^daily-audit-\d{4}-\d{2}-\d{2}\.md$/ },
  { name: "quality gates", pattern: /^quality-gate-\d{4}-\d{2}-\d{2}\.md$/ },
  {
    name: "documentation audits",
    pattern: /^documentation-audit-\d{4}-\d{2}-\d{2}\.md$/,
  },
  {
    name: "perf trend evidence",
    pattern: /^perf-trend-\d{4}-W\d{2}\.md$/,
  },
];

function generatedAt(path) {
  try {
    const content = readFileSync(path, "utf-8");
    const match = content.match(/^generated_at:\s*(.+)$/m);
    if (match) {
      const date = new Date(match[1].trim().replace(/^"|"$/g, ""));
      if (!Number.isNaN(date.getTime())) return date;
    }
  } catch {
    // fall back below
  }
  return new Date(0);
}

function collectReports(pattern) {
  return readdirSync(REVIEW_DIR)
    .filter((file) => pattern.test(file))
    .map((file) => {
      const path = join(REVIEW_DIR, file);
      return { file, path, generatedAt: generatedAt(path) };
    })
    .sort((a, b) => b.generatedAt - a.generatedAt);
}

let deleteCount = 0;
for (const reportClass of REPORT_CLASSES) {
  const reports = collectReports(reportClass.pattern);
  const stale = reports.slice(KEEP_COUNT);
  console.log(`${reportClass.name}: ${reports.length} found, ${stale.length} stale, keep ${KEEP_COUNT}`);
  for (const report of stale) {
    deleteCount += 1;
    if (apply) {
      unlinkSync(report.path);
      console.log(`  deleted ${report.file}`);
    } else {
      console.log(`  would delete ${report.file}`);
    }
  }
}

if (!apply) {
  console.log("Dry run only. Pass --apply to delete stale rolling reports.");
}

console.log(`Report retention complete: ${deleteCount} stale file(s).`);
