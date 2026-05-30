---
agent: quality-guardian
period: 2026-05-18
generated_at: 2026-05-18T00:30:00+08:00
repo_revision: "working-tree"
inputs:
  - packages/engine/package.json
  - packages/ai/package.json
  - docs/engineering/v0.1-release-checklist.md
decision_level: advisory
---

# Package Release Review: 2026-05-18

## Scope

This review closes the package file review and npm dry-run item from the release
checklist. It covers the two public packages:

- `@gis-engine/engine`
- `@gis-engine/ai`

## Findings

| Item | Result | Action |
| --- | --- | --- |
| Scoped package access | Fixed | Added `publishConfig.access: public` to both packages. |
| License metadata | Fixed | Added `license: Apache-2.0` to both package manifests. |
| Repository metadata | Fixed | Added GitHub repository URL and package directory metadata. |
| Package README | Fixed | Added package-level README files so npm package pages are not empty. |
| Workspace dependency handling | Verified | Keep `@gis-engine/ai` on `workspace:*` for local development; release must use pnpm's publish/pack path so workspace dependencies are rewritten for registry output. |
| Dist artifacts | Passed | `dist` contains JS, declarations, schema artifacts, and source maps. |
| Package size | Passed | Engine dry-run is about 54 kB packed; AI dry-run is about 39 kB packed. |

## Dry-Run Commands

Use a temporary npm cache in this environment because the user-level npm cache
contains root-owned files.

```bash
NPM_CONFIG_CACHE=/private/tmp/gis-engine-npm-cache pnpm --filter @gis-engine/engine publish --dry-run --no-git-checks
NPM_CONFIG_CACHE=/private/tmp/gis-engine-npm-cache pnpm --filter @gis-engine/ai publish --dry-run --no-git-checks
```

`pnpm pack` was also run for both packages so the packed `package.json` could be
inspected directly.

## Acceptance

- Dry-run completed without requiring a real publish.
- Packed registry output rewrites `@gis-engine/ai`'s local `workspace:*`
  dependency to `@gis-engine/engine: 0.1.0`.
- Scoped packages publish with public access.
- Package tarballs include `package.json`, `README.md`, and `dist`.

## Remaining Release Item

The package review does not replace the formal release runner requirement for
`pnpm test:release:strict`. That still needs to run in a browser/WebGL-capable
environment before a real release.
