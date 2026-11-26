---
"@gis-engine/engine": major
---

Remove the unused A2A protocol stub (`A2ATaskRouter`, `createGisEngineAgentCard`,
`validateAgentCard`, and the A2A types) from the public entry point. The module
had no consumers in the repository, tests, examples, or Workbench; agent
interoperability remains covered by the canonical 14-tool MCP server.