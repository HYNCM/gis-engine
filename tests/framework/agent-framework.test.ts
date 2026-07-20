import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  classifyChangedFiles,
  classifyReportEvidence,
  validateAutomationReportContent,
  validatePlanningConsistency,
} from "../../scripts/agent-framework.mjs";
import { AGENT_REGISTRY, listAgentNames } from "../../scripts/agent-registry.mjs";
import { generateReport } from "../../scripts/agent-runner.mjs";
import { buildPlan } from "../../scripts/gate-plan.mjs";
import { classifyFlow } from "../../scripts/handoff-ledger.mjs";

describe("agent coordination framework", () => {
  it("separates docs-only changes from framework changes", () => {
    const docsOnly = classifyChangedFiles(["docs/README.md"]);
    expect(docsOnly.docsOnly).toBe(true);
    expect(docsOnly.requiresFrameworkChecks).toBe(false);

    const workflowChange = classifyChangedFiles([".github/workflows/agent-weekly.yml"]);
    expect(workflowChange.docsOnly).toBe(false);
    expect(workflowChange.requiresFrameworkChecks).toBe(true);

    const coordinationChange = classifyChangedFiles(["docs/planning/weekly-digest.md"]);
    expect(coordinationChange.docsOnly).toBe(false);
    expect(coordinationChange.coordinationTouched).toBe(true);
    expect(coordinationChange.requiresFrameworkChecks).toBe(true);
  });

  it("routes workflow and coordination changes to deterministic gates", () => {
    const workflowPlan = [...buildPlan([".github/workflows/agent-weekly.yml"]).keys()];
    expect(workflowPlan).toContain("pnpm test:agent-framework");
    expect(workflowPlan).toContain("pnpm build:schema");
    expect(workflowPlan).toContain("pnpm check");
    expect(workflowPlan).not.toContain("pnpm test:docs");

    const coordinationPlan = [...buildPlan(["docs/planning/weekly-digest.md"]).keys()];
    expect(coordinationPlan).toContain("pnpm test:agent-framework");
    expect(coordinationPlan).toContain("pnpm build:schema");
    expect(coordinationPlan).toContain("pnpm check");
    expect(coordinationPlan).toContain("node scripts/doc-generator.mjs links");
  });

  it("installs Playwright before recovery gates run snapshot smoke", () => {
    const workflow = readFileSync(".github/workflows/agent-failure-recovery.yml", "utf8");
    const installIndex = workflow.indexOf("pnpm exec playwright install --with-deps chromium");
    const gateIndex = workflow.indexOf("pnpm build:schema && pnpm check");

    expect(installIndex).toBeGreaterThan(-1);
    expect(gateIndex).toBeGreaterThan(installIndex);
  });

  it("creates recovery labels before opening escalation issues", () => {
    const workflow = readFileSync(".github/workflows/agent-failure-recovery.yml", "utf8");
    const labelIndex = workflow.indexOf("gh label create agent-escalation");
    const issueIndex = workflow.indexOf("gh issue create");

    expect(labelIndex).toBeGreaterThan(-1);
    expect(issueIndex).toBeGreaterThan(labelIndex);
    expect(workflow).not.toContain('--label "agent-escalation,automation"');
  });

  it("uses nullglob for optional monthly release reports", () => {
    const workflow = readFileSync(".github/workflows/agent-monthly.yml", "utf8");

    expect(workflow).toContain("shopt -s nullglob");
    expect(workflow).toContain("release_reports=(docs/reviews/quality-gate-release-*.md)");
    expect(workflow).not.toContain('file_pattern: "docs/planning/monthly-roadmap.md');
  });

  it("gates generated daily artifacts before the orchestrator bot commits them", () => {
    const workflow = readFileSync(".github/workflows/agent-daily.yml", "utf8");
    const refreshIndex = workflow.indexOf("Refresh health dashboard and retention window");
    const gateIndex = workflow.indexOf("Gate generated daily artifacts");
    const commitIndex = workflow.indexOf("Commit daily artifacts");

    expect(refreshIndex).toBeGreaterThan(-1);
    expect(gateIndex).toBeGreaterThan(refreshIndex);
    expect(commitIndex).toBeGreaterThan(gateIndex);
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain("git diff --check");
    expect(workflow).toContain("pnpm test:agent-framework");
    expect(workflow).toContain("node scripts/doc-generator.mjs links");
  });

  it("passes authenticated issue state into atomic weekly and monthly planning evidence", () => {
    for (const workflowPath of [".github/workflows/agent-weekly.yml", ".github/workflows/agent-monthly.yml"]) {
      const workflow = readFileSync(workflowPath, "utf8");
      const refreshIndex = workflow.indexOf("node scripts/planning-evidence.mjs");
      const commitIndex = workflow.indexOf("git commit");

      expect(refreshIndex, workflowPath).toBeGreaterThan(-1);
      expect(commitIndex, workflowPath).toBeGreaterThan(refreshIndex);
      expect(workflow, workflowPath).toMatch(/permissions:\n(?:[ \t]+.*\n)*?[ \t]+issues: read/);
      expect(workflow, workflowPath).toContain("GH_TOKEN: ${{ github.token }}");
    }
  });

  it("fails closed on malformed task ids and keeps valid ids in sync", () => {
    const valid = validatePlanningConsistency(
      "| TASK-2026W24-RCU-001 | item |\n| TASK-2026W24-PRD-001 | item |\n",
      "| TASK-2026W24-RCU-001 | item |\n| TASK-2026W24-PRD-001 | item |\n",
    );
    expect(valid.valid).toBe(true);
    expect(valid.issues).toHaveLength(0);

    const invalid = validatePlanningConsistency("| TASK-2026ABC-001 | item |\n", "| TASK-2026ABC-001 | item |\n");
    expect(invalid.valid).toBe(false);
    expect(invalid.issues[0]?.code).toBe("TASK_PARSE_BURNDOWN_FAIL");

    const mixed = validatePlanningConsistency(
      "| TASK-2026W24-RCU-001 | item |\n| TASK-2026ABC-001 | item |\n",
      "| TASK-2026W24-RCU-001 | item |\n| TASK-2026ABC-001 | item |\n",
    );
    expect(mixed.valid).toBe(false);
    expect(mixed.issues.some((issue) => issue.code === "TASK_PARSE_BURNDOWN_FAIL")).toBe(true);
  });

  it("keeps the public agent list free of the hidden evolution guardian", () => {
    expect(listAgentNames()).not.toContain("evolution-guardian");
    expect(AGENT_REGISTRY["evolution-guardian"]?.hidden).toBe(true);
  });

  it("validates generated automation reports", () => {
    const report = generateReport("orchestrator", AGENT_REGISTRY.orchestrator, "2026-W24", []);
    const validation = validateAutomationReportContent(report);
    expect(validation.valid).toBe(true);
    expect(validation.frontMatter?.agent).toBe("orchestrator");
    expect(validation.frontMatter?.decision_level).toBe("info");
    expect(validation.frontMatter?.evidence_kind).toBe("template");
    expect(validation.frontMatter?.inputs).toEqual(["AGENTS.md", "README.md"]);

    const relabeledTemplate = report.replace("evidence_kind: template", "evidence_kind: specialist");
    expect(classifyReportEvidence(relabeledTemplate)).toBe("template");
  });

  it("requires explicit upstream citation before a handoff counts as consumed", () => {
    const flow = {
      id: "HOC-N1",
      from: "product",
      to: "orchestrator",
      required: true,
      description: "competitor signals and priority recommendations",
    };
    const upstream = {
      path: "docs/research/competitor-updates-2026-W24.md",
      generatedAt: new Date("2026-06-05T13:05:41Z"),
      sha256: "51d2e000931efdb5a5a985dc815402dc10a035f87b15d456b3f5ca2cdd32689b",
    };
    const downstreamWithoutReference = {
      path: "docs/planning/weekly-digest.md",
      generatedAt: new Date("2026-06-05T16:36:16Z"),
      content: "# Weekly Digest\n",
      inputs: ["AGENTS.md"],
    };

    expect(classifyFlow(flow, upstream, downstreamWithoutReference).status).toBe("pending");

    const downstreamWithReference = {
      ...downstreamWithoutReference,
      content: `---\ninputs:\n  - docs/research/competitor-updates-2026-W24.md\n---\n# Weekly Digest\n`,
      inputs: ["docs/research/competitor-updates-2026-W24.md"],
    };
    const consumed = classifyFlow(flow, upstream, downstreamWithReference);
    expect(consumed.status).toBe("consumed");
    expect(consumed.note).toContain("docs/research/competitor-updates-2026-W24.md");

    const downstreamWithOnlyTimestamp = {
      ...downstreamWithoutReference,
      content: `---\nnotes: ${upstream.generatedAt.toISOString()}\n---\n# Weekly Digest\n`,
    };
    expect(classifyFlow(flow, upstream, downstreamWithOnlyTimestamp).status).toBe("pending");
  });

  it.each([
    {
      id: "HOC-N1",
      from: "product",
      description: "competitor signals and priority recommendations",
      path: "docs/research/competitor-updates-2026-W30.md",
    },
    {
      id: "HOC-N3",
      from: "quality",
      description: "gate pass/block and release readiness",
      path: "docs/reviews/quality-gate-2026-07-21.md",
    },
  ])("rejects template-only reports on both sides of $id", ({ id, from, description, path }) => {
    const flow = { id, from, to: "orchestrator", required: true, description };
    const upstream = {
      path,
      generatedAt: new Date("2026-07-21T00:00:00Z"),
      sha256: `template-${from}`,
      evidenceKind: "template",
    };
    const downstream = {
      path: "docs/planning/weekly-digest.md",
      generatedAt: new Date("2026-07-21T00:01:00Z"),
      content: path,
      inputs: [path],
      evidenceKind: "specialist",
    };

    const templateUpstream = classifyFlow(flow, upstream, downstream);
    expect(templateUpstream).toMatchObject({
      status: "invalid-upstream",
      severity: "error",
    });
    expect(templateUpstream.status).not.toBe("consumed");

    const templateDownstream = classifyFlow(
      flow,
      { ...upstream, evidenceKind: "specialist" },
      { ...downstream, evidenceKind: "template" },
    );
    expect(templateDownstream).toMatchObject({
      status: "pending",
      severity: "error",
    });
    expect(templateDownstream.status).not.toBe("consumed");
  });
});
