import { createGisEngineMcpServer } from "@gis-engine/ai";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createGisEngineMcpServer();
const transport = new StdioServerTransport();

console.error("GIS Engine MCP server starting on stdio...");
await server.connect(transport);
console.error("GIS Engine MCP server connected.");
