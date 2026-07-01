---
"@gis-engine/engine": minor
"@gis-engine/ai": minor
"@gis-engine/cli": minor
"@gis-engine/scene3d": minor
"@gis-engine/scene3d-three-adapter": patch
---

Rendering and AI generation enhancement:
- Expression engine: +, -, *, /, coalesce, exponential/cubic-bezier interpolate
- String expressions: concat, upcase, downcase
- New heatmap layer type
- New symbol layer type (full version, symbol-lite retained for backward compatibility)
- Enhanced generate_spec: choropleth, graduated-circle, multi-layer, 6 themes, 50+ location keywords
- New MCP tools: inspect_data (GeoJSON data inspection) and edit_spec (natural language spec editing)
- Expression validator: heatmap-density, concat, upcase, downcase support
- 4 new runnable examples: heatmap-density, choropleth-auto, symbol-labels, expression-showcase
