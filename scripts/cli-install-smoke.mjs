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
const generatePrompt = "Create a map showing private smoke verifier locations";
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
  assertInstalledPackageVersions(consumerDir);
  assertInstalledCliBinary(consumerDir);
  run("node", ["node_modules/.bin/create-gis-map", scaffoldName, "--template", "vite-ts", "--yes"], consumerDir);
  pinGeneratedPackageDependencies(join(consumerDir, scaffoldName, "package.json"), tarballs);
  assertPinnedPackageDependencies(join(consumerDir, scaffoldName, "package.json"), tarballs);
  run("npm", ["install", "--ignore-scripts"], join(consumerDir, scaffoldName));
  run("npm", ["run", "build"], join(consumerDir, scaffoldName));
  run(
    "node",
    [
      "node_modules/.bin/create-gis-map",
      generateName,
      "--generate",
      "--provider",
      "mock",
      "--prompt",
      generatePrompt,
      "--yes",
    ],
    consumerDir,
  );

  const generatedMap = join(consumerDir, generateName, "map.json");
  if (!existsSync(generatedMap)) {
    throw new Error(`Generate smoke did not write ${generatedMap}`);
  }

  const preflight = runJson(
    "node",
    ["node_modules/.bin/create-gis-map", "--preflight", join(generateName, "map.json"), "--json"],
    consumerDir,
  );
  assertSmokeResult(preflight.ok === true, "Generated map preflight did not pass.");
  assertSmokeResult(preflight.status === "ready", `Generated map preflight returned status ${preflight.status}.`);

  const artifactVerification = runJson(
    "node",
    ["node_modules/.bin/create-gis-map", "--verify-artifacts", generateName, "--json"],
    consumerDir,
  );
  assertSmokeResult(artifactVerification.ok === true, "Generated artifact verification did not pass.");
  assertSmokeResult(
    artifactVerification.summary?.missingFileCount === 0,
    "Generated artifact verification reported missing files.",
  );
  assertSmokeResult(
    artifactVerification.summary?.hashMismatchCount === 0,
    "Generated artifact verification reported hash mismatches.",
  );
  assertRequiredReviewFiles(join(consumerDir, generateName));
  assertNoRawPromptRetention(join(consumerDir, generateName), generatePrompt);

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

function assertInstalledPackageVersions(projectDir) {
  for (const target of packTargets) {
    const workspacePackage = readPackageJson(join(root, target.dir, "package.json"));
    const installedPackage = readPackageJson(join(projectDir, "node_modules", target.name, "package.json"));
    assertSmokeResult(
      installedPackage.version === workspacePackage.version,
      `${target.name} installed version ${installedPackage.version} did not match workspace version ${workspacePackage.version}.`,
    );
    assertSmokeResult(
      installedPackage.version === "1.0.0",
      `${target.name} install smoke must verify 1.0.0 artifacts; found ${installedPackage.version}.`,
    );
  }
}

function assertInstalledCliBinary(projectDir) {
  const cliBin = join(projectDir, "node_modules/.bin/create-gis-map");
  assertSmokeResult(existsSync(cliBin), "Installed @gis-engine/cli did not expose node_modules/.bin/create-gis-map.");
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

function assertPinnedPackageDependencies(packageJsonPath, tarballs) {
  const packageJson = readPackageJson(packageJsonPath);
  for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
    const dependencies = packageJson[section];
    if (!dependencies || typeof dependencies !== "object") continue;

    for (const target of packTargets) {
      if (!dependencies[target.name]) continue;
      assertSmokeResult(
        dependencies[target.name] === `file:${tarballs[target.name]}`,
        `${target.name} in generated ${section} was not pinned to the packed tarball.`,
      );
    }
  }
}

function readPackageJson(packageJsonPath) {
  return JSON.parse(readFileSync(packageJsonPath, "utf-8"));
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

function runJson(command, args, cwd) {
  const output = runText(command, args, cwd);
  return JSON.parse(output);
}

function assertSmokeResult(condition, message) {
  if (!condition) throw new Error(message);
}

function assertRequiredReviewFiles(projectDir) {
  const manifest = JSON.parse(readFileSync(join(projectDir, "artifact-manifest.json"), "utf-8"));
  const manifestPaths = new Set(manifest.files.map((file) => file.path));
  for (const requiredFile of manifest.requiredReviewFiles) {
    assertSmokeResult(manifestPaths.has(requiredFile), `Required review file is not listed: ${requiredFile}`);
  }
}

function assertNoRawPromptRetention(projectDir, prompt) {
  const manifest = JSON.parse(readFileSync(join(projectDir, "artifact-manifest.json"), "utf-8"));
  const generatedFiles = [...manifest.files.map((file) => file.path), "artifact-manifest.json"];
  const retainedPromptFiles = generatedFiles.filter((path) =>
    readFileSync(join(projectDir, path), "utf-8").includes(prompt),
  );

  assertSmokeResult(
    retainedPromptFiles.length === 0,
    `Generated files retained the raw prompt: ${retainedPromptFiles.join(", ")}`,
  );
}
