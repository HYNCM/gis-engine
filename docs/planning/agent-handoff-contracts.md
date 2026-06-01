---
title: Agent Handoff Contract Standard Library
description: Explicit protocols defining data, validation, and responsibility boundaries between GIS Engine agents
version: 1.0
last_updated: 2026-06-01
owner: "@coordinator"
---

# Agent Handoff Contract Standard Library

This document defines the explicit, machine-verifiable "handoff contracts" between agents in the GIS Engine multi-agent system. Each contract specifies:

- **What data must be handed off** (YAML front-matter, evidence, artifacts)
- **How it is validated** (gate conditions)
- **What the downstream agent must/must-not do**
- **What can block or escalate** (diagnostic codes)

Every agent-to-agent data flow must be covered by a contract. Violations of contract requirements are blocking issues and must be escalated to `@coordinator`.

---

## HOC-001: Adapter-Agent → QA-Agent (3D Evidence Handoff)

**Trigger**: `@adapter-agent` completes SceneView3D or other 3D adapter implementation

**From**: `@adapter-agent`  
**To**: `@qa-agent`  
**Handoff Type**: Capability Evidence  

### Required Handoff Data

**Front-matter** (mandatory):
```yaml
agent: adapter-agent
feature: scene3d-v1  # or specific 3D capability name
capability_type: renderer-adapter
evidence_type: adapter-local
generated_at: ISO-8601 timestamp
repo_revision: git SHA
decision_level: info | advisory
status: ready-for-visual | ready-for-qa-review | blocked
handoff_readiness: yes | no
```

**Artifacts** (must all exist):
1. **Adapter implementation**: `packages/scene3d-three-adapter/src/**/*.ts` (compiled and passing build)
2. **Adapter tests**: 
   - `packages/scene3d-three-adapter/tests/adapter-*.test.ts` (>80% code coverage)
   - `packages/scene3d-three-adapter/tests/adapter-*.snapshot` (deterministic snapshots)
3. **Adapter evidence report**: `docs/reviews/adapter-evidence-{feature}-{date}.md` containing:
   - Lifecycle and load diagnostics summary
   - Mock snapshot output (before real renderer)
   - Any resource policy changes introduced
   - Known limitations or visual gaps vs. spec

**Report structure**:
```markdown
# Adapter Evidence: SceneView3D v1 (2026-06-01)

## Adapter Implementation Status
- [x] Renderer lifecycle implemented and tested
- [x] Layer/source adapters for MapSpec extensions
- [x] Error diagnostics with structured codes
- [ ] Three.js integration complete (mock passes)

## Mock Snapshot Results
```
packages/scene3d-three-adapter/tests/scene-sphere.snapshot
✓ sphere geometry rendered
✓ camera controls functional
✓ diagnostics emitted correctly
```

## Resource Policy Audit
- [x] No new external URLs introduced
- [x] Three.js version pinned (no drift from package.json)
- [x] Worker threads (if used) securely scoped

## Visual Readiness Assessment
- Adapter loads successfully: YES
- Mock snapshot matches spec: YES (see packages/scene3d-three-adapter/tests/*)
- Ready for real-world browser visual testing: YES / NO
  - Reason if NO: "mock snapshots only, real renderer visual evidence needed"

## Known Limitations
- Terrain rendering not yet implemented (P1 for v1.1)
- Shadow quality lower than 2D in certain angles (expected for MVP)
```

### Validation Gate

**Gate command**:
```bash
pnpm test:adapter:scene3d --snapshot
pnpm test:adapter:resource-policy
```

**Pass condition**:
- All adapter tests pass
- All snapshots deterministic (no flakiness over 3 runs)
- Resource policy checks pass
- Front-matter `handoff_readiness: yes`

**Fail condition** (blocks downstream):
- Tests fail
- Resource policy violations detected
- Evidence report missing or incomplete
- Front-matter `status: blocked`

### Downstream Agent Responsibilities

**QA-Agent must do**:
1. Read adapter evidence report completely
2. Verify that adapter-local snapshot matches expected behavior
3. Schedule and execute real-world browser visual testing with the adapter
4. Document whether real renderer output matches mock or has discrepancies
5. If visual discrepancies found, open issue with diagnostic codes (e.g., `SCENE3D.VISUAL_MISMATCH`)

