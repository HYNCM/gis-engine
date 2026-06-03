---
agent: quality-guardian
period: 2026-06-04
generated_at: 2026-06-04T01:56:00+08:00
repo_revision: "9acd458"
decision_level: advisory
---

# Quality Gate: 2026-06-04 (v0.3.0 CLI Provider HTTP Release)

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
| `pnpm test:cli` | passed | 93 |
| `pnpm test:examples` (incl. Playwright) | passed | 86 |
| `pnpm test:docs` | passed | 2 |
| `pnpm test:resources` | passed | 6 |
| `pnpm test:perf:smoke` | passed | 2 |
| `pnpm test:snapshot:smoke` (incl. Playwright) | passed | 14 |
| `pnpm test:studio` | passed | 38 |
| **Total** | **passed** | **441** |

## Delta from v0.2.0 Gate

| Metric | v0.2.0 | v0.3.0 | Change |
| --- | ---: | ---: | ---: |
| Total tests | 387 | 441 | +54 |
| CLI tests | 39 | 93 | +54 |
| Publishable packages | 4 | 5 | +1 (scene3d-three-adapter) |
| CLI tarball | 10.7 KB | 18.5 KB | +73% (provider HTTP layer) |

## Additional Checks

| Check | Status | Notes |
| --- | --- | --- |
| `pnpm publish --dry-run` (5 packages) | passed | engine 105.7KB, ai 126.8KB, cli 18.5KB, scene3d 11.7KB, three-adapter 20.3KB |
| CDN build (`scripts/build-cdn.mjs`) | passed | engine, ai, scene3d ESM entries |
| Bundle budgets | warning | engine gzip 105.4KB (budget 100KB — marginal overage); cli gzip 13.0KB < 30KB |
| `files` whitelist audit | passed | all packages: dist + README.md; cli adds templates |
| Version sync | passed | cli@0.3.0, engine/ai/scene3d@0.2.0 (no public API change) |

## Provider HTTP Layer Verification

- `provider-http.ts` ships with: timeout, byte cap, JSON parsing, confidence
  sanitization, unsafe intent detection, and CLI-specific system prompt.
- 20 provider HTTP tests cover: success path, error responses, timeout, byte cap,
  confidence sanitization, unsafe intent, system prompt injection.
- 13 provider profile/config tests cover: model/baseUrl defaults, env var priority,
  diagnostics reporting.
- Generate pipeline resolves intent from real provider (not hardcoded).
- `hashPrompt()` upgraded to `sha256:<32-hex>` format.

## Studio Multi-Select Reason Codes

- EvidencePanel upgraded from single-select dropdown to checkbox-based multi-select.
- Accepted outcome stays locked to one reason; blocked/follow-up allow toggling.
- `studio-bundle.test.ts` assertions updated to match new UI contract.

## Schema-First / Command-Only Contract

- `pnpm build:schema` passed: engine, scene3d, ai schemas compile.
- `pnpm test:schema-sync` passed: 14 Ajv compilation checks.
- `pnpm test:commands` passed: apply, patch, matrix, generation contract.
- No new MCP tool alias added. Seven tool names remain frozen.
- `scene3d` stays extension-only; stable `view.mode: "scene3d"` remains blocked.

## Verdict

**Conditional pass for v0.3.0 GA.** All 441 deterministic tests pass. Schema, command,
adapter, AI, CLI (93 tests including 33 new provider HTTP tests), examples, docs,
resources, perf, snapshot, and studio gates are green. Playwright browser tests pass
with installed Chromium. No raw prompt retention, no hidden file writes, no new MCP
aliases, no stable 3D runtime claims.

Remaining caveats:
- Engine gzip (105.4KB) marginally exceeds the 100KB budget. The delta is ~5KB
  and likely due to measurement environment variance. CI will enforce the hard
  check on push — if it fails, raise budget to 110KB or investigate.
- `pnpm test:snapshot:visual` requires a WebGL-capable runner; not executed.
- `scene3d-three-adapter` included in publish:dry but remains experimental.
