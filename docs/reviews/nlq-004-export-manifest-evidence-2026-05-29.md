---
agent: ai-agent
period: 2026-05-29
generated_at: 2026-05-29T09:16:58Z
repo_revision: "0eae2e3705acd9527dd19707f9d6ea43334b06f9"
inputs:
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - docs/reviews/nlq-003-spatial-query-evidence-2026-05-29.md
  - packages/ai/src/tools/exportExampleApp.ts
  - packages/ai/src/tools/generationEvidence.ts
  - packages/ai/src/mcp/server.ts
owner: "@ai-agent"
decision_level: advisory
---

# NLQ-004 Export Manifest Evidence

`TASK-2026W23-NLQ-004` hardens generated-app export manifests without changing
the public MCP tool surface. `export_example_app` can now carry a compact
caller-provided `generationEvidence` summary, and
`createGenerationEvidenceBundle()` automatically supplies that summary from the
current planner, command, spatial query, snapshot, export, and diagnostic
evidence.

## Evidence

| Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Manifest evidence is compact | `ExampleAppGenerationEvidenceSummarySchema` records status, target domains, tool sequence, diagnostic counts, command replay, planner, spatial query, snapshot, and export counts. | Generated-app handoff can surface readiness without embedding full `GenerationEvidenceBundle` payloads. | Keep this summary compact when NLQ-005/NLQ-006 add more readiness fields. | high |
| Export remains side-effect free | `exportExampleAppTool()` still returns `writesFiles: false`, file paths only, and no file content; the optional summary is cloned into the manifest. | AI clients can attach evidence metadata without local writes, network fetches, or resource loading. | Preserve the side-effect-free guard in schema-sync and MCP integration tests. | high |
| No MCP tool aliases were added | Tool list remains the existing seven snake_case names, with `export_example_app` input/output schemas updated in place. | Existing clients see a schema extension, not a new tool contract. | Keep generated-app export polish inside `export_example_app` until a broader packaging contract is approved. | high |
| Sensitive payloads stay out | The manifest summary omits raw prompts, feature payloads, snapshot data URLs, and renderer private objects. | Generated app delivery evidence stays reviewable and small. | If future artifacts need downloadable files, design a separate file-output policy first. | high |

## Gates

- `pnpm --filter @gis-engine/ai build`
- `pnpm test:ai -- tests/ai/generation-evidence.test.ts tests/ai/mcp-integration.test.ts tests/ai/prompt-evidence-scenarios.test.ts`
- `pnpm test:schema-sync`

## Next Handoff

`TASK-2026W23-NLQ-005` can now build the cloud-native source readiness matrix
on top of a handoff path that already exposes planner, spatial query, snapshot,
export, and example manifest evidence.
