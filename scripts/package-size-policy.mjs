import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

const MAGIC = Buffer.from("gis-engine-dist-gzip-v1\0");
const TOP_LEVEL_KEYS = new Set([
  "schemaVersion",
  "measurement",
  "buildRecipe",
  "advisoryRegressionPercent",
  "packages",
]);
const MEASUREMENT_KEYS = new Set([
  "algorithm",
  "scope",
  "fileType",
  "pathOrder",
  "framing",
  "gzipLevel",
  "excludedMetadata",
]);
const PACKAGE_KEYS = new Set([
  "distPath",
  "budgetBytes",
  "semantics",
  "baselineBytes",
  "baselineRawBytes",
  "baselineFileCount",
  "baselineRevision",
  "measuredAt",
  "rationale",
]);
const BUILD_RECIPE_KEYS = new Set(["cleanPaths", "commands"]);
const BUILD_COMMAND_KEYS = new Set(["command", "args"]);
const REQUIRED_CLEAN_PATHS = [
  "packages/engine/dist",
  "packages/engine/.tsbuildinfo",
  "packages/cli/dist",
  "packages/cli/.tsbuildinfo",
];
const REQUIRED_BUILD_COMMANDS = [
  { command: "pnpm", args: ["build:schema"] },
  { command: "pnpm", args: ["build"] },
];

export function loadPackageSizePolicy(policyPath = "config/package-size-budgets.json") {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(policyPath, "utf8"));
  } catch (error) {
    throw new Error(`PACKAGE_SIZE.POLICY_READ_FAILED: ${policyPath}: ${error.message}`);
  }
  return validatePackageSizePolicy(parsed);
}

export function validatePackageSizePolicy(policy) {
  assertPlainObject(policy, "policy");
  assertOnlyKeys(policy, TOP_LEVEL_KEYS, "policy");
  assert(policy.schemaVersion === 1, "policy.schemaVersion must equal 1");
  assertPlainObject(policy.measurement, "policy.measurement");
  assertOnlyKeys(policy.measurement, MEASUREMENT_KEYS, "policy.measurement");

  const expectedMeasurement = {
    algorithm: "canonical-dist-gzip-v1",
    scope: "complete-dist",
    fileType: "regular-files-only",
    pathOrder: "relative-posix-utf8-bytewise",
    framing: "magic-nul-path-nul-byte-length-nul-content-nul",
    gzipLevel: 9,
  };
  for (const [key, value] of Object.entries(expectedMeasurement)) {
    assert(policy.measurement[key] === value, `policy.measurement.${key} must equal ${JSON.stringify(value)}`);
  }
  assert(
    Array.isArray(policy.measurement.excludedMetadata) &&
      policy.measurement.excludedMetadata.length === 2 &&
      policy.measurement.excludedMetadata[0] === "mtime" &&
      policy.measurement.excludedMetadata[1] === "permissions",
    'policy.measurement.excludedMetadata must equal ["mtime", "permissions"]',
  );
  validateBuildRecipe(policy.buildRecipe);
  assert(
    Number.isFinite(policy.advisoryRegressionPercent) && policy.advisoryRegressionPercent >= 0,
    "policy.advisoryRegressionPercent must be a non-negative number",
  );
  assertPlainObject(policy.packages, "policy.packages");
  assert(Object.keys(policy.packages).length > 0, "policy.packages must contain at least one package");
  assertPlainObject(policy.packages.engine, "policy.packages.engine");
  assertPlainObject(policy.packages.cli, "policy.packages.cli");

  for (const [name, rule] of Object.entries(policy.packages)) {
    assert(/^[a-z0-9-]+$/.test(name), `policy.packages.${name} has an invalid package key`);
    assertPlainObject(rule, `policy.packages.${name}`);
    assertOnlyKeys(rule, PACKAGE_KEYS, `policy.packages.${name}`);
    assert(typeof rule.distPath === "string" && rule.distPath.length > 0, `${name}.distPath must be non-empty`);
    assert(
      !rule.distPath.startsWith("/") && !rule.distPath.split(/[\\/]/).includes(".."),
      `${name}.distPath must be relative`,
    );
    assertPositiveInteger(rule.budgetBytes, `${name}.budgetBytes`);
    assert(rule.semantics === "blocking" || rule.semantics === "advisory", `${name}.semantics is invalid`);
    assertPositiveInteger(rule.baselineBytes, `${name}.baselineBytes`);
    assertPositiveInteger(rule.baselineRawBytes, `${name}.baselineRawBytes`);
    assertPositiveInteger(rule.baselineFileCount, `${name}.baselineFileCount`);
    assert(
      typeof rule.baselineRevision === "string" && rule.baselineRevision.length > 0,
      `${name}.baselineRevision is required`,
    );
    assert(
      typeof rule.measuredAt === "string" && Number.isFinite(Date.parse(rule.measuredAt)),
      `${name}.measuredAt must be ISO-8601`,
    );
    assert(typeof rule.rationale === "string" && rule.rationale.length >= 20, `${name}.rationale is required`);
  }

  return policy;
}

