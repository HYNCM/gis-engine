---
agent: builder
period: 2026-06-14
generated_at: 2026-06-14T04:19:23.979Z
repo_revision: "c37e9fc65dac62da8fed080b973a569ad7a294b1"
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
| Elapsed time | 45.9s / 30m budget |
| Release-runner parity | fail (advisory) |
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

## CLI Install Smoke Breakdown

| Check | Status | Evidence |
| --- | --- | --- |
| Packed install | passed | Packed local engine, scene3d, ai, and cli tarballs and installed them into a fresh consumer project. |
| Scaffolded app build | passed | Scaffolded the vite-ts template, pinned local tarballs, installed dependencies, and built the scaffolded app. |
| Generated app review path | passed | Ran mock generate with the app template and produced map.json plus the required review files. |
| Generated app verification | passed | Map preflight and artifact-manifest verification passed with no missing files or hash mismatches. |
| Prompt safety | passed | Checked generated files and artifact-manifest.json to confirm the raw prompt text was not retained. |
| Generated app build | passed | Pinned generated app dependencies to local tarballs, installed dependencies, and built the generated app. |

## Release Runner Parity

| Check | Status | Evidence |
| --- | --- | --- |
| node | fail | expected major 22; found 26.0.0 |
| pnpm | pass | expected 9.15.0; found 9.15.0 |
| biome | pass | Version: 2.4.16 |
| listener | pass | 127.0.0.1:61206 |
| playwright_chromium | skip | --skip-browser supplied |

## Command

```bash
pnpm smoke:first-run
# advisory local parity

```
