import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const validSnapshot = `---
agent: orchestrator
period: issue-snapshot
generated_at: 2026-07-21T02:00:00.000Z
repo_revision: "fixture"
inputs:
  - GitHub Issues API
owner: "@orchestrator"
decision_level: info
issue_source: authenticated
---

# GitHub Issues Planning Snapshot

## Summary

- Open issues: 1
- Closed issues in snapshot: 1
- Total returned: 2
`;

describe("fail-closed issue snapshot generation", () => {
  it("does not overwrite a valid snapshot when authenticated issue fetch fails", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-issues-snapshot-"));
    const scriptPath = join(root, "scripts/issues-snapshot.mjs");
    const outputPath = join(root, "docs/planning/issues-snapshot.md");
    const binDir = join(root, "bin");

    mkdirSync(dirname(scriptPath), { recursive: true });
    mkdirSync(dirname(outputPath), { recursive: true });
    mkdirSync(binDir, { recursive: true });
    cpSync("scripts/issues-snapshot.mjs", scriptPath);
    writeFileSync(outputPath, validSnapshot, "utf8");

    const fakeGh = join(binDir, "gh");
    writeFileSync(fakeGh, "#!/bin/sh\necho 'authentication required' >&2\nexit 4\n", "utf8");
    chmodSync(fakeGh, 0o755);

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
    });

    expect(
      result.status,
      `stdout: ${result.stdout}\nstderr: ${result.stderr}\nerror: ${result.error?.message ?? "none"}`,
    ).toBe(2);
    expect(result.stderr).toContain("authentication required");
    expect(readFileSync(outputPath, "utf8")).toBe(validSnapshot);
  });

  it("preserves all planning evidence artifacts when the real bundle CLI cannot authenticate", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-planning-evidence-cli-"));
    const binDir = join(root, "bin");
    const ghCwdPath = join(root, "gh-cwd.txt");
    const artifacts = new Map([
      ["docs/planning/issues-snapshot.md", "authenticated issue snapshot\n"],
      ["docs/planning/handoff-ledger.json", '{"source":"valid-ledger"}\n'],
      ["docs/planning/AGENT_HEALTH_DASHBOARD.md", "# Valid dashboard\n"],
    ]);

    mkdirSync(binDir, { recursive: true });
    for (const [relativePath, content] of artifacts) {
      const outputPath = join(root, relativePath);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, content, "utf8");
    }

    const fakeGh = join(binDir, "gh");
    writeFileSync(
      fakeGh,
      "#!/bin/sh\npwd > \"$GH_CWD_PATH\"\necho 'bundle authentication required' >&2\nexit 4\n",
      "utf8",
    );
    chmodSync(fakeGh, 0o755);

    const result = spawnSync(process.execPath, [resolve("scripts/planning-evidence.mjs"), "--root", root], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        GH_CWD_PATH: ghCwdPath,
        PATH: `${binDir}:${process.env.PATH}`,
      },
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("bundle authentication required");
    expect(realpathSync(readFileSync(ghCwdPath, "utf8").trim())).toBe(realpathSync(root));
    for (const [relativePath, content] of artifacts) {
      expect(readFileSync(join(root, relativePath), "utf8")).toBe(content);
    }
  });
});