**QA-Agent cannot do**:
- Modify or refactor adapter code (that's adapter-agent's scope)
- Promise stable 3D support without real visual evidence
- Skip visual testing with a claim that "mock is good enough"
- Change renderer selection or adapter configuration

**QA-Agent may do**:
- Request mock snapshot refinement via GitHub issue (adapter-agent owns the fix)
- Suggest performance optimizations in browser context
- Recommend unit test additions for edge cases found during visual testing

### Blocker Diagnostic Codes

| Code | Severity | Meaning | Resolution |
|------|----------|---------|------------|
| `SCENE3D.ADAPTER_LOAD_FAILURE` | Blocking | Adapter fails to initialize | adapter-agent fixes, resubmits |
| `SCENE3D.ADAPTER_SNAPSHOT_FLAKY` | Blocking | Mock snapshots non-deterministic | adapter-agent stabilizes, resubmits |
| `SCENE3D.RESOURCE_POLICY_VIOLATION` | Blocking | Adapter violates URL/tile/worker policy | adapter-agent remediates, resubmits |
| `SCENE3D.VISUAL_MISMATCH` | Blocking (for stable promotion) | Real renderer output ≠ mock | coordinate fix or update spec |
| `SCENE3D.VISUAL_EVIDENCE_MISSING` | Blocking (for promotion to beta) | No real-world browser testing done | qa-agent produces evidence |

### Escalation Path

If `@qa-agent` cannot produce visual evidence or encounters `SCENE3D.VISUAL_MISMATCH`:
1. Open GitHub issue with label `agent-escalation`, tag `@adapter-agent` and `@coordinator`
2. Issue must contain:
   - Visual diff (before/after screenshots)
   - Diagnostic code from above table
   - Recommendation (fix, waive, or defer)
3. `@coordinator` reviews and decides: proceed to next gate, request fixes, or defer feature

---

## HOC-002: Engine-Agent → AI-Agent (Schema-to-MCP Wrapper)

**Trigger**: `@engine-agent` completes public schema or command definition affecting AI operability

**From**: `@engine-agent`  
**To**: `@ai-agent`  
**Handoff Type**: Contract Extension  

### Required Handoff Data

**Front-matter**:
```yaml
agent: engine-agent
schema_name: MapGenerationRequestSchema | MapSpec | Command | Diagnostic
schema_version: SEMVER
generated_at: ISO-8601
repo_revision: git SHA
decision_level: advisory
status: ready-for-mcp-wrapping | requires-revision
breaking_change: yes | no
```

**Artifacts**:
1. **Schema definition**: `packages/engine/src/schema/**/*.ts` (TypeBox schema with JSDoc)
2. **Schema build output**: `packages/engine/src/schema/**/*.json` (JSON schema, generated via `pnpm build:schema`)
3. **Validator implementation**: `packages/engine/src/validate/**/*.ts` with before/after command examples
4. **Engine handoff report**: `docs/reviews/engine-contract-{schema_name}-{date}.md` containing:
   ```markdown
   # Engine Contract: MapGenerationRequestSchema (2026-06-01)
   
   ## Schema Definition
   - File: packages/engine/src/schema/map-generation-request.ts
   - Version: 1.0.0
   - Stability: stable | beta | experimental
   
   ## JSON Schema Output
   ```json
   {
     "$schema": "http://json-schema.org/draft-07/schema#",
     "title": "MapGenerationRequestSchema",
     "type": "object",
     "properties": {
       "map_style": { "type": "string", "enum": ["vector", "raster"] },
       "layers": { "type": "array" }
     }
   }
   ```
   
   ## AI Operability Assessment
   - Schema clarity (human-readable descriptions): HIGH
   - Deterministic validation (no ambiguity in required vs. optional): YES
   - Diagnostic paths for all error cases: YES (see validators)
   - Example valid/invalid payloads provided: YES (see tests/)
   
   ## Breaking Changes
   - None (backward compatible with MapSpec v0.1)
   OR
   - YES: removed `layer_group` field (deprecated since v0.9, see CHANGELOG)
     Migration path: rename to `layer_set` in client code
   
   ## Readiness for MCP Wrapping
   - Can ai-agent directly reference this schema in MCP input? YES
   - Does schema have external dependencies that complicate MCP? NO
   - Are there any schema version pins or conflicts? NO
   ```

