#!/usr/bin/env node

import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { exportLegacyWorkbenchProjects } from "../apps/workbench/server/project-store.mjs";

const [databasePath, outputPath] = process.argv.slice(2);
if (process.argv.includes("--help")) {
  console.log("Usage: pnpm workbench:migrate:export -- <legacy.sqlite> <output.json>");
  process.exit(0);
}
if (!databasePath || !outputPath) {
  console.error("Usage: pnpm workbench:migrate:export -- <legacy.sqlite> <output.json>");
  process.exit(1);
}

const source = resolve(databasePath);
const destination = resolve(outputPath);
try {
  await access(destination);
  throw new Error(`Refusing to overwrite existing migration export: ${destination}`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const projects = await exportLegacyWorkbenchProjects(source);
await mkdir(dirname(destination), { recursive: true });
await writeFile(
  destination,
  `${JSON.stringify(
    {
      schemaVersion: "gis-engine.workbench.legacy-export.v1",
      sourceDatabase: source,
      exportedAt: new Date().toISOString(),
      projectCount: projects.length,
      projects,
    },
    null,
    2,
  )}\n`,
  { encoding: "utf8", flag: "wx" },
);
console.log(`Exported ${projects.length} legacy project(s) to ${destination}`);
