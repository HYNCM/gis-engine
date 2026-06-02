---
agent: engine-agent
period: 2026-06-03
generated_at: 2026-06-02T16:32:57Z
repo_revision: "2412c662bfc8"
inputs:
  - docs/planning/feature-specs/maplibre-capability-commands.md
  - apps/studio/server/provider.mjs
  - apps/studio/server/index.mjs
  - apps/studio/src/components/MapStage.tsx
  - apps/studio/README.md
  - docs/engineering/supported-feature-matrix.md
  - tests/studio/studio-maplibre-capabilities.test.ts
  - tests/studio/studio-server.test.ts
owner: "@engine-agent @ai-agent @docs-agent"
decision_level: advisory
---

# MLC-001 MapLibre Capability Commands

## Decision

The first post-AWP Studio capability-command slice is accepted. Studio now
closes a bounded set of MapLibre-native editing intents through provider action
contracts, `MapCommand` execution, bounds-aware camera sync, and public docs.

The accepted surface is:

- `setFilter`
- `setLayerZoomRange`
- `reorderLayer`
- `fitBounds`
- `setLayout` for `layout.visibility`

This slice improves the Phase 2 Studio product loop without reopening MapLibre
package drift, MCP alias expansion, terrain/projection work, feature-state
mutation, or stable SceneView3D runtime promotion.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Provider contract | pass | `apps/studio/server/provider.mjs` now advertises `reorderLayer`, `fitBounds`, `setFilter`, `setLayerZoomRange`, `setLayout.visibility`, and parses `layout`, `beforeLayerId`, and `bounds`. | Natural-language providers can return schema-shaped capability actions instead of browser-only hints. | Keep provider responses bounded to command-safe payloads; do not promote padding or terrain options in this batch. | high |
| Command-only server mapping | pass | `apps/studio/server/index.mjs` maps provider outputs to `setLayout`, `setFilter`, `setLayerZoomRange`, `reorderLayer`, and `fitBounds` commands; legacy fallback can now fit demo data into view. | Studio mutations stay auditable, replayable, and rollback-safe. | Preserve `MapCommand` as the only mutation path for future camera/layer capability work. | high |
| Frontend camera sync | pass | `apps/studio/src/components/MapStage.tsx` now consumes `summary.bounds` through `map.fitBounds()` when `center/zoom` is absent, and `apps/studio/src/App.tsx` types the new summary shape. | `fitBounds` is no longer a command-only no-op from the user’s perspective. | Keep `center/zoom` precedence ahead of `bounds` to avoid stale mixed view state. | high |
| Public capability docs | pass | `apps/studio/README.md` and `docs/engineering/supported-feature-matrix.md` now name layer filters, visibility, zoom ranges, ordering, and `fitBounds` as the current Studio-facing command loop. | Product-facing docs now match the real Studio surface. | Use this wording as the baseline for future Studio/product review surfaces. | high |
| Focused regression coverage | pass | `tests/studio/studio-maplibre-capabilities.test.ts` and `tests/studio/studio-server.test.ts` cover provider normalization, capability actions, and fit-bounds state flow. | The highest-risk Studio product path now has deterministic regression coverage. | Re-run Studio tests for future provider payload, camera, or capability-summary changes. | high |

## Boundaries Preserved

- No new MCP tool names or aliases.
- No direct browser-side mutation path around `applyCommands`.
- No MapLibre package movement or drift-audit reopening.
- No terrain, projection, sky, light, globe, or feature-state write path.
- No stable `view.mode: "scene3d"` promotion.

## Verification

Required for this implementation handoff:

- `pnpm build:schema`
- `pnpm test:commands`
- `pnpm test:adapter`
- `pnpm test:studio`
- `pnpm test:snapshot:visual`
- `pnpm check`
- `git diff --check`

This report satisfies `TASK-2026W23-MLC-001`.
