---
agent: builder
period: 2026-06-10
generated_at: 2026-06-10T10:03:19.145Z
repo_revision: "00ebd863c7d016d2322a58d1212b77624fd411a6"
inputs:
  - scripts/first-run-acceptance.mjs
  - scripts/cli-install-smoke.mjs
  - https://github.com/HYNCM/gis-engine/issues/9
owner: "@builder"
decision_level: advisory
---

# W25 First-Run Acceptance

Status: **passed**

| Check | Evidence |
| --- | --- |
| Elapsed time | 29.9s / 30m budget |
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

## Command

```bash
pnpm smoke:first-run
```
