---
agent: quality
period: 2026-08-03
generated_at: 2026-08-03T17:10:31Z
repo_revision: "057bdb24a39bf46d258492987ca1274fecaccbd9"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/40
  - docs/planning/feature-specs/mcp-2026-07-28-compatibility.md
  - tests/fixtures/mcp/compatibility-2026-07-28.json
  - tests/ai/mcp-2026-07-28-compatibility.test.ts
  - tests/ai/mcp-contract-convergence.test.ts
  - packages/ai/src/mcp/server.ts
owner: "@quality"
decision_level: blocking
evidence_kind: specialist
---

# MCP 2026-07-28 Quality Decision

## HOC-N3 Decision

**No-go** for promoting MCP `2026-07-28` to the runtime default or claiming
dual-revision support. **PASS** for retaining the current MCP `2025-11-25`
default and adding the compatibility gate.

The repository still uses `@modelcontextprotocol/sdk` 1.x and has no accepted
v2 discovery/lifecycle conformance evidence. The bounded gate keeps the exact
14-tool inventory and order, draft-07 input/output descriptors,
schema-conforming `structuredContent`, the structured diagnostic failure
envelope, and the legacy JSON diagnostics block.

The official TypeScript SDK README/npm stable-line evidence and the 2.0.0
GitHub release body's residual beta wording are inconsistent. That wording is
not a blocker and is not used to claim v2 is unavailable; repository migration
and conformance gaps are the blocking evidence.

| Area | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Protocol default | `GIS_ENGINE_MCP_PROTOCOL_VERSION` remains `2025-11-25`; the fixture decision is `no-go` | Existing clients remain on the validated lifecycle | Keep the default until all RFC promotion gates pass | high |
| Descriptor contract | The compatibility test validates live `tools/list` through SDK `ListToolsResultSchema` and asserts names/order plus both schemas | Prevents candidate research from changing the public AI surface | Run `pnpm test:compat:mcp` on future MCP changes | high |
| Result contract | Existing convergence tests cover successful structured content and structured diagnostics with text fallback | Maintains deterministic machine-readable results | Preserve both `structuredContent` and legacy JSON paths during any migration | high |
| Candidate gaps | Fixture marks discovery, lifecycle, `resultType`, cache metadata, and subscriptions blocked | Default promotion would claim unimplemented protocol behavior | Implement and review a dedicated split-SDK v2 conformance change | high |
| Compatibility policy | A `2026-07-28` client MUST treat a result from an earlier-protocol server that omits `resultType` as complete | Avoids confusing a client-side fallback interpretation with runtime support | Add real current-client/earlier-server fixtures before dual-revision Go | high |

## Verification Evidence

| Check | Result |
| --- | --- |
| `pnpm exec vitest run tests/ai/mcp-2026-07-28-compatibility.test.ts` (RED, test only) | Expected FAIL: 1 file / 3 tests; fixture and RFC did not exist |
| `pnpm test:compat:mcp` | PASS, 1 file / 3 tests |
| `pnpm build:schema` | PASS; engine, Scene3D, and AI schema builds completed |
| `pnpm test:ai` | PASS, 14 files / 302 tests |
| `pnpm test:docs` | PASS, 5 files / 35 tests |
| `pnpm check` (this agent, restricted sandbox) | Environment-limited: all workspace builds and preceding deterministic suites passed; `tests/examples/ai-map-workbench.test.ts` then failed 23 localhost cases only with `listen EPERM: operation not permitted 127.0.0.1` |
| `pnpm check` (independent root-agent rerun at `057bdb2`, unrestricted environment) | PASS; all suites completed, including 77/77 Workbench tests and the downstream deterministic suites |

The restricted run remains recorded to distinguish an environment limitation
from a regression. The independent unrestricted rerun at `057bdb2` satisfies
the full-check evidence, including the localhost Workbench cases. The focused
MCP, schema, AI, and documentation results above are this agent's evidence.

## Promotion Blockers

1. Migrate to and pin the split TypeScript SDK v2 packages.
2. Prove `server/discover` and per-request protocol/capability behavior.
3. Prove required `resultType` and the current-client/earlier-server omission
   behavior over real transports.
4. Define and test `ttlMs`, `cacheScope`, and invalidation behavior.
5. Define and test `subscriptions/listen` lifecycle and authorization.
6. Re-run the complete schema, AI, documentation, deterministic, and MCP
   conformance gates before `@quality` issues a Go decision.

This report does not authorize planning-state or issue-state changes;
`@orchestrator` remains the single writer for those surfaces.
