# Documentation Map

The code and tests define behavior. These pages record intent, boundaries, and current evidence.

## Run

```bash
pnpm docs:dev
pnpm test:docs
pnpm docs:links
```

## Core Map

- [Project intent](intent/project-definition.md)
- [Architecture decision](architecture/core-framework.md)
- [Contracts](spec/contracts-and-interfaces.md)
- [Resource policy context](engineering/ci-test-strategy.md)
- [Release boundaries](engineering/release-wording-guardrails.md)
- [Migration index](migration/README.md)

## Generated Docs

- [API reference](website/api/reference)
- [Feature matrix](engineering/supported-feature-matrix.md)
- [Link audit](reviews/doc-link-audit.md)
- [Issue snapshot](planning/issues-snapshot.md)

## Current Work

- [Scope and next steps](planning/next-step-plan.md)
- [Competitor analysis, checked 2026-09-26](research/competitor-updates-2026-W39.md)
- [Operating rules](../AGENTS.md)

PR CI owns routine verification. Supplementary checks use the manual
[Agent Review](../.github/workflows/agent-review.yml) workflow. Planning reports,
[handoff audits](planning/agent-handoff-contracts.md) and evolution tools are
on-demand; dated dashboards and [review records](reviews/REPORT_INDEX.md) are
historical evidence, not a live health service.

Historical prose lives in Git history. Do not recreate an in-tree archive.
