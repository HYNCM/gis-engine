---
name: gis-engine-diagnostic-workflows
description: >
  Debug and fix GIS Engine MapSpec issues using structured diagnostic codes. Use
  when validation fails, layers reference missing sources, expressions have type
  errors, security policy blocks URLs, or snapshot rendering fails. Covers all
  diagnostic code categories (SPEC, SRC, LAYER, EXPR, VIEW, RENDER, SNAPSHOT,
  COMMAND, CONFLICT, SECURITY, GEO, CAPABILITY, SCHEMA), fix strategies,
  severity levels, and the diagnose-fix-validate-retry workflow.
metadata:
  author: gis-engine
  version: "1.0"
  package: "@gis-engine/engine"
---

# Diagnostic Workflows Guide

GIS Engine returns structured diagnostics instead of free-text errors. Every
diagnostic has a stable `code`, a JSON pointer `path`, a `severity` level, and
an optional `fix` suggestion. This makes it possible for AI agents and tools to
programmatically diagnose and repair MapSpec issues.

## Diagnostic Structure

```json
{
  "severity": "error",
  "code": "LAYER.SOURCE_MISSING",
  "message": "Layer \"parcels-fill\" requires a source.",
  "path": "/layers/0/source",
  "relatedResources": [{ "kind": "layer", "id": "parcels-fill" }],
  "fix": {
    "kind": "manual",
    "confidence": "medium",
    "message": "Add the missing source or update the layer source id."
  }
}
```

| Field | Type | Description |
|---|---|---|
| `severity` | `"error" \| "warning" \| "info"` | Impact level. `error` blocks validation. |
| `code` | `string` | Stable diagnostic code (see table below). |
| `message` | `string` | Human-readable description. |
| `path` | `string` | JSON pointer to the offending field (e.g. `/layers/2/paint/circle-color`). |
| `relatedResources` | `Array<{kind, id}>` | Affected layers, sources, or other resources. |
| `fix` | `{ kind, confidence, message }` | Optional repair guidance. |

## Complete Diagnostic Code Reference

### SPEC — Schema and Structure

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `SPEC.INVALID_VERSION` | error | `version` is not `"0.1"`. | Set `"version": "0.1"`. |
| `SPEC.MISSING_FIELD` | error | Required field absent (`view`, `sources`, `layers`). | Add the missing top-level field. |
| `SPEC.INVALID_TYPE` | error | Field has wrong type (string instead of number, etc.). | Check the schema and correct the value type. |
| `SPEC.UNKNOWN_FIELD` | error | Extra field not in the schema. | Remove the unknown field or move it to `metadata`. |

### SRC — Source Issues

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `SRC.NOT_FOUND` | error | A referenced source does not exist. | Add the missing source or correct the reference. |

### LAYER — Layer Issues

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `LAYER.DUPLICATE_ID` | error | Two layers share the same `id`. | Rename one of the duplicate layer IDs. |
| `LAYER.NOT_FOUND` | error | Command references a non-existent layer. | Use an existing layer ID or create the layer first. |
| `LAYER.SOURCE_MISSING` | error | Non-background layer has no `source` field. | Add a `source` reference or change to `background` type. |
| `LAYER.SOURCE_INCOMPATIBLE` | error | Layer type does not match source type. | See compatibility table in mapspec-authoring skill. |
| `LAYER.ZOOM_RANGE_INVALID` | error | `minzoom` > `maxzoom`. | Swap values or set minzoom ≤ maxzoom. |

### EXPR — Expression Errors

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `EXPR.TYPE_MISMATCH` | error | Expression produces wrong type for its context. | Check expected output type (color, number, boolean) and adjust expression. |
| `EXPR.UNKNOWN_OPERATOR` | error | Expression uses an unsupported operator. | Use a valid MapLibre expression operator. |
| `EXPR.INVALID_ARITY` | error | Expression has wrong number of arguments. | Check operator documentation for argument count. |
| `EXPR.INVALID_COLOR` | error | Color string cannot be parsed. | Use valid hex (`#rrggbb`), `rgb()`, `rgba()`, or named color. |
| `EXPR.PROPERTY_UNKNOWN` | error | Expression references a feature property that does not exist. | Verify the data schema and property names. |

### VIEW — View and Coordinate Errors

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `VIEW.OUT_OF_DATA_BOUNDS` | warning | View center is far outside the data extent. | Adjust center or bounds to match data. |
| `GEO.INVALID_COORDINATES` | error | Longitude outside [-180, 180] or latitude outside [-90, 90]. | Correct coordinate values. |
| `GEO.EMPTY_BBOX` | error | Bounding box is empty or invalid. | Provide valid [west, south, east, north]. |

### RENDER — Rendering Errors

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `RENDER.ADAPTER_ERROR` | error | MapLibre or mock adapter failed. | Check adapter initialization and configuration. |
| `RENDER.DESTROYED` | error | Map instance was destroyed. | Create a new map instance. |

### SNAPSHOT — Snapshot Issues

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `SNAPSHOT.BLANK_CANVAS` | warning | Snapshot produced a blank image. | Check that layers have visible data and styles. |
| `SNAPSHOT.RESOURCE_PENDING` | warning | Resources not fully loaded at snapshot time. | Wait for data to load or increase timeout. |

### COMMAND — Command Errors

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `COMMAND.INVALID_PATCH` | error | Command produced an invalid JSON Patch. | Check command payload structure. |
| `COMMAND.UNSUPPORTED` | error | Command type not recognized. | Use a valid command type from command.schema. |

