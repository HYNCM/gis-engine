# Diagnostic Codes Reference

GIS Engine returns structured diagnostic codes instead of plain error strings.
Use this reference to quickly identify what went wrong and how to fix it.

```typescript
import { DiagnosticCodes } from "@gis-engine/engine";
```

---

## SPEC — Schema Validation

These codes are returned by `validateSpec()` when the MapSpec fails JSON Schema validation (via Ajv).

### SPEC.UNKNOWN_FIELD

| Field | Detail |
|---|---|
| **Code** | `SPEC.UNKNOWN_FIELD` |
| **Trigger** | The spec contains a property not defined in the MapSpec schema (Ajv `additionalProperties` violation). |
| **Fix** | Remove the unrecognized field. Check the MapSpec schema for the list of valid properties at that path. |
| **Example** | Adding `"theme": "dark"` at the root level of a MapSpec triggers this code. |

### SPEC.INVALID_VERSION

| Field | Detail |
|---|---|
| **Code** | `SPEC.INVALID_VERSION` |
| **Trigger** | The `version` field is not `"0.1"` (the only supported version). |
| **Fix** | Set `"version": "0.1"`. |
| **Example** | `"version": "1.0"` → error at `/version`. |

### SPEC.INVALID_TYPE

| Field | Detail |
|---|---|
| **Code** | `SPEC.INVALID_TYPE` |
| **Trigger** | A field has the wrong JSON type (e.g. string where a number is expected). Also the default code for unrecognized schema keyword failures. |
| **Fix** | Check the schema at the reported `path` and use the correct type. |
| **Example** | `"zoom": "high"` instead of `"zoom": 12` at `/view/zoom`. |

### SPEC.MISSING_FIELD

| Field | Detail |
|---|---|
| **Code** | `SPEC.MISSING_FIELD` |
| **Trigger** | A required field is absent from the spec (Ajv `required` violation). |
| **Fix** | Add the missing field. The diagnostic `path` points to the parent object; the `message` names the missing property. |
| **Example** | Omitting `"layers"` from the root MapSpec triggers this code. |

---

## SRC — Data Sources

### SRC.NOT_FOUND

| Field | Detail |
|---|---|
| **Code** | `SRC.NOT_FOUND` |
| **Trigger** | A layer references a `source` id that does not exist in `spec.sources`. Also fired for SceneView3D scene layers referencing missing scene sources. |
| **Fix** | Add the missing source to `spec.sources`, or correct the `source` id on the layer. |
| **Example** | `layers[0].source: "roads"` but `sources` has no `"roads"` key. |

---

## LAYER — Layer Configuration

### LAYER.DUPLICATE_ID

| Field | Detail |
|---|---|
| **Code** | `LAYER.DUPLICATE_ID` |
| **Trigger** | Two or more layers (or scene layers) share the same `id`. |
| **Fix** | Give each layer a unique `id`. |
| **Example** | Two layers with `"id": "buildings"` in `spec.layers`. |

### LAYER.NOT_FOUND

| Field | Detail |
|---|---|
| **Code** | `LAYER.NOT_FOUND` |
| **Trigger** | A command, query, or scene operation targets a layer id that does not exist. |
| **Fix** | Verify the layer id exists in `spec.layers` (or `extensions.scene3d.layers`). |
| **Example** | `applyCommands` with `setLayerPaint` targeting `"id": "missing-layer"`. |

### LAYER.SOURCE_MISSING

| Field | Detail |
|---|---|
| **Code** | `LAYER.SOURCE_MISSING` |
| **Trigger** | A non-background layer does not specify a `source`. |
| **Fix** | Add a `source` property referencing an existing source id, or set the layer type to `"background"`. |
| **Example** | `{ "id": "roads", "type": "line" }` without a `source` field. |

### LAYER.SOURCE_INCOMPATIBLE

| Field | Detail |
|---|---|
| **Code** | `LAYER.SOURCE_INCOMPATIBLE` |
| **Trigger** | The layer type is not compatible with the source type. Compatibility matrix: `fill`/`line`/`circle`/`symbol-lite`/`fill-extrusion-lite` → `geojson`/`pmtiles`/`flatgeobuf`/`geoparquet`/`vector`; `raster` → `raster`/`pmtiles`. |
| **Fix** | Use a compatible source type for the layer type, or change the layer type. |
| **Example** | A `circle` layer pointing to a `raster` source. |

