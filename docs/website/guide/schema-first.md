# Schema-First Design

GIS Engine uses [TypeBox](https://github.com/sinclairzx81/typebox) to define
every public API surface. JSON Schema and TypeScript types are generated and
kept in sync automatically.

## Why Schema-First?

Traditional map libraries validate state at runtime—if at all. GIS Engine
validates at the boundary:

```typescript
import { MapSpecSchema, validateSpec } from "@gis-engine/engine";

const result = validateSpec(userInput);
// result.success === false → structured diagnostics
// result.success === true  → typed MapSpec
```

Benefits:
- **AI-friendly** — schemas become MCP tool input/output descriptors
- **Type-safe** — `Static<typeof Schema>` gives exact TypeScript types
- **Self-documenting** — schemas are the API docs
- **Validated at edges** — bad data never enters the engine

## Schema Hierarchy

```
MapSpec                              ← Top-level map document
├── sources: Record<string, Source>   ← Data sources (GeoJSON, raster, vector...)
├── layers: Layer[]                   ← Render layers (fill, line, circle...)
├── view: ViewState                   ← Camera position
└── extensions: { scene3d? }          ← Extension boundaries
```

## Adding a New Schema

1. Define in TypeBox:

```typescript
import { Type, type Static } from "@sinclair/typebox";

export const MyFeatureSchema = Type.Object({
  enabled: Type.Boolean({ default: false }),
  intensity: Type.Number({ minimum: 0, maximum: 1 }),
});

export type MyFeature = Static<typeof MyFeatureSchema>;
```

2. Register in the parent schema:

```typescript
export const MapSpecSchema = Type.Object({
  // ...existing fields
  myFeature: Type.Optional(MyFeatureSchema),
});
```

3. Run `pnpm build:schema` to regenerate JSON Schema and types.

## Schema Synchronization

GIS Engine enforces schema-type consistency at build time:

```bash
pnpm build:schema   # Regenerate JSON Schema from TypeBox
pnpm test:schema-sync  # Assert JSON Schema ↔ TypeScript types match
```

## Validation Pipeline

Every public input goes through:

```
Raw Input → Ajv (JSON Schema) → TypeBox (static types) → Semantic Checks → Diagnostics
```

Semantic checks include:
- Source-layer references (does the layer's source exist?)
- Expression validation (does `get("name")` reference a real property?)
- Resource policy (is the URL allowed?)
- Capability gates (is the feature supported?)
