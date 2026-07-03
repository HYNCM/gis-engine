#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

const packages = [
  { name: "@gis-engine/engine", dir: "packages/engine", tag: "latest" },
  { name: "@gis-engine/scene3d", dir: "packages/scene3d", tag: "next" },
  { name: "@gis-engine/ai", dir: "packages/ai", tag: "latest" },
  { name: "@gis-engine/cli", dir: "packages/cli", tag: "latest" },
];

function run(command, args, options = {}) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  return execFileSync(command, args, {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  }).trim();
}

function runInherit(command, args, options = {}) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_AUTH_TOKEN: process.env.NODE_AUTH_TOKEN ?? process.env.NPM_TOKEN ?? "",
    },
    ...options,
  });
}

function packageVersion(packageDir) {
  const packageJson = JSON.parse(readFileSync(join(root, packageDir, "package.json"), "utf8"));
  return packageJson.version;
}

function isPublished(name, version) {
  try {
    const publishedVersion = run("npm", ["view", `${name}@${version}`, "version"]);
    return publishedVersion === version;
  } catch {
    return false;
  }
}

if (!dryRun && !process.env.NODE_AUTH_TOKEN && !process.env.NPM_TOKEN) {
  console.error("NPM_TOKEN or NODE_AUTH_TOKEN is required to publish GA packages.");
  process.exit(1);
}

console.log(dryRun ? "# GA package publish dry run" : "# GA package publish");

for (const pkg of packages) {
  const version = packageVersion(pkg.dir);
  const spec = `${pkg.name}@${version}`;

  if (!dryRun && isPublished(pkg.name, version)) {
    console.log(`- skip ${spec}: already published`);
    continue;
  }

  const args = ["publish", "--no-git-checks", "--access", "public", "--tag", pkg.tag];
  if (dryRun) {
    args.push("--dry-run");
  } else {
    args.push("--provenance");
  }

  console.log(`- publish ${spec} with dist-tag ${pkg.tag}`);
  runInherit("pnpm", args, { cwd: join(root, pkg.dir) });
}

console.log(dryRun ? "GA package publish dry run passed." : "GA package publish completed.");
