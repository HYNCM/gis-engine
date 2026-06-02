---
title: Agent Handoff Contract Standard Library
description: Explicit protocols defining data, validation, and responsibility boundaries between GIS Engine agents
version: 2.0
last_updated: 2026-06-03
owner: "@orchestrator"
---

# Agent Handoff Contract Standard Library

This document defines the explicit, machine-verifiable "handoff contracts" between agents in the GIS Engine multi-agent system. Each contract specifies:

- **What data must be handed off** (YAML front-matter, evidence, artifacts)
- **How it is validated** (gate conditions)
- **What the downstream agent must/must-not do**
- **What can block or escalate** (diagnostic codes)

Every agent-to-agent data flow must be covered by a contract. Violations of contract requirements are blocking issues and must be escalated to `@orchestrator`.

> **v2.0 (2026-06-03)**: Simplified from 6 contracts to 3 after agent consolidation (11→5 agents).

---

## HOC-N1: @product → @orchestrator (Competitor Signals + Priority Recommendations)

**Trigger**: `@product` publishes weekly competitor update and scorecard refresh.

**From**: `@product`
**To**: `@orchestrator`
**Handoff Type**: Strategic Input

### Required Handoff Data

**Front-matter** (mandatory):
```yaml
agent: product
period: YYYY-Www
generated_at: ISO-8601
repo_revision: git SHA
decision_level: advisory | blocking
status: ready-for-planning | requires-escalation
```

**Artifacts** (all must exist):
1. `docs/research/competitor-updates-{week}.md` — with dated evidence and source URLs
2. `docs/research/capability-scorecard.md` — with W-over-W score deltas and evidence notes
3. Priority-ranked recommendations with short justifications

### Validation Gate

**Gate condition**: All claims must have dated source URLs from approved default sources.

**Pass condition**: Scorecard refreshed within 7 days; competitor report has ≥1 verified external signal.

**Fail condition** (blocks planning): Report contains unsourced claims; scorecard stale >14 days.

### Downstream Agent Responsibilities

**@orchestrator must do**: Feed priority recommendations into sprint planning; merge with @quality gate decisions.

**@orchestrator cannot do**: Treat unsourced competitor claims as factual input.

### Blocker Diagnostic Codes

| Code | Severity | Meaning |
|------|----------|---------|
| `PRODUCT.UNSOURCED_CLAIM` | Blocking | Competitor claim lacks dated source URL |
| `PRODUCT.STALE_SCORECARD` | Blocking | Scorecard not refreshed in 14+ days |
| `PRODUCT.PRIORITY_NO_JUSTIFICATION` | Advisory | Priority score missing justification |

---

## HOC-N2: @builder → @quality (Implementation Evidence + Test Results)

**Trigger**: `@builder` completes implementation in any focus area (engine/ai/adapter/qa).

**From**: `@builder`
**To**: `@quality`
**Handoff Type**: Implementation Evidence

### Required Handoff Data

**Front-matter** (mandatory):
```yaml
agent: builder
focus_area: engine | ai | adapter | qa
feature: feature-id
generated_at: ISO-8601
repo_revision: git SHA
decision_level: advisory
status: ready-for-review | blocked
```

**Artifacts** (must all exist):
1. Changed source files with passing build
2. Test results: `pnpm test` output (or focused test suite)
3. Evidence summary in PR description covering: what changed, test coverage, resource/MCP implications, known limitations

### Validation Gate

```bash
pnpm build:schema  # when schema changes
pnpm check
pnpm test  # or focused test suite
```

**Pass condition**: Build passes, tests pass, no type widening to `any`.

**Fail condition**: Build or test failure; missing diagnostics for error paths.

### Downstream Agent Responsibilities

**@quality must do**: Run review checklist + gate tests; issue pass/block decision as PR comment.

**@quality cannot do**: Modify implementation code; skip gates for convenience.

### Blocker Diagnostic Codes

| Code | Severity | Meaning |
|------|----------|---------|
| `BUILD.SCHEMA_SYNC_DRIFT` | Blocking | Schema build output out of sync with TypeBox source |
| `TEST.COVERAGE_GAP` | Advisory | Changed behavior missing test coverage |
| `RESOURCE.POLICY_UNCHECKED` | Blocking | URL/tile/worker change without resource policy check |
| `MCP.CONTRACT_BREACH` | Blocking | AI tool name/schema changed without update |

---

## HOC-N3: @quality → @orchestrator (Gate Pass/Block + Release Readiness)

**Trigger**: `@quality` completes review + gate evaluation on a PR or release candidate.

**From**: `@quality`
**To**: `@orchestrator`
**Handoff Type**: Gate Decision

### Required Handoff Data

**Front-matter** (mandatory):
```yaml
agent: quality
generated_at: ISO-8601
repo_revision: git SHA
decision_level: blocking | advisory | info
gate_result: pass | conditional-pass | block | waiver
```

**Artifacts** (all must exist):
1. Review checklist results (8 areas)
2. Gate test output
3. Decision summary with diagnostic codes for any blocks

### Validation Gate

All applicable gates from the required gates table in AGENTS.md.

**Pass condition**: All required gates pass; all checklist areas pass.

**Block condition**: Any required gate fails; blocking checklist violation.

**Waiver condition**: Visual snapshot waived only for non-rendering changes.

### Downstream Agent Responsibilities

**@orchestrator must do**: Accept gate decision; if pass, update planning state; if block, create follow-up GitHub Issues.

**@orchestrator cannot do**: Override a blocking gate decision without documented justification.

### Blocker Diagnostic Codes

| Code | Severity | Meaning |
|------|----------|---------|
| `GATE.SCHEMA_BUILD_FAIL` | Blocking | Schema build failed |
| `GATE.CHECK_FAIL` | Blocking | `pnpm check` failed |
| `GATE.VISUAL_SNAPSHOT_FAIL` | Blocking (release) | Visual snapshot divergence without waiver |
| `GATE.RESOURCE_POLICY_FAIL` | Blocking | Resource policy check failed |
| `GATE.EMERGENCY_BYPASS` | Conditional | Emergency bypass with documented follow-up tasks |

---

## Summary Table

| HOC ID | From | To | Trigger | Key Gate |
|--------|------|----|---------|-----------|
| HOC-N1 | @product | @orchestrator | Weekly competitor update | Sourced claims, fresh scorecard |
| HOC-N2 | @builder | @quality | Implementation complete | `pnpm build:schema && pnpm check && pnpm test` |
| HOC-N3 | @quality | @orchestrator | Gate evaluation complete | All required gates |

---

**Last Updated**: 2026-06-03  
**Owner**: @orchestrator  
**Review Cadence**: Monthly  
**Version**: 2.0
