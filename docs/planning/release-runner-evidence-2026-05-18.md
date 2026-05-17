---
agent: quality-guardian
period: 2026-05-18
generated_at: 2026-05-18T01:19:00Z
repo_revision: "ef11bba"
inputs:
  - package.json
  - tests/snapshot/visual/maplibre-visual.spec.ts
  - docs/planning/v0.2-gate-checklist.md
decision_level: release-evidence
---

# Release Runner Evidence: 2026-05-18

## Command

```bash
pnpm -s test:release:strict
```

## Result

Passed in a release-capable local runner after moving outside the default macOS
sandbox.

The first sandboxed run confirmed deterministic gates passed but strict visual
snapshot failed because Chromium could not register its Mach port:

```txt
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)
```

The release-capable rerun passed:

- `pnpm build:schema`
- `pnpm check`
- `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual`

Visual coverage:

- GeoJSON MapLibre visual snapshot: passed.
- Generated local MVT release acceptance snapshot: passed.
- `fill-extrusion-lite` beta visual snapshot: passed.

## Notes

This evidence closes the strict visual runner gap for the current local release
candidate and adds gated 2.5D visual coverage. CI runners still need
Chromium/WebGL/Mach-port permissions; otherwise they should fail fast in strict
mode rather than silently downgrade visual coverage.