### Validation Gate

**Gate command**:
```bash
pnpm build:schema
pnpm test:schema:contract
pnpm test:schema:validator
```

**Pass condition**:
- Schema TypeScript compiles without errors
- JSON schema generated and validates against meta-schema
- All validator tests pass (both positive and negative cases)
- No breaking changes without documented migration path
- Report includes example MCP usage (in ai-agent notes section)

**Fail condition**:
- Schema build fails
- Validator tests fail
- Breaking change without migration guidance

### Downstream Agent Responsibilities

**AI-Agent must do**:
1. Review engine contract report
2. Create MCP input/output schemas that wrap or extend the engine schema
3. Ensure MCP schema versions are pinned to corresponding engine schema versions
4. Test end-to-end: engine validators → MCP tool call → command execution
5. Document any schema mapping or transformation logic in `packages/ai/src/mcp-tools/*.ts`

**AI-Agent cannot do**:
- Invent new schema variations for "AI convenience" (use the engine schema as-is)
- Create undocumented tool names (every MCP tool must reference an engine schema)
- Omit output schema (every tool must declare its success/error response shape)

**AI-Agent may do**:
- Suggest clarifications to engine schema descriptions
- Request additional diagnostic codes for AI-specific error cases
- Propose schema versioning strategy if not yet defined

### Blocker Diagnostic Codes

| Code | Severity | Meaning | Resolution |
|------|----------|---------|------------|
| `SCHEMA.VALIDATOR_FAILURE` | Blocking | Validator test fails | engine-agent fixes |
| `SCHEMA.BREAKING_CHANGE_UNDOCUMENTED` | Blocking | Breaking change without migration guide | engine-agent documents |
| `MCP.SCHEMA_MISMATCH` | Blocking | MCP schema incompatible with engine | ai-agent or engine-agent fixes |
| `MCP.OUTPUT_SCHEMA_MISSING` | Blocking | MCP tool has no declared output schema | ai-agent adds schema |

### Escalation Path

If schema handoff causes MCP contract violations:
1. Open issue: `agent-escalation`, `mcp-contract-failure`
2. Include: schema diff, validator output, MCP tool attempt
3. `@code-reviewer` and `@ai-agent` coordinate fix
4. `@coordinator` approves final decision

---

## HOC-003: Code-Reviewer → Quality-Guardian (Review Findings)

**Trigger**: `@code-reviewer` completes daily audit or PR review

**From**: `@code-reviewer`  
**To**: `@quality-guardian`  
**Handoff Type**: Risk Attestation  

### Required Handoff Data

**Front-matter**:
```yaml
agent: code-reviewer
period: YYYY-MM-DD
scope: "last-24h-commits" | "pull-request-#{pr}" | "diff-range-{sha}..{sha}"
generated_at: ISO-8601
repo_revision: git SHA
decision_level: blocking | advisory | info
findings_count: N
blocker_count: M
```

**Artifacts**:
1. **Daily audit report** or **PR review comment**: `docs/reviews/daily-audit-{date}.md` or in-PR review with comment structure
2. **Finding format** (all findings must follow this structure):
   ```markdown
   ### [P{1|2|3}] {Short finding title}
   
   - **Evidence**: {file}:{line}, {commit SHA}, {test output}, or {PR link}
   - **Category**: architecture | security | test-coverage | resource-policy | ai-operability | performance | docs
   - **Impact**: {user-facing impact | product-risk | architecture-risk}
   - **Required action**: {specific fix or decision needed}
   - **Blocker code** (if blocking): {CODE_NAME}
   - **Confidence**: high | medium | low
   - **Reviewed by**: @code-reviewer signature or PR comment permalink
   ```

