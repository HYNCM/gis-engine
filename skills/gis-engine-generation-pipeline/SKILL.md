---
name: gis-engine-generation-pipeline
description: >
  Use the GIS Engine CLI generation pipeline to transform natural-language prompts
  into validated MapSpec documents with a full evidence trail. Use when generating
  maps from text descriptions, running the AI generate workflow, using the mock
  provider for deterministic output, understanding the Generation Evidence Bundle,
  or integrating the pipeline into CI. Covers create-gis-map --generate, all
  pipeline steps, output files, provider configuration, and programmatic SDK usage.
metadata:
  author: gis-engine
  version: "1.0"
  package: "@gis-engine/cli"
---

# Generation Pipeline Guide

The GIS Engine CLI `--generate` flag runs a 5-step AI pipeline that transforms
a natural-language prompt into a validated MapSpec with a complete evidence
trail. This is the recommended path for AI-assisted map creation.

## Quick Start

### Generate with Mock Provider (Default)

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate
```

The mock provider requires **no API key** and produces deterministic output.
Every run yields the same result, making it ideal for testing and CI.

### Generate with a Real Provider

```bash
# DeepSeek
DEEPSEEK_API_KEY=sk-xxx npm exec --package @gis-engine/cli@latest -- \
  create-gis-map my-map --generate -p deepseek --prompt "Show Beijing subway stations"

# OpenAI
OPENAI_API_KEY=sk-xxx npm exec --package @gis-engine/cli@latest -- \
  create-gis-map my-map --generate -p openai --prompt "A map of NYC parks"
```

### Preview Without Writing

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate --dry-run
```

## Pipeline Steps

```
Step 1: Resolve provider intent        → HTTP call (real) or deterministic (mock)
Step 2: Normalize provider plan        → Validate and structure the provider output
Step 3: Create command skeleton        → Decompose into base spec + commands
Step 4: Apply commands and validate    → Execute commands, validate result
Step 5: Create evidence bundle         → Assemble all artifacts for audit
```

### Step 1: Resolve Provider Intent

For real providers, the CLI sends the prompt to the configured LLM API and
receives a structured intent response. For the mock provider, intent is
deterministic and requires no network access.

### Step 2: Normalize Provider Plan

The provider output is validated against the workbench provider plan schema.
The plan must use `promptHash` (not raw prompt) and structured `intent`.
Forbidden fields: `rawPrompt`, `prompt`, `promptText`, `javascript`,
`commands`, `mapSpec`, `patch`.

### Step 3: Create Command Skeleton

The plan is decomposed into:
- **baseSpec**: a minimal valid MapSpec
- **commands**: an ordered sequence of MapCommands that build the full map

This skeleton is fully replayable — applying the same commands to the same
base always produces the same result.

### Step 4: Apply Commands and Validate

Commands are applied to the base spec. The result is validated against the
MapSpec schema. This step produces source counts, layer counts, and
validation diagnostics.

### Step 5: Create Evidence Bundle

All pipeline artifacts are assembled into a signed evidence bundle. The raw
prompt is never included — only its SHA-256 hash.

## Output Files

After a successful generate run, these files are written:

| File | Always | Description |
|---|---|---|
| `map.json` | Yes | The generated, validated MapSpec document. |
| `preflight.json` | Yes | Delivery preflight: validation + source readiness + PMTiles load plan. |
| `delivery-summary.json` | Yes | Pipeline metadata, delivery status, source readiness, follow-ups. |
| `REVIEW.md` | Yes | Human-readable review handoff for the first reviewer to open. |
| `artifact-manifest.json` | Yes | File list with roles, byte sizes, and sha256 hashes. |
| `evidence.json` | Yes | Full evidence bundle with all pipeline artifacts. |
| `diagnostics.json` | Only when present | Aggregated diagnostics from plan, skeleton, and validation. |
| App scaffold files | Conditional | Vite + React + Tailwind files when app template is emitted. |

### map.json

The core output. A valid MapSpec v0.1 document ready for rendering:

```json
{
  "version": "0.1",
  "view": { "center": [116.4, 39.9], "zoom": 10 },
  "sources": {
    "data": { "type": "geojson", "data": "..." }
  },
  "layers": [
    { "id": "data-circle", "type": "circle", "source": "data", "paint": {...} }
  ]
}
```

### artifact-manifest.json

Machine-readable file integrity manifest:

```json
{
  "schemaVersion": "gis-engine.generate-artifact-manifest.v1",
  "projectName": "my-map",
  "provider": "mock",
  "promptHash": "sha256:<hex>",
  "traceId": "cli-<timestamp36>",
  "retainedRawPrompt": false,
  "requiredReviewFiles": ["map.json", "preflight.json", "delivery-summary.json", "REVIEW.md"],
  "files": [
    { "path": "map.json", "role": "mapspec", "required": true, "bytes": 1234, "sha256": "sha256:<hex>" }
  ]
}
```

### delivery-summary.json

Delivery status and review readiness:

