# Natural Language Map Editing

GIS Engine converts natural language into safe, auditable map commands.

## Flow

```
User: "make points red and zoom to Hangzhou"
   │
   ▼
planMapGenerationRequest({ promptHash, intent })
   │
   ▼
createMapGenerationCommandSkeleton()
   │
   ▼
applyCommands(spec, skeleton.commands)
   │
   ▼
MapLibre re-renders with new style
```

## AI Provider Integration

GIS Engine supports any OpenAI-compatible provider (DeepSeek, GPT, etc.):

```typescript
import { callGisEngineTool } from "@gis-engine/ai/mcp";

// AI calls validate_spec to check the current state
const validation = await callGisEngineTool("validate_spec", { spec });

// AI calls apply_commands to make edits
const result = await callGisEngineTool("apply_commands", {
  spec,
  commands: [{ type: "setPaint", layerId: "points", paint: { "circle-color": "#ef4444" } }],
});
```

## Safety Guarantees

- **Structured intents only** — AI must output typed intents, not freeform code
- **Command gating** — all edits go through `applyCommands` with validation
- **Prompt hashing** — raw prompts never stored, only `sha256:*` hashes
- **Audit trail** — every edit records provenance and diagnostics
- **Rollback** — inverse commands generated automatically
