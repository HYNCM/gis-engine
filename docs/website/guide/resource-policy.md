# Resource Policy

GIS Engine validates every URL in a `MapSpec` against a **Resource Policy** —
an allowlist of schemes and hosts that prevents accidental data exfiltration
and keeps generated maps safe by default.

## What Is a Resource Policy?

A `ResourcePolicy` controls which URLs are allowed inside `MapSpec.sources`:

```typescript
import type { ResourcePolicy } from "@gis-engine/engine";

interface ResourcePolicy {
  allowRelativeUrls?: boolean;
  allowedSchemes: ResourceUrlScheme[];   // "http:" | "https:" | "pmtiles:"
  allowedHosts: string[];                // hostname allowlist for http(s)
  allowedPathPrefixes?: string[];        // optional path prefix filter
  maxResourceBytes?: number;             // optional size cap
  timeoutMs?: number;                    // optional fetch timeout
}
```

If a URL fails the policy check, a structured `Diagnostic` with code
`RESOURCE.URL_BLOCKED` or `RESOURCE.SCHEME_BLOCKED` is returned — the spec
is not silently accepted.

## Default Policy

```typescript
import { defaultResourcePolicy } from "@gis-engine/engine";

// {
//   allowRelativeUrls: true,
//   allowedSchemes: ["http:", "https:", "pmtiles:"],
//   allowedHosts: ["localhost", "127.0.0.1", "::1", "[::1]"],
//   timeoutMs: 10000
// }
```

By default, only localhost hosts are allowed for `http:` / `https:` URLs.
`pmtiles:` is always scheme-allowed. Relative URLs (paths without a scheme)
are permitted.

## `validateResourcePolicy(spec, policy?)`

Validates all URL-bearing sources in a `MapSpec` against the policy. Returns an
array of `Diagnostic` objects (empty means all URLs passed).

```typescript
import { validateResourcePolicy, defaultResourcePolicy } from "@gis-engine/engine";

const spec = {
  version: "0.1",
  sources: {
    tiles: { type: "raster", tiles: ["https://cdn.example.com/{z}/{x}/{y}.png"] }
  },
  layers: [{ id: "base", type: "raster", source: "tiles" }]
};

const diagnostics = validateResourcePolicy(spec);
// diagnostics[0].code === "RESOURCE.URL_BLOCKED"
// diagnostics[0].message contains "cdn.example.com"
```

The function checks every source type that contains URLs:

| Source Type | Checked Fields |
|---|---|
| `geojson` (URL data) | `source.data` |
| `raster` | `source.tiles[]` |
| `pmtiles` | `source.url` |
| `vector` | `source.url` or `source.tiles[]` |

## `validateResourceUrl(url, path, policy)`

Validates a single URL string. Useful when checking URLs before adding them to
a spec programmatically.

```typescript
import { validateResourceUrl, defaultResourcePolicy } from "@gis-engine/engine";

const errors = validateResourceUrl(
  "https://tiles.example.com/data.geojson",
  "/sources/my-source/data",
  defaultResourcePolicy
);
// Returns diagnostic if host is not allowlisted
```

The `path` argument is a JSON Pointer used in the returned diagnostic so that
errors point to the exact spec location.

## Custom Policies

Create a custom policy to allow additional hosts or restrict schemes:

```typescript
import { validateResourcePolicy, type ResourcePolicy } from "@gis-engine/engine";

const prodPolicy: ResourcePolicy = {
  allowRelativeUrls: false,
  allowedSchemes: ["https:", "pmtiles:"],
  allowedHosts: [
    "tiles.example.com",
    "cdn.example.com",
    "localhost"
  ],
  timeoutMs: 5000
};

const diagnostics = validateResourcePolicy(spec, prodPolicy);
```

To restrict paths within allowed hosts:

```typescript
const restrictedPolicy: ResourcePolicy = {
  ...defaultResourcePolicy,
  allowedPathPrefixes: ["/public/", "/tiles/"]
};
```

## Relationship to SceneView3D

The `@gis-engine/scene3d` package has its own `SceneResourcePolicy` for 3D
assets (tilesets, models, textures). That policy controls resource **size and
count budgets** rather than URL schemes. Both policies are independent:

| Concern | Package | What it controls |
|---|---|---|
| URL scheme + host allowlisting | `@gis-engine/engine` | Which URLs are allowed in sources |
| 3D asset size/count budgets | `@gis-engine/scene3d` | Max bytes, texture count, workers |

## Related

- [Diagnostics](/guide/diagnostics) — diagnostic code registry
- [Schema-First Design](/guide/schema-first) — how MapSpec validation works
- [Engine API Reference](/api/engine) — `validateResourcePolicy`, `validateResourceUrl`, `defaultResourcePolicy`