```json
{
  "promptHash": "sha256:...",
  "provider": "mock",
  "validation": { "valid": true, "sourceCount": 2, "layerCount": 3 },
  "delivery": {
    "status": "ready",
    "acceptance": { "state": "ready", "ready": true },
    "sourceReadiness": { "total": 2, "supported": 2, "blocked": 0 }
  },
  "retainedRawPrompt": false
}
```

## Provider Configuration

### Built-in Providers

| Provider | Mode | API Key | Default Model |
|---|---|---|---|
| `mock` | mock | None required | N/A |
| `deepseek` | openai-compatible | `DEEPSEEK_API_KEY` | `deepseek-chat` |
| `openai` | openai-compatible | `OPENAI_API_KEY` | `gpt-4o-mini` |

### API Key Resolution

```
--api-key flag > GIS_ENGINE_API_KEY env > provider-specific env (DEEPSEEK_API_KEY / OPENAI_API_KEY)
```

### Configuration File

Create `~/.gis-engine/config.json` for persistent defaults:

```json
{
  "provider": "deepseek",
  "template": "vite-ts",
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com/v1",
  "timeout": 20000
}
```

### Configuration Priority

```
CLI flags > environment variables > ~/.gis-engine/config.json > defaults
```

## Templates

Use `--template` / `-t` to control the output format:

| Template | Description | Best For |
|---|---|---|
| `static-html` (default) | Standalone HTML with CDN imports | Quick preview, no build step |
| `vite-ts` | Vite + TypeScript project | Development with hot reload |
| `mapspec` | MapSpec JSON only | Integration with existing apps |
| `app` | Vite + React + Tailwind | Full interactive map application |

### App Template with Generate

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-app --generate -t app -p deepseek --prompt "Build an earthquake explorer"
```

The `app` template includes a React UI with `validateSpec()` feedback,
map.json reload/upload/download, delivery summary display, and artifact
integrity verification in the browser.

## Post-Generation Verification

### Preflight Check

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./my-map/map.json --json
```

### Artifact Verification

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map --verify-artifacts ./my-map --json
```

## Programmatic SDK Usage

```typescript
import {
  createMapGenerationCommandSkeleton,
  applyCommands,
  validateSpec,
} from "@gis-engine/engine";
import {
  resolveProviderIntent,
  normalizeWorkbenchProviderPlan,
  createGenerationEvidenceBundle,
} from "@gis-engine/ai";

// 1. Resolve intent
const intent = await resolveProviderIntent({
  providerId: "mock",
  prompt: "A map of NYC parks",
});

// 2. Normalize plan
const providerResult = normalizeWorkbenchProviderPlan({
  providerId: "mock",
  intent,
});

// 3. Create command skeleton
const skeleton = createMapGenerationCommandSkeleton(providerResult.plan);

// 4. Apply and validate
const applied = applyCommands(skeleton.baseSpec, skeleton.commands, {
  collectTrace: true,
  traceId: "sdk-example",
});
const validation = validateSpec(applied.spec);
console.log("Valid:", validation.valid);
console.log("Sources:", validation.stats.sourceCount);
console.log("Layers:", validation.stats.layerCount);

// 5. Evidence bundle
const evidence = await createGenerationEvidenceBundle({
  promptHash: "sha256:abc123...",
  skeleton,
  planner: { plan: providerResult.plan },
});
```

## CI Integration

### Deterministic CI Pipeline

```yaml
# GitHub Actions example
- name: Generate map with mock provider
  run: npx @gis-engine/cli create-gis-map ci-map --generate

- name: Verify preflight
  run: npx @gis-engine/cli --preflight ./ci-map/map.json --json

- name: Verify artifacts
  run: npx @gis-engine/cli --verify-artifacts ./ci-map --json
```

The mock provider guarantees deterministic output, so CI runs are reproducible.

### Real Provider in CI

```yaml
- name: Generate with DeepSeek
  env:
    DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
  run: npx @gis-engine/cli create-gis-map my-map --generate -p deepseek --prompt "Earthquake map"
```

## Evidence Bundle Structure

The `evidence.json` file contains all pipeline artifacts for auditing:

```json
{
  "promptHash": "sha256:<hex>",
  "traceId": "cli-<timestamp36>",
  "provider": "mock",
  "retainedRawPrompt": false,
  "plan": { "status": "ok", "commands": [...] },
  "skeleton": { "baseSpec": {...}, "commands": [...] },
  "validation": { "valid": true, "diagnostics": [] },
  "contextSummary": { "sourceCount": 2, "layerCount": 3 },
  "generatedAt": "2026-07-01T00:00:00Z"
}
```

The raw prompt text is never stored. Only the SHA-256 hash is retained for
correlation without exposing prompt content.

## Tips

- Always start with `mock` provider during development — it is fast, free, and deterministic.
- Use `--dry-run` to preview what the pipeline would generate before writing files.
- Run `--preflight` on `map.json` before delivering to a reviewer or deploying.
- Run `--verify-artifacts` in CI to confirm file integrity.
- Open `REVIEW.md` first when reviewing a generated map — it summarizes all evidence.
- The `app` template provides the richest review experience with in-browser validation.
- Never store API keys in code or config files committed to version control.
