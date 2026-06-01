---
title: Agent Report Index
description: Tracking and anomaly detection for all scheduled agent reports
generated_at: 2026-06-01T00:00:00Z
scope: "Week 2026-W23"
auto_generated: true
---

# Agent Report Index (Weekly Snapshot)

**Generated**: 2026-06-01  
**Scope**: GIS Engine multi-agent system weekly execution status  
**Purpose**: Automated tracking of all agent reports by period; anomaly detection and escalation

---

## 📊 Required Reports by Agent & Period

### Daily Agent: Code-Reviewer

| Period | Expected Report | File Pattern | Status | Last Update | Days Overdue | Alert |
|--------|-----------------|--------------|--------|-------------|-------------|-------|
| 2026-05-27 | Daily Audit | `daily-audit-2026-05-27.md` | ❌ MISSING | — | **5** | 🔴 **CRITICAL** |
| 2026-05-28 | Daily Audit | `daily-audit-2026-05-28.md` | ❌ MISSING | — | **4** | 🔴 **CRITICAL** |
| 2026-05-29 | Daily Audit | `daily-audit-2026-05-29.md` | ❌ MISSING | — | **3** | 🟡 **WARNING** |
| 2026-05-30 | Daily Audit | `daily-audit-2026-05-30.md` | ❌ MISSING | — | **2** | 🟡 **WARNING** |
| 2026-05-31 | Daily Audit | `daily-audit-2026-05-31.md` | ❌ MISSING | — | **1** | 🟡 **WARNING** |

**Analysis**: Code-reviewer has not produced any daily audits in the past 5 days. This is a P0 anomaly.

**Recommendation**: 
1. Verify that code-reviewer agent is configured and enabled
2. Check `.github/workflows/agent-daily.yml` is scheduled and running
3. If workflow is disabled, re-enable or trigger manually: `gh workflow run agent-daily.yml`

---

### Weekly Agent: Coordinator

| Period | Expected Report | File Pattern | Status | Last Update | Days Overdue | Alert |
|--------|-----------------|--------------|--------|-------------|-------------|-------|
| 2026-W20 | Weekly Digest | `weekly-digest.md` | ✅ EXISTS | 2026-05-20 | **12** | 🔴 **CRITICAL** |
| 2026-W21 | Weekly Digest | `weekly-digest.md` | ❌ MISSING | — | **21** | 🔴 **CRITICAL** |
| 2026-W22 | Weekly Digest | `weekly-digest.md` | ❌ MISSING | — | **14** | 🔴 **CRITICAL** |
| 2026-W23 | Weekly Digest | `weekly-digest.md` | ❌ MISSING | — | **4** | 🔴 **CRITICAL** |

**Analysis**: Coordinator has produced no weekly digest for 4+ weeks. Planning authority is not being exercised. This is blocking all strategic decisions.

**Recommendation**:
1. Verify coordinator is enabled and properly configured
2. Run manually: `node scripts/agent-runner.mjs coordinator --period 2026-W23`
3. If W21-W22 reports are needed for historical continuity, backfill: `node scripts/agent-runner.mjs coordinator --period 2026-W21 --backfill`

---

### Weekly Agent: Competitive-Intel

| Period | Expected Report | File Pattern | Status | Last Update | Days Overdue | Alert |
|--------|-----------------|--------------|--------|-------------|-------------|-------|
| 2026-W22 | Competitor Analysis | `competitor-updates-2026-W22.md` | ✅ EXISTS | 2026-05-23 | **9** | 🟡 **WARNING** |
| 2026-W23 | Competitor Analysis | `competitor-updates-2026-W23.md` | ❌ MISSING | — | **2** | 🟡 **WARNING** |

**Analysis**: Competitive-intel was active in W22 but missing for W23. May indicate a one-time skip or workflow scheduling issue.

**Recommendation**:
1. Schedule for next Monday (W24): `node scripts/agent-runner.mjs competitive-intel --period 2026-W24`
2. Or check if W23 report exists with a different file naming convention

---

### Weekly Agent: Product-Strategist

| Period | Expected Report | File Pattern | Status | Last Update | Days Overdue | Alert |
|--------|-----------------|--------------|--------|-------------|-------------|-------|
| 2026-05 | Monthly Roadmap | `monthly-roadmap.md` | ✅ EXISTS | 2026-05-31 | **1** | 🟢 OK |

**Analysis**: Latest roadmap update is current (as of May 31). Product-strategist is operating normally.

---

### Monthly Agent: Quality-Guardian Release Review

| Period | Expected Report | File Pattern | Status | Last Update | Days Overdue | Alert |
|--------|-----------------|--------------|--------|-------------|-------------|-------|
| 2026-06 | Release Readiness | `quality-gate-release-2026-06-01.md` | ❌ MISSING | — | **0** | 🟡 **DUE TODAY** |

**Analysis**: Release readiness review is due today (June 1). No report yet.

**Recommendation**:
1. Trigger now: `node scripts/agent-runner.mjs quality-guardian --period 2026-06 --scope release`

---

## 📋 Optional/Execution-Layer Reports

### Engine-Agent (Execution Layer)

