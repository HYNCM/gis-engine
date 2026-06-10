#!/usr/bin/env node

import { execFileSync, execSync, spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArgs(process.argv.slice(2));
const tmp = mkdtempSync(join(tmpdir(), "gis-engine-provider-smoke-"));
const cliBin = join(root, "packages/cli/dist/bin.js");
const projectName = "provider-success";
const providerPrompt = "Create a provider smoke map for private adoption evidence";
const providerApiKey = "sk-provider-smoke-secret";
const receivedRequests = [];

const reportResult = {
  passed: false,
  cases: [],
  failureMessage: "",
  tmpDir: tmp,
};

const server = createServer((request, response) => {
  const entry = recordRequest(request);

  if (request.url === "/success/v1/chat/completions") {
    writeJson(response, 200, {
      choices: [
        {
          message: {
            content: JSON.stringify({
              intent: {
                targetDomains: ["feature-display"],
              },
              confidence: {
                level: "high",
                reasons: ["structured local provider response", "no external network required"],
              },
            }),
          },
        },
      ],
    });
    return;
  }

  if (request.url === "/malformed/v1/chat/completions") {
    writeJson(response, 200, {
      choices: [{ message: { content: "{not-json" } }],
    });
    return;
  }

  if (request.url === "/http-error/v1/chat/completions") {
    writeJson(response, 503, { error: { message: "provider smoke service unavailable" } });
    return;
  }

  if (request.url === "/timeout/v1/chat/completions") {
    setTimeout(() => {
      if (!response.destroyed) {
        writeJson(response, 200, {
          choices: [{ message: { content: JSON.stringify({ intent: { targetDomains: ["feature-display"] } }) } }],
        });
      }
    }, 300);
    return;
  }

  writeJson(response, 404, { error: { message: `unknown provider smoke route: ${entry.url}` } });
});

try {
  await listen(server);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  if (!options.skipBuild) runInherited("pnpm", ["build"], root);
  assertSmokeResult(existsSync(cliBin), `CLI binary was not built at ${relative(root, cliBin)}.`);

  const success = await runCli([
    projectName,
    "--generate",
    "--provider",
    "openai",
    "--base-url",
    `${base}/success/v1`,
    "--api-key",
    providerApiKey,
    "--timeout",
    "2000",
    "--prompt",
    providerPrompt,
    "--yes",
  ]);
  assertCommand(success, 0, "success generate");
  assertNoSensitiveRetention("success generate output", success.output);

  const successRequest = receivedRequests.find((entry) => entry.url === "/success/v1/chat/completions");
  assertSmokeResult(successRequest, "Provider success request was not received.");
  assertSmokeResult(
    successRequest.authorization === `Bearer ${providerApiKey}`,
    "Provider success request did not include the expected Authorization header.",
  );
  await waitFor(() => successRequest.body.includes(providerPrompt), 500);
  assertSmokeResult(
    successRequest.body.includes(providerPrompt),
    "Provider success request did not include the prompt sent to the local provider.",
  );

  const projectDir = join(tmp, projectName);
  const preflight = await runJson(["--preflight", join(projectName, "map.json"), "--json"]);
  assertSmokeResult(preflight.ok === true, "Generated provider smoke map did not pass preflight.");
  assertSmokeResult(preflight.status === "ready", `Generated provider smoke preflight returned ${preflight.status}.`);

  const artifactVerification = await runJson(["--verify-artifacts", projectName, "--json"]);
  assertSmokeResult(artifactVerification.ok === true, "Generated provider smoke artifacts did not verify.");
  assertSmokeResult(
    artifactVerification.summary?.missingFileCount === 0,
    "Generated provider smoke artifacts reported missing files.",
  );
  assertSmokeResult(
    artifactVerification.summary?.hashMismatchCount === 0,
    "Generated provider smoke artifacts reported hash mismatches.",
  );
  assertNoSensitiveRetention("generated provider smoke files", readProjectFiles(projectDir));

  reportResult.cases.push({
    name: "success",
    status: "passed",
    evidence: "OpenAI-compatible envelope generated a reviewable map; preflight and artifact verification passed.",
  });

  const malformed = await runCli([
    "provider-malformed",
    "--generate",
    "--provider",
    "openai",
    "--base-url",
    `${base}/malformed/v1`,
    "--api-key",
    providerApiKey,
    "--timeout",
    "2000",
    "--prompt",
    providerPrompt,
    "--yes",
  ]);
  assertCommand(malformed, 1, "malformed provider response");
  assertSmokeResult(
    malformed.output.includes("Provider response content must be a JSON object."),
    "Malformed provider response did not surface the expected structured diagnostic.",
  );
  assertNoSensitiveRetention("malformed provider output", malformed.output);
  reportResult.cases.push({
    name: "malformed response",
    status: "passed",
    evidence: "Malformed provider content failed with a structured provider diagnostic and no sensitive output.",
  });

  const httpError = await runCli([
    "provider-http-error",
    "--generate",
    "--provider",
    "openai",
    "--base-url",
    `${base}/http-error/v1`,
    "--api-key",
    providerApiKey,
    "--timeout",
    "2000",
    "--prompt",
    providerPrompt,
    "--yes",
  ]);
  assertCommand(httpError, 1, "provider HTTP error");
  assertSmokeResult(
    httpError.output.includes("Provider request failed with HTTP 503."),
    "Provider HTTP error did not surface the expected structured diagnostic.",
  );
  assertNoSensitiveRetention("provider HTTP error output", httpError.output);
  reportResult.cases.push({
    name: "HTTP error",
    status: "passed",
    evidence: "Provider HTTP error failed deterministically and kept sensitive strings out of command output.",
  });

  const timeout = await runCli([
    "provider-timeout",
    "--generate",
    "--provider",
    "openai",
    "--base-url",
    `${base}/timeout/v1`,
    "--api-key",
    providerApiKey,
    "--timeout",
    "25",
    "--prompt",
    providerPrompt,
    "--yes",
  ]);
  assertCommand(timeout, 1, "provider timeout");
  assertSmokeResult(
    timeout.output.includes("Provider request timed out."),
    "Provider timeout did not surface the expected structured diagnostic.",
  );
  assertNoSensitiveRetention("provider timeout output", timeout.output);
  reportResult.cases.push({
    name: "timeout",
    status: "passed",
    evidence: "Provider timeout failed deterministically and kept sensitive strings out of command output.",
  });

  reportResult.passed = true;
  console.log(`Provider smoke passed in ${tmp}`);
} catch (error) {
  reportResult.failureMessage = redactSensitive(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  throw error;
} finally {
  await closeServer(server);
  writeReport(resolve(root, options.outputPath), reportResult);
  if (!options.keep) rmSync(tmp, { recursive: true, force: true });
}

function parseArgs(argv) {
  const parsed = {
    keep: false,
    skipBuild: false,
    outputPath: `docs/reviews/provider-smoke-${new Date().toISOString().slice(0, 10)}.md`,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (arg === "--keep") {
      parsed.keep = true;
      continue;
    }
    if (arg === "--skip-build") {
      parsed.skipBuild = true;
      continue;
    }
    if (arg === "--output") {
      parsed.outputPath = requireValue(argv[index + 1], "--output");
      index += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      parsed.outputPath = requireValue(arg.slice("--output=".length), "--output");
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return parsed;
}

function requireValue(value, flag) {
  if (value === undefined || value.length === 0) throw new Error(`${flag} requires a value.`);
  return value;
}

function runInherited(command, args, cwd) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
  });
}

function runCli(args) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [cliBin, ...args], {
      cwd: tmp,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks = [];
    child.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    child.on("error", (error) => {
      resolveRun({
        status: 1,
        signal: null,
        output: error instanceof Error ? error.message : String(error),
      });
    });
    child.on("close", (status, signal) => {
      resolveRun({
        status: status ?? 1,
        signal,
        output: Buffer.concat(chunks).toString("utf-8"),
      });
    });
  });
}

