import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
import { buildHandoffLedger, classifyFlow, findLatestReport } from "../../scripts/handoff-ledger.mjs";
import { collectSlaViolations } from "../../scripts/sla-checker.mjs";

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

  it("passes every failed workflow identity to the recovery incident CLI", () => {
    const workflow = readFileSync(".github/workflows/agent-failure-recovery.yml", "utf8");

    expect(workflow).toContain("--json conclusion,status,databaseId,url");
    expect(workflow).toContain("FAILED_RUNS_FILE");
    expect(workflow).toContain("while IFS=$'\\t' read -r WORKFLOW_NAME RUN_ID RUN_URL");
    expect(workflow).toMatch(
      /node scripts\/recovery-incident\.mjs --workflow "\$\{WORKFLOW_NAME\}" --run-id "\$\{RUN_ID\}"/,
    );
    expect(workflow).not.toContain("gh issue create");
    expect(workflow).not.toContain('|| echo "[]"');
  });

  it("attempts every recovery incident before failing the reconciliation step", () => {
    const workflow = readFileSync(".github/workflows/agent-failure-recovery.yml", "utf8");
    const script = extractWorkflowRunStep(workflow, "Reconcile escalation incidents");
    const root = mkdtempSync(join(tmpdir(), "gis-engine-recovery-loop-"));
    const binDir = join(root, "bin");
    const attemptsPath = join(root, "attempts.txt");
    const incidentsPath = join(root, "failed-runs.tsv");
    mkdirSync(binDir, { recursive: true });
    writeFileSync(
      join(binDir, "node"),
      `#!/bin/sh
printf '%s\n' "$*" >> "$ATTEMPTS_FILE"
case "$*" in
  *"--run-id 111"*) exit 1 ;;
esac
exit 0
`,
      "utf8",
    );
    chmodSync(join(binDir, "node"), 0o755);
    writeFileSync(
      incidentsPath,
      "Agent Daily Cadence\t111\thttps://github.test/actions/runs/111\nAgent Weekly Cadence\t222\thttps://github.test/actions/runs/222\n",
      "utf8",
    );

    const result = spawnSync("/bin/bash", ["-c", script], {
      encoding: "utf8",
      env: {
        ...process.env,
        ATTEMPTS_FILE: attemptsPath,
        FAILED_RUNS_FILE: incidentsPath,
        PATH: `${binDir}:${process.env.PATH}`,
      },
    });
    const attempts = readFileSync(attemptsPath, "utf8").trim().split("\n");

    expect(result.status).toBe(1);
    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toContain("--run-id 111");
    expect(attempts[1]).toContain("--run-id 222");
  });

  it("serializes recovery scans without cancelling an in-progress reconciliation", () => {
    const workflow = readFileSync(".github/workflows/agent-failure-recovery.yml", "utf8");

    expect(workflow).toContain("concurrency:\n  group: agent-failure-recovery\n  cancel-in-progress: false");
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

  it("serializes cadence artifact writers and fails closed on specialist evidence health", () => {
    const workflowPaths = [
      ".github/workflows/agent-daily.yml",
      ".github/workflows/agent-weekly.yml",
      ".github/workflows/agent-monthly.yml",
    ];

    for (const workflowPath of workflowPaths) {
      const workflow = readFileSync(workflowPath, "utf8");
      const evidenceGateIndex = workflow.indexOf("node scripts/sla-checker.mjs");
      const handoffGateIndex = workflow.indexOf("node scripts/handoff-ledger.mjs --check --dry-run");
      const commitIndex = workflow.indexOf("git commit");

      expect(workflow, workflowPath).toMatch(/group: agent-artifact-writers-\$\{\{ github\.ref \}\}/);
      expect(evidenceGateIndex, workflowPath).toBeGreaterThan(-1);
      expect(handoffGateIndex, workflowPath).toBeGreaterThan(evidenceGateIndex);
      expect(commitIndex, workflowPath).toBeGreaterThan(handoffGateIndex);
      expect(workflow, workflowPath).toContain("node scripts/git-push-retry.mjs");
      expect(workflow, workflowPath).not.toContain("git-auto-commit-action");
      expect(workflow, workflowPath).not.toMatch(/git push(?:\s|$)/);
      expect(workflow, workflowPath).not.toContain("--force");
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

  it("discovers dated specialist builder and quality decision reports", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-specialist-reports-"));
    const reports = {
      "docs/reviews/maplibre-v5-v6-compatibility-builder-evidence-2026-07-21.md": specialistReport(
        "builder",
        "2026-07-20T16:51:28Z",
      ),
      "docs/reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md": specialistReport(
        "quality",
        "2026-07-20T16:57:56Z",
      ),
    };

    for (const [path, content] of Object.entries(reports)) {
      const outputPath = join(root, path);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, content, "utf8");
    }

    expect(findLatestReport("builder", root)?.path).toContain("builder-evidence");
    expect(findLatestReport("quality", root)?.path).toContain("quality-decision");
  });

  it("selects the latest specialist report without a newer template masking it", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-specialist-selection-"));
    writeReport(
      root,
      "docs/research/competitor-updates-2026-W30-specialist.md",
      evidenceReport("product", "specialist", "2026-07-21T02:30:00Z"),
    );
    writeReport(
      root,
      "docs/research/competitor-updates-2026-W30-template.md",
      evidenceReport("product", "template", "2026-07-21T02:59:00Z"),
    );

    const selected = findLatestReport("product", root, { evidenceKind: "specialist" });
    expect(selected).toMatchObject({
      path: "docs/research/competitor-updates-2026-W30-specialist.md",
      evidenceKind: "specialist",
    });
    expect(collectSlaViolations(root, new Date("2026-07-21T03:00:00Z")).violations).not.toContainEqual(
      expect.objectContaining({ agent: "product" }),
    );
  });

  it("returns an actionable template-only diagnostic when no specialist report exists", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-template-diagnostic-"));
    writeReport(
      root,
      "docs/research/competitor-updates-2026-W30.md",
      evidenceReport("product", "template", "2026-07-21T02:59:00Z"),
    );

    expect(collectSlaViolations(root, new Date("2026-07-21T03:00:00Z")).violations).toContainEqual(
      expect.objectContaining({
        agent: "product",
        code: "EVIDENCE.TEMPLATE_NOT_SPECIALIST",
        action: expect.stringContaining("specialist"),
      }),
    );
  });

  it("uses specialist age for stale diagnostics even when a template is newer", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-stale-specialist-"));
    writeReport(
      root,
      "docs/research/competitor-updates-2026-W29-specialist.md",
      evidenceReport("product", "specialist", "2026-07-18T00:00:00Z"),
    );
    writeReport(
      root,
      "docs/research/competitor-updates-2026-W30-template.md",
      evidenceReport("product", "template", "2026-07-21T02:59:00Z"),
    );

    expect(collectSlaViolations(root, new Date("2026-07-21T03:00:00Z")).violations).toContainEqual(
      expect.objectContaining({
        agent: "product",
        code: "EVIDENCE.SPECIALIST_STALE",
        lastRun: "2026-07-18T00:00:00.000Z",
        action: expect.stringContaining("specialist"),
      }),
    );
  });

  it.each([
    {
      label: "missing",
      content: evidenceReport("product", "specialist", "2026-07-21T02:59:00Z").replace(
        "generated_at: 2026-07-21T02:59:00Z\n",
        "",
      ),
      code: "EVIDENCE.GENERATED_AT_MISSING",
    },
    {
      label: "invalid",
      content: evidenceReport("product", "specialist", "not-a-date"),
      code: "EVIDENCE.GENERATED_AT_INVALID",
    },
  ])("rejects $label specialist generated_at instead of using filesystem mtime", ({ content, code }) => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-invalid-specialist-time-"));
    writeReport(root, "docs/research/competitor-updates-2026-W30.md", content);
    const now = new Date("2026-07-21T03:00:00Z");

    expect(findLatestReport("product", root, { evidenceKind: "specialist", now })).toBeNull();
    expect(collectSlaViolations(root, now).violations).toContainEqual(
      expect.objectContaining({
        agent: "product",
        code,
        action: expect.stringContaining("generated_at"),
      }),
    );
  });

  it("allows five minutes of clock skew but rejects one millisecond beyond it", () => {
    const now = new Date("2026-07-21T03:00:00.000Z");
    const boundaryRoot = mkdtempSync(join(tmpdir(), "gis-engine-clock-skew-boundary-"));
    writeReport(
      boundaryRoot,
      "docs/research/competitor-updates-2026-W30.md",
      evidenceReport("product", "specialist", "2026-07-21T03:05:00.000Z"),
    );
    expect(collectSlaViolations(boundaryRoot, now).violations).not.toContainEqual(
      expect.objectContaining({ agent: "product" }),
    );

    const futureRoot = mkdtempSync(join(tmpdir(), "gis-engine-clock-skew-future-"));
    writeReport(
      futureRoot,
      "docs/research/competitor-updates-2026-W30.md",
      evidenceReport("product", "specialist", "2026-07-21T03:05:00.001Z"),
    );
    expect(collectSlaViolations(futureRoot, now).violations).toContainEqual(
      expect.objectContaining({
        agent: "product",
        code: "EVIDENCE.GENERATED_AT_FUTURE",
        action: expect.stringContaining("generated_at"),
      }),
    );
  });

  it("fails required HOC when specialist generated_at is invalid", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-hoc-invalid-specialist-time-"));
    writeReport(
      root,
      "docs/research/competitor-updates-2026-W30.md",
      evidenceReport("product", "specialist", "not-a-date"),
    );
    writeReport(
      root,
      "docs/planning/weekly-digest.md",
      evidenceReport("orchestrator", "specialist", "2026-07-21T02:59:00Z"),
    );

    const hocN1 = buildHandoffLedger(root, { generatedAt: new Date("2026-07-21T03:00:00Z") }).flows.find(
      (flow) => flow.id === "HOC-N1",
    );
    expect(hocN1).toMatchObject({
      status: "invalid-upstream",
      severity: "error",
      code: "EVIDENCE.GENERATED_AT_INVALID",
      action: expect.stringContaining("generated_at"),
      upstream: null,
    });
  });

  it.each([
    {
      label: "invalid",
      content: evidenceReport("product", "specialist", "not-a-date"),
      code: "EVIDENCE.GENERATED_AT_INVALID",
      artifactMtime: "2026-07-21T02:59:30Z",
    },
    {
      label: "future",
      content: evidenceReport("product", "specialist", "2026-07-21T03:05:00.001Z"),
      code: "EVIDENCE.GENERATED_AT_FUTURE",
      artifactMtime: null,
    },
  ])("does not fall back to older valid proof when the newest specialist is $label", ({
    content,
    code,
    artifactMtime,
  }) => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-newest-specialist-authority-"));
    const olderPath = "docs/research/competitor-updates-2026-W29-specialist.md";
    const newestPath = "docs/research/competitor-updates-2026-W30-specialist.md";
    writeReport(root, olderPath, evidenceReport("product", "specialist", "2026-07-21T02:30:00Z"));
    writeReport(root, newestPath, content);
    if (artifactMtime) {
      const mtime = new Date(artifactMtime);
      utimesSync(join(root, newestPath), mtime, mtime);
    }
    writeReport(
      root,
      "docs/planning/weekly-digest.md",
      evidenceReport("orchestrator", "specialist", "2026-07-21T03:00:00Z", [olderPath]),
    );
    const now = new Date("2026-07-21T03:00:00Z");

    expect(findLatestReport("product", root, { evidenceKind: "specialist", now })).toBeNull();
    expect(collectSlaViolations(root, now).violations).toContainEqual(
      expect.objectContaining({ agent: "product", code, severity: "critical" }),
    );
    const hocN1 = buildHandoffLedger(root, { generatedAt: now }).flows.find((flow) => flow.id === "HOC-N1");
    expect(hocN1).toMatchObject({
      status: "invalid-upstream",
      severity: "error",
      code,
      upstream: null,
    });
  });

  it("keeps a required HOC consumed when a newer template follows fresh specialist evidence", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-hoc-specialist-selection-"));
    const specialistPath = "docs/research/competitor-updates-2026-W30-specialist.md";
    writeReport(root, specialistPath, evidenceReport("product", "specialist", "2026-07-21T02:30:00Z"));
    writeReport(
      root,
      "docs/research/competitor-updates-2026-W30-template.md",
      evidenceReport("product", "template", "2026-07-21T02:59:00Z"),
    );
    writeReport(
      root,
      "docs/planning/weekly-digest.md",
      evidenceReport("orchestrator", "specialist", "2026-07-21T02:45:00Z", [specialistPath]),
    );

    const hocN1 = buildHandoffLedger(root, { generatedAt: new Date("2026-07-21T03:00:00Z") }).flows.find(
      (flow) => flow.id === "HOC-N1",
    );
    expect(hocN1).toMatchObject({
      status: "consumed",
      severity: "info",
      upstream: { path: specialistPath },
      latest_upstream_template: { path: "docs/research/competitor-updates-2026-W30-template.md" },
    });
  });

  it.each([
    { label: "missing", gateResultLine: "", code: "HOC.CONTRACT_FIELD_MISSING" },
    { label: "invalid", gateResultLine: "gate_result: green\n", code: "HOC.CONTRACT_FIELD_INVALID" },
  ])("fails HOC-N3 closed when gate_result is $label", ({ gateResultLine, code }) => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-hoc-n3-contract-"));
    const qualityPath = "docs/reviews/feature-quality-decision-2026-07-21.md";
    const quality = evidenceReport("quality", "specialist", "2026-07-21T02:30:00Z").replace(
      "evidence_kind: specialist\n",
      `${gateResultLine}evidence_kind: specialist\n`,
    );
    writeReport(root, qualityPath, quality);
    writeReport(
      root,
      "docs/planning/weekly-digest.md",
      evidenceReport("orchestrator", "specialist", "2026-07-21T02:45:00Z", [qualityPath]),
    );

    const hocN3 = buildHandoffLedger(root, { generatedAt: new Date("2026-07-21T03:00:00Z") }).flows.find(
      (flow) => flow.id === "HOC-N3",
    );
    expect(hocN3).toMatchObject({
      status: "invalid-upstream",
      severity: "error",
      code,
    });
    expect(hocN3?.note).toContain("gate_result");
  });

  it("does not consume HOC-N2 when builder contract fields are missing", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-hoc-n2-contract-"));
    const builderPath = "docs/reviews/feature-builder-evidence-2026-07-21.md";
    writeReport(root, builderPath, evidenceReport("builder", "specialist", "2026-07-21T02:30:00Z"));
    writeReport(
      root,
      "docs/reviews/feature-quality-decision-2026-07-21.md",
      evidenceReport("quality", "specialist", "2026-07-21T02:45:00Z", [builderPath]).replace(
        "evidence_kind: specialist\n",
        "gate_result: pass\nevidence_kind: specialist\n",
      ),
    );

    const hocN2 = buildHandoffLedger(root, { generatedAt: new Date("2026-07-21T03:00:00Z") }).flows.find(
      (flow) => flow.id === "HOC-N2",
    );
    expect(hocN2).toMatchObject({
      status: "invalid-upstream",
      severity: "warning",
      code: "HOC.CONTRACT_FIELD_MISSING",
    });
    expect(hocN2?.note).toMatch(/focus_area|feature|status/);
  });

  it("fails required HOC with stable actionable diagnostics for template-only or stale evidence", () => {
    const flow = {
      id: "HOC-N1",
      from: "product",
      to: "orchestrator",
      required: true,
      description: "competitor signals and priority recommendations",
    };
    const templateOnly = classifyFlow(flow, null, null, {
      upstreamDiagnostic: {
        code: "EVIDENCE.TEMPLATE_NOT_SPECIALIST",
        action: "@product must publish a specialist report",
      },
    });
    expect(templateOnly).toMatchObject({
      status: "invalid-upstream",
      severity: "error",
      code: "EVIDENCE.TEMPLATE_NOT_SPECIALIST",
      action: expect.stringContaining("specialist"),
    });

    const stale = classifyFlow(
      flow,
      {
        path: "docs/research/competitor-updates-2026-W29.md",
        generatedAt: new Date("2026-07-18T00:00:00Z"),
        evidenceKind: "specialist",
      },
      null,
      {
        upstreamDiagnostic: {
          code: "EVIDENCE.SPECIALIST_STALE",
          action: "@product must refresh specialist evidence",
        },
      },
    );
    expect(stale).toMatchObject({
      status: "invalid-upstream",
      severity: "error",
      code: "EVIDENCE.SPECIALIST_STALE",
      action: expect.stringContaining("refresh specialist"),
    });
  });
});