### LAYER.ZOOM_RANGE_INVALID

| Field | Detail |
|---|---|
| **Code** | `LAYER.ZOOM_RANGE_INVALID` |
| **Trigger** | `minzoom` is greater than `maxzoom` on a layer. |
| **Fix** | Set `minzoom` ≤ `maxzoom`, or remove one of the bounds. Valid zoom range is 0–24. |
| **Example** | `"minzoom": 15, "maxzoom": 5`. |

---

## EXPR — Expressions

### EXPR.TYPE_MISMATCH

| Field | Detail |
|---|---|
| **Code** | `EXPR.TYPE_MISMATCH` |
| **Trigger** | An expression evaluates to a type that doesn't match the expected property type, or branch outputs in `case`/`match`/`step`/`interpolate` have inconsistent types. Also fires when filter expressions don't return boolean, or when `get`/`has` receives a non-string property name. |
| **Fix** | Ensure expression outputs match the target property type. For filters, ensure the expression returns a boolean. |
| **Example** | `"circle-color": ["get", 42]` — property name must be a string, not a number. |

### EXPR.UNKNOWN_OPERATOR

| Field | Detail |
|---|---|
| **Code** | `EXPR.UNKNOWN_OPERATOR` |
| **Trigger** | An expression array uses an operator string that is not recognized. Supported operators: `literal`, `get`, `case`, `match`, `step`, `interpolate`, `zoom`, `has`, `all`, `any`, `!`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `to-number`, `to-string`. |
| **Fix** | Check for typos or use a supported operator. |
| **Example** | `["concat", "a", "b"]` — `concat` is not a supported operator. |

### EXPR.INVALID_ARITY

| Field | Detail |
|---|---|
| **Code** | `EXPR.INVALID_ARITY` |
| **Trigger** | An expression has the wrong number of arguments. For example, an empty expression array, `["literal"]` with no value, or `["zoom", 1]` with extra arguments. |
| **Fix** | Check the expected syntax for the operator and provide the correct number of arguments. |
| **Example** | `[]` — expression array cannot be empty. |

### EXPR.INVALID_COLOR

| Field | Detail |
|---|---|
| **Code** | `EXPR.INVALID_COLOR` |
| **Trigger** | An `interpolate` expression produces string outputs that are not valid CSS color values (hex `#rrggbb` or `rgb()`/`rgba()`). |
| **Fix** | Use valid hex colors (e.g. `"#ff0000"`) or `rgb()`/`rgba()` strings as interpolate outputs. |
| **Example** | `["interpolate", ["linear"], ["zoom"], 0, "red", 10, "blue"]` — `"red"` is not a valid hex/rgb color. |

### EXPR.PROPERTY_UNKNOWN

| Field | Detail |
|---|---|
| **Code** | `EXPR.PROPERTY_UNKNOWN` |
| **Trigger** | A `get` or `has` expression references a property name not found in the known feature property set (when property metadata is available). Severity: **warning**, not error. |
| **Fix** | Verify the property name against the source data's feature schema. |
| **Example** | `["get", "population"]` when features only have `"pop"` and `"name"`. |

---

## VIEW — View Configuration

### VIEW.OUT_OF_DATA_BOUNDS

| Field | Detail |
|---|---|
| **Code** | `VIEW.OUT_OF_DATA_BOUNDS` |
| **Trigger** | The current view extent does not overlap with any data source bounds. _Reserved — not yet emitted by the current runtime._ |
| **Fix** | Adjust the view `center`, `zoom`, or `bounds` to overlap with your data extent. |

---

## RENDER — Renderer Runtime

### RENDER.ADAPTER_ERROR

| Field | Detail |
|---|---|
| **Code** | `RENDER.ADAPTER_ERROR` |
| **Trigger** | The renderer adapter encounters an error during an operation — typically when attempting to apply patches, query features, or snapshot before a MapSpec has been loaded, or after a load failure. |
| **Fix** | Ensure `load()` has been called successfully before performing operations on the adapter. |
| **Example** | Calling `applyPatch()` on a MapLibre adapter that hasn't loaded a spec yet. |

