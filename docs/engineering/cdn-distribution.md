# CDN Distribution

GIS Engine packages are published to npm and available through CDN providers.

## Packages

| Package | Description |
|---|---|
| `@gis-engine/engine` | MapSpec runtime, commands, diagnostics, adapters |
| `@gis-engine/ai` | MCP tools, generation evidence |
| `@gis-engine/scene3d` | Experimental 3D boundary |

`@gis-engine/scene3d-three-adapter` is an independent experimental 0.x package
and is not part of the GA CDN bundle workflow.

## CDN Providers

```html
<!-- unpkg -->
<script type="module">
  import { createMap } from "https://unpkg.com/@gis-engine/engine";
</script>
<!-- jsDelivr -->
<script type="module">
  import { createMap } from "https://cdn.jsdelivr.net/npm/@gis-engine/engine/+esm";
</script>
<!-- esm.sh -->
<script type="module">
  import { createMap } from "https://esm.sh/@gis-engine/engine";
</script>
```

## ESM Entry

All packages use `"type": "module"`. The `exports` field maps `.` to the compiled
JS entry. `createMap` is a named export of `@gis-engine/engine`.

## Version Pinning

```
https://unpkg.com/@gis-engine/engine@1.1.0
https://esm.sh/@gis-engine/engine@^1.1.0
```

Unpinned imports resolve to the `latest` dist-tag.

## Package Exports

Engine: `{ ".": { "types": "./dist/src/index.d.ts", "import": "./dist/src/index.js" } }`

AI adds sub-paths: `"./mcp"` (server) and `"./tools/*"` (individual tools).