3. **Checklist results** (one of 8 mandatory checks):
   ```
   ## Code Review Checklist Results
   
   - [ ] Architecture & Public Contract: changes follow schema-first, adapter boundaries
   - [ ] AI Operability: APIs data-driven, deterministic, auditable, replayable
   - [ ] Commands & Mutations: all state changes go through command system with validation
   - [ ] Diagnostics: errors use structured diagnostic codes and file paths
   - [ ] Tests: behavior changes covered by schema/command/adapter/ai/snapshot tests
   - [ ] Docs & Examples: public API changes have docs and runnable examples
   - [ ] Security & Resource Policy: network/resource access explicit and policy-checked
   - [ ] TypeScript: `pnpm check` passes without type widening to `any`
   
   Summary: {X}/{8} checks passed
   Blockers: {blockers}
   ```

### Validation Gate

**Pre-gate (before code-reviewer submits)**:
```bash
pnpm check
pnpm test:schema:contract
pnpm build:schema
```

**Gate**: quality-guardian reads findings and decides whether to:
- ✅ **Pass**: all blockers resolved or explicitly waived
- ❌ **Block**: blockers unresolved, must fix before merge
- ⚠️ **Advisory**: non-blocking findings, ok to merge with acknowledgment

### Downstream Agent Responsibilities

**Quality-Guardian must do**:
1. Read all findings in code-reviewer report
2. For each blocker code, verify whether it is a deterministic gate failure or a design judgment
3. If design judgment (e.g., "should we allow breaking change?"), escalate to `@coordinator`
4. If deterministic (e.g., "test failed"), reproduce locally or in CI
5. Issue final decision: `PASS`, `BLOCK`, or `EMERGENCY_WAIVER`

**Quality-Guardian cannot do**:
- Ignore code-reviewer findings and auto-pass
- Override architecture or resource-policy decisions without coordinator approval
- Waive tests or diagnostics without explicit evidence that they are false positives

**Quality-Guardian may do**:
- Ask code-reviewer for clarification on findings
- Run additional tests not listed in code-reviewer report
- Suggest process improvements

### Blocker Diagnostic Codes

| Code | Severity | Meaning |
|------|----------|---------|
| `CODE.ARCHITECTURE_VIOLATION` | Blocking | Public capability breaks schema-first or adapter boundary rules |
| `CODE.MISSING_DIAGNOSTIC` | Blocking | Error path exists without structured diagnostic code |
| `CODE.MUTATION_OUTSIDE_COMMAND` | Blocking | State change not routed through command system |
| `CODE.MISSING_TEST_COVERAGE` | Blocking | Behavior change has no test coverage |
| `CODE.RESOURCE_POLICY_VIOLATION` | Blocking | URL/tile/worker access not declared or policy-violating |
| `CODE.TYPE_WIDENING` | Blocking | TypeScript `any` widening in public API |

### Escalation Path

If code-reviewer and quality-guardian disagree on a finding:
1. code-reviewer marks finding with `requires_coordinator_input: yes`
2. quality-guardian opens issue: `agent-escalation`, assigns `@coordinator`
3. Issue includes: finding detail, both agents' positions, recommended decision
4. Coordinator decides: approve, block, or defer decision

---

## HOC-004: QA-Agent → Task-Distributor (Test Results Attestation)

**Trigger**: `@qa-agent` completes testing and evidence collection for a task

**From**: `@qa-agent`  
**To**: `@task-distributor`  
**Handoff Type**: Acceptance Attestation  

### Required Handoff Data

**Front-matter**:
```yaml
agent: qa-agent
task_id: TASK-YYYY-Www-NNN
test_scope: "snapshot" | "visual" | "release" | "browser" | "performance"
generated_at: ISO-8601
repo_revision: git SHA
decision_level: info
test_result: pass | fail | waived
acceptance_criteria: all-met | partial | not-met
```

