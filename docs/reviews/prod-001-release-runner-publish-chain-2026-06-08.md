---
agent: builder
period: 2026-06-08
generated_at: 2026-06-08T13:48:14Z
repo_revision: "5ddec91"
inputs:
  - docs/archive/2026-06-10/planning/next-stage-tasks-2026-06-07.md
  - scripts/release-preflight.mjs
  - scripts/cli-install-smoke.mjs
  - command: npx -y -p node@22 -p pnpm@9.15.0 sh -c 'pnpm release:preflight'
  - command: npx -y -p node@22 -p pnpm@9.15.0 sh -c 'pnpm check'
  - command: npx -y -p node@22 -p pnpm@9.15.0 sh -c 'pnpm smoke:cli-install'
  - command: npx -y -p node@22 -p pnpm@9.15.0 sh -c 'pnpm publish:dry'
  - command: npx -y -p node@22 -p pnpm@9.15.0 sh -c 'pnpm build:cdn -- --dry-run'
owner: "@builder"
decision_level: advisory
---

# PROD-001 Release Runner And Publish Chain

## Decision

`TASK-2026W24-PROD-001`, `TASK-2026W24-PROD-002`, and the release-chain part
of `TASK-2026W24-PROD-005` are locally closed for the SDK+CLI launch surface.
The release gates ran under a Node 22 runner with pnpm 9.15.0, Biome present,
localhost listener permission, and Playwright Chromium support.

The local machine's default `node` remains `26.0.0`; the trusted runner for
this evidence is the explicit command wrapper:

```bash
npx -y -p node@22 -p pnpm@9.15.0 sh -c '<gate>'
```

## Findings

| Area | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Release runner | `pnpm release:preflight` passed with Node `22.22.3`, pnpm `9.15.0`, Biome `2.4.16`, localhost listener, and Chromium | Removes the prior local environment waiver for release gates | Keep release gates on Node 22 in CI and local release wrappers | high |
| Deterministic gate | `pnpm check` passed, including examples and `pnpm test:snapshot:smoke` | The prior `listen EPERM 127.0.0.1` example blocker is no longer present in this runner | Treat localhost/browser failures as environment-specific unless they reproduce here | high |
| Packed install smoke | `scripts/cli-install-smoke.mjs` now packs engine, scene3d, AI, and CLI, installs the local tarball group, then pins generated project dependencies to those tarballs | Smoke verifies the linked `1.0.0` group instead of accidentally mixing the local CLI with older registry dependencies | Keep packed linked-group smoke before publish or installability claims | high |
| Publish dry-run | `pnpm publish:dry` exited `0`; pnpm reported no new packages should be published | Confirms publish command shape and build, while npm state indicates current `1.0.0` packages are already published | Use npm signal refresh for registry status rather than inferring it from local manifests | high |
| CDN dry-run | `pnpm build:cdn -- --dry-run` reported engine, AI, and scene3d at `1.0.0` | CDN identity matches package manifests | Keep CDN dry-run in release checklist | high |

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm release:preflight` on Node 22 wrapper | PASS | Node `22.22.3`; pnpm `9.15.0`; Biome `2.4.16`; listener `127.0.0.1:*`; Chromium launched |
| `pnpm check` on Node 22 wrapper | PASS | Build, schema, commands, runtime, adapter, AI, CLI, examples, docs, resources, perf smoke, snapshot smoke, and Studio tests passed |
| `pnpm smoke:cli-install` on Node 22 wrapper | PASS | Local packed `engine`, `scene3d`, `ai`, and `cli` tarballs installed; CLI scaffolded Vite TS; generated project installed and built; mock generate wrote review artifacts |
| `pnpm publish:dry` on Node 22 wrapper | PASS | Workspace build passed; four GA package publish dry-runs exited `0` with "no new packages" because registry already has current versions |
| `pnpm build:cdn -- --dry-run` on Node 22 wrapper | PASS | engine `1.0.0`, AI `1.0.0`, and scene3d `1.0.0`; dry-run wrote no files |

## Non-Goals

- This does not publish new npm artifacts.
- This does not promote Studio or AI Map Workbench to hosted/product scope.
- This does not enable stable `view.mode: "scene3d"`.
- This does not add PMTiles archive parsing, hidden range IO, or feature query.
