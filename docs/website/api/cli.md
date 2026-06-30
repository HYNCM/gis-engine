# @gis-engine/cli

`@gis-engine/cli` is the developer entrypoint package for GIS Engine v1.1.0.

## What Lives Here

- `create-gis-map` scaffolding and generate pipeline entrypoints
- programmatic preflight and artifact verification helpers
- provider profile/config resolution
- template metadata and generated file helpers

## Reading Order

1. Use the [Guide quick start](/guide/quick-start) for the shortest first-run
   path.
2. Use the [CLI generated reference](/api/reference/cli/) for exact exported
   functions and types.
3. Use the package README in the repo for command examples and workflow detail.

## Key Boundaries

- This sprint does not add new CLI flags or change JSON output shapes.
- Human-readable errors may improve, but existing machine-readable preflight and
  artifact verification contracts stay intact.
- The CLI remains the recommended first-run path for new users.

## Reference

- Generated reference: [/api/reference/cli/](/api/reference/cli/)