**Artifacts**:
1. **Test execution report**: `docs/reviews/qa-evidence-{task}-{date}.md` containing:
   ```markdown
   # QA Evidence: NLA-006 Prompt Evidence Scenarios (2026-05-30)
   
   ## Test Execution Summary
   
   | Test Suite | Passed | Failed | Waived | Duration |
   |-----------|--------|--------|--------|----------|
   | snapshot-visual-mapl | 42 | 0 | 0 | 2m15s |
   | snapshot-visual-scene3d | 38 | 1 | 0 | 3m42s |
   | browser-runner-scene3d | 15 | 0 | 0 | 12m |
   | **Total** | **95** | **1** | **0** | **~18m** |
   
   ## Acceptance Criteria Check
   
   - [x] MapLibre 2D baseline visual snapshots deterministic (>10 runs)
   - [x] MapLibre generation quality >80% similarity to hand-crafted templates
   - [ ] SceneView3D visual snapshot stable (FAILED: flakiness in camera animation)
   - [x] Generated prompt diagnostics structured and auditable
   
   **Result**: 3/4 criteria met, 1 blocked by camera animation flakiness
   
   ## Known Issues & Waivers
   
   ### Blocked Issues (blocking release):
   - `SCENE3D.VISUAL_SNAPSHOT_FLAKY`: camera movement in scene3d visual snapshot varies ±5px
     Recommendation: defer to v1.1 or accept visual snapshot waiver for v1 stable promotion
   
   ### Advisory Issues (won't block merge):
   - Performance regression detected: generation time +8% vs. W22
     Root cause: new diagnostic logging
     Recommendation: optimize logging path in ai-agent
   ```

2. **Test artifacts** (location-dependent):
   - Snapshot visual outputs: `test-results/tests-snapshot-visual-*.png`
   - Browser logs: `test-results/browser-runner-*.log`
   - Performance metrics: `test-results/perf-*.json`

### Validation Gate

**Gate command**:
```bash
pnpm test:snapshot:visual
pnpm test:release:scene3d  # if SceneView3D feature
GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual  # strict mode
```

**Pass condition**:
- All acceptance criteria met or explicitly waived with coordinator approval
- No critical test failures (critical = blocks user workflows)
- Test report complete with all evidence artifacts

**Fail condition**:
- Acceptance criteria not met
- Critical test failures unresolved
- Evidence report missing

### Downstream Agent Responsibilities

**Task-Distributor must do**:
1. Read QA evidence report
2. Verify all acceptance criteria are marked pass/fail/waived
3. If waived criteria exist, check that coordinator has explicitly approved the waiver
4. Only mark task as "done" in task-burndown if:
   - All acceptance criteria met, OR
   - Waived criteria have coordinator approval recorded
5. If QA report shows unresolved blockers, transition task back to "in-review" or "blocked"

**Task-Distributor cannot do**:
- Mark task done without reading QA evidence
- Override waived criteria decisions without coordinator input
- Update burndown status while QA is still testing (wait for `qa-evidence-*.md` to be committed)

**Task-Distributor may do**:
- Request re-testing if evidence seems incomplete
- Suggest batching related test runs for efficiency

### Blocker Diagnostic Codes

| Code | Severity | Meaning |
|------|----------|---------|
| `QA.SNAPSHOT_FAILURE` | Blocking | Visual snapshot failed determinism test |
| `QA.BROWSER_FAILURE` | Blocking | Browser test harness crashed or timed out |
| `QA.ACCEPTANCE_CRITERIA_UNMET` | Blocking | Required acceptance criterion failed |
| `QA.PERF_REGRESSION` | Advisory | Performance declined >10% vs. baseline |

### Escalation Path

If QA evidence shows unresolved blockers and no waiver approval:
1. task-distributor opens issue: `qa-blocker`, assigns `@quality-guardian`, `@coordinator`
2. Issue includes: failing test, expected vs. actual, recommendation
3. Coordinator decides: approve fix, accept waiver, or defer task

---

## HOC-005: Task-Distributor → Coordinator (Serialized Planning State)

**Trigger**: All owner evidence (engine-agent, ai-agent, adapter-agent, qa-agent, docs-agent, code-reviewer, quality-guardian findings) collected for a planning cycle

**From**: `@task-distributor`  
**To**: `@coordinator`  
**Handoff Type**: State Synchronization  

### Required Handoff Data

