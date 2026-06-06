# @gis-engine/cli

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/HYNCM/gis-engine/blob/main/LICENSE)

CLI for scaffolding and generating GIS Engine map projects. Provides three modes: **scaffold** (default) for creating projects from templates, **generate** (`--generate` flag) for running the full AI pipeline from a natural-language prompt to a validated MapSpec bundle, and **preflight** (`--preflight`) for validating a MapSpec JSON file before delivery.

- **Package**: `@gis-engine/cli`
- **Version**: 1.0.0
- **Binary**: `create-gis-map`
- **Repository**: [github.com/HYNCM/gis-engine](https://github.com/HYNCM/gis-engine)

---

## Table of Contents

- [Quickstart](#quickstart)
- [CLI Reference](#cli-reference)
- [Provider Configuration](#provider-configuration)
- [Templates](#templates)
- [Generate Pipeline](#generate-pipeline)
- [Preflight Mode](#preflight-mode)
- [SDK Minimal Use](#sdk-minimal-use)
- [License](#license)

---

## Quickstart

### 1. Scaffold your first project

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
```

This creates a `my-map/` directory using the `static-html` template (default). The output contains a standalone `index.html` with inline GIS Engine CDN imports -- no build step required.

```bash
cd my-map
open index.html
```

### 2. Use a different template

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map -t vite-ts
```

This scaffolds a Vite + TypeScript project. Install dependencies and start the dev server:

```bash
cd my-map
npm install
npm run dev
```

### 3. Run the AI generate pipeline

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate
```

This runs the full generate pipeline with the `mock` provider. Mock mode requires **no API key** and produces deterministic output -- every run yields the same result. The output includes `map.json`, `delivery-summary.json`, `evidence.json`, and `diagnostics.json`.

To use a real provider, set the provider-specific API key and pass a prompt:

```bash
DEEPSEEK_API_KEY=sk-xxx npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -p deepseek --prompt "显示北京地铁站"
```

### 4. Preview without writing

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --dry-run
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate --dry-run
```

The `--dry-run` flag prints what would be created without writing any files.

### 5. Preflight a generated MapSpec

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./map.json
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./map.json --json
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./map.json --require-archive-metadata --pmtiles-metadata parcels=./parcels.metadata.json
```

Preflight mode validates `map.json`, reports structured diagnostics, and checks
the source-readiness and PMTiles runtime load plans without writing files,
fetching resources, starting workers, or parsing PMTiles archives. It exits
non-zero only when validation or PMTiles delivery blockers are present. With
`--require-archive-metadata`, missing PMTiles archive metadata also exits
non-zero.

---

## CLI Reference

### Usage

```
create-gis-map <project-name> [options]
create-gis-map --preflight <map.json> [--json]
```

### Options

| Flag | Alias | Description | Default |
|---|---|---|---|
| `--template <name>` | `-t` | Template: `static-html`, `vite-ts`, `mapspec`, `app` | `static-html` |
| `--provider <id>` | `-p` | Provider profile: `mock`, `deepseek`, `openai` | `mock` |
| `--model <name>` | | Model name for OpenAI-compatible provider | per-provider default |
| `--base-url <url>` | | API base URL for OpenAI-compatible provider | per-provider default |
| `--generate` | `-g` | Run the AI generate pipeline instead of scaffolding | `false` |
| `--prompt <text>` | | Prompt text for generate mode | (built-in default) |
| `--preflight <path>` | | Validate a MapSpec JSON file plus source-readiness and PMTiles load plans without writing files | |
| `--require-archive-metadata` | | Require PMTiles archive metadata for preflight success | `false` |
| `--pmtiles-metadata <source-id=path>` | | Provide PMTiles archive metadata JSON for a source. Repeatable. | |
| `--json` | | Print preflight output as machine-readable JSON | `false` |
| `--api-key <key>` | | API key for OpenAI-compatible providers. Overrides provider-specific env vars (`DEEPSEEK_API_KEY`, `OPENAI_API_KEY`). | (from env) |
| `--timeout <ms>` | | HTTP request timeout in milliseconds for provider API calls | `20000` |
| `--yes` | `-y` | Skip directory-exists check (overwrite). Also accepts `--force`. | `false` |
| `--dry-run` | | Preview files without writing | `false` |
| `--help` | `-h` | Show help message | |
| `--version` | `-v` | Print CLI version | |

### Examples

```bash
# Scaffold with default static-html template
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map

# Scaffold with Vite + TypeScript
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map -t vite-ts

# Scaffold with minimal MapSpec JSON only
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map -t mapspec

# Scaffold with overwrite if directory exists
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map -y

# AI generate with mock provider (default)
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate

# AI generate with deepseek provider
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -p deepseek

# AI generate with deepseek provider and API key inline
DEEPSEEK_API_KEY=sk-xxx npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -p deepseek --prompt "显示北京地铁站"

# AI generate with custom model and base URL
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -p deepseek --model deepseek-chat --base-url https://api.deepseek.com/v1

# AI generate with custom prompt
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate --prompt "A map of NYC parks"

# AI generate with the interactive app scaffold
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -t app -p deepseek --prompt "Build an earthquake explorer"

# AI generate with explicit API key and timeout
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -p openai --api-key sk-xxx --timeout 60000

# Dry-run: preview output without writing
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate --dry-run

# Preflight a generated MapSpec
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./map.json --json

# Require caller-supplied PMTiles archive metadata
npm exec --package @gis-engine/cli@latest -- create-gis-map --preflight ./map.json --require-archive-metadata --pmtiles-metadata parcels=./parcels.metadata.json
```

---

## Provider Configuration

The CLI supports three built-in provider profiles. The provider controls how the generate pipeline produces its plan and commands.

### Provider Profiles

| Provider | Mode | Status | Description |
|---|---|---|---|
| `mock` | mock | ready | Deterministic output, no external calls, no API key required. Default for development and testing. |
| `deepseek` | openai-compatible | requires API key | DeepSeek API. Requires `DEEPSEEK_API_KEY` or `--api-key`. |
| `openai` | openai-compatible | requires API key | OpenAI API. Requires `OPENAI_API_KEY` or `--api-key`. |

### Mock Provider

The `mock` provider requires **no configuration and no API key**. It produces deterministic output suitable for local development, CI pipelines, and testing. Every run with the mock provider yields the same result given the same inputs, making it fully reproducible.

### Real Provider Defaults

The `deepseek` and `openai` providers are OpenAI-compatible and require an API key. Default model and base URL values are:

| Provider | Default Model | Default Base URL | API Key Env Var |
|---|---|---|---|
| `deepseek` | `deepseek-chat` | `https://api.deepseek.com/v1` | `DEEPSEEK_API_KEY` |
| `openai` | `gpt-4o-mini` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |

Override with `--model`, `--base-url`, and `--api-key` flags or the corresponding environment variables.

### API Key Management

Real providers require an API key, resolved in the following priority order:

```
--api-key flag > GIS_ENGINE_API_KEY env var > provider-specific env var (DEEPSEEK_API_KEY / OPENAI_API_KEY)
```

- **`DEEPSEEK_API_KEY`** -- Used when the provider is `deepseek`. Set it in your shell or pass via `--api-key`.
- **`OPENAI_API_KEY`** -- Used when the provider is `openai`. Set it in your shell or pass via `--api-key`.
- **`GIS_ENGINE_API_KEY`** -- A provider-agnostic override that takes precedence over the provider-specific variables above.

If no API key is found, the CLI exits with a clear error message indicating which variable to set.

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
| `GIS_ENGINE_MODEL` | `--model` |
| `GIS_ENGINE_BASE_URL` | `--base-url` |
| `GIS_ENGINE_API_KEY` | `--api-key` |
| `GIS_ENGINE_TIMEOUT` | `--timeout` |

Example:

```bash
export GIS_ENGINE_PROVIDER=deepseek
export DEEPSEEK_API_KEY=sk-xxx
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate
```

### Configuration File

Create `~/.gis-engine/config.json` to set defaults that persist across invocations:

```json
{
  "provider": "deepseek",
  "template": "vite-ts",
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com/v1",
  "apiKey": "sk-xxx",
  "timeout": 20000
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

### app

Full interactive map application (Vite + React + Tailwind). Use this with `--generate -t app` to pair the generated MapSpec with a starter app shell that includes responsive controls, loading/empty/error states, and local `map.json` reload/upload buttons.

Generated files:

| File | Description |
|---|---|
| `package.json` | Project manifest with `@gis-engine/engine`, `maplibre-gl`, React, Tailwind, and Vite dependencies. |
| `vite.config.ts` | Vite config with the React plugin. |
| `tsconfig.json` | TypeScript configuration targeting ES2022 with JSX and bundler resolution. |
| `tailwind.config.js` | Tailwind config for the app shell. |
| `postcss.config.js` | PostCSS config with Tailwind and autoprefixer. |
| `index.html` | Root HTML file mounting the React app. |
| `src/index.css` | Tailwind entry plus MapLibre GL CSS import. |
| `src/vite-env.d.ts` | Vite client typings for JSON, CSS, and asset imports. |
| `src/main.tsx` | React root that renders the generated app. |
| `src/App.tsx` | Map container, status banner, and local `map.json` reload/upload flow that mounts the generated spec and UI components. |
| `src/components/*.tsx` | LayerPanel, FeaturePopup, Legend, SearchBox, and BasemapSwitcher, emitted according to the app config. |
| `map.json` | Starter MapSpec placeholder when scaffolding outside the AI pipeline. |
| `README.md` | Project readme with app type, component list, and usage instructions. |

---

## Generate Pipeline

The `--generate` flag activates the full AI generate pipeline. It transforms a prompt into a validated MapSpec with a complete evidence trail. When the provider infers an app type from the prompt, the pipeline emits the interactive Vite + React + Tailwind scaffold around the generated MapSpec; `--template app` forces the same scaffold explicitly and includes the responsive status/load surface for empty, error, reload, and local file-import flows.

### Pipeline Steps

```
Step 1: Resolve provider intent          (HTTP call for real providers, deterministic for mock)
Step 2: Provider plan normalization      (normalizeWorkbenchProviderPlan)
Step 3: Create command skeleton          (createMapGenerationCommandSkeleton)
Step 4: Apply commands and validate      (applyCommands + validateSpec)
Step 5: Create evidence bundle           (createGenerationEvidenceBundle)
```

**Step 1 -- Resolve provider intent.** The pipeline resolves the user's intent by contacting the selected provider. For real providers (`deepseek`, `openai`), this is an HTTP call to the provider's API using the configured API key and timeout. For the `mock` provider, intent resolution is deterministic and requires no network access -- it returns a fixed intent immediately.

**Step 2 -- Provider plan normalization.** The selected provider profile is validated and normalized into a structured plan. The mock provider resolves with deterministic diagnostics. Real providers incorporate the HTTP response from Step 1 into the normalized plan.

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
| App scaffold files | Conditional | When the app scaffold is emitted, the Vite + React + Tailwind files listed in the `app` template section are written alongside `map.json`. |

### No Raw Prompt Retention

The generate pipeline is designed so that the raw prompt text is never stored in any output file. Only the SHA-256 prompt hash (`sha256:<32-hex>`) is retained. This is reflected in `delivery-summary.json`:

```json
{
  "promptHash": "sha256:0123456789abcdef0123456789abcdef",
  "retainedRawPrompt": false
}
```

The prompt hash allows you to correlate runs without exposing the original prompt content.

### delivery-summary.json Schema

```json
{
  "promptHash": "string (sha256:<32-hex>)",
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

## Preflight Mode

Use `--preflight <map.json>` when a generated or hand-authored MapSpec needs a
CI-friendly delivery check before it reaches an application runtime.

Preflight mode performs:

| Check | Description |
|---|---|
| MapSpec validation | Runs the engine validator and returns schema, semantic, and resource-policy diagnostics. |
| Source readiness | Runs `createSourceReadinessReport()` for every declared source, showing supported, readiness-only, and blocked states plus display/query readiness. |
| PMTiles load plan | Runs `createPMTilesRuntimeLoadPlan()` for PMTiles sources, including URL policy, MapLibre `source-layer` metadata, range-policy requirements, and optional caller-supplied archive metadata. |
| No IO side effects | Reads the supplied JSON file only. It does not create project files, fetch URLs, start workers, or parse PMTiles archives. |

Text output is intended for humans:

```bash
create-gis-map --preflight ./map.json
```

JSON output is intended for CI and release scripts:

```bash
create-gis-map --preflight ./map.json --json
```

PMTiles archive metadata can be supplied per source:

```bash
create-gis-map --preflight ./map.json --require-archive-metadata --pmtiles-metadata parcels=./parcels.metadata.json --json
```

The metadata JSON uses the engine `PMTilesArchiveMetadata` contract:

```json
{
  "specVersion": 3,
  "archiveBytes": 1000000,
  "rootDirectoryOffset": 0,
  "rootDirectoryLength": 1024,
  "hasVectorTiles": true,
  "hasRasterTiles": false,
  "tileType": "vector",
  "minZoom": 0,
  "maxZoom": 14,
  "bounds": [-74.1, 40.6, -73.7, 40.9]
}
```

The result includes `ok`, `status`, `inputs`, `validation`, `sourceReadiness`,
`pmtiles`, and `diagnostics`. `sourceReadiness.status: "follow-up-required"`
can still appear with `ok: true` when sources are valid for display/export but
have explicit follow-up work, such as PMTiles archive parsing or URL GeoJSON
headless query. `status: "blocked"` exits with code `1`. `metadata-required`
exits with code `1` only when `--require-archive-metadata` is set; otherwise it
remains a readiness signal.

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
  createMapGenerationCommandSkeleton,
  applyCommands,
  validateSpec,
} from "@gis-engine/engine";
import {
  resolveProviderIntent,
  normalizeWorkbenchProviderPlan,
  createGenerationEvidenceBundle,
} from "@gis-engine/ai";

// 1. Resolve provider intent (HTTP call for real providers, deterministic for mock)
const intent = await resolveProviderIntent({
  providerId: "mock",
  prompt: "A map of NYC parks",
});

// 2. Normalize provider plan
const providerResult = normalizeWorkbenchProviderPlan({
  providerId: "mock",
  intent,
});

// 3. Create command skeleton
const skeleton = createMapGenerationCommandSkeleton(providerResult.plan);

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
  planner: { plan: providerResult.plan },
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
