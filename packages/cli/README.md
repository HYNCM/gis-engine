# @gis-engine/cli

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/HYNCM/gis-engine/blob/main/LICENSE)

CLI for scaffolding and generating GIS Engine map projects. Provides two modes: **scaffold** (default) for creating projects from templates, and **generate** (`--generate` flag) for running the full AI pipeline from a natural-language prompt to a validated MapSpec bundle.

- **Package**: `@gis-engine/cli`
- **Binary**: `create-gis-map`
- **Repository**: [github.com/HYNCM/gis-engine](https://github.com/HYNCM/gis-engine)

---

## Table of Contents

- [Quickstart](#quickstart)
- [CLI Reference](#cli-reference)
- [Provider Configuration](#provider-configuration)
- [Templates](#templates)
- [Generate Pipeline](#generate-pipeline)
- [SDK Minimal Use](#sdk-minimal-use)
- [License](#license)

---

## Quickstart

### 1. Scaffold your first project

```bash
npx create-gis-map my-map
```

This creates a `my-map/` directory using the `static-html` template (default). The output contains a standalone `index.html` with inline GIS Engine CDN imports -- no build step required.

```bash
cd my-map
open index.html
```

### 2. Use a different template

```bash
npx create-gis-map my-map -t vite-ts
```

This scaffolds a Vite + TypeScript project. Install dependencies and start the dev server:

```bash
cd my-map
npm install
npm run dev
```

### 3. Run the AI generate pipeline

```bash
npx create-gis-map my-map --generate
```

This runs the full generate pipeline with the `mock` provider (deterministic, no external calls). The output includes `map.json`, `delivery-summary.json`, `evidence.json`, and `diagnostics.json`.

To use a real provider:

```bash
npx create-gis-map my-map --generate -p deepseek --prompt "A map of NYC parks"
```

### 4. Preview without writing

```bash
npx create-gis-map my-map --dry-run
npx create-gis-map my-map --generate --dry-run
```

The `--dry-run` flag prints what would be created without writing any files.

---

## CLI Reference

### Usage

```
create-gis-map <project-name> [options]
```

### Options

| Flag | Alias | Description | Default |
|---|---|---|---|
| `--template <name>` | `-t` | Template: `static-html`, `vite-ts`, `mapspec` | `static-html` |
| `--provider <id>` | `-p` | Provider profile: `mock`, `deepseek`, `openai` | `mock` |
| `--generate` | `-g` | Run the AI generate pipeline instead of scaffolding | `false` |
| `--prompt <text>` | | Prompt text for generate mode | (built-in default) |
| `--dry-run` | | Preview files without writing | `false` |
| `--help` | `-h` | Show help message | |
| `--version` | `-v` | Print CLI version | |

### Examples

```bash
# Scaffold with default static-html template
npx create-gis-map my-map

# Scaffold with Vite + TypeScript
npx create-gis-map my-map -t vite-ts

# Scaffold with minimal MapSpec JSON only
npx create-gis-map my-map -t mapspec

# AI generate with mock provider (default)
npx create-gis-map my-map --generate

# AI generate with deepseek provider
npx create-gis-map my-map --generate -p deepseek

# AI generate with custom prompt
npx create-gis-map my-map --generate --prompt "A map of NYC parks"

# Dry-run: preview output without writing
npx create-gis-map my-map --generate --dry-run
```

---

## Provider Configuration

The CLI supports three built-in provider profiles. The provider controls how the generate pipeline produces its plan and commands.

### Provider Profiles

| Provider | Mode | Status | Description |
|---|---|---|---|
| `mock` | mock | ready | Deterministic output, no external calls. Default for development and testing. |
| `deepseek` | openai-compatible | unconfigured | DeepSeek API. Requires base URL and API key. |
| `openai` | openai-compatible | unconfigured | OpenAI API. Requires base URL and API key. |

The `mock` provider requires no configuration and produces deterministic output suitable for local development and CI. The `deepseek` and `openai` providers are OpenAI-compatible and require server-side configuration.

### Configuration Priority

Configuration is resolved in the following order, where earlier sources take precedence:

```
CLI flags > environment variables > ~/.gis-engine/config.json > defaults
```

### Environment Variables

| Variable | Maps to |
|---|---|
| `GIS_ENGINE_PROVIDER` | `--provider` |
| `GIS_ENGINE_TEMPLATE` | `--template` |
| `GIS_ENGINE_PROMPT` | `--prompt` |

Example:

```bash
export GIS_ENGINE_PROVIDER=deepseek
npx create-gis-map my-map --generate
```

### Configuration File

Create `~/.gis-engine/config.json` to set defaults that persist across invocations:

```json
{
  "provider": "deepseek",
  "template": "vite-ts"
}
```

The file is optional. If absent, the CLI falls through to defaults (`mock` provider, `static-html` template).

---

## Templates

Templates control which files are created during scaffold mode.

### static-html

**Default.** A standalone HTML file with inline GIS Engine CDN imports. No build tooling required.

Generated files:

| File | Description |
|---|---|
| `index.html` | Self-contained HTML page with `<script type="module">` importing `@gis-engine/engine` from unpkg CDN. Includes a starter MapSpec with a GeoJSON source and circle layer. |
| `README.md` | Project readme with usage instructions. |

### vite-ts

A Vite + TypeScript project with proper module resolution, type checking, and hot reload.

Generated files:

| File | Description |
|---|---|
| `package.json` | Project manifest with `@gis-engine/engine`, `@gis-engine/ai`, TypeScript, and Vite as dependencies. |
| `tsconfig.json` | TypeScript configuration targeting ES2022 with bundler module resolution. |
| `index.html` | Entry HTML loading `src/main.ts` as a module script. |
| `src/main.ts` | TypeScript entry point calling `createMap()` with a typed MapSpec. |
| `README.md` | Project readme with usage instructions. |

### mapspec

Minimal output: a MapSpec JSON file only. Use this when you want to supply your own application shell.

Generated files:

| File | Description |
|---|---|
| `map.json` | A valid MapSpec v0.2 document with an empty GeoJSON source and a circle layer. Load it with any GIS Engine runtime. |
| `README.md` | Project readme with usage instructions. |

---

## Generate Pipeline

The `--generate` flag activates the full AI generate pipeline. Instead of scaffolding template files, the pipeline transforms a prompt into a validated MapSpec with a complete evidence trail.

### Pipeline Steps

```
Step 1: Provider plan normalization
Step 2: Plan map generation request    (planMapGenerationRequest)
Step 3: Create command skeleton        (createMapGenerationCommandSkeleton)
Step 4: Apply commands and validate     (applyCommands + validateSpec)
Step 5: Create evidence bundle         (createGenerationEvidenceBundle)
```

**Step 1 -- Provider plan normalization.** The selected provider profile is validated and normalized. The mock provider resolves immediately with deterministic diagnostics. OpenAI-compatible providers require server-side configuration and will report `unconfigured` status at the CLI level.

**Step 2 -- Plan map generation request.** The planner converts the normalized provider plan and intent into a structured `MapGenerationRequest` describing what should be generated.

**Step 3 -- Create command skeleton.** The request is decomposed into a base spec and a sequence of commands (the command-pattern skeleton). Each command represents a discrete, replayable edit to the spec.

**Step 4 -- Apply commands and validate.** Commands are applied to the base spec in order. The resulting spec is validated against the MapSpec schema. This step produces source counts, layer counts, and validation diagnostics.

**Step 5 -- Create evidence bundle.** All pipeline artifacts (prompt hash, plan, skeleton, validation results) are assembled into a signed evidence bundle. The raw prompt is never included.

### Output Files

After a successful generate run, the following files are written to the project directory:

| File | Always written | Description |
|---|---|---|
| `map.json` | Yes | The generated and validated MapSpec document. |
| `delivery-summary.json` | Yes | Pipeline metadata: prompt hash, trace ID, provider, plan status, command count, validation results. Does not contain the raw prompt. |
| `evidence.json` | Yes (when bundle succeeds) | Full evidence bundle with all pipeline artifacts for auditing and replay. |
| `diagnostics.json` | Only when diagnostics exist | Aggregated diagnostics from the plan, skeleton, and validation steps. |

### No Raw Prompt Retention

The generate pipeline is designed so that the raw prompt text is never stored in any output file. Only the SHA-256 prompt hash (truncated to 16 hex characters) is retained. This is reflected in `delivery-summary.json`:

```json
{
  "promptHash": "a1b2c3d4e5f67890",
  "retainedRawPrompt": false
}
```

The prompt hash allows you to correlate runs without exposing the original prompt content.

### delivery-summary.json Schema

```json
{
  "promptHash": "string (16-char hex SHA-256 prefix)",
  "traceId": "string (cli-<timestamp36>)",
  "provider": "string (provider profile id)",
  "providerDiagnostics": ["string"],
  "planStatus": "string",
  "commandCount": "number",
  "validation": {
    "valid": "boolean",
    "sourceCount": "number",
    "layerCount": "number"
  },
  "evidenceStatus": "ok | diagnostics",
  "retainedRawPrompt": false,
  "generatedAt": "string (ISO 8601)"
}
```

---

## SDK Minimal Use

You do not need the CLI to use GIS Engine. The `@gis-engine/engine` and `@gis-engine/ai` packages can be used directly as libraries.

### Install

```bash
npm install @gis-engine/engine @gis-engine/ai
```

### Render a map

```ts
import { createMap } from "@gis-engine/engine";

const spec = {
  version: "0.2" as const,
  sources: {
    points: {
      type: "geojson" as const,
      data: { type: "FeatureCollection" as const, features: [] },
    },
  },
  layers: [
    {
      id: "points-layer",
      type: "circle" as const,
      source: "points",
      paint: { "circle-radius": 6, "circle-color": "#3b82f6" },
    },
  ],
};

const container = document.getElementById("map")!;
const map = await createMap(container, spec, { renderer: "maplibre" });
```

### Programmatic generate pipeline

```ts
import {
  planMapGenerationRequest,
  createMapGenerationCommandSkeleton,
  applyCommands,
  validateSpec,
} from "@gis-engine/engine";
import {
  createGenerationEvidenceBundle,
  normalizeWorkbenchProviderPlan,
} from "@gis-engine/ai";

// 1. Normalize provider plan
const providerResult = normalizeWorkbenchProviderPlan({
  providerId: "mock",
  intent: { targetDomains: ["feature-display"] },
});

// 2. Plan generation request
const plan = planMapGenerationRequest({
  promptHash: "abc123",
  traceId: "sdk-example",
  plannerId: "sdk-mock",
  intent: { targetDomains: ["feature-display"] },
});

// 3. Create command skeleton
const skeleton = createMapGenerationCommandSkeleton(plan.request);

// 4. Apply commands and validate
const applied = applyCommands(skeleton.baseSpec, skeleton.commands, {
  collectTrace: true,
  traceId: "sdk-example",
});
const validation = validateSpec(applied.spec);

// 5. Create evidence bundle
const evidence = await createGenerationEvidenceBundle({
  promptHash: "abc123",
  skeleton,
  planner: { plan },
});
```

### Key packages

| Package | Description |
|---|---|
| `@gis-engine/engine` | Core runtime: MapSpec schema, command system, validation, diagnostics, snapshots, renderer adapters. |
| `@gis-engine/ai` | AI and MCP tools: provider plan normalization, evidence bundles, structured output, MCP server. |
| `@gis-engine/cli` | This package. Thin orchestration layer over `engine` and `ai`. |

---

## License

[Apache-2.0](https://github.com/HYNCM/gis-engine/blob/main/LICENSE)
