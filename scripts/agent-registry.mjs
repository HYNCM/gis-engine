import { join } from "node:path";

export const AGENT_REGISTRY = {
  orchestrator: {
    role: "chief planning, orchestration, and task decomposition agent",
    period: "weekly",
    cadence: "weekly",
    modelPolicy: {
      tier: "frontier-planning",
      reasoningEffort: "high",
      routingNote:
        "Use for cross-agent conflict resolution, roadmap tradeoffs, Go/No-go planning state, and GitHub Issue creation.",
    },
    outputDir: "docs/planning",
    outputFile: "weekly-digest.md",
    reportSearch: [{ dir: "docs/planning", pattern: /^weekly-digest\.md$/ }],
    gates: [],
    gateDecisionLevel: "advisory",
    slaMaxHours: 48,
  },
  product: {
    role: "evidence-first competitor analyst, roadmap owner, and feature-priority driver",
    period: "weekly",
    cadence: "weekly",
    modelPolicy: {
      tier: "frontier-research",
      reasoningEffort: "high",
      routingNote:
        "Use when dated external releases, standards, or dependency changes can alter roadmap priority.",
    },
    outputDir: (period) =>
      /^\d{4}-\d{2}$/.test(period) ? "docs/planning" : "docs/research",
    outputFile: (period) =>
      /^\d{4}-\d{2}$/.test(period)
        ? "monthly-roadmap.md"
        : `competitor-updates-${period}.md`,
    reportSearch: [
      { dir: "docs/research", pattern: /^competitor-updates-.*\.md$/ },
    ],
    gates: [],
    gateDecisionLevel: "advisory",
    slaMaxHours: 48,
  },
  quality: {
    role: "unified design reviewer and deterministic gate keeper",
    period: "daily",
    cadence: "daily",
    modelPolicy: {
      tier: "frontier-quality",
      reasoningEffort: "high",
      routingNote:
        "Use for blocking merge/release gate decisions, architecture review, and waiver review.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `quality-gate-${period}.md`,
    reportSearch: [{ dir: "docs/reviews", pattern: /^quality-gate-.*\.md$/ }],
    gates: [
      "pnpm build:schema",
      "pnpm check",
      "pnpm test:snapshot:smoke",
      "pnpm test:release:scene3d",
    ],
    gateDecisionLevel: "blocking",
    slaMaxHours: 24,
  },
  builder: {
    role: "implementation agent with focus areas: engine, ai, adapter, qa",
    period: "ad-hoc",
    cadence: "ad-hoc",
    modelPolicy: {
      tier: "coding-implementation",
      reasoningEffort: "medium",
      routingNote:
        "Use for bounded implementation slices with schema, MCP, adapter, or diagnostic implications.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `builder-evidence-${period}.md`,
    reportSearch: [
      { dir: "docs/reviews", pattern: /^builder-evidence-.*\.md$/ },
    ],
    gates: ["pnpm build:schema", "pnpm check", "pnpm test"],
    gateDecisionLevel: "advisory",
    slaMaxHours: null,
  },
  docs: {
    role: "documentation ledger, release notes, public status alignment",
    period: "daily",
    cadence: "daily",
    modelPolicy: {
      tier: "efficient-docs",
      reasoningEffort: "low",
      routingNote:
        "Use for documentation consistency, link audits, release-note alignment after evidence exists.",
    },
    outputDir: "docs/reviews",
    outputFile: (period) => `documentation-audit-${period}.md`,
    reportSearch: [
      { dir: "docs/reviews", pattern: /^documentation-audit-.*\.md$/ },
    ],
    gates: ["pnpm test:docs", "node scripts/doc-generator.mjs links"],
    gateDecisionLevel: "advisory",
    slaMaxHours: 48,
  },
  "evolution-guardian": {
    role: "self-evolving ecosystem metrics collector (orchestrator subset)",
    period: "weekly",
    cadence: "weekly",
    reportAgent: "orchestrator",
    owner: "@orchestrator (evolution-guardian)",
    modelPolicy: {
      tier: "frontier-planning",
      reasoningEffort: "medium",
      routingNote:
        "Use for monthly evolution reviews: analyzing 4-week metric trends, auto-suggesting rule adjustments, calibrating estimation baselines and decision weights.",
    },
    outputDir: "docs/planning",
    outputFile: (period) => `evolution-review-${period}.md`,
    reportSearch: [
      { dir: "docs/planning", pattern: /^evolution-review-.*\.md$/ },
    ],
    gates: [],
    gateDecisionLevel: "advisory",
    slaMaxHours: null,
    healthRequired: false,
  },
};

export const LEGACY_AGENT_ALIASES = {
  coordinator: "orchestrator",
  "task-distributor": "orchestrator",
  "competitive-intel": "product",
  "product-strategist": "product",
  "code-reviewer": "quality",
  "quality-guardian": "quality",
  "engine-agent": "builder",
  "ai-agent": "builder",
  "adapter-agent": "builder",
  "qa-agent": "builder",
  "docs-agent": "docs",
};

export const HANDOFF_FLOWS = [
  {
    id: "HOC-N1",
    from: "product",
    to: "orchestrator",
    required: true,
    description: "competitor signals and priority recommendations",
  },
  {
    id: "HOC-N2",
    from: "builder",
    to: "quality",
    required: false,
    description: "implementation evidence and test results",
  },
  {
    id: "HOC-N3",
    from: "quality",
    to: "orchestrator",
    required: true,
    description: "gate pass/block and release readiness",
  },
];

export function listAgentNames() {
  return Object.keys(AGENT_REGISTRY);
}

export function resolveAgentName(name) {
  return LEGACY_AGENT_ALIASES[name] ?? name;
}

export function getAgentOutput(agentDef, period) {
  const outputDir =
    typeof agentDef.outputDir === "function"
      ? agentDef.outputDir(period)
      : agentDef.outputDir;
  const outputFile =
    typeof agentDef.outputFile === "function"
      ? agentDef.outputFile(period)
      : agentDef.outputFile;
  return { outputDir, outputFile };
}

export function getAgentOutputPath(root, agentDef, period) {
  const { outputDir, outputFile } = getAgentOutput(agentDef, period);
  return join(root, outputDir, outputFile);
}