### RENDER.DESTROYED

| Field | Detail |
|---|---|
| **Code** | `RENDER.DESTROYED` |
| **Trigger** | An operation is attempted after the adapter or runtime has been destroyed. Severity: **info** — this is an expected lifecycle state, not a bug. |
| **Fix** | No action needed. If you see this unexpectedly, ensure you are not reusing a destroyed adapter instance. |

---

## SNAPSHOT — Snapshot Testing

### SNAPSHOT.BLANK_CANVAS

| Field | Detail |
|---|---|
| **Code** | `SNAPSHOT.BLANK_CANVAS` |
| **Trigger** | A snapshot was requested but no visible layers exist to render. In SceneView3D: no visible scene layers are present. |
| **Fix** | Add at least one visible layer before taking a snapshot. |

### SNAPSHOT.RESOURCE_PENDING

| Field | Detail |
|---|---|
| **Code** | `SNAPSHOT.RESOURCE_PENDING` |
| **Trigger** | A snapshot was taken while one or more required scene sources have not finished loading. Severity is **error** when `requireLoadedResources` is set, otherwise **warning**. |
| **Fix** | Wait for all required scene sources to load before snapshotting, or mark the snapshot as non-strict. |

---

## CAPABILITY — Feature Capabilities

### CAPABILITY.UNSUPPORTED

| Field | Detail |
|---|---|
| **Code** | `CAPABILITY.UNSUPPORTED` |
| **Trigger** | A spec requests a capability that is not available in the current runtime. Examples: using `fill-extrusion-lite` without enabling the experimental capability gate; requesting `view.mode: "scene3d"` or `capabilities.renderer: "scene3d"` before the stable runtime promotion; using non-linear interpolation. |
| **Fix** | Enable the required capability in `spec.capabilities`, or use a supported alternative. For `fill-extrusion-lite`, set `view.mode` to `"map2_5d"` and add `"fill-extrusion-lite"` to `capabilities.experimental`. |
| **Example** | `"view": { "mode": "scene3d" }` — blocked until stable runtime promotion gate passes. |

---

## COMMAND — Command System

### COMMAND.INVALID_PATCH

| Field | Detail |
|---|---|
| **Code** | `COMMAND.INVALID_PATCH` |
| **Trigger** | A command's patch operation is malformed: the `path` is not a valid JSON Pointer (must start with `/`), or an `add`/`replace` operation is missing its `value` field. Also fired when an adapter fails to apply a patch internally. |
| **Fix** | Ensure patch paths are valid JSON Pointers (e.g. `/layers/0/paint/circle-color`) and that `add`/`replace` operations include a `value`. |
| **Example** | `{ "op": "replace", "path": "layers/0/paint", "value": {} }` — path must start with `/`. |

### COMMAND.UNSUPPORTED

| Field | Detail |
|---|---|
| **Code** | `COMMAND.UNSUPPORTED` |
| **Trigger** | A command uses a `type` that is not recognized by the command system. |
| **Fix** | Use a supported command type (e.g. `setLayerPaint`, `setLayerLayout`, `addLayer`, `removeLayer`, `setView`, `addSource`, `removeSource`). |
| **Example** | `{ "type": "rotateMap", ... }` — `rotateMap` is not a supported command. |

---

## CONFLICT — Revision Conflicts

### CONFLICT.BASE_REVISION

| Field | Detail |
|---|---|
| **Code** | `CONFLICT.BASE_REVISION` |
| **Trigger** | A command's `baseRevision` does not match the current spec `revision`, indicating a conflict with another concurrent edit. |
| **Fix** | Re-fetch the latest spec revision and rebase the command with the correct `baseRevision` before retrying. |
| **Example** | Command has `baseRevision: "abc"` but the spec is now at revision `"def"`. |

---

## MIGRATION — Spec Migration

### MIGRATION.UNSUPPORTED_VERSION

