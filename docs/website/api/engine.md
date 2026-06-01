# @gis-engine/engine

Core package: MapSpec runtime, command system, diagnostics, renderer adapters.

## Quick Install

::: code-group
```bash [npm]
npm install @gis-engine/engine
```
```bash [pnpm]
pnpm add @gis-engine/engine
```
```html [CDN]
<script type="module">
import { createMap, applyCommands } from "https://unpkg.com/@gis-engine/engine";
</script>
```
:::

## Core API

### createMap()

Create a map instance with a MapSpec and optional renderer adapter.

```typescript
import { createMap } from "@gis-engine/engine";

const map = await createMap(container, spec, {
  renderer: "maplibre",  // or "mock"
});

// Map is now rendered
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `HTMLElement \| string` | DOM element or selector |
| `spec` | `MapSpec` | Map specification document |
| `options.renderer` | `"maplibre" \| "mock"` | Renderer adapter |

### applyCommands()

Edit a map through the command system. All mutations are dry-run capable,
rollback-friendly, and deterministic.

```typescript
import { applyCommands } from "@gis-engine/engine";

const result = await applyCommands(spec, [
  { type: "setPaint", layerId: "my-layer", paint: { "circle-color": "#ef4444" } },
]);

// result.status === "applied"
// result.spec        → updated MapSpec
// result.revision    → new revision number
// result.diagnostics → structured diagnostics
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `spec` | `MapSpec` | Base map specification |
| `commands` | `MapCommand[]` | Commands to apply |
| `options.dryRun` | `boolean` | Preview without committing |
| `options.collectTrace` | `boolean` | Return audit trace |

### validateSpec()

Validate a MapSpec document against schema, semantics, expressions, and resource policy.

```typescript
import { validateSpec } from "@gis-engine/engine";

const result = validateSpec(spec);
// result.valid        → boolean
// result.diagnostics  → Diagnostic[]
```

### transformMapSpecToMapLibreStyle()

Convert a MapSpec to a MapLibre GL style object.

```typescript
import { transformMapSpecToMapLibreStyle } from "@gis-engine/engine";

const result = transformMapSpecToMapLibreStyle(spec);
// result.style         → MapLibreStyle | null
// result.diagnostics   → Diagnostic[]
```

## Renderer Adapters

### MockAdapter

Deterministic adapter for testing. No browser, GPU, or WebGL required.

```typescript
import { MockAdapter, registerAdapter } from "@gis-engine/engine";

registerAdapter("mock", () => new MockAdapter());
```

### MapLibreAdapter

Real MapLibre GL JS rendering adapter.

```typescript
import { MapLibreAdapter, registerAdapter } from "@gis-engine/engine";

registerAdapter("maplibre", () => new MapLibreAdapter());
```

## Source Loaders

```typescript
import { SOURCE_CAPABILITY_PRESETS } from "@gis-engine/engine";

// Pre-built source capability presets for:
// - GeoJSON (inline + URL)
// - Raster tiles (XYZ)
// - PMTiles
// - Vector tiles (MVT/TileJSON)
```

## Diagnostics

All errors are structured:

```typescript
interface Diagnostic {
  code: string;        // e.g. "LAYER.SOURCE_NOT_FOUND"
  severity: "error" | "warning" | "info";
  path: string;        // JSON Pointer
  message: string;
  fix?: string;        // Suggested fix
}
```

## Resource Policy

```typescript
import { defaultResourcePolicy, validateResourceUrl } from "@gis-engine/engine";

const result = validateResourceUrl("https://example.com/tiles/{z}/{x}/{y}.png");
// result.allowed → boolean
```

## Generation

```typescript
import {
  planMapGenerationRequest,
  createMapGenerationCommandSkeleton,
} from "@gis-engine/engine";

const plan = planMapGenerationRequest({ promptHash, intent });
const skeleton = createMapGenerationCommandSkeleton({ ...plan.request, baseSpec });
// skeleton.commands → MapCommand[] ready for applyCommands()
```