async function runJson(args) {
  const result = await runCli(args);
  assertCommand(result, 0, args[0] ?? "json command");
  assertNoSensitiveRetention("json command output", result.output);
  return JSON.parse(result.output);
}

function assertCommand(result, expectedStatus, label) {
  assertSmokeResult(
    result.status === expectedStatus,
    `${label} exited with ${result.status}, expected ${expectedStatus}.\n${redactSensitive(result.output)}`,
  );
}

function assertSmokeResult(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoSensitiveRetention(label, value) {
  const output = String(value);
  const retained = [];
  if (output.includes(providerApiKey)) retained.push("provider API key");
  if (output.includes(providerPrompt)) retained.push("raw prompt");
  assertSmokeResult(retained.length === 0, `${label} retained sensitive content: ${retained.join(", ")}`);
}

function readProjectFiles(projectDir) {
  const contents = [];
  for (const path of walkFiles(projectDir)) {
    contents.push(readFileSync(path, "utf-8"));
  }
  return contents.join("\n");
}

function walkFiles(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) entries.push(...walkFiles(path));
    if (stats.isFile()) entries.push(path);
  }
  return entries;
}

function redactSensitive(value) {
  return String(value).split(providerApiKey).join("[redacted-api-key]").split(providerPrompt).join("[redacted-prompt]");
}