export function measureCanonicalDistGzip(distPath) {
  const root = resolve(distPath);
  if (!existsSync(root)) {
    throw new Error(`PACKAGE_SIZE.DIST_MISSING: ${distPath}`);
  }
  const rootStat = lstatSync(root);
  if (!rootStat.isDirectory()) {
    throw new Error(`PACKAGE_SIZE.DIST_NOT_DIRECTORY: ${distPath}`);
  }

  const files = collectRegularFiles(root).sort((left, right) =>
    Buffer.compare(Buffer.from(toPosix(relative(root, left))), Buffer.from(toPosix(relative(root, right)))),
  );
  const parts = [MAGIC];
  let rawBytes = 0;
  for (const filePath of files) {
    const path = toPosix(relative(root, filePath));
    const content = readFileSync(filePath);
    rawBytes += content.length;
    parts.push(Buffer.from(`${path}\0${content.length}\0`), content, Buffer.from("\0"));
  }

  return {
    algorithm: "canonical-dist-gzip-v1",
    bytes: gzipSync(Buffer.concat(parts), { level: 9 }).byteLength,
    rawBytes,
    fileCount: files.length,
  };
}

export function preparePackageSizeArtifacts(
  policyInput,
  { rootDir = process.cwd(), runCommand = runBuildCommand } = {},
) {
  const policy = validatePackageSizePolicy(policyInput);
  const root = resolve(rootDir);
  for (const cleanPath of policy.buildRecipe.cleanPaths) {
    const target = resolve(root, cleanPath);
    assert(target.startsWith(`${root}${sep}`), `buildRecipe clean path escapes root: ${cleanPath}`);
    rmSync(target, { recursive: true, force: true });
  }
  for (const { command, args } of policy.buildRecipe.commands) {
    runCommand(command, [...args], { cwd: root });
  }
}

export function checkPackageSizes(policyInput, { rootDir = process.cwd() } = {}) {
  const policy = validatePackageSizePolicy(policyInput);
  const results = {};
  const warnings = [];
  let blockingFailures = 0;
  let errors = 0;

  for (const [name, rule] of Object.entries(policy.packages)) {
    try {
      const measurement = measureCanonicalDistGzip(resolve(rootDir, rule.distPath));
      const overBudget = measurement.bytes > rule.budgetBytes;
      const regressionPercent = ((measurement.bytes - rule.baselineBytes) / rule.baselineBytes) * 100;
      const overAdvisoryRegression = regressionPercent > policy.advisoryRegressionPercent;
      let status = "pass";
      if (overBudget && rule.semantics === "blocking") {
        status = "fail";
        blockingFailures += 1;
      } else if (overBudget || overAdvisoryRegression) {
        status = "warning";
      }
      if (overBudget && rule.semantics === "advisory") {
        warnings.push(`${name} exceeds its advisory budget`);
      }
      if (overAdvisoryRegression) {
        warnings.push(
          `${name} is ${regressionPercent.toFixed(2)}% above baseline, exceeding the ${policy.advisoryRegressionPercent}% advisory threshold`,
        );
      }
      results[name] = {
        ...measurement,
        budgetBytes: rule.budgetBytes,
        baselineBytes: rule.baselineBytes,
        baselineRawBytes: rule.baselineRawBytes,
        baselineFileCount: rule.baselineFileCount,
        regressionPercent: Number(regressionPercent.toFixed(2)),
        semantics: rule.semantics,
        status,
      };
    } catch (error) {
      errors += 1;
      results[name] = {
        algorithm: policy.measurement.algorithm,
        bytes: null,
        fileCount: null,
        budgetBytes: rule.budgetBytes,
        baselineBytes: rule.baselineBytes,
        baselineRawBytes: rule.baselineRawBytes,
        baselineFileCount: rule.baselineFileCount,
        regressionPercent: null,
        semantics: rule.semantics,
        status: "error",
        diagnostic: error.message,
      };
    }
  }

  return {
    schemaVersion: policy.schemaVersion,
    algorithm: policy.measurement.algorithm,
    advisoryRegressionPercent: policy.advisoryRegressionPercent,
    results,
    warnings,
    summary: { blockingFailures, errors, warnings: warnings.length },
    exitCode: blockingFailures > 0 || errors > 0 ? 1 : 0,
  };
}