**Front-matter**:
```yaml
agent: task-distributor
period: YYYY-Www
generated_at: ISO-8601
repo_revision: git SHA
decision_level: info
status: ready-for-coordinator-review
tasks_updated: N
tasks_completed: M
blockers_pending: P
```

**Artifacts**:
1. **Planning snapshot**: Modified versions of:
   - `docs/planning/task-burndown.md` (updated task statuses)
   - `docs/planning/dependency-graph.md` (completed edges marked)
   - `docs/planning/sprint-{YYYY-Www}.md` (detailed task status)

2. **Serialization report**: `docs/reviews/serialized-planning-{period}.md` containing:
   ```markdown
   # Serialized Planning Handoff: 2026-W23 (2026-06-02)
   
   ## Planning State Update Summary
   
   ### Tasks Transitioned
   | Task ID | Old Status | New Status | Owner Evidence | Decision |
   |---------|-----------|-----------|----------------|----------|
   | NLA-002 | doing | done | nla-002-generation-command-contract.md ✓ | PASS |
   | NLA-003 | doing | done | nla-003-mcp-orchestration.md ✓ | PASS |
   | NLA-004 | review | blocked | code-reviewer-findings + engine-agent update needed | BLOCK |
   | NLA-005 | doing | done | nla-005-scene-browsing-boundary.md ✓ | PASS (waived visual) |
   
   ### Dependency Graph Updates
   - NLA-001 → NLA-002: complete ✓
   - NLA-002 → NLA-003: complete ✓
   - NLA-003 → NLA-004: BLOCKED (schema validation failure)
   
   ### Burndown Progress
   - W23 Start: 12 tasks, 95 estimated hours
   - W23 Current: 8 tasks done, 4 in-progress/blocked, 82 actual hours
   - Estimated completion: W24 Tuesday (1 day ahead of schedule)
   
   ### Pending Blockers Requiring Coordinator Input
   - SCENE3D.VISUAL_EVIDENCE_MISSING (HOC-001): adapter-agent ready, qa-agent requesting timeline
     Recommendation: defer visual testing to v1.1 or extend W23 deadline
   - CODE.ARCHITECTURE_VIOLATION (HOC-003): code-reviewer flagged command mutation bypass
     Recommendation: request engine-agent rework or waive with justification
   
   ### Evidence Validation Checklist
   - [x] engine-agent report received and validated
   - [x] ai-agent report received and validated
   - [x] adapter-agent report received and validated
   - [x] qa-agent report received and validated
   - [x] docs-agent report received (if applicable)
   - [x] code-reviewer findings processed
   - [x] quality-guardian gate results recorded
   - [x] All reports in YAML format with decision_level and confidence
   - [x] No concurrent edits to planning files detected
   
   ### File Modifications
   ```
   docs/planning/task-burndown.md: 3 lines changed (task statuses)
   docs/planning/dependency-graph.md: 2 edges marked complete
   docs/planning/sprint-2026-W23-ai-map-app-generation.md: status column updated
   ```
   
   ## Next Steps for Coordinator
   1. Review this handoff and pending blockers
   2. Make decision on deferred visual evidence waiver
   3. Decide on NLA-004 architecture rework or waiver
   4. Approve final planning state update
   5. Publish coordinator summary for W24 planning
   ```

### Validation Gate

**Pre-gate (before task-distributor submits)**:
```bash
# Verify all required evidence files exist
ls docs/reviews/engine-contract-*.md
ls docs/reviews/mcp-contract-*.md
ls docs/reviews/adapter-evidence-*.md
ls docs/reviews/qa-evidence-*.md
ls docs/reviews/daily-audit-*.md

# Validate no concurrent edits
git status docs/planning/task-burndown.md
git diff --cached docs/planning/
```

**Gate**: coordinator reads serialized planning and decides:
- ✅ **Approve**: Planning state is consistent, ready to commit
- ❌ **Reject**: Evidence gaps or inconsistencies detected, request re-submission
- ⚠️ **Conditional**: Approve with noted waivers (e.g., deferred visual testing)

### Downstream Agent Responsibilities

