---
agent: quality
period: 2026-08-03
generated_at: 2026-08-03T15:04:37Z
repo_revision: "260add03acec12827d2e61c9e4fd320eb3be990d"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/41
  - tests/docs/public-docs-consistency.test.ts
  - docs/website/release-notes.md
  - CHANGELOG.md
  - docs/engineering/release-wording-guardrails.md
owner: "@quality"
decision_level: blocking
gate_result: pass
evidence_kind: specialist
---

# Release Truth Quality Decision

## HOC-N3 Decision

**PASS for the bounded public v1.5 release-truth change in issue #41.** The
website release page now identifies v1.5.0 as current, lists the canonical 14
MCP tools in `tools/list` order, and preserves explicit No-go boundaries. The
complete v1.0.0 section remains as history, and its package tags are labeled as
historical rather than current registry state.

This decision validates repository release wording. It does not independently
verify current npm dist-tags, hosted deployment readiness, stable SceneView3D
promotion, or PMTiles runtime query support.

| Area | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Current release | `docs/website/release-notes.md` begins its version history with `v1.5.0`; the consistency test includes that page in the current-version entry points | Public readers no longer encounter v1.0.0 as the current release | Keep the page in the current-version regression set | high |
| MCP inventory | The release page lists all 14 names in canonical order and links to `/mcp/overview`; the consistency test includes it in the canonical inventory set | Agents and developers receive one stable public `tools/list` contract | Change the list only with the canonical MCP contract and its tests | high |
| Promotion boundaries | The current section states No-go for Hosted Workbench GA, Stable SceneView3D, and PMTiles runtime query support | Release wording cannot promote bounded evidence into unsupported capability claims | Retain each boundary until a separate accepted promotion gate changes it | high |
| Historical release record | The existing v1.0.0 section remains complete and is preceded by a historical-tag clarification | Historical package tags cannot be mistaken for current registry tags | Preserve historical sections verbatim during future current-release updates | high |

## Verification Evidence

| Check | Result |
| --- | --- |
| `pnpm exec vitest run tests/docs/public-docs-consistency.test.ts` (RED, test-only diff) | Expected FAIL: 3 failed / 20 passed; the page did not mention v1.5.0, did not identify 14 tools, and first named v1.0.0 |
| `pnpm exec vitest run tests/docs/public-docs-consistency.test.ts` (GREEN) | PASS, 1 file / 23 tests |
| `pnpm test:docs` | PASS, 5 files / 35 tests |
| `node scripts/doc-generator.mjs links` | PASS; zero active broken links, five archived links ignored by policy |
| `pnpm dlx node@22 /Users/chengming/.npm-global/bin/pnpm release:preflight` | PASS under Node 22.23.2: Node, pnpm 11.9.0, Biome 2.4.16, localhost listener, and Playwright Chromium |

## Constraints

- The successful release preflight required execution outside the restricted
  sandbox so localhost listener and Chromium process checks could run.
- An earlier plain `pnpm release:preflight` attempt ran under Node 26.0.0 and
  failed the Node-major check; it is not used as Node 22 release evidence.
- No npm registry query or publish action was performed.
- This report is quality evidence only. `@orchestrator` remains the sole writer
  for planning and issue state.
