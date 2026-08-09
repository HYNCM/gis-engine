# AI Map Workbench

This reference app exercises command-only mutation, diagnostics, snapshots, exports, and review evidence against a real browser surface.

## Run

```bash
pnpm example:ai-map-workbench
```

Open `http://127.0.0.1:4173`. Mock prompts are deterministic; provider mode is optional and must preserve the same validation and evidence boundary.

Scene browsing is extension-only evidence. Changes here do not promote a stable `view.mode: "scene3d"`; that decision requires adapter, resource-policy, snapshot, and quality-gate evidence.

## Signposts

- [Server](server.mjs)
- [Generation evidence tests](../../tests/ai/generation-evidence.test.ts)
- [Boundary test](../../tests/examples/ai-map-workbench-boundary.test.ts)
- [Product boundary](../../docs/planning/feature-specs/ai-map-workbench-promotion-scope.md)
