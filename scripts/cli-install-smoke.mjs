#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const keep = process.argv.includes("--keep");
const tmp = mkdtempSync(join(tmpdir(), "gis-engine-cli-install-"));
const consumerDir = join(tmp, "consumer");
const scaffoldName = "smoke-vite";
const generateName = "smoke-generate";
const packTargets = [
  { name: "@gis-engine/engine", dir: "packages/engine" },
  { name: "@gis-engine/scene3d", dir: "packages/scene3d" },
  { name: "@gis-engine/ai", dir: "packages/ai" },
  { name: "@gis-engine/cli", dir: "packages/cli" },
];

try {
  mkdirSync(consumerDir, { recursive: true });
  run("pnpm", ["build"], root);
  const tarballs = packLocalPackages(tmp);

  run("npm", ["init", "-y"], consumerDir);
  run("npm", ["install", "--ignore-scripts", ...packTargets.map(({ name }) => tarballs[name])], consumerDir);
  run("node", ["node_modules/.bin/create-gis-map", scaffoldName, "--template", "vite-ts", "--yes"], consumerDir);
  pinGeneratedPackageDependencies(join(consumerDir, scaffoldName, "package.json"), tarballs);
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

function packLocalPackages(destination) {
  const tarballs = {};
  for (const target of packTargets) {
    const packOutput = runText("pnpm", ["--dir", target.dir, "pack", "--pack-destination", destination], root);
    const tarball = packOutput
      .split("\n")
      .map((line) => line.trim())
      .findLast((line) => line.endsWith(".tgz"));

    if (!tarball) {
      throw new Error(`Could not locate packed tarball for ${target.name} in output:\n${packOutput}`);
    }

    tarballs[target.name] = tarball;
  }
  return tarballs;
}

function pinGeneratedPackageDependencies(packageJsonPath, tarballs) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
    const dependencies = packageJson[section];
    if (!dependencies || typeof dependencies !== "object") continue;

    for (const target of packTargets) {
      if (dependencies[target.name]) dependencies[target.name] = `file:${tarballs[target.name]}`;
    }
  }
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf-8");
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
