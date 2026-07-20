# @gis-engine/engine

AI-native TypeScript runtime for `MapSpec` validation, command replay,
diagnostics, snapshots, feature query, optional command audit traces, and
renderer adapter integration.

## Install

```bash
npm install @gis-engine/engine
```

## Minimal Use

```ts
import { createMap, validateSpec } from "@gis-engine/engine";

const validation = validateSpec(spec);
if (!validation.valid) {
  console.error(validation.diagnostics);
}

const map = await createMap(container, spec, { renderer: "maplibre" });
await map.apply({
  id: "cmd-update-view",
  version: "0.1",
  type: "setView",
  view: { center: [116.39, 39.9], zoom: 10 }
});
```

## Package Scope

This package owns the public runtime API, TypeBox schemas, JSON Patch command
path, command audit trace collection, diagnostics, resource policy, snapshot
contract, and renderer adapter contracts. AI/MCP orchestration lives in
`@gis-engine/ai`.

## Peer Dependency

GIS Engine uses MapLibre GL JS as an optional peer dependency for rendering:
```bash
npm install maplibre-gl
```
The engine works without MapLibre for validation, commands, and spec operations. MapLibre is only required for `createMap()` with the maplibre adapter.

### Runtime Compatibility And Adoption

MapLibre runtime compatibility evidence and dependency adoption are separate
decisions. Runtime compatibility means the checked adapter types, lifecycle,
worker delivery, and strict visual evidence have no failures. Adoption also
requires an explicit quality decision to change the release baseline.

```typescript
import {
  isMapLibreV6AdoptionApproved,
  isMapLibreV6RuntimeCompatible,
  runMapLibreV6Audit,
} from "@gis-engine/engine";

const report = runMapLibreV6Audit();
isMapLibreV6RuntimeCompatible(report); // runtime evidence only
isMapLibreV6AdoptionApproved(report); // also requires candidateDecision: "bump-approved"
```

`isMapLibreV6Compatible()` remains a backwards-compatible alias for runtime
compatibility. It does not approve a package or release-baseline change.

## CDN

You can also load GIS Engine from a CDN:
```html
<script type="module">
  import { createMap, validateSpec } from "https://cdn.jsdelivr.net/npm/@gis-engine/engine@latest/dist/index.js";
</script>
```

## Usage

```typescript
import { createMap, validateSpec, applyCommands } from "@gis-engine/engine";

// Validate a MapSpec
const report = validateSpec(mySpec);
console.log(`Valid: ${report.valid}, ${report.diagnostics.length} diagnostics`);

// Create a map and apply commands
const map = await createMap(container, mySpec, { renderer: "maplibre" });
const result = applyCommands(map.spec, commands, { collectTrace: true });

// Take a snapshot
const snapshot = await map.snapshot();
```

## PMTiles Runtime Preflight

PMTiles is the preferred lightweight vector delivery path for local and hosted
large-map datasets. Before handing a PMTiles `MapSpec` to MapLibre, SDK callers
can create an IO-free load plan that checks the URL policy, required
`metadata["source-layer"]` values, optional archive metadata budgets, and known
unsupported states.

```typescript
import { createPMTilesRuntimeLoadPlan } from "@gis-engine/engine";

const plan = createPMTilesRuntimeLoadPlan(spec, {
  requireArchiveMetadata: true,
  archiveMetadata: {
    parcels: {
      specVersion: 3,
      archiveBytes: 1_000_000,
      rootDirectoryOffset: 0,
      rootDirectoryLength: 1024,
      hasVectorTiles: true,
      hasRasterTiles: false,
      tileType: "vector",
    },
  },
});

if (plan.status === "blocked") {
  console.error(plan.diagnostics);
}
```

This preflight does not fetch resources, parse PMTiles archives, or provide
PMTiles feature-query semantics. It makes URL-compatible MapLibre vector
delivery auditable before runtime. `PMTILES_CAPABILITY_DECISION` is the public
machine-readable truth: URL-compatible display and IO-free load-plan preflight
are Go; runtime archive load and runtime feature query are No-go.

`PMTilesRuntimeLoader` remains exported for API compatibility, but it is a
fail-closed shell. `loadHeader()`, `loadDirectory()`, and `initialize()` reject
with `PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED`; `query()` returns
`PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED`. None of those methods call the
provided range fetcher or decoder.

Source readiness keeps PMTiles `queryReady: false` even when fixture evidence
is supplied; that evidence is reported by `fixtureEvidenceReady` and
`fixtureEvidenceStatus`.

## Next Steps

- [CLI Quick Start](../cli/README.md) — scaffold or AI-generate a map project
- [Examples](../../examples/) — runnable examples and fixture data
- [API Reference](https://gis-engine.dev/api/engine) — full API documentation
