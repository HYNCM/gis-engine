---
generated_at: 2026-06-01T16:32:31.136Z
repo_revision: "9f30995"
month: 2026-05
total_pitfalls: 8
---

# Evolution Pitfall Library

此库记录从代码审查、架构评估和 Residual Risk 分析中提取的常见陷阱。
每个 pitfall 包含风险描述、来源和避免建议。

## PIT-001: Residual Risk: docs/archive/2026-06-07/reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md

**遇见于**: `docs/archive/2026-06-07/reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md`

- This slice does not add a file-writing tool and does not make
  `export_example_app` create artifacts. That is intentional.
- `delivery.sourceReadiness` summarizes only current `MapSpec.sources`.
  GeoParquet, FlatGeobuf, and GeoTIFF are public contracts with runtime
  blocked; GeoZarr remains a blocked planning intent until a future schema
  exists.
- Scene browsing delivery is `follow-up-req

## PIT-002: Residual Risk: docs/archive/2026-06-07/reviews/ain-003-004-promotion-criteria-2026-05-30.md

**遇见于**: `docs/archive/2026-06-07/reviews/ain-003-004-promotion-criteria-2026-05-30.md`

- These are promotion criteria, not implementation evidence. They intentionally
  leave GeoParquet, FlatGeobuf, GeoTIFF, GeoZarr, buffer, overlay,
  intersection, routing, and aggregation blocked.
- PMTiles remains readiness-only for archive parsing and feature query until a
  parser/resource/query gate lands.

## PIT-003: Residual Risk: docs/archive/2026-06-07/reviews/ain-005-scene-browsing-delivery-copy-2026-05-30.md

**遇见于**: `docs/archive/2026-06-07/reviews/ain-005-scene-browsing-delivery-copy-2026-05-30.md`

- This task does not make SceneView3D stable. It closes the delivery wording and
  evidence handoff only.
- Future renderer promotion still requires a separate quality-guardian and
  coordinator Go decision.

## PIT-004: Blocking finding in docs/archive/2026-05-30/reviews/daily-audit-2026-05-24.md

**遇见于**: `docs/archive/2026-05-30/reviews/daily-audit-2026-05-24.md`

### [P1] CI agent reports are generated as templates, not substantive audits

- Evidence: `.github/workflows/agent-daily.yml:61` writes a daily audit with
  build status only; `.github/workflows/agent-weekly.yml:46`,
  `.github/workflows/agent-weekly.yml:116`, and
  `.github/workflows/agent-weekly.yml:147` write placeholder reports that say
  an ag

## PIT-005: Blocking finding in docs/archive/2026-05-30/reviews/daily-audit-2026-05-24.md

**遇见于**: `docs/archive/2026-05-30/reviews/daily-audit-2026-05-24.md`

### [P1] Scheduled workflows use multiple auto-commit writers against the same branch

- Evidence: `.github/workflows/agent-weekly.yml:82`,
  `.github/workflows/agent-weekly.yml:131`, `.github/workflows/agent-weekly.yml:166`,
  and `.github/workflows/agent-weekly.yml:188` each auto-commit from separate
  jobs; `.github/workflows/agent-daily.yml:87`

## PIT-006: Blocking finding in docs/archive/2026-05-30/reviews/daily-audit-2026-05-24.md

**遇见于**: `docs/archive/2026-05-30/reviews/daily-audit-2026-05-24.md`

### [P2] Local daily runner and GitHub daily cadence disagree on docs-agent scope

- Evidence: `package.json:32` maps `agent:daily` to
  `node scripts/agent-runner.mjs all --daily`, but
  `scripts/agent-runner.mjs:83` registers `docs-agent` as `weekly`; meanwhile
  `.github/workflows/agent-daily.yml:146` runs docs-agent as part of the daily
  caden

## PIT-007: Blocking finding in docs/archive/2026-05-30/reviews/daily-audit-2026-05-24.md

**遇见于**: `docs/archive/2026-05-30/reviews/daily-audit-2026-05-24.md`

### [P2] Emergency alert workflow writes literal shell variables into the artifact

- Evidence: `.github/workflows/emergency-response.yml:46` uses a single-quoted
  heredoc delimiter, so shell variables such as `${DATE}` in lines 50 and 59
  are not expanded.
- Impact: emergency artifacts may miss the actual generated timestamp in the
  front matte

## PIT-008: Residual Risk: docs/archive/2026-05-30/reviews/v0.2-checkpoint-audit-2026-05-17.md

**遇见于**: `docs/archive/2026-05-30/reviews/v0.2-checkpoint-audit-2026-05-17.md`

- MapLibre visual snapshot depends on Playwright Chromium/WebGL availability.
- Generic vector source validation checks URL contract and transformer output; it intentionally does not fetch or parse production MVT tiles in the core engine.
- `SceneView3D` remains a reserved boundary, not an implemented renderer.
