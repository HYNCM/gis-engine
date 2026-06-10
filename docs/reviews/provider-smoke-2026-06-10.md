---
agent: builder
period: 2026-06-10
generated_at: 2026-06-10T05:49:19.761Z
repo_revision: "0254a8576bfe54b764e68966235b4dc7f84b4aca"
inputs:
  - scripts/provider-smoke.mjs
  - packages/cli/src/provider-http.ts
  - docs/cli/provider-config.md
  - https://github.com/HYNCM/gis-engine/issues/10
owner: "@builder"
decision_level: advisory
---

# W25 OpenAI-Compatible Provider Smoke

Status: **passed**

| Case | Status | Evidence |
| --- | --- | --- |
| success | passed | OpenAI-compatible envelope generated a reviewable map; preflight and artifact verification passed. |
| malformed response | passed | Malformed provider content failed with a structured provider diagnostic and no sensitive output. |
| HTTP error | passed | Provider HTTP error failed deterministically and kept sensitive strings out of command output. |
| timeout | passed | Provider timeout failed deterministically and kept sensitive strings out of command output. |

## Safety Boundary

- Uses a local `127.0.0.1` OpenAI-compatible test server; no CI secret or external provider is required.
- Asserts the local provider receives an Authorization header, then checks command output and generated files do not retain the test key or raw prompt.
- Runs generated map preflight and artifact-manifest verification on the success path.

## Command

```bash
pnpm smoke:provider
```