function recordRequest(request) {
  const entry = {
    url: request.url ?? "",
    authorization: request.headers.authorization ?? "",
    body: "",
  };
  receivedRequests.push(entry);
  request.on("data", (chunk) => {
    entry.body += Buffer.from(chunk).toString("utf-8");
  });
  request.resume();
  return entry;
}

async function waitFor(predicate, timeoutMs) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start >= timeoutMs) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  }
}

function writeJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

function listen(httpServer) {
  return new Promise((resolveListen, rejectListen) => {
    httpServer.once("error", rejectListen);
    httpServer.listen(0, "127.0.0.1", () => {
      httpServer.off("error", rejectListen);
      resolveListen();
    });
  });
}

function closeServer(httpServer) {
  return new Promise((resolveClose) => {
    httpServer.close(() => resolveClose());
  });
}

function writeReport(path, result) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${renderReport(result)}\n`, "utf-8");
}

function renderReport(result) {
  const generatedAt = new Date().toISOString();
  const status = result.passed ? "passed" : "failed";
  const decisionLevel = result.passed ? "advisory" : "blocking";
  const cases = result.cases.length
    ? result.cases
    : [{ name: "provider smoke", status: "failed", evidence: result.failureMessage || "Smoke did not complete." }];
  const failureLines = result.failureMessage ? ["", "## Failure", "", "```txt", result.failureMessage, "```"] : [];

  return [
    "---",
    "agent: builder",
    `period: ${generatedAt.slice(0, 10)}`,
    `generated_at: ${generatedAt}`,
    `repo_revision: "${getGitSha()}"`,
    "inputs:",
    "  - scripts/provider-smoke.mjs",
    "  - packages/cli/src/provider-http.ts",
    "  - docs/cli/provider-config.md",
    "  - https://github.com/HYNCM/gis-engine/issues/10",
    'owner: "@builder"',
    `decision_level: ${decisionLevel}`,
    "---",
    "",
    "# W25 OpenAI-Compatible Provider Smoke",
    "",
    `Status: **${status}**`,
    "",
    "| Case | Status | Evidence |",
    "| --- | --- | --- |",
    ...cases.map((entry) => `| ${entry.name} | ${entry.status} | ${entry.evidence} |`),
    "",
    "## Safety Boundary",
    "",
    "- Uses a local `127.0.0.1` OpenAI-compatible test server; no CI secret or external provider is required.",
    "- Asserts the local provider receives an Authorization header, then checks command output and generated files do not retain the test key or raw prompt.",
    "- Runs generated map preflight and artifact-manifest verification on the success path.",
    "",
    "## Command",
    "",
    "```bash",
    "pnpm smoke:provider",
    "```",
    ...failureLines,
  ].join("\n");
}

function getGitSha() {
  try {
    return execSync("git rev-parse HEAD", { cwd: root, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function printHelp() {
  console.log(`
Usage: node scripts/provider-smoke.mjs [options]

Options:
  --keep         Keep the temporary smoke directory for inspection
  --skip-build   Reuse the existing packages/cli/dist build
  --output PATH  Markdown report path (default: docs/reviews/provider-smoke-YYYY-MM-DD.md)
  --help, -h     Show this help message
`);
}
