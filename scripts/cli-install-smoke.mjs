#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const keep = process.argv.includes("--keep");
const tmp = mkdtempSync(join(tmpdir(), "gis-engine-cli-install-"));
const consumerDir = join(tmp, "consumer");
const scaffoldName = "smoke-vite";
const generateName = "smoke-generate";

try {
  mkdirSync(consumerDir, { recursive: true });
  run("pnpm", ["--filter", "@gis-engine/cli", "build"], root);
  const packOutput = runText("pnpm", ["--dir", "packages/cli", "pack", "--pack-destination", tmp], root);
  const tarball = packOutput
    .split("\n")
    .map((line) => line.trim())
    .findLast((line) => line.endsWith(".tgz"));

  if (!tarball) {
    throw new Error(`Could not locate packed CLI tarball in output:\n${packOutput}`);
  }

  run("npm", ["init", "-y"], consumerDir);
  run("npm", ["install", "--ignore-scripts", tarball], consumerDir);
  run("node", ["node_modules/.bin/create-gis-map", scaffoldName, "--template", "vite-ts", "--yes"], consumerDir);
  run("npm", ["install", "--ignore-scripts"], join(consumerDir, scaffoldName));
  run("npm", ["run", "build"], join(consumerDir, scaffoldName));
  run(
    "node",
    ["node_modules/.bin/create-gis-map", generateName, "--generate", "--provider", "mock", "--yes"],
    consumerDir,
  );

  const generatedMap = join(consumerDir, generateName, "map.json");
  if (!existsSync(generatedMap)) {
    throw new Error(`Generate smoke did not write ${generatedMap}`);
  }

  console.log(`CLI install smoke passed in ${consumerDir}`);
} finally {
  if (!keep) rmSync(tmp, { recursive: true, force: true });
}

function run(command, args, cwd) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
  });
}

function runText(command, args, cwd) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  const output = execFileSync(command, args, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  process.stdout.write(output);
  return output;
}
