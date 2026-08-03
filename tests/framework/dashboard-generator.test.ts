import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeHealthMetrics, generateDashboard } from "../../scripts/dashboard-generator.mjs";
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

  it("shows a newer template without masking a fresh specialist report", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-dashboard-specialist-"));
    const reports = [
      ["competitor-updates-2026-W30-specialist.md", "specialist", "2026-07-21T02:30:00Z"],
      ["competitor-updates-2026-W30-template.md", "template", "2026-07-21T02:59:00Z"],
    ] as const;
    for (const [file, evidenceKind, generatedAt] of reports) {
      const reportPath = join(root, "docs/research", file);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(
        reportPath,
        `---
agent: product
period: 2026-W30
generated_at: ${generatedAt}
repo_revision: fixture
inputs:
  - AGENTS.md
owner: "@product"
decision_level: ${evidenceKind === "template" ? "info" : "advisory"}
evidence_kind: ${evidenceKind}
---
# Product ${evidenceKind}
`,
        "utf8",
      );
    }

    const product = computeHealthMetrics(root, new Date("2026-07-21T03:00:00Z")).find(
      (metric) => metric.agent === "product",
    );
    expect(product).toMatchObject({
      lastFile: "docs/research/competitor-updates-2026-W30-specialist.md",
      status: "fresh",
      evidenceKind: "specialist",
      latestTemplateFile: "docs/research/competitor-updates-2026-W30-template.md",
    });
    if (!product) throw new Error("expected product health metric");

    const dashboard = generateDashboard([product], [], "2026-07-21", {
      root,
      generatedAt: new Date("2026-07-21T03:00:00Z"),
    });
    expect(dashboard).toContain("docs/research/competitor-updates-2026-W30-template.md");
  });

  it("marks a 36-hour quality specialist report overdue in both health and SLA", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-dashboard-quality-sla-"));
    const reportPath = join(root, "docs/reviews/quality-gate-2026-07-19.md");
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(
      reportPath,
      `---
agent: quality
period: 2026-07-19
generated_at: 2026-07-19T15:00:00Z
repo_revision: fixture
inputs:
  - fixture
owner: "@quality"
decision_level: blocking
evidence_kind: specialist
---
# Quality specialist evidence
`,
      "utf8",
    );
    const now = new Date("2026-07-21T03:00:00Z");
    const quality = computeHealthMetrics(root, now).find((metric) => metric.agent === "quality");

    expect(quality).toMatchObject({ status: "overdue", evidenceKind: "specialist" });
    expect(collectSlaViolations(root, now).violations).toContainEqual(
      expect.objectContaining({
        agent: "quality",
        code: "EVIDENCE.SPECIALIST_STALE",
        severity: "warning",
      }),
    );
    if (!quality) throw new Error("expected quality health metric");
    const dashboard = generateDashboard([quality], [], "2026-07-21", { root, generatedAt: now });
    expect(dashboard).toContain("**健康 agent**: 0/1");
    expect(dashboard).toContain("**问题 agent**: 1/1");
    expect(dashboard).toContain("❌ breach");
  });

  it.each([
    { label: "invalid", generatedAt: "not-a-date", artifactMtime: "2026-07-21T02:59:30Z" },
    { label: "future", generatedAt: "2026-07-21T03:05:00.001Z", artifactMtime: null },
  ])("does not show green when the newest specialist timestamp is $label", ({ generatedAt, artifactMtime }) => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-dashboard-newest-specialist-"));
    const reports = [
      ["competitor-updates-2026-W29-specialist.md", "2026-07-21T02:30:00Z"],
      ["competitor-updates-2026-W30-specialist.md", generatedAt],
    ] as const;
    for (const [file, reportGeneratedAt] of reports) {
      const reportPath = join(root, "docs/research", file);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(
        reportPath,
        `---
agent: product
period: 2026-W30
generated_at: ${reportGeneratedAt}
repo_revision: fixture
inputs:
  - fixture
owner: "@product"
decision_level: advisory
evidence_kind: specialist
---
# Product specialist evidence
`,
        "utf8",
      );
      if (file.includes("W30") && artifactMtime) {
        const mtime = new Date(artifactMtime);
        utimesSync(reportPath, mtime, mtime);
      }
    }
    const now = new Date("2026-07-21T03:00:00Z");
    const product = computeHealthMetrics(root, now).find((metric) => metric.agent === "product");

    expect(product?.status).not.toBe("fresh");
    if (!product) throw new Error("expected product health metric");
    const dashboard = generateDashboard([product], [], "2026-07-21", { root, generatedAt: now });
    expect(dashboard).toContain("**健康 agent**: 0/1");
    expect(dashboard).toContain("**问题 agent**: 1/1");
    expect(dashboard).toContain("❌ breach");
  });
});
