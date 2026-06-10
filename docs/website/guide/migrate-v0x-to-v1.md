# Migrate from v0.x to v1.0

Use this page as the docs-site entry point for GIS Engine `v1.0.0` upgrades.

## Who Should Start Here

- `0.2.x` users adopting the stable SDK + CLI line
- `0.3.x` users already using provider HTTP integration
- `0.4.x` users moving generated-app workflows into the stable release line

## Main Upgrade Notes

- Update package versions to `^1.0.0`.
- Keep the public MCP tool surface unchanged; no alias migration is required.
- Treat generated-app delivery evidence, preflight, and artifact verification as
  the supported reviewer/CI handoff path.
- Keep SceneView3D stable runtime and runtime-blocked cloud-native loaders out
  of release claims.

## Continue Reading

- Repo migration guide: [docs/migration/v0.x-to-v1.0.md](https://github.com/HYNCM/gis-engine/blob/main/docs/migration/v0.x-to-v1.0.md)
- Prior step detail: [/guide/quick-start](/guide/quick-start)
- Release notes: [/release-notes](/release-notes)