| Field | Detail |
|---|---|
| **Code** | `MIGRATION.UNSUPPORTED_VERSION` |
| **Trigger** | A migration was requested from a spec version that has no migration path. _Reserved — not yet emitted by the current runtime._ |
| **Fix** | Check the [migration guide](/guide/migrate-v0x-to-v1) for supported version transitions. |

---

## SECURITY — Resource Policy & Security

### SECURITY.URL_BLOCKED

| Field | Detail |
|---|---|
| **Code** | `SECURITY.URL_BLOCKED` |
| **Trigger** | A source URL fails the resource policy check. Causes include: invalid or empty URL, scheme not in `allowedSchemes`, host not in `allowedHosts`, path not matching `allowedPathPrefixes`, relative URLs blocked by policy, or path traversal (`..`) in relative URLs. |
| **Fix** | Use a relative path, `pmtiles:` URL, localhost, or a host listed in `ResourcePolicy.allowedHosts`. See [Resource Policy](/guide/resource-policy) for details. |
| **Example** | `"data": "https://cdn.example.com/data.geojson"` with default policy (only localhost allowed). |

### SECURITY.RESOURCE_TIMEOUT

| Field | Detail |
|---|---|
| **Code** | `SECURITY.RESOURCE_TIMEOUT` |
| **Trigger** | A resource load operation exceeded the configured `timeoutMs` (default: 10 000 ms). Applies to PMTiles queries and SceneView3D resource loads. |
| **Fix** | Optimize the resource load, or increase `timeoutMs` in the resource policy only through an explicit contract update. |
| **Example** | Scene resource load took 15 000 ms with `timeoutMs: 10000`. |

### SECURITY.RESOURCE_TOO_LARGE

| Field | Detail |
|---|---|
| **Code** | `SECURITY.RESOURCE_TOO_LARGE` |
| **Trigger** | A resource exceeds the configured byte budget (`maxResourceBytes` or scene resource size limit). Applies to PMTiles query loader responses and SceneView3D asset loads. |
| **Fix** | Reduce the resource size, or raise the byte budget only after a review gate. |
| **Example** | PMTiles loader response is 50 MB with `byteBudgetBytes: 10485760` (10 MB). |

### SECURITY.UNSUPPORTED_ASSET_TYPE

| Field | Detail |
|---|---|
| **Code** | `SECURITY.UNSUPPORTED_ASSET_TYPE` |
| **Trigger** | A SceneView3D resource load entry has a `kind` not supported by the v1 resource policy gate. |
| **Fix** | Use a supported asset kind for scene resources. Check the SceneView3D extension documentation for allowed kinds. |

---

## GEO — Geometry & Coordinates

### GEO.INVALID_COORDINATES

| Field | Detail |
|---|---|
| **Code** | `GEO.INVALID_COORDINATES` |
| **Trigger** | `view.center` coordinates are out of range (longitude must be [-180, 180], latitude must be [-90, 90]), or `view.bounds` has west > east or south > north. |
| **Fix** | Ensure center is `[lng, lat]` with lng ∈ [-180, 180] and lat ∈ [-90, 90]. Ensure bounds are `[west, south, east, north]` with west ≤ east and south ≤ north. |
| **Example** | `"center": [200, 50]` — longitude 200 is out of range. |

### GEO.EMPTY_BBOX

| Field | Detail |
|---|---|
| **Code** | `GEO.EMPTY_BBOX` |
| **Trigger** | A `queryFeatures` or PMTiles fixture query `bbox` is not a valid finite `[minX, minY, maxX, maxY]` extent, or min values exceed max values. |
| **Fix** | Provide a valid bbox with finite numbers where minX ≤ maxX and minY ≤ maxY. |
| **Example** | `"bbox": [10, 50, 5, 45]` — minX (10) > maxX (5). |

---

## QUERY — Data Queries

### QUERY.EMPTY_RESULT

| Field | Detail |
|---|---|
| **Code** | `QUERY.EMPTY_RESULT` |
| **Trigger** | A PMTiles fixture query matched zero features. Severity: **info** — this is informational, not an error. |
| **Fix** | No action required. If unexpected, check the query bbox and layer filters. |

---

## SCHEMA — Source Schema Validation

