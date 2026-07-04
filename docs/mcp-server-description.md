# GIS Engine MCP Server

AI-native map editing tools for Claude Desktop, Cursor, and any Model Context
Protocol (MCP) client. GIS Engine exposes 14 structured tools that validate,
mutate, summarize, snapshot, compare, generate, edit, query, inspect, style,
and transform declarative MapSpec documents and GeoJSON data — all with
structured diagnostics and schema-enforced contracts.

**Package:** `@gis-engine/ai` (v1.4.0)
**License:** Apache-2.0
**Repository:** https://github.com/HYNCM/gis-engine
**Docs:** https://gis-engine.dev

---

## Quick Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "@gis-engine/ai"]
    }
  }
}
```

### Cursor

Add the same JSON block to your Cursor MCP settings
(`Settings → MCP → Add new global MCP server config`).

### Smithery

```bash
npx -y @smithery/cli install @gis-engine/ai --client claude
```

### LobeHub

Import the following MCP plugin configuration via
`Settings → Plugins → Add MCP Plugin → JSON Import`:

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "@gis-engine/ai"]
    }
  }
}
```

---

## Tools (14 total)

### `validate_spec`

Validate a MapSpec document against the schema and return a validation report.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `spec` | `MapSpec` | Yes | The map specification to validate |

**Output:** `{ valid, diagnostics[], stats: { sourceCount, layerCount, visibleLayerCount } }`

**Example:**

```json
{
  "name": "validate_spec",
  "arguments": {
    "spec": {
      "version": "1.0",
      "view": { "center": [0, 0], "zoom": 2 },
      "sources": {},
      "layers": []
    }
  }
}
```

---

### `apply_commands`

Apply a series of MapCommands to a MapSpec to modify the map state. Supports
dry-run, atomic/best-effort transactions, and optional trace collection.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `spec` | `MapSpec` | Yes | The base map specification |
| `commands` | `MapCommand[]` | Yes | Array of commands to apply |
| `dryRun` | `boolean` | No | If true, simulate without committing |
| `transaction` | `"atomic" \| "best-effort"` | No | Transaction mode |
| `collectTrace` | `boolean` | No | Include command provenance in result |
| `traceId` | `string` | No | Optional trace identifier |

**Output:** `{ spec, results[], transaction, dryRun, committed, rolledBack, traceId, traces[] }`

---

### `export_spec`

Return a validated, optionally command-modified MapSpec for deployment.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `spec` | `MapSpec` | Yes | The map specification to export |
| `commands` | `MapCommand[]` | No | Optional commands to apply before export |
| `dryRun` | `boolean` | No | Simulate without committing |
| `transaction` | `"atomic" \| "best-effort"` | No | Transaction mode |
| `traceId` | `string` | No | Optional trace identifier |

**Output:** The resulting `MapSpec` after optional command application.

---

### `get_context_summary`

Return a compact MapSpec summary plus AI orchestration capability boundaries
for planning and review. Includes source readiness, layer inventory, validation
status, and a `capabilitySummary` block covering feature-display,
spatial-analysis, and scene-browsing domains.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `spec` | `MapSpec` | Yes | The map specification to summarize |
| `capabilities` | `CapabilityReport` | No | Optional capability overrides |

**Output:** `{ view, sources[], sourceReadiness[], layers[], validation, capabilitySummary, scene3d? }`

---

### `snapshot_spec`

Validate a MapSpec and produce a headless snapshot result (mock or MapLibre
renderer).

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `spec` | `MapSpec` | Yes | The map specification to snapshot |
| `renderer` | `"maplibre" \| "mock"` | No | Renderer backend (default: mock) |
| `snapshot.width` | `number` | No | Snapshot width in pixels |
| `snapshot.height` | `number` | No | Snapshot height in pixels |
| `snapshot.pixelRatio` | `number` | No | Device pixel ratio |
| `snapshot.format` | `"png" \| "jpeg" \| "data-url"` | No | Output format |
| `snapshot.targetLayers` | `string[]` | No | Limit snapshot to specific layers |

