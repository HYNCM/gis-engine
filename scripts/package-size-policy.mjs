import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

const MAGIC = Buffer.from("gis-engine-dist-gzip-v1\0");
const TOP_LEVEL_KEYS = new Set(["schemaVersion", "measurement", "advisoryRegressionPercent", "packages"]);
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
  "baselineRevision",
  "measuredAt",
  "rationale",
]);

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
    pathOrder: "relative-posix-locale-en",
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
  assert(
    Number.isFinite(policy.advisoryRegressionPercent) && policy.advisoryRegressionPercent >= 0,
    "policy.advisoryRegressionPercent must be a non-negative number",
  );
  assertPlainObject(policy.packages, "policy.packages");
  assert(Object.keys(policy.packages).length > 0, "policy.packages must contain at least one package");

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
    toPosix(relative(root, left)).localeCompare(toPosix(relative(root, right)), "en"),
  );
  const parts = [MAGIC];
  for (const filePath of files) {
    const path = toPosix(relative(root, filePath));
    const content = readFileSync(filePath);
    parts.push(Buffer.from(`${path}\0${content.length}\0`), content, Buffer.from("\0"));
  }

  return {
    algorithm: "canonical-dist-gzip-v1",
    bytes: gzipSync(Buffer.concat(parts), { level: 9 }).byteLength,
    fileCount: files.length,
  };
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
    "| Package | Bytes | Files | Baseline | Budget | Semantics | Regression | Status |",
    "| --- | ---: | ---: | ---: | ---: | --- | ---: | --- |",
  ];
  for (const [name, result] of Object.entries(report.results)) {
    lines.push(
      `| @gis-engine/${name} | ${result.bytes ?? "n/a"} | ${result.fileCount ?? "n/a"} | ${result.baselineBytes} | ${result.budgetBytes} | ${result.semantics} | ${result.regressionPercent ?? "n/a"}% | ${result.status} |`,
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
