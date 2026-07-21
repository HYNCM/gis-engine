import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import * as planningEvidence from "../../scripts/planning-evidence.mjs";

describe("fixture-driven planning evidence workflow", () => {
  it("keeps issue snapshot, handoff ledger, and dashboard on one evidence run", async () => {
    const fixture = JSON.parse(readFileSync("tests/fixtures/agent-framework/planning-evidence.json", "utf8"));
    const root = mkdtempSync(join(tmpdir(), "gis-engine-planning-evidence-"));

    for (const [path, content] of Object.entries(fixture.reports)) {
      const outputPath = join(root, path);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, String(content), "utf8");
    }

    const result = await (planningEvidence as any).generatePlanningEvidence({
      root,
      period: fixture.period,
      generatedAt: new Date(fixture.generatedAt),
      issueResult: { available: true, source: "fixture", issues: fixture.issues },
    });

    expect(result.issueSummary).toEqual({ open: 1, closed: 1, total: 2 });
    expect(result.ledger.evidence_run_id).toBe(result.evidenceRunId);
    expect(result.ledger.issue_snapshot).toMatchObject({
      source: "fixture",
      open: 1,
      closed: 1,
      total: 2,
    });
    expect(
      result.ledger.flows.filter((flow: any) => flow.required).every((flow: any) => flow.status === "consumed"),
    ).toBe(true);
    expect(result.dashboard).toContain(`evidence_run_id: ${result.evidenceRunId}`);
    expect(result.dashboard).toContain("| fixture | 1 | 1 | 2 | 2/2 consumed |");
    expect(result.snapshot).toContain(`evidence_run_id: ${result.evidenceRunId}`);
  });
});