export function renderPackageSizeSummary(report) {
  const lines = [
    "## Package size policy",
    "",
    `Algorithm: \`${report.algorithm}\` (complete \`dist\`, deterministic gzip).`,
    "",
    "| Package | Raw bytes | Gzip bytes | Files | Baseline | Budget | Semantics | Regression | Status |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | --- |",
  ];
  for (const [name, result] of Object.entries(report.results)) {
    lines.push(
      `| @gis-engine/${name} | ${result.rawBytes ?? "n/a"} | ${result.bytes ?? "n/a"} | ${result.fileCount ?? "n/a"} | ${result.baselineBytes} | ${result.budgetBytes} | ${result.semantics} | ${result.regressionPercent ?? "n/a"}% | ${result.status} |`,
    );
  }
  if (report.warnings.length > 0) {
    lines.push("", "Advisories:", ...report.warnings.map((warning) => `- ${warning}`));
  }
  return `${lines.join("\n")}\n`;
}

export function validatePackageSizeConsumerContent(policyInput, content) {
  const policy =
    typeof policyInput === "string" ? loadPackageSizePolicy(policyInput) : validatePackageSizePolicy(policyInput);
  const issues = [];
  if (!content.includes(policy.measurement.algorithm)) {
    issues.push(`missing algorithm ${policy.measurement.algorithm}`);
  }
  for (const [name, rule] of Object.entries(policy.packages)) {
    const kib = rule.budgetBytes / 1024;
    if (!content.includes(`${kib} KiB`)) {
      issues.push(`${name} budget must be ${kib} KiB`);
    }
  }
  if (!content.includes(`${policy.advisoryRegressionPercent}%`)) {
    issues.push(`advisory regression threshold must be ${policy.advisoryRegressionPercent}%`);
  }
  return { valid: issues.length === 0, issues };
}

function collectRegularFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRegularFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    } else {
      throw new Error(`PACKAGE_SIZE.NON_REGULAR_ENTRY: ${entryPath}`);
    }
  }
  return files;
}

function validateBuildRecipe(recipe) {
  assertPlainObject(recipe, "policy.buildRecipe");
  assertOnlyKeys(recipe, BUILD_RECIPE_KEYS, "policy.buildRecipe");
  assert(
    JSON.stringify(recipe.cleanPaths) === JSON.stringify(REQUIRED_CLEAN_PATHS),
    `policy.buildRecipe.cleanPaths must equal ${JSON.stringify(REQUIRED_CLEAN_PATHS)}`,
  );
  assert(Array.isArray(recipe.commands), "policy.buildRecipe.commands must be an array");
  for (const [index, item] of recipe.commands.entries()) {
    assertPlainObject(item, `policy.buildRecipe.commands[${index}]`);
    assertOnlyKeys(item, BUILD_COMMAND_KEYS, `policy.buildRecipe.commands[${index}]`);
    assert(typeof item.command === "string" && item.command.length > 0, `build command ${index} is invalid`);
    assert(
      Array.isArray(item.args) && item.args.every((arg) => typeof arg === "string"),
      `build command ${index} args are invalid`,
    );
  }
  assert(
    JSON.stringify(recipe.commands) === JSON.stringify(REQUIRED_BUILD_COMMANDS),
    `policy.buildRecipe.commands must equal ${JSON.stringify(REQUIRED_BUILD_COMMANDS)}`,
  );
}

function runBuildCommand(command, args, { cwd }) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: "inherit" });
  if (result.error) {
    throw new Error(`PACKAGE_SIZE.BUILD_FAILED: ${command} ${args.join(" ")}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`PACKAGE_SIZE.BUILD_FAILED: ${command} ${args.join(" ")} exited ${result.status}`);
  }
}

function toPosix(path) {
  return sep === "/" ? path : path.split(sep).join("/");
}

function assertPlainObject(value, path) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${path} must be an object`);
}

function assertOnlyKeys(value, allowed, path) {
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  assert(unexpected.length === 0, `${path} contains unsupported keys: ${unexpected.join(", ")}`);
}

function assertPositiveInteger(value, path) {
  assert(Number.isSafeInteger(value) && value > 0, `${path} must be a positive integer`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`PACKAGE_SIZE.POLICY_INVALID: ${message}`);
  }
}
