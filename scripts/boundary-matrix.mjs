#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export const BOUNDARY_MATRIX_SOURCE = "docs/architecture/core-extension-boundary-matrix.json";

export const BOUNDARY_MATRIX_TARGETS = [
  {
    file: "docs/architecture/core-framework.md",
    marker: "core-extension-boundary:framework",
    section: "framework",
  },
  {
    file: "docs/spec/contracts-and-interfaces.md",
    marker: "core-extension-boundary:contracts",
    section: "contracts",
  },
];

function readRepoText(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

function writeRepoText(path, content) {
  writeFileSync(join(ROOT, path), content);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderCell(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, "<br>")
    .replace(/\|/g, "\\|");
}

export function readBoundaryMatrixSource() {
  return JSON.parse(readRepoText(BOUNDARY_MATRIX_SOURCE));
}

export function renderBoundaryMatrixSection(section, sourcePath = BOUNDARY_MATRIX_SOURCE) {
  const columns = section.columns ?? [];
  const rows = section.rows ?? [];
  const header = `| ${columns.map((column) => renderCell(column.label)).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => renderCell(row[column.key])).join(" | ")} |`);

  return [
    `> Generated from \`${sourcePath}\`. Run \`pnpm docs:boundary\` after editing the source.`,
    "",
    header,
    divider,
    ...body,
  ].join("\n");
}

export function replaceGeneratedBlock(content, marker, nextContent) {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}\\n[\\s\\S]*?\\n${escapeRegExp(end)}`);

  if (!pattern.test(content)) {
    throw new Error(`Missing generated block markers: ${start} ... ${end}`);
  }

  return content.replace(pattern, `${start}\n${nextContent}\n${end}`);
}

export function extractGeneratedBlock(content, marker) {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}\\n([\\s\\S]*?)\\n${escapeRegExp(end)}`);
  const match = content.match(pattern);

  if (!match) {
    throw new Error(`Missing generated block markers: ${start} ... ${end}`);
  }

  return match[1];
}

export function buildBoundaryMatrixOutputs(source = readBoundaryMatrixSource()) {
  return BOUNDARY_MATRIX_TARGETS.map((target) => {
    const section = source.sections?.[target.section];
    if (!section) {
      throw new Error(`Missing boundary matrix section: ${target.section}`);
    }

    return {
      ...target,
      content: renderBoundaryMatrixSection(section),
    };
  });
}

export function updateBoundaryMatrixDocs({ check = false } = {}) {
  const changed = [];

  for (const target of buildBoundaryMatrixOutputs()) {
    const current = readRepoText(target.file);
    const next = replaceGeneratedBlock(current, target.marker, target.content);

    if (next !== current) {
      changed.push(target.file);
      if (!check) {
        writeRepoText(target.file, next);
      }
    }
  }

  if (check && changed.length > 0) {
    throw new Error(`Boundary matrix docs are out of date: ${changed.join(", ")}`);
  }

  return changed;
}

function main() {
  const check = process.argv.includes("--check");
  const changed = updateBoundaryMatrixDocs({ check });

  if (changed.length === 0) {
    console.log("Boundary matrix docs are up to date.");
    return;
  }

  console.log(`Updated boundary matrix docs: ${changed.join(", ")}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
