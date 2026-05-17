# @gis-engine/engine

AI-native TypeScript runtime for `MapSpec` validation, command replay,
diagnostics, snapshots, feature query, and renderer adapter integration.

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
path, diagnostics, resource policy, snapshot contract, and renderer adapter
contracts. AI/MCP orchestration lives in `@gis-engine/ai`.