function writeReport(root: string, path: string, content: string): void {
  const outputPath = join(root, path);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, "utf8");
}

function extractWorkflowRunStep(workflow: string, stepName: string): string {
  const stepStart = workflow.indexOf(`      - name: ${stepName}`);
  if (stepStart < 0) throw new Error(`workflow step not found: ${stepName}`);
  const runMarker = "        run: |\n";
  const runStart = workflow.indexOf(runMarker, stepStart);
  if (runStart < 0) throw new Error(`workflow run block not found: ${stepName}`);
  const bodyStart = runStart + runMarker.length;
  const nextStep = workflow.indexOf("\n      - ", bodyStart);
  const body = workflow.slice(bodyStart, nextStep < 0 ? workflow.length : nextStep);
  return body
    .split("\n")
    .map((line) => (line.startsWith("          ") ? line.slice(10) : line))
    .join("\n");
}

function evidenceReport(
  agent: "orchestrator" | "product" | "quality" | "builder" | "docs",
  evidenceKind: "specialist" | "template",
  generatedAt: string,
  inputs = ["fixture"],
): string {
  return `---
agent: ${agent}
period: 2026-07-21
generated_at: ${generatedAt}
repo_revision: "fixture"
inputs:
${inputs.map((input) => `  - ${input}`).join("\n")}
owner: "@${agent}"
decision_level: ${evidenceKind === "template" ? "info" : agent === "quality" ? "blocking" : "advisory"}
${agent === "product" && evidenceKind === "specialist" ? "status: ready-for-planning\n" : ""}evidence_kind: ${evidenceKind}
---

# ${evidenceKind} evidence
`;
}

function specialistReport(agent: "builder" | "quality", generatedAt: string): string {
  return `---
agent: ${agent}
period: 2026-07-21
generated_at: ${generatedAt}
repo_revision: "fixture"
inputs:
  - fixture
owner: "@${agent}"
decision_level: ${agent === "quality" ? "blocking" : "advisory"}
evidence_kind: specialist
---

# Specialist evidence
`;
}