**Output:** `{ passed, diagnostics[], dataUrl?, renderer, validation }`

---

### `explain_spec`

Return a structured AI-facing summary with capability boundaries and full
validation diagnostics. Ideal for AI agents that need to understand what a
MapSpec describes before editing it.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `spec` | `MapSpec` | Yes | The map specification to explain |
| `capabilities` | `CapabilityReport` | No | Optional capability overrides |

**Output:** `{ summary, validation, diagnostics[] }`

---

### `export_example_app`

Return a manifest and file list for a bundled example application without
writing files. Useful for scaffolding runnable demo apps.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `exampleId` | `string` (enum) | Yes | The example to export |
| `generationEvidence` | `object` | No | Generation evidence summary for AI review flows |

**Output:** `{ exampleId, title, description, writesFiles: false, files[], notes[], generationEvidence? }`

---

### `diff_specs`

Compare two MapSpec objects and output the command set needed to transform
one into the other, with a summary of added, removed, modified, and unchanged
elements.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `before` | `MapSpec` | Yes | The source MapSpec |
| `after` | `MapSpec` | Yes | The target MapSpec |
| `options.ignoreMetadata` | `boolean` | No | Ignore metadata differences |
| `options.ignoreRevision` | `boolean` | No | Ignore revision differences |

**Output:** `{ commands[], summary: { added[], removed[], modified[], unchanged[] }, diagnostics[] }`

**Example:**

```json
{
  "name": "diff_specs",
  "arguments": {
    "before": { "version": "1.0", "view": { "center": [0, 0], "zoom": 2 }, "sources": {}, "layers": [] },
    "after":  { "version": "1.0", "view": { "center": [120, 30], "zoom": 5 }, "sources": {}, "layers": [] }
  }
}
```

---

### `generate_spec`

Generate a MapSpec skeleton from a structured intent description, with
validation diagnostics and improvement suggestions.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `intent.description` | `string` | Yes | Natural language description of the desired map |
| `intent.dataType` | `"geojson" \| "vector-tiles" \| "raster"` | No | Preferred data type |
| `intent.center` | `[number, number]` | No | Map center [lng, lat] |
| `intent.zoom` | `number` | No | Initial zoom level |
| `intent.theme` | `"dark" \| "light" \| "satellite"` | No | Visual theme |
| `options.includeMetadata` | `boolean` | No | Include metadata in generated spec |
| `options.includeInteractions` | `boolean` | No | Include interaction configurations |

**Output:** `{ spec, diagnostics[], suggestions[] }`

**Example:**

```json
{
  "name": "generate_spec",
  "arguments": {
    "intent": {
      "description": "A world map showing country boundaries with a dark theme",
      "dataType": "vector-tiles",
      "zoom": 2,
      "theme": "dark"
    }
  }
}
```

---

### `inspect_data`

Inspect GeoJSON data structure, properties, geometry types, and bounds to
understand the data before visualization. Returns a property schema with
detected types and sample values, bounding box, and styling suggestions.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | No | URL to fetch GeoJSON data from |
| `geojson` | `object` | No | Inline GeoJSON FeatureCollection or GeoJSON object |
| `sampleSize` | `number` (1–100) | No | Number of sample features to return (default: 5) |

**Output:** `{ featureCount, propertySchema: [{ name, types[], sampleValues[] }], geometryTypes[], sample[], bounds[], suggestions[] }`

---

### `edit_spec`

Edit a MapSpec using natural language instructions. Supports adding/removing
layers, changing paint/layout properties, setting filters, and modifying the
view. Returns the updated spec, the commands that were generated, and a
human-readable summary.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `spec` | `MapSpec` | Yes | The map specification to edit |
| `instruction` | `string` | Yes | Natural language edit instruction |

**Output:** `{ spec, commands[], diagnostics[], summary }`

**Example:**

```json
{
  "name": "edit_spec",
  "arguments": {
    "spec": { "version": "1.0", "view": { "center": [0, 0], "zoom": 2 }, "sources": {}, "layers": [] },
    "instruction": "Add a circle layer for the GeoJSON source with radius 5 and blue fill"
  }
}
```