### CONFLICT — Edit Conflicts

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `CONFLICT.BASE_REVISION` | error | `baseRevision` does not match current spec revision. | Fetch the latest spec, then retry with updated `baseRevision`. |

### CAPABILITY — Feature Support

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `CAPABILITY.UNSUPPORTED` | error | Feature not supported by current renderer or config. | Check capabilities request and renderer support. For `fill-extrusion-lite`, add both `dimensions: ["2_5d"]` and `experimental: ["fill-extrusion-lite"]`. |

### SECURITY — Resource Policy

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `SECURITY.URL_BLOCKED` | error | URL violates resource policy (blocked host or scheme). | Use an allowed host, or update the resource policy configuration. |
| `SECURITY.RESOURCE_TIMEOUT` | error | Resource fetch exceeded timeout. | Check URL availability or increase timeout. |
| `SECURITY.RESOURCE_TOO_LARGE` | error | Resource exceeds size limits. | Use a smaller dataset or increase policy limits. |
| `SECURITY.UNSUPPORTED_ASSET_TYPE` | error | Asset type not allowed by policy. | Use a supported format or update policy. |

### SCHEMA — Schema Validation

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `SCHEMA.INVALID` | error | Generic schema validation failure. | Check the specific Ajv error in `message` and `path`. |

### QUERY — Query Results

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `QUERY.EMPTY_RESULT` | info | Spatial query returned no features. | Verify query coordinates and layer data. |

### MIGRATION — Version Migration

| Code | Severity | Cause | Fix Strategy |
|---|---|---|---|
| `MIGRATION.UNSUPPORTED_VERSION` | error | Spec version not supported for migration. | Use a supported version or manually update the spec. |

## Diagnostic Workflow: Diagnose → Fix → Validate → Retry

### Step 1: Validate

```typescript
import { validateSpec } from "@gis-engine/engine";

const report = validateSpec(spec);
```

Or via MCP:

```json
// Tool: validate_spec
{ "spec": { ... } }
```

### Step 2: Read Diagnostics

```json
{
  "valid": false,
  "diagnostics": [
    {
      "severity": "error",
      "code": "LAYER.SOURCE_MISSING",
      "message": "Layer \"parcels-fill\" requires a source.",
      "path": "/layers/0/source",
      "fix": {
        "kind": "manual",
        "confidence": "medium",
        "message": "Add the missing source or update the layer source id."
      }
    }
  ]
}
```

### Step 3: Apply Fix

Use the `code` and `path` to determine the fix:

| Code | Automated Fix Approach |
|---|---|
| `SPEC.INVALID_VERSION` | Set `spec.version = "0.1"` |
| `SPEC.MISSING_FIELD` | Add the missing field with a sensible default |
| `LAYER.DUPLICATE_ID` | Append suffix to duplicate ID |
| `LAYER.SOURCE_MISSING` | Add the missing source or fix the layer's `source` reference |
| `LAYER.SOURCE_INCOMPATIBLE` | Change layer type or source type to be compatible |
| `LAYER.ZOOM_RANGE_INVALID` | Swap minzoom and maxzoom if minzoom > maxzoom |
| `GEO.INVALID_COORDINATES` | Clamp coordinates to valid ranges |
| `SECURITY.URL_BLOCKED` | Replace URL with an allowed host or update resource policy |

### Step 4: Re-validate

```typescript
const report2 = validateSpec(fixedSpec);
if (report2.valid) {
  console.log("Spec is valid!");
} else {
  // Repeat fix cycle for remaining diagnostics
}
```

### Step 5: Apply via Commands (Optional)

Use the command system to record the fix as a replayable edit:

```json
[
  {
    "id": "fix-001",
    "version": "0.1",
    "type": "addSource",
    "sourceId": "parcels",
    "source": { "type": "geojson", "data": { "type": "FeatureCollection", "features": [] } },
    "reason": "Fix LAYER.SOURCE_MISSING for parcels-fill"
  }
]
```

## AI Agent Diagnostic Loop

When acting as an AI agent, follow this loop:

```
1. validate_spec(spec)
2. IF valid → DONE
3. FOR EACH diagnostic where severity = "error":
   a. Read code and path
   b. Determine fix based on code (see table above)
   c. Apply fix to spec
4. GOTO 1 (max 3 iterations to avoid infinite loops)
```

### Example Agent Loop

```typescript
import { validateSpec } from "@gis-engine/engine";

let current = spec;
for (let i = 0; i < 3; i++) {
  const report = validateSpec(current);
  if (report.valid) break;

  for (const d of report.diagnostics.filter(d => d.severity === "error")) {
    current = applyFix(current, d);  // your fix logic
  }
}
```

## Severity Guidelines

| Severity | Meaning | Action |
|---|---|---|
| `error` | Blocks validation. Spec cannot be rendered. | Must fix before proceeding. |
| `warning` | Non-blocking but indicates a problem. | Recommended to fix; spec can still render. |
| `info` | Informational observation. | No action required. |

## Tips

- Always check `diagnostics` array length, not just `valid`. A valid spec may still have warnings.
- Use `path` to pinpoint the exact field: `/layers/2/paint/circle-color` means the third layer's circle-color paint property.
- `relatedResources` helps identify cascading issues (e.g., a missing source affects multiple layers).
- When fixing, prefer adding missing data over removing layers or sources — removal may break other references.
- The `fix.confidence` field (`"high"`, `"medium"`, `"low"`) indicates how reliable the automated fix suggestion is.
- For `SECURITY.URL_BLOCKED`, check `resource-policy.ts` for the current allowed hosts and schemes.