### SCHEMA.INVALID

| Field | Detail |
|---|---|
| **Code** | `SCHEMA.INVALID` |
| **Trigger** | A cloud-native source (PMTiles, GeoParquet, GeoTIFF) fails domain-specific validation beyond the base JSON Schema. Examples: PMTiles spec version ≠ 3, GeoParquet/GeoTIFF bbox out of range, GeoTIFF band index conflicts, missing CRS or noData metadata when required by policy, PMTiles metadata format errors, or source URL is empty. |
| **Fix** | Check the reported `path` and `message` for the specific field that failed. Ensure cloud-native source metadata conforms to the expected format. |
| **Example** | PMTiles source with `specVersion: 2` — only version 3 is supported. |

---

## Quick Lookup Table

| Code | Domain | Severity | Summary |
|---|---|---|---|
| `SPEC.UNKNOWN_FIELD` | SPEC | error | Unrecognized property in spec |
| `SPEC.INVALID_VERSION` | SPEC | error | Version is not `"0.1"` |
| `SPEC.INVALID_TYPE` | SPEC | error | Field has wrong JSON type |
| `SPEC.MISSING_FIELD` | SPEC | error | Required field is absent |
| `SRC.NOT_FOUND` | SRC | error | Source id does not exist |
| `LAYER.DUPLICATE_ID` | LAYER | error | Layer id is not unique |
| `LAYER.NOT_FOUND` | LAYER | error | Target layer does not exist |
| `LAYER.SOURCE_MISSING` | LAYER | error | Non-background layer has no source |
| `LAYER.SOURCE_INCOMPATIBLE` | LAYER | error | Layer/source type mismatch |
| `LAYER.ZOOM_RANGE_INVALID` | LAYER | error | minzoom > maxzoom |
| `EXPR.TYPE_MISMATCH` | EXPR | error | Expression type doesn't match expected |
| `EXPR.UNKNOWN_OPERATOR` | EXPR | error | Unrecognized expression operator |
| `EXPR.INVALID_ARITY` | EXPR | error | Wrong number of expression arguments |
| `EXPR.INVALID_COLOR` | EXPR | error | Invalid color string in interpolate |
| `EXPR.PROPERTY_UNKNOWN` | EXPR | warning | Feature property not in known set |
| `VIEW.OUT_OF_DATA_BOUNDS` | VIEW | error | View extent misses all data _(reserved)_ |
| `RENDER.ADAPTER_ERROR` | RENDER | error | Adapter operation failed |
| `RENDER.DESTROYED` | RENDER | info | Operation on destroyed adapter |
| `SNAPSHOT.BLANK_CANVAS` | SNAPSHOT | error | Snapshot with no visible layers |
| `SNAPSHOT.RESOURCE_PENDING` | SNAPSHOT | error/warning | Snapshot before resources loaded |
| `CAPABILITY.UNSUPPORTED` | CAPABILITY | error | Feature not available in runtime |
| `COMMAND.INVALID_PATCH` | COMMAND | error | Malformed patch operation |
| `COMMAND.UNSUPPORTED` | COMMAND | error | Unknown command type |
| `CONFLICT.BASE_REVISION` | CONFLICT | error | Revision mismatch on command |
| `MIGRATION.UNSUPPORTED_VERSION` | MIGRATION | error | No migration path for version _(reserved)_ |
| `SECURITY.URL_BLOCKED` | SECURITY | error | URL rejected by resource policy |
| `SECURITY.RESOURCE_TIMEOUT` | SECURITY | error | Resource load exceeded timeout |
| `SECURITY.RESOURCE_TOO_LARGE` | SECURITY | error | Resource exceeds byte budget |
| `SECURITY.UNSUPPORTED_ASSET_TYPE` | SECURITY | error | Unsupported 3D asset kind |
| `GEO.INVALID_COORDINATES` | GEO | error | Coordinates out of valid range |
| `GEO.EMPTY_BBOX` | GEO | error | Invalid or empty bounding box |
| `QUERY.EMPTY_RESULT` | QUERY | info | Query matched zero features |
| `SCHEMA.INVALID` | SCHEMA | error | Cloud-native source validation failed |