| Task | Expected Report | File Pattern | Status | Last Update | Owner |
|------|-----------------|--------------|--------|-------------|-------|
| NLA-002 | Command Contract | `nla-002-generation-command-contract-2026-05-29.md` | ✅ EXISTS | 2026-05-29 | engine-agent |
| NLA-004 | Runtime Contract | `nla-004-runtime-*.md` | ❌ MISSING | — | engine-agent |

---

### AI-Agent (Execution Layer)

| Task | Expected Report | File Pattern | Status | Last Update | Owner |
|------|-----------------|--------------|--------|-------------|-------|
| NLA-003 | MCP Contract | `nla-003-mcp-orchestration-evidence-2026-05-29.md` | ✅ EXISTS | 2026-05-29 | ai-agent |

---

### QA-Agent (Execution Layer)

| Task | Expected Report | File Pattern | Status | Last Update | Owner |
|------|-----------------|--------------|--------|-------------|-------|
| NLA-006 | Visual Evidence | `qa-evidence-prompts-2026-05-30.md` | ✅ EXISTS | 2026-05-30 | qa-agent |

---

### Docs-Agent (Execution Layer)

| Task | Expected Report | File Pattern | Status | Last Update | Owner |
|------|-----------------|--------------|--------|-------------|-------|
| NLA-007 | Release Notes | `docs-audit-release-wording-2026-05-30.md` | ⚠️ PARTIAL | 2026-05-30 | docs-agent |

**Note**: Docs-agent produces output but rarely submits independent reports. Typically participates in other tasks' evidence.

**Recommendation**: Decide whether to:
- Activate docs-agent as fully reporting agent with weekly `docs-audit-{date}.md`
- Keep it in "participatory" mode, producing docs when tasks require them

---

## 🚨 Anomalies Detected

### 🔴 P0 Anomaly: Coordinator Reporting Chain Broken

**Symptom**: No weekly digest for 4 weeks (W20 → W23)

**Impact**:
- Planning authority has no voice
- No strategic decisions recorded
- Product roadmap approval missing
- Evolution metrics not being reviewed

**Root Cause Hypothesis**:
- `.github/workflows/agent-weekly.yml` may not be enabled or running
- Coordinator script may be failing silently
- Manual trigger not executed since W20

**Recovery Actions**:
1. Check if GitHub Actions weekly workflow is scheduled:
   ```bash
   gh api repos/{owner}/{repo}/actions/workflows -q '.workflows[] | select(.name | contains("weekly")) | {name, state}'
   ```
2. If disabled, re-enable:
   ```bash
   gh workflow enable agent-weekly.yml
   ```
3. Run manual backfill:
   ```bash
   node scripts/agent-runner.mjs coordinator --period 2026-W21 --backfill
   node scripts/agent-runner.mjs coordinator --period 2026-W22 --backfill
   node scripts/agent-runner.mjs coordinator --period 2026-W23
   ```
4. Review generated reports for accuracy
5. Commit to `docs/planning/` with message: "PLANNING: coordinator W21-W23 backfill and current digest"

**Owner**: @coordinator  
**Priority**: P0 - Planning Authority  
**Target Fix Date**: 2026-06-02

---

### 🔴 P0 Anomaly: Code-Reviewer Daily Audits Missing

**Symptom**: No daily audits for past 5 days (May 27-31)

**Impact**:
- Quality issues may not be detected before merge
- Security and architecture risks unchecked
- Merger gate (quality-guardian) has no code-reviewer input

**Root Cause Hypothesis**:
- `.github/workflows/agent-daily.yml` may not be scheduled or active
- code-reviewer agent disabled in runner config
- Syntax error in workflow preventing execution

**Recovery Actions**:
1. Check daily workflow status:
   ```bash
   gh workflow view agent-daily.yml --json status,enabled
   ```
2. Review recent workflow runs:
   ```bash
   gh run list --workflow agent-daily.yml --limit 10
   ```
3. If workflow is failing, check logs:
   ```bash
   gh run view --log <run-id>
   ```
4. Re-enable if disabled and manually trigger:
   ```bash
   gh workflow enable agent-daily.yml
   gh workflow run agent-daily.yml
   ```
5. Monitor next 3 daily executions to ensure stability

**Owner**: @code-reviewer  
**Priority**: P0 - Quality Gates  
**Target Fix Date**: 2026-06-01 (today)

---

### 🟡 P1 Anomaly: Evolution-Guardian Never Activated

**Symptom**: evolution-collector.mjs exists but evolution-ledger has no weekly snapshots since framework inception

**Impact**:
- D1-D6 metrics not being collected
- Self-calibration closed loop broken
- No data-driven rule adjustments
- Pattern library and pitfall library not growing

**Root Cause**:
- evolution-collector script exists but no CI job triggers it
- evolution-guardian (coordinator subset) role not yet assigned to any workflow
- No `.github/workflows/agent-evolution.yml` or evolution step in existing workflows

