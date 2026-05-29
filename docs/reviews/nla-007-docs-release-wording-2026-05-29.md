---
agent: docs-agent
period: 2026-W23
generated_at: 2026-05-29T07:32:17Z
repo_revision: "7c8aabd471a20a4ec737fa82becb043a97cb27da"
inputs:
  - README.md
  - CHANGELOG.md
  - docs/README.md
  - docs/spec/contracts-and-interfaces.md
  - docs/engineering/supported-feature-matrix.md
  - docs/planning/feature-specs/natural-language-map-app-generation.md
  - packages/ai/README.md
  - examples/ai-map-edit/README.md
  - docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md
owner: "@docs-agent"
decision_level: advisory
---

# NLA-007 Docs And Release Wording

## Summary

`TASK-2026W23-NLA-007` aligns public docs, package docs, examples, and release
wording with the tested natural-language generation evidence loop.

The docs now describe generation as evidence-first orchestration:

```txt
prompt -> capabilitySummary -> MapGenerationCommandSkeleton -> apply_commands -> diagnostics -> snapshot/export/example evidence
```

No stable SceneView3D runtime wording was promoted.

## Evidence

- Evidence: `README.md` now names the command skeleton and generation evidence
  bundle, links the natural-language generation spec/sprint/report, and states
  that no embedded free-form prompt parser is shipped yet.
- Impact: user and product clarity; the project headline matches the actual
  command/evidence implementation.
- Action: keep README wording synced when a real planner/parser is introduced.
- Confidence: high.

- Evidence: `packages/ai/README.md` documents
  `createGenerationEvidenceBundle()` as a helper that composes existing tools
  instead of adding a new MCP alias.
- Impact: MCP contract stability; integrators see the correct orchestration
  route and the blocked stable SceneView3D boundary.
- Action: update this section only when the public tool list or bundle schema
  changes.
- Confidence: high.

- Evidence: `docs/spec/contracts-and-interfaces.md` now records the
  natural-language generation evidence contract, including command-only
  mutation, blocked readiness semantics, and no `generate_map_app` shortcut.
- Impact: architecture; future implementation slices have a public contract to
  review against.
- Action: keep this contract aligned with TypeBox schemas and AI tests.
- Confidence: high.

- Evidence: `docs/engineering/supported-feature-matrix.md`,
  `docs/planning/feature-specs/natural-language-map-app-generation.md`, and
  `CHANGELOG.md` now include the NLA-002 through NLA-006 implementation state.
- Impact: release wording; the feature is described as prompt evidence, not as
  unsupported geoprocessing or stable 3D runtime.
- Action: `NLA-008` can serialize the final handoff with docs evidence.
- Confidence: high.

- Evidence: `examples/ai-map-edit/README.md` explains replayable command
  delivery, audit provenance, `sourcePromptHash`, and the stable `scene3d`
  limitation.
- Impact: developer experience; the existing example now teaches the evidence
  path without changing runtime behavior.
- Action: include this README in future export manifest work only if the public
  example-file contract is intentionally expanded.
- Confidence: high.

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test:examples` | pass | 9 bundled example tests passed |
| `pnpm check` | pass | full deterministic gate passed, including AI prompt evidence and smoke snapshots |
| `git diff --check` | pass | no whitespace errors |

## Next Handoff

`TASK-2026W23-NLA-008` should serialize the final planning handoff after the
docs gate evidence is recorded.
