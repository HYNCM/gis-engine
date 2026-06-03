---
agent: quality-guardian
period: 2026-06-03
generated_at: 2026-06-03T08:15:52Z
repo_revision: "a77ce78"
decision_level: advisory
---

# Quality Gate: 2026-06-03 (v0.2 GA Pre-Release)

## Gate Results

| Gate | Status | Tests |
| --- | --- | ---: |
| `pnpm build:schema` | passed | — |
| `pnpm build` (all 7 packages including Studio) | passed | — |
| `pnpm test:schema` | passed | 22 |
| `pnpm test:schema-sync` | passed | 14 |
| `pnpm test:commands` | passed | 46 |
| `pnpm test:patch` | passed | 3 |
| `pnpm test:runtime` | passed | 11 |
| `pnpm test:adapter` | passed | 49 |
| `pnpm test:ai` | passed | 55 |
| `pnpm test:cli` | passed | 39 |
| `pnpm test:examples` (incl. Playwright) | passed | 86 |
| `pnpm test:docs` | passed | 2 |
| `pnpm test:resources` | passed | 6 |
| `pnpm test:perf:smoke` | passed | 2 |
| `pnpm test:snapshot:smoke` (incl. Playwright) | passed | 14 |
| `pnpm test:studio` | passed | 38 |
| **Total** | **passed** | **387** |

## Additional Checks

| Check | Status | Notes |
| --- | --- | --- |
| `npm pack --dry-run` (4 packages) | passed | engine 101.1KB, ai 119.5KB, cli 10.7KB, scene3d 11.6KB |
| CDN build (`scripts/build-cdn.mjs`) | passed | engine, ai, scene3d ESM entries with correct exports |
| Bundle budgets (CI) | passed | engine 82KB gz < 100KB, cli within 30KB |
| `files` whitelist audit | passed | all packages: dist + README.md; cli adds templates |
| Version sync | passed | all 5 publishable packages at v0.2.0 |

## Schema-First / Command-Only Contract

- `pnpm build:schema` passed: engine, scene3d, ai schemas compile.
- `pnpm test:schema-sync` passed: 14 Ajv compilation checks.
- `pnpm test:commands` passed: apply, patch, matrix, generation contract.
- No new MCP tool alias added. Seven tool names remain frozen.
- `scene3d` stays extension-only; stable `view.mode: "scene3d"` remains blocked.

## Verdict

**Conditional pass for v0.2 GA.** All 387 deterministic tests pass. Schema, command,
adapter, AI, CLI, examples, docs, resources, perf, snapshot, and studio gates are
green. Playwright browser tests pass with installed Chromium. No raw prompt
retention, no hidden file writes, no new MCP aliases, no stable 3D runtime claims.

Remaining caveats:
- `pnpm test:snapshot:visual` (Playwright visual regression) requires a
  browser/WebGL-capable runner; not executed in this headless environment.
- `scene3d-three-adapter` remains internal/experimental, excluded from GA publish.