**Recovery Actions**:
1. Add evolution-collector step to `.github/workflows/agent-weekly.yml`:
   ```yaml
   - name: Collect Evolution Metrics
     run: node scripts/evolution-collector.mjs --period ${{ env.PERIOD }}
   - name: Upload evolution snapshot
     uses: actions/upload-artifact@v3
     with:
       name: evolution-snapshot
       path: docs/planning/evolution-snapshot-*.md
   ```
2. First run in dry-run mode to verify metrics collection:
   ```bash
   node scripts/evolution-collector.mjs --period 2026-W23 --dry-run
   ```
3. Review output for accuracy (D1-D6 calculations)
4. Enable for next week's execution

**Owner**: evolution-guardian (coordinator)  
**Priority**: P1 - Data-Driven Improvement  
**Target Start Date**: 2026-W24

---

### 🟡 P2 Anomaly: Docs-Agent Reporting Unclear

**Symptom**: Docs-agent defined in AGENTS.md but no regular independent reports

**Impact**:
- Documentation quality not systematically audited
- Release notes completeness not verified
- No signal whether docs meet public API contract

**Root Cause**:
- docs-agent is defined as execution owner but never scheduled as standalone agent
- Task-based participation only (docs-agent contributes to NLA-007, etc.)

**Decision Required**:
1. **Option A** (Activate): Make docs-agent a weekly reporting agent, schedule in `agent-weekly.yml`
2. **Option B** (Passive): Keep docs-agent in task-based mode, mark in AGENTS.md as "non-reporting"
3. **Option C** (Hybrid): Docs-agent reports monthly, coordinated with release cycles

**Owner**: @coordinator  
**Priority**: P2 - Process Clarity  
**Target Decision Date**: 2026-W23 coordinator digest

---

## 📈 Health Summary Table

### Governance Agents Status

| Agent | Expected Cadence | Last Report | Days Overdue | Status | Action |
|-------|------------------|-------------|-------------|--------|--------|
| coordinator | weekly | 2026-W20 | **12 days** | 🔴 CRITICAL | Immediate backfill + recovery |
| code-reviewer | daily | 2026-05-26 | **5 days** | 🔴 CRITICAL | Check workflow, trigger manual run |
| competitive-intel | weekly | 2026-W22 | **9 days** | 🟡 WARNING | Next run for W24 |
| product-strategist | monthly | 2026-05-31 | **1 day** | 🟢 OK | Due next month |
| quality-guardian | per-gate | 2026-05-31 | — | 🟢 OK | Release review due today |
| task-distributor | per-sprint | 2026-W23 | — | 🟢 OK | Serialized W23 plan ready |

### Data Flow Health

| Flow | Expected Freq | Last Status | Status | Action |
|------|---------------|------------|--------|--------|
| code-reviewer → quality-guardian | daily | broken (no code-reviewer reports) | 🔴 DOWN | Fix code-reviewer |
| competitive-intel → coordinator | weekly | broken (no coordinator digest) | 🔴 DOWN | Fix coordinator |
| all owners → task-distributor | per-sprint | healthy (W23 evidence complete) | 🟢 UP | Monitor |
| task-distributor → coordinator | per-sprint | broken (no coordinator review) | 🔴 DOWN | Fix coordinator |

**Overall System Health**: 🔴 **CRITICAL** — Two critical workflows (code-reviewer, coordinator) are offline.

---

## 🔧 Quick Actions for Today (2026-06-01)

### Immediate (Next 2 hours)

- [ ] Check if `.github/workflows/agent-daily.yml` and `.github/workflows/agent-weekly.yml` are enabled
  ```bash
  gh workflow list -q '.[] | {name: .name, state: .state}'
  ```
- [ ] If disabled, enable them:
  ```bash
  gh workflow enable agent-daily.yml
  gh workflow enable agent-weekly.yml
  ```
- [ ] Trigger manual runs for missing critical reports:
  ```bash
  node scripts/agent-runner.mjs code-reviewer --period 2026-06-01
  node scripts/agent-runner.mjs coordinator --period 2026-W23
  node scripts/agent-runner.mjs quality-guardian --period 2026-06 --scope release
  ```

### Short-term (Today)

- [ ] Review generated reports for accuracy
- [ ] If workflows are working again, commit and monitor next 3-5 cycles

### Medium-term (This Week)

- [ ] Backfill missing W21-W22 coordinator reports
- [ ] Verify GitHub Actions secrets and permissions are correct
- [ ] Document any issues found in `.github/workflows/` or agent-runner configuration

---

## 📅 Next Report Index Update

This index is auto-generated. Next update scheduled for:

- **Monday 2026-06-02 00:00 UTC** (weekly refresh)
- Or manually via: `pnpm run doc:generate --only report-index`

---

## Configuration Reference

To regenerate this report manually:

```bash
# Full refresh (scans all agents, all periods)
node scripts/doc-generator.mjs --report-index

# Specific period
node scripts/doc-generator.mjs --report-index --period 2026-W23

# With anomaly detection (red flags missing reports)
node scripts/doc-generator.mjs --report-index --anomalies
```

---

**Generated by**: doc-generator.mjs  
**Last Generated**: 2026-06-01T00:00:00Z  
**Maintainer**: @coordinator  
**Review Frequency**: Weekly  
**Critical Issues Contact**: @coordinator
