# Generation Evidence

Every AI-generated map in GIS Engine produces a **Generation Evidence Bundle** —
a structured, machine-readable record of what the AI planned, what it applied,
and what validation passed or failed. No raw prompts are retained.

## What Is an Evidence Bundle?

An evidence bundle is a single JSON object that captures the full provenance of a
generated map. It answers: what did the AI intend? What commands were applied?
Did validation pass? Can spatial queries be executed? Does the snapshot render?

| Section | Purpose |
|---|---|
| `promptHash` | SHA-256 hash of the original prompt (raw prompt is never stored) |
| `skeleton` | The `MapGenerationCommandSkeleton` — base spec + commands |
| `plannerEvidence` | Planner plan, confidence, accepted/unsupported intent fields |
| `spatialQueryEvidence` | Point/bbox query cases, capability gate, results |
| `snapshotEvidence` | Renderer snapshot pass/fail, data URL presence |
| `exportEvidence` | Source/layer counts, readiness for export |
| `delivery` | Acceptance summary with section-level statuses |
| `exampleEvidence` | Example app manifest and file count |
| `diagnostics` | All visible (error + warning) diagnostics |

## The `GenerationEvidenceBundle` Structure

```typescript
import type { GenerationEvidenceBundle } from "@gis-engine/ai";

interface GenerationEvidenceBundle {
  promptHash: string;
  status: "ready" | "blocked";
  targetDomains: MapGenerationTargetDomain[];
  toolSequence: GisEngineToolName[];
  summary: ContextSummary;
  validation: ValidationReport;
  commandEvidence: GenerationCommandEvidence;
  plannerEvidence: GenerationPlannerEvidence;
  spatialQueryEvidence: GenerationSpatialQueryEvidence;
  snapshotEvidence: GenerationSnapshotEvidence;
  exportEvidence: GenerationExportEvidence;
  delivery: ExampleAppDeliverySummary;
  exampleEvidence: GenerationExampleEvidence;
  diagnostics: Diagnostic[];
}
```

The bundle `status` is `"blocked"` when any section reports an error diagnostic.
Otherwise it is `"ready"`.

## How `createGenerationEvidenceBundle()` Works

The function takes an input object, validates it against
`GenerationEvidenceBundleInputSchema`, and then builds each evidence section:

1. **Validate** the skeleton spec with `validateSpec`.
2. **Build context summary** with `getContextSummary`.
3. **Replay commands** through `applyCommandsTool` to build `commandEvidence`.
4. **Verify planner** hash/trace alignment to build `plannerEvidence`.
5. **Run spatial query cases** (if requested) via a headless adapter.
6. **Take a snapshot** (if the skeleton is not blocked).
7. **Compute export readiness** from the validated spec.
8. **Generate example evidence** via `exportExampleAppTool`.
9. **Collect diagnostics** — only errors and warnings are surfaced.

```typescript
import { createGenerationEvidenceBundle } from "@gis-engine/ai";

const response = await createGenerationEvidenceBundle({
  promptHash: "sha256:abc123...",
  skeleton: commandSkeleton,
  planner: { plan, confidence: { level: "high", score: 1, reasons: [] } },
  spatialQueries: {
    renderer: "mock",
    cases: [
      { id: "q1", operation: "point-query", point: [10, 10] }
    ]
  }
});

if (response.ok) {
  console.log(response.result.status);       // "ready" | "blocked"
  console.log(response.result.delivery);      // acceptance + section statuses
}
```

## Delivery States

The `delivery` field reports whether the generated map can be delivered to the
user. It has four possible states:

| State | Meaning |
|---|---|
| `ready` | All sections pass. The map is deliverable. |
| `blocked` | At least one section has a blocking error. |
| `needs-confirmation` | Sources reference external URLs requiring user approval. |
| `follow-up-required` | Non-blocking gaps remain (e.g. unsupported planner intents, waived spatial queries). |

Each delivery section (`readiness`, `files`, `map-edits`, `data-and-analysis`,
`scene-browsing`) carries its own status, blocker count, and follow-up count.

## CLI Usage

Pass `--generate` (or `-g`) to run the full pipeline and write output files:

```bash
gis-engine my-project --generate --prompt "Show earthquake data on a map"
```

This writes the following files to `./my-project/`:

| File | Content |
|---|---|
| `map.json` | The generated `MapSpec` |
| `preflight.json` | IO-free MapSpec delivery preflight with validation, source readiness, PMTiles load-plan, and diagnostics |
| `delivery-summary.json` | Pipeline, delivery, and preflight summary without raw prompt |
| `evidence.json` | Full `GenerationEvidenceBundle` |
| `diagnostics.json` | All diagnostics (only if non-empty) |

Use `--dry-run` to preview without writing files.

## Programmatic Pipeline

For full control, run the pipeline steps yourself:

```typescript
import { createMapGenerationCommandSkeleton, applyCommands, validateSpec } from "@gis-engine/engine";
import { createGenerationEvidenceBundle, normalizeWorkbenchProviderPlan } from "@gis-engine/ai";

// 1. Normalize the provider plan
const planResponse = normalizeWorkbenchProviderPlan({ providerId: "mock", promptHash, traceId, intent });

// 2. Create the command skeleton
const skeleton = createMapGenerationCommandSkeleton(planResponse.result.plan.request);

// 3. Build the evidence bundle
const evidence = await createGenerationEvidenceBundle({
  promptHash,
  skeleton,
  planner: { plan: planResponse.result.plan }
});
```

## Related

- [AI Package API Reference](/api/ai) — full `@gis-engine/ai` exports
- [Diagnostics](/guide/diagnostics) — structured diagnostic codes
- [MCP Server](/guide/mcp-server) — AI tool integration
