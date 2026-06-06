---
agent: docs
period: 2026-06-04
generated_at: 2026-06-04T02:18:43Z
repo_revision: "6d49960cefbd92558b2f74bd11328ac4e8a0d458"
inputs:
  - AGENTS.md
  - packages/cli/README.md
  - docs/README.md
  - docs/reviews/REPORT_INDEX.md
  - docs/reviews/doc-link-audit.md (deleted — 5-line stub removed during 2026-06-06 audit)
  - docs/planning/AGENT_HEALTH_DASHBOARD.md
  - scripts/doc-generator.mjs
  - scripts/dashboard-generator.mjs
owner: "@docs"
decision_level: info
---

# Documentation Audit: 2026-06-04

## Summary

This pass brought the CLI package docs back in sync with the new interactive
`app` template and corrected the prompt-hash wording to match the current
generate pipeline. The link audit stayed green, and the agent health dashboard
was refreshed to today's repo state.

## Findings

### 1. CLI package docs lagged the current app template

- Evidence: `packages/cli/README.md` still listed only `static-html`,
  `vite-ts`, and `mapspec`, and the generate-pipeline docs did not mention
  `--template app`.
- Impact: readers could not discover the new interactive scaffold path from
  the package docs.
- Action: update the template list, add an `app` section, and document
  `--generate -t app` as the scaffolded generate path.
- Confidence: high.

### 2. Prompt-hash docs were stale

- Evidence: the README said the raw prompt retention used a 16-character hex
  prefix, but the implementation returns `sha256:<32-hex>`.
- Impact: the output contract was described incorrectly and could confuse
  downstream auditors.
- Action: align the README examples and schema wording with the actual hash
  format.
- Confidence: high.

### 3. Cross-reference integrity is clean

- Evidence: `docs/reviews/doc-link-audit.md` (deleted — 5-line stub removed during 2026-06-06 audit) previously reported that all document
  references are complete.
- Impact: no broken-link cleanup is needed from this pass.
- Action: keep the generated link audit as the current reference artifact.
- Confidence: high.

### 4. Dashboard freshness is current, but planning handoffs still lag

- Evidence: the regenerated `docs/planning/AGENT_HEALTH_DASHBOARD.md` still
  shows two handoff anomalies because the orchestrator digest is older than the
  latest product and quality reports.
- Impact: documentation is healthy, but the planning cadence still needs a new
  weekly digest to clear the dashboard warnings.
- Action: refresh the orchestrator/product reports when the weekly cadence
  resumes.
- Confidence: medium-high.

## Actions Completed

- Updated `packages/cli/README.md` to document the `app` template, the
  `--generate -t app` path, and the current `sha256:<32-hex>` prompt-hash
  format.
- Regenerated `docs/planning/AGENT_HEALTH_DASHBOARD.md` from the current repo
  state.

## Validation

- `node scripts/doc-generator.mjs links` — passed.
- `pnpm test:docs` — passed.
- `pnpm test:cli` — passed.
- `node scripts/dashboard-generator.mjs --period 2026-06-04` — passed.
