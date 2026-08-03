#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function pushError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validateGitTarget(value, label) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(String(value ?? ""))) {
    throw pushError("GIT.INVALID_TARGET", `${label} contains unsupported characters`);
  }
}

function defaultRunGit(args) {
  const result = spawnSync("git", args, { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe"] });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function isNonFastForward(result) {
  return /non-fast-forward|fetch first|\[rejected\]/i.test(`${result.stderr ?? ""}\n${result.stdout ?? ""}`);
}

function runRequired(runGit, args, code) {
  const result = runGit(args) ?? {};
  if (result.status !== 0) {
    throw pushError(code, `git ${args[0]} failed: ${String(result.stderr ?? result.stdout ?? "").trim()}`);
  }
  return result;
}

export function pushWithRetry({ remote = "origin", branch, maxAttempts = 3, runGit = defaultRunGit }) {
  validateGitTarget(remote, "remote");
  validateGitTarget(branch, "branch");
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) {
    throw pushError("GIT.INVALID_RETRY_BOUND", "maxAttempts must be an integer from 1 to 5");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const pushed = runGit(["push", remote, `HEAD:${branch}`]) ?? {};
    if (pushed.status === 0) return { attempts: attempt };
    if (!isNonFastForward(pushed)) {
      throw pushError("GIT.PUSH_FAILED", `git push failed: ${String(pushed.stderr ?? pushed.stdout ?? "").trim()}`);
    }
    if (attempt === maxAttempts) {
      throw pushError("GIT.PUSH_RETRY_EXHAUSTED", `git push remained non-fast-forward after ${maxAttempts} attempts`);
    }

    runRequired(runGit, ["fetch", remote, branch], "GIT.FETCH_FAILED");
    runRequired(runGit, ["rebase", "FETCH_HEAD"], "GIT.REBASE_FAILED");
  }

  throw pushError("GIT.PUSH_RETRY_EXHAUSTED", "unreachable retry exhaustion");
}

function parseArgs(args) {
  const parsed = { remote: "origin", maxAttempts: 3 };
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--remote" && args[index + 1]) parsed.remote = args[++index];
    else if (args[index] === "--branch" && args[index + 1]) parsed.branch = args[++index];
    else if (args[index] === "--max-attempts" && args[index + 1]) parsed.maxAttempts = Number(args[++index]);
    else throw pushError("GIT.INVALID_ARGUMENT", `unknown or incomplete argument: ${args[index]}`);
  }
  return parsed;
}

function main() {
  const result = pushWithRetry(parseArgs(process.argv.slice(2)));
  console.log(`Artifact push succeeded after ${result.attempts} attempt(s).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`${error.code ?? "GIT.PUSH_FAILED"}: ${error.message}`);
    process.exit(1);
  }
}
