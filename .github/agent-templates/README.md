# Optional Report Templates

Use `node scripts/agent-runner.mjs <role> --dry-run` when a report scaffold is
useful. The runner does not invoke a specialist or make a product decision.
There is no scheduled report-production pipeline.

Every report keeps the front matter in [AGENTS.md](../../AGENTS.md): agent,
period, generated_at, repo_revision, inputs, owner and decision_level. Generated
reports declare `evidence_kind: template`. Model-policy metadata is routing
advice, never evidence. Do not relabel a template without doing the actual review.

Keep reports proportional to the decision:

| Role | Required substance |
| --- | --- |
| product | Dated official sources, facts vs inference, scope and priority recommendation |
| builder | Changed behavior, exact revision/test results, resource/MCP impact, limitations |
| quality | Findings, applicable gates, pass/block/waiver and its basis |
| orchestrator | Evidence consumed, decision, owner and next artifact |
| docs | Public behavior alignment and unresolved discrepancies |

Each recommendation needs evidence, impact, owner/action and confidence. Actual
agent-to-agent handoffs follow [HOC-N1/N2/N3](../../docs/planning/agent-handoff-contracts.md).
A PR review normally belongs in the PR, not another dated markdown report.

For an explicit planning audit, `node scripts/planning-evidence.mjs` generates
issue/HOC/dashboard snapshots from one evidence run. Authentication failure must
preserve valid previous snapshots. Historical reports are not current health.
The manual [Agent Review](../workflows/agent-review.yml) uploads raw check logs;
its selected checks are not a specialist approval or a complete release gate.
