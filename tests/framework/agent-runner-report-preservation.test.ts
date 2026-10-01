import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PERIOD = "2099-12";
const AGENT = "evolution-guardian";

const specialistReport = `---
agent: orchestrator
period: ${PERIOD}
generated_at: 2099-12-01T00:00:00Z
repo_revision: "fixture"
inputs:
  - fixture evidence
owner: "@orchestrator (evolution-guardian)"
decision_level: advisory
evidence_kind: specialist
---

# Evolution Review: ${PERIOD}

## Metric Trends

- D3 quality trend: gate failures concentrated in the cadence jobs, with evidence.
`;

function fixtureRoot() {
  // The runner only self-invokes when argv[1] matches its own module URL, so the
  // fixture root must be the realpath (/var -> /private/var on macOS).
  const root = realpathSync(mkdtempSync(join(tmpdir(), "gis-engine-agent-runner-")));
  cpSync("scripts", join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "docs/planning"), { recursive: true });
  return root;
}

function reportPath(root) {
  return join(root, "docs/planning", `evolution-review-${PERIOD}.md`);
}

function runAgent(root) {
  return spawnSync(process.execPath, [join(root, "scripts/agent-runner.mjs"), AGENT, "--period", PERIOD], {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
  });
}

describe("agent runner report writing", () => {
  it("keeps a filled specialist report when the cadence reruns the same period", () => {
    const root = fixtureRoot();
    writeFileSync(reportPath(root), specialistReport, "utf8");

    const result = runAgent(root);

    expect(result.status, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).toBe(0);
    expect(readFileSync(reportPath(root), "utf8")).toBe(specialistReport);
    expect(result.stdout).toContain("specialist");
  });

  it("refreshes a report that is still template-only evidence", () => {
    const root = fixtureRoot();
    writeFileSync(
      reportPath(root),
      "---\nagent: orchestrator\nevidence_kind: template\n---\n\nstale template\n",
      "utf8",
    );

    const result = runAgent(root);

    expect(result.status, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).toBe(0);
    const refreshed = readFileSync(reportPath(root), "utf8");
    expect(refreshed).not.toContain("stale template");
    expect(refreshed).toContain("evidence_kind: template");
  });

  it("generates the report when no artifact exists yet", () => {
    const root = fixtureRoot();

    const result = runAgent(root);

    expect(result.status, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).toBe(0);
    expect(existsSync(reportPath(root))).toBe(true);
    expect(readFileSync(reportPath(root), "utf8")).toContain(`period: ${PERIOD}`);
  });
});