**Coordinator must do**:
1. Read serialized planning report completely
2. Verify evidence trail: each task status transition backed by evidence artifact
3. Review pending blockers and make promotion decisions:
   - Approve: task is complete
   - Waive: accept waiver with reasoning documented
   - Defer: move task to next sprint
4. Publish weekly-digest summarizing decisions and next steps

**Coordinator cannot do**:
- Approve planning state without reading evidence reports
- Modify planning files directly (task-distributor owns the serialization)
- Ignore pending blockers (must decide on each waiver)

**Coordinator may do**:
- Ask task-distributor for clarification
- Request additional evidence from executor agents
- Modify waiver text for clarity in next digest

### Blocker Diagnostic Codes

| Code | Severity | Meaning |
|------|----------|---------|
| `PLANNING.EVIDENCE_MISSING` | Blocking | Required owner evidence file not found |
| `PLANNING.INCONSISTENT_STATE` | Blocking | Task dependency broken or status contradictory |
| `PLANNING.CONCURRENT_EDIT` | Blocking | Multiple agents detected writing planning files simultaneously |
| `PLANNING.WAIVER_UNAPPROVED` | Blocking | Waived criterion lacks coordinator approval |

### Escalation Path

If serialized planning contains unresolved inconsistencies:
1. task-distributor returns serialized-planning report to "in-progress" (do not commit)
2. Opens issue: `planning-inconsistency`, assigns `@coordinator`
3. Coordinator decides: request re-submission with fixes or escalate to emergency response

---

## HOC-006: Quality-Guardian → Coordinator (Gate Decision)

**Trigger**: `@quality-guardian` completes merge or release gate evaluation

**From**: `@quality-guardian`  
**To**: `@coordinator`  
**Handoff Type**: Authorization Decision  

### Required Handoff Data

**Front-matter**:
```yaml
agent: quality-guardian
gate_type: merge | release | stable-runtime-promotion
scope: "PR#{pr}" | "release-v{version}" | "sceneview3d-stable"
generated_at: ISO-8601
repo_revision: git SHA
decision_level: blocking
decision: pass | block | emergency-waiver
gates_run:
  - schema-build
  - deterministic-check
  - visual-snapshot
  - resource-policy
  - mcp-contract
```

**Artifacts**:
1. **Gate execution report**: In-PR comment or `docs/reviews/quality-gate-{scope}-{date}.md` containing:
   ```markdown
   # Quality Gate: PR#1234 Merge Review (2026-06-01)
   
   ## Required Gates & Results
   
   | Gate | Command | Result | Duration | Evidence |
   |------|---------|--------|----------|----------|
   | Schema Build | `pnpm build:schema` | ✅ PASS | 12s | [CI log](link) |
   | Deterministic Check | `pnpm check` | ✅ PASS | 8s | [CI log](link) |
   | SceneView3D Visual | `pnpm test:release:scene3d` | ⚠️ WAIVED | — | SRC-006 approval |
   | Visual Snapshot | `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` | ✅ PASS | 18m | [artifact](link) |
   | Resource Policy | `pnpm test:schema:resource-policy` | ✅ PASS | 5s | [CI log](link) |
   | MCP Contract | `pnpm test:ai:mcp-contract` | ✅ PASS | 3s | [CI log](link) |
   
   ## Summary
   
   **6/6 gates passed** (1 waived with approval)
   
   ## Decision
   
   ✅ **PASS** — Safe to merge
   
   **Conditions**:
   - SceneView3D visual snapshot waived per SRC-006 (stable runtime decision), follow-up task TASK-2026W25-VIDEO-TEST created
   - All code-reviewer findings resolved or waived
   - No new resource-policy violations
   
   ## Waiver Details (if any)
   
   **Waived**: SceneView3D visual snapshot  
   **Reason**: Deferred to v1.1 per SRC-006 stable runtime decision  
   **Approval**: @coordinator approved in weekly-digest-W22  
   **Follow-up Task**: TASK-2026W25-VIDEO-TEST, due W25  
   ```

2. **Code-reviewer integration**: Reference to relevant daily-audit findings and code-reviewer's decision_level

### Validation Gate