---

### `query_features`

Query GeoJSON features by point or bounding box spatial filter. Returns
matching features with properties and geometry types.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `geojson` | `object` | Yes | Inline GeoJSON FeatureCollection or Feature to query against |
| `point` | `[number, number]` | No | Point query as [longitude, latitude] |
| `bbox` | `[number, number, number, number]` | No | Bounding box query as [west, south, east, north] |
| `layers` | `string[]` | No | Optional layer filter (API consistency; not used for GeoJSON) |
| `maxFeatures` | `number` (1–1000) | No | Maximum features to return (default: 100) |

**Output:** `{ queryType: "point" | "bbox" | "all", featureCount, features: [{ type, id?, geometry?, properties }], suggestions[] }`

---

### `style_recommend`

Analyze GeoJSON data features and recommend appropriate map layer types, paint
properties, and style configurations based on geometry types, property
distributions, and optional context hints.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `geojson` | `object` | Yes | Inline GeoJSON FeatureCollection or GeoJSON object to analyze |
| `hints.theme` | `"light" \| "dark" \| "satellite" \| "minimal"` | No | Preferred visual theme |
| `hints.density` | `"low" \| "medium" \| "high"` | No | Expected feature density |
| `hints.purpose` | `"exploration" \| "presentation" \| "analysis" \| "navigation"` | No | Map purpose to influence style choices |

**Output:** `{ featureCount, geometryTypes[], primaryGeometry, numericProperties[], categoricalProperties[], recommendations: [{ layerType, rationale, paint, layout, priority }], diagnostics[] }`

---

### `transform_data`

Transform GeoJSON data with filter, aggregate, select, sort, and rename
operations. Supports property-based filtering, group-by aggregation
(count/sum/avg/min/max), property selection, sorting, and renaming.

**Input:**

| Field | Type | Required | Description |
|---|---|---|---|
| `geojson` | `object` | Yes | Inline GeoJSON FeatureCollection to transform |
| `operations` | `object[]` | Yes | Ordered list of transform operations to apply |

Each operation object supports:

| Field | Type | Description |
|---|---|---|
| `type` | `"filter" \| "aggregate" \| "select" \| "sort" \| "rename"` | Operation type |
| `property` | `string` | Target property name |
| `operator` | `"==" \| "!=" \| ">" \| "<" \| ">=" \| "<=" \| "contains" \| "exists"` | Filter comparison operator |
| `value` | any | Filter comparison value |
| `groupBy` | `string` | Property to group by (aggregate) |
| `aggregation` | `"count" \| "sum" \| "avg" \| "min" \| "max"` | Aggregation function |
| `properties` | `string[]` | Property names for select |
| `direction` | `"asc" \| "desc"` | Sort direction |
| `newName` | `string` | New property name for rename |

**Output:** `{ operationCount, inputFeatureCount, outputFeatureCount, output: { type, features[] }, aggregations?: [{ groupBy, aggregation, property?, groups: [{ key, value, count }] }], diagnostics[] }`

---

## Architecture

GIS Engine follows these core principles:

- **Schema first** — all public inputs are described by TypeBox schemas and
  validated with Ajv.
- **Command-only mutation** — runtime state changes go through `MapCommand`
  and `applyCommands`.
- **Structured diagnostics** — failures return stable diagnostic codes, not
  natural-language-only errors.
- **Adapter boundary** — renderer-specific behavior stays behind
  `RendererAdapter` contracts.

The MCP server wraps the public `@gis-engine/engine` contracts without
reaching into renderer internals.

## Supported Data Sources

| Source Type | Status |
|---|---|
| GeoJSON | Supported |
| Raster tiles | Supported |
| PMTiles | Supported (archive contract) |
| Vector tiles (MVT) | Supported |
| GeoParquet | Schema contract only |
| FlatGeobuf | Schema contract only |

## License

Apache-2.0
