import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const BOT_GUARD_PUSH = "github.event_name != 'pull_request' || github.actor != 'github-actions[bot]'";
const BOT_GUARD_PULL_REQUEST = "github.actor != 'github-actions[bot]'";

/**
 * A pull request head authored by `github-actions[bot]` parks every run in
 * `action_required`, so each regenerated version-packages commit adds another
 * unapproved queue instead of gate evidence. PR-triggered jobs must opt out of
 * bot-authored heads; push and schedule paths stay untouched.
 */
const WORKFLOWS_WITH_PUSH = [".github/workflows/ci.yml", ".github/workflows/bundle-size.yml"];
const PR_ONLY_WORKFLOWS = [".github/workflows/pr-quality.yml", ".github/workflows/auto-fix.yml"];

function jobRanges(lines: string[]): Array<{ name: string; body: string[] }> {
  const jobsStart = lines.indexOf("jobs:");
  if (jobsStart === -1) throw new Error("workflow declares no jobs section");

  const starts = lines
    .map((line, index) => ({ line, index }))
    .filter(({ index, line }) => index > jobsStart && /^ {2}[A-Za-z0-9_-]+:$/.test(line));

  return starts.map(({ line, index }, position) => ({
    name: /^ {2}([A-Za-z0-9_-]+):$/.exec(line)![1],
    body: lines.slice(index + 1, starts[position + 1]?.index ?? lines.length),
  }));
}

function jobsMissingGuard(workflowPath: string, guard: string): string[] {
  return jobRanges(readFileSync(workflowPath, "utf8").split("\n"))
    .filter(({ body }) => !body.some((line) => /^ {4}if:/.test(line) && line.includes(guard)))
    .map(({ name }) => name);
}

describe("pull request workflows skip bot-authored heads", () => {
  it("guards every job that also runs on push without skipping the push path", () => {
    for (const workflowPath of WORKFLOWS_WITH_PUSH) {
      expect(jobsMissingGuard(workflowPath, BOT_GUARD_PUSH), workflowPath).toEqual([]);
    }
  });

  it("guards every job of the pull-request-only workflows", () => {
    for (const workflowPath of PR_ONLY_WORKFLOWS) {
      expect(jobsMissingGuard(workflowPath, BOT_GUARD_PULL_REQUEST), workflowPath).toEqual([]);
    }
  });

  it("keeps the push predicate scoped to pull request events", () => {
    for (const workflowPath of WORKFLOWS_WITH_PUSH) {
      const guarded = jobRanges(readFileSync(workflowPath, "utf8").split("\n")).filter(({ body }) =>
        body.some((line) => /^ {4}if:/.test(line) && line.includes(BOT_GUARD_PUSH)),
      );
      expect(guarded.length, workflowPath).toBeGreaterThan(0);
    }
  });
});
