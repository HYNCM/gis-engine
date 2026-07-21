import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeHealthMetrics } from "../../scripts/dashboard-generator.mjs";
import { collectSlaViolations } from "../../scripts/sla-checker.mjs";

describe("agent dashboard evidence freshness", () => {
  it("does not report a recent template-only specialist artifact as fresh", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-dashboard-"));
    const reportPath = join(root, "docs/research/competitor-updates-2026-W30.md");
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(
      reportPath,
      `---
agent: product
period: 2026-W30
generated_at: 2026-07-21T02:59:00Z
repo_revision: fixture
inputs:
  - AGENTS.md
owner: "@product"
decision_level: info
evidence_kind: template
---
# Product template
`,
      "utf8",
    );

    const product = computeHealthMetrics(root, new Date("2026-07-21T03:00:00Z")).find(
      (metric) => metric.agent === "product",
    );

    expect(product).toMatchObject({
      lastFile: "docs/research/competitor-updates-2026-W30.md",
      status: "template-only",
      evidenceKind: "template",
    });

    expect(collectSlaViolations(root, new Date("2026-07-21T03:00:00Z")).violations).toContainEqual(
      expect.objectContaining({
        agent: "product",
        severity: "critical",
        message: expect.stringContaining("template-only"),
      }),
    );
  });
});
