import { describe, expect, it } from "vitest";

describe("bounded artifact push retry", () => {
  it("fetches, rebases, and retries after a non-fast-forward push", async () => {
    const { pushWithRetry } = await import("../../scripts/git-push-retry.mjs");
    const calls: string[][] = [];
    const results = [
      { status: 1, stderr: "! [rejected] HEAD -> main (non-fast-forward)" },
      { status: 0, stderr: "" },
      { status: 0, stderr: "" },
      { status: 0, stderr: "" },
    ];
    const runGit = (args: string[]) => {
      calls.push(args);
      return results.shift() ?? { status: 0, stderr: "" };
    };

    const result = pushWithRetry({ remote: "origin", branch: "main", maxAttempts: 3, runGit });

    expect(result).toEqual({ attempts: 2 });
    expect(calls).toEqual([
      ["push", "origin", "HEAD:main"],
      ["fetch", "origin", "main"],
      ["rebase", "FETCH_HEAD"],
      ["push", "origin", "HEAD:main"],
    ]);
  });

  it("fails closed after bounded non-fast-forward retries are exhausted", async () => {
    const { pushWithRetry } = await import("../../scripts/git-push-retry.mjs");
    const calls: string[][] = [];
    const runGit = (args: string[]) => {
      calls.push(args);
      if (args[0] === "push") {
        return { status: 1, stderr: "! [rejected] HEAD -> main (fetch first)" };
      }
      return { status: 0, stderr: "" };
    };

    expect(() => pushWithRetry({ remote: "origin", branch: "main", maxAttempts: 2, runGit })).toThrowError(
      expect.objectContaining({ code: "GIT.PUSH_RETRY_EXHAUSTED" }),
    );
    expect(calls.filter((args) => args[0] === "push")).toHaveLength(2);
    expect(calls.filter((args) => args[0] === "fetch")).toHaveLength(1);
    expect(calls.filter((args) => args[0] === "rebase")).toHaveLength(1);
  });

  it("aborts a conflicted rebase before returning the primary rebase failure", async () => {
    const { pushWithRetry } = await import("../../scripts/git-push-retry.mjs");
    const calls: string[][] = [];
    const results = [
      { status: 1, stderr: "! [rejected] HEAD -> main (non-fast-forward)" },
      { status: 0, stderr: "" },
      { status: 1, stderr: "CONFLICT (content): merge conflict" },
      { status: 0, stderr: "" },
    ];
    const runGit = (args: string[]) => {
      calls.push(args);
      return results.shift() ?? { status: 0, stderr: "" };
    };

    expect(() => pushWithRetry({ remote: "origin", branch: "main", runGit })).toThrowError(
      expect.objectContaining({
        code: "GIT.REBASE_FAILED",
        message: expect.stringContaining("merge conflict"),
      }),
    );
    expect(calls).toEqual([
      ["push", "origin", "HEAD:main"],
      ["fetch", "origin", "main"],
      ["rebase", "FETCH_HEAD"],
      ["rebase", "--abort"],
    ]);
  });

  it("retains rebase failure as primary when rebase abort also fails", async () => {
    const { pushWithRetry } = await import("../../scripts/git-push-retry.mjs");
    const results = [
      { status: 1, stderr: "! [rejected] HEAD -> main (non-fast-forward)" },
      { status: 0, stderr: "" },
      { status: 1, stderr: "original rebase conflict" },
      { status: 1, stderr: "abort cleanup failed" },
    ];
    const runGit = () => results.shift() ?? { status: 0, stderr: "" };

    expect(() => pushWithRetry({ remote: "origin", branch: "main", runGit })).toThrowError(
      expect.objectContaining({
        code: "GIT.REBASE_FAILED",
        message: expect.stringMatching(/original rebase conflict[\s\S]*abort cleanup failed/),
      }),
    );
  });
});