No additional gate — quality-guardian IS the gate. Result must include:
- All required gates explicitly passed, failed, or waived
- Each waiver must cite coordinator approval (with link to decision)
- Each failure must include blocking diagnostic code

### Downstream Agent Responsibilities

**Coordinator must do**:
1. Read quality-guardian decision and gate results
2. If decision is `block`, determine remedy (rework, waive, or defer)
3. If decision is `emergency-waiver`, verify:
   - Original input has `decision_level: emergency` from earlier escalation
   - All minimal gates still passed (schema validation, diagnostics, resource-policy)
   - Follow-up P0/P1 tasks created for waived gates
4. Update next weekly-digest with gate decision and any waivers

**Coordinator cannot do**:
- Override quality-guardian block without explicit evidence
- Approve waiver without recording it in next weekly-digest
- Allow stable runtime promotion without visual evidence or explicit emergency bypass

**Coordinator may do**:
- Ask quality-guardian for clarification on gate results
- Request additional gates beyond the standard set
- Adjust waiver criteria for future gates

### Blocker Diagnostic Codes

All gate-specific codes (schema, visual, resource, MCP) are in respective sections above.

### Escalation Path

If quality-guardian gates block a P0 incident or critical path item:
1. quality-guardian marks decision_level: `blocking`
2. Coordinator opens issue: `gate-blocker`, `p0` label, assigns `@quality-guardian`
3. Issue includes: gate failure, blocker code, root cause
4. Coordinator decides: emergency waiver (with follow-up), rework request, or project deferral

---

## Appendix: Handoff Contract Lifecycle

### Creating a New Handoff Contract

1. Identify agent pair and data flow direction
2. Create section in this file following HOC template
3. Define required front-matter fields
4. Specify validation gate command and pass/fail conditions
5. List downstream "must do", "cannot do", "may do" actions
6. Add ≥2 blocker diagnostic codes
7. Reference contract in both agents' job descriptions in AGENTS.md
8. Add to validation checks in agent-runner.mjs

### Updating an Existing Contract

- Version field in top front-matter should increment
- All breaking changes to contract must be announced in coordinator digest
- Old contract versions kept in git history for audit trail
- executor agents must support both old and new contract during transition period

### Validating Contract Compliance

Run in CI:
```bash
# Pseudo-code for agent-runner.mjs validation:
function validateHandoffCompliance(agentReport, contractId) {
  const contract = loadContract(contractId);
  const report = parseReport(agentReport);
  
  // Check front-matter
  for (const field of contract.required_frontmatter) {
    if (!report.frontmatter[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Check artifacts
  for (const artifact of contract.required_artifacts) {
    if (!fileExists(artifact.path)) {
      throw new Error(`Missing required artifact: ${artifact.path}`);
    }
  }
  
  // Run validation gate
  const gateResult = exec(contract.validation_gate.command);
  if (!gateResult.success && !report.decision_level_allows_failure) {
    throw new Error(`Validation gate failed: ${contract.validation_gate.id}`);
  }
}
```

---

## Summary Table

| HOC ID | From | To | Trigger | Key Gate | Blockers |
|--------|------|----|---------|---------:|----------|
| HOC-001 | adapter-agent | qa-agent | Adapter implementation complete | `pnpm test:adapter:scene3d --snapshot` | SCENE3D.* codes (3) |
| HOC-002 | engine-agent | ai-agent | Schema or command defined | `pnpm build:schema` | SCHEMA.*, MCP.* codes (4) |
| HOC-003 | code-reviewer | quality-guardian | Daily audit or PR review | checklist 8/8 | CODE.* codes (6) |
| HOC-004 | qa-agent | task-distributor | Testing complete | acceptance criteria met | QA.* codes (4) |
| HOC-005 | task-distributor | coordinator | All owner evidence collected | evidence files validated | PLANNING.* codes (4) |
| HOC-006 | quality-guardian | coordinator | Gate evaluation complete | all required gates | (gate-specific) |

---

**Last Updated**: 2026-06-01  
**Owner**: @coordinator  
**Review Cadence**: Monthly or when contract violations occur  
**Version**: 1.0
