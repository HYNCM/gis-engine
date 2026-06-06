#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const json = args.has("--json");
const skipBrowser = args.has("--skip-browser");

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
const expectedNodeMajor = readExpectedNodeMajor();
const expectedPnpmVersion = String(packageJson.packageManager ?? "").split("@")[1] ?? "unknown";
const checks = [];

record(
  "node",
  process.versions.node.split(".")[0] === expectedNodeMajor,
  `expected major ${expectedNodeMajor}; found ${process.versions.node}`,
  "Release gates run in CI on Node 22. Use .nvmrc or the CI runner image before publishing.",
);

const pnpmVersion = runText("pnpm", ["--version"]);
record(
  "pnpm",
  pnpmVersion.ok && pnpmVersion.text === expectedPnpmVersion,
  pnpmVersion.ok ? `expected ${expectedPnpmVersion}; found ${pnpmVersion.text}` : pnpmVersion.text,
  "Install the packageManager version from package.json before running release gates.",
);

const biomeVersion = runText("pnpm", ["exec", "biome", "--version"]);
record(
  "biome",
  biomeVersion.ok,
  biomeVersion.text,
  "Run pnpm install with optional dependencies enabled so the platform Biome binary is present.",
);

await checkListener();
await checkBrowser();

if (json) {
  console.log(JSON.stringify({ generated_at: new Date().toISOString(), checks }, null, 2));
} else {
  console.log("# Release Runner Preflight\n");
  for (const check of checks) {
    const symbol = check.status === "pass" ? "PASS" : check.status === "skip" ? "SKIP" : "FAIL";
    console.log(`- ${symbol} ${check.name}: ${check.evidence}`);
    if (check.status === "fail") console.log(`  action: ${check.action}`);
  }
}

process.exit(checks.some((check) => check.status === "fail") ? 1 : 0);

function readExpectedNodeMajor() {
  try {
    return readFileSync(resolve(root, ".nvmrc"), "utf-8").trim().replace(/^v/, "");
  } catch {
    return "22";
  }
}

function runText(command, commandArgs) {
  try {
    return {
      ok: true,
      text: execFileSync(command, commandArgs, {
        cwd: root,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
    };
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr).trim() : "";
    const stdout = error?.stdout ? String(error.stdout).trim() : "";
    return { ok: false, text: stderr || stdout || String(error) };
  }
}

function record(name, passed, evidence, action) {
  checks.push({
    name,
    status: passed ? "pass" : "fail",
    evidence,
    action,
  });
}

async function checkListener() {
  const result = await new Promise((resolveResult) => {
    const server = createServer();
    server.once("error", (error) => {
      resolveResult({ ok: false, text: error.message });
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        resolveResult({ ok: true, text: typeof address === "object" && address ? `127.0.0.1:${address.port}` : "ok" });
      });
    });
  });

  record(
    "listener",
    result.ok,
    result.text,
    "Use a runner that permits localhost listeners before running Studio, examples, or browser smoke gates.",
  );
}

async function checkBrowser() {
  if (skipBrowser) {
    checks.push({
      name: "playwright_chromium",
      status: "skip",
      evidence: "--skip-browser supplied",
      action: "Run without --skip-browser before release or any visual/snapshot claim.",
    });
    return;
  }

  try {
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent("<!doctype html><title>gis-engine-release-preflight</title><main>ok</main>");
    await page.close();
    await browser.close();
    checks.push({
      name: "playwright_chromium",
      status: "pass",
      evidence: "Chromium launched and rendered a minimal page",
      action: "",
    });
  } catch (error) {
    checks.push({
      name: "playwright_chromium",
      status: "fail",
      evidence: error instanceof Error ? error.message : String(error),
      action: "Run pnpm exec playwright install --with-deps chromium on the release runner.",
    });
  }
}
