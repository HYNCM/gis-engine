---
agent: builder
period: 2026-06-10
generated_at: 2026-06-10T10:38:18.161Z
repo_revision: "91e75ade35ab90ee0fa3ac885119966d51b1203b"
inputs:
  - scripts/first-run-acceptance.mjs
  - scripts/cli-install-smoke.mjs
  - https://github.com/HYNCM/gis-engine/issues/9
owner: "@builder"
decision_level: blocking
---

# W25 First-Run Acceptance

Status: **failed**

| Check | Evidence |
| --- | --- |
| Elapsed time | 22.4s / 30m budget |
| Release-runner parity | fail (required) |
| CLI install smoke | passed |
| Time budget | within 30-minute first-run budget |
| Fresh consumer path | Packed local GA packages, installed in a temporary consumer project, scaffolded Vite TypeScript, and built the generated app |
| Generated map review path | Mock provider generation, `map.json` preflight, artifact manifest verification, and required review files |
| Prompt safety | `cli-install-smoke` asserts raw prompt text is not retained in generated files |

## Required Review Files

- `map.json`
- `preflight.json`
- `delivery-summary.json`
- `REVIEW.md`

## Release Runner Parity

| Check | Status | Evidence |
| --- | --- | --- |
| node | fail | expected major 22; found 26.0.0 |
| pnpm | pass | expected 9.15.0; found 9.15.0 |
| biome | pass | Version: 2.4.16 |
| listener | pass | 127.0.0.1:54953 |
| playwright_chromium | skip | --skip-browser supplied |

## Command

```bash
pnpm smoke:first-run
# strict local parity
pnpm smoke:first-run --require-release-env
```
