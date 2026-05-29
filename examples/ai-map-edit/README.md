# AI Map Edit Example

This example shows the current generated-app handoff shape without requiring a
free-form prompt parser.

- `before.map.json` is the schema-valid base `MapSpec`.
- `commands.json` is the minimal generated edit that can be replayed through
  `apply_commands`.
- `audit.commands.json` adds agent provenance, `createdAt`, and
  `sourcePromptHash` for review flows that call `apply_commands` with
  `collectTrace: true`.

Prompt-level generation should treat this example as delivery evidence only
after validation, command replay, snapshot evidence, and export/example
evidence pass. Scene browsing output remains under `extensions.scene3d`;
stable `view.mode: "scene3d"` is not part of this example.
