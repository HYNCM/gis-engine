#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const skipBrowser = args.has("--skip-browser");

const steps = [
  {
    name: "release-preflight",
    command: "pnpm",
    args: ["release:preflight", ...(skipBrowser ? ["--skip-browser"] : [])],
    failureAction:
      "Fix the release runner parity first. If your local shell is not on Node 22, switch with `.nvmrc` before retrying.",
  },
  {
    name: "lint",
    command: "pnpm",
    args: ["lint"],
    failureAction: "Apply Biome fixes before retrying release verification.",
  },
  {
    name: "build-schema",
    command: "pnpm",
    args: ["build:schema"],
    failureAction: "Resolve schema/build drift before attempting release verification again.",
  },
  {
    name: "check",
    command: "pnpm",
    args: ["check"],
    failureAction: "Fix deterministic test/build regressions before continuing.",
  },
  {
    name: "smoke-cli-install",
    command: "pnpm",
    args: ["smoke:cli-install"],
    failureAction: "Fix packaged CLI or generated-project regressions before continuing.",
  },
  {
    name: "build-cdn-dry-run",
    command: "pnpm",
    args: ["build:cdn", "--", "--dry-run"],
    failureAction: "Fix CDN bundle packaging issues before continuing.",
  },
  {
    name: "publish-dry-run",
    command: "pnpm",
    args: ["publish:dry"],
    failureAction: "Fix package publish metadata/build issues before continuing.",
  },
  {
    name: "docs-links",
    command: "pnpm",
    args: ["docs:links"],
    failureAction: "Fix documentation link drift before continuing.",
  },
];

console.log("# Release Verify\n");
for (const step of steps) {
  console.log(`## ${step.name}`);
  console.log(`$ ${[step.command, ...step.args].join(" ")}`);
  try {
    execFileSync(step.command, step.args, {
      cwd: root,
      stdio: "inherit",
    });
    console.log(`✓ ${step.name}\n`);
  } catch (error) {
    console.error(`✗ ${step.name}`);
    console.error(`  next: ${step.failureAction}`);
    process.exit(error?.status ?? 1);
  }
}

console.log("Release verification passed.");
