#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  checkPackageSizes,
  loadPackageSizePolicy,
  preparePackageSizeArtifacts,
  renderPackageSizeSummary,
} from "./package-size-policy.mjs";

const args = new Set(process.argv.slice(2));
const policyPath = resolve("config/package-size-budgets.json");

try {
  const policy = loadPackageSizePolicy(policyPath);
  if (args.has("--build")) {
    preparePackageSizeArtifacts(policy, { rootDir: process.cwd() });
  }
  const report = checkPackageSizes(policy, { rootDir: process.cwd() });
  const humanSummary = renderPackageSizeSummary(report);

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.stderr.write(humanSummary);

  if (args.has("--github-summary")) {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) {
      throw new Error("PACKAGE_SIZE.GITHUB_SUMMARY_MISSING: GITHUB_STEP_SUMMARY is required");
    }
    appendFileSync(summaryPath, humanSummary, "utf8");
  }

  process.exitCode = report.exitCode;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
