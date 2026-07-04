import { defineConfig } from "vitepress";

export default defineConfig({
  title: "GIS Engine",
  description: "AI-native, schema-first map engine — deterministic, replayable, auditable.",
  lang: "en-US",
  base: "/gis-engine/",
  lastUpdated: true,
  cleanUrls: true,

  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/gis-engine/favicon.svg" }]],

  themeConfig: {
    logo: {
      light: "/gis-engine/logo-light.svg",
      dark: "/gis-engine/logo-dark.svg",
    },
    nav: [
      { text: "Guide", link: "/guide/what-is-gis-engine" },
      { text: "API", link: "/api/" },
      { text: "MCP", link: "/mcp/overview" },
      { text: "Research", link: "/research/ai-native-map-sdk-design" },
      { text: "Blog", link: "/blog/2026-07-ai-native-map-sdk" },
      { text: "Release Notes", link: "/release-notes" },
      { text: "Examples", link: "https://github.com/HYNCM/gis-engine/tree/main/examples" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is GIS Engine?", link: "/guide/what-is-gis-engine" },
            { text: "Quick Start", link: "/guide/quick-start" },
            { text: "Playground", link: "/guide/playground" },
            { text: "Minimal Consumer Handoff", link: "/guide/consumer-handoff" },
            { text: "Migrate from v0.x to v1.0", link: "/guide/migrate-v0x-to-v1" },
            { text: "Core Concepts", link: "/guide/core-concepts" },
            { text: "Schema-First Design", link: "/guide/schema-first" },
            { text: "Command System", link: "/guide/commands" },
            { text: "Diagnostics", link: "/guide/diagnostics" },
            { text: "Diagnostic Codes Reference", link: "/guide/diagnostic-codes" },
          ],
        },
        {
          text: "AI Integration",
          items: [
            { text: "MCP Server Setup", link: "/guide/mcp-server" },
            { text: "Natural Language Editing", link: "/guide/nl-editing" },
            { text: "Generation Evidence", link: "/guide/generation-evidence" },
          ],
        },
        {
          text: "Tutorials",
          items: [
            { text: "Choropleth Map in 10 Minutes", link: "/guide/tutorial-choropleth" },
            { text: "AI-Assisted Map Creation", link: "/guide/tutorial-ai-map" },
            { text: "Interactive Map with Events", link: "/guide/tutorial-interactive-map" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Custom Adapters", link: "/guide/custom-adapters" },
            { text: "Snapshot Testing", link: "/guide/snapshot-testing" },
            { text: "Resource Policy", link: "/guide/resource-policy" },
            { text: "Performance", link: "/guide/performance" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api/" },
            { text: "@gis-engine/engine", link: "/api/engine" },
            { text: "Engine reference", link: "/api/reference/engine/" },
            { text: "@gis-engine/ai", link: "/api/ai" },
            { text: "AI reference", link: "/api/reference/ai/" },
            { text: "@gis-engine/cli", link: "/api/cli" },
            { text: "CLI reference", link: "/api/reference/cli/" },
            { text: "@gis-engine/scene3d", link: "/api/scene3d" },
          ],
        },
      ],
      "/mcp/": [
        {
          text: "MCP Tools",
          items: [
            { text: "Overview", link: "/mcp/overview" },
            { text: "validate_spec", link: "/mcp/validate-spec" },
            { text: "apply_commands", link: "/mcp/apply-commands" },
            { text: "export_spec", link: "/mcp/export-spec" },
            { text: "get_context_summary", link: "/mcp/get-context-summary" },
            { text: "snapshot_spec", link: "/mcp/snapshot-spec" },
            { text: "explain_spec", link: "/mcp/explain-spec" },
            { text: "export_example_app", link: "/mcp/export-example-app" },
          ],
        },
      ],
      "/research/": [
        {
          text: "Research",
          items: [{ text: "AI-Native Map SDK Design", link: "/research/ai-native-map-sdk-design" }],
        },
      ],
      "/blog/": [
        {
          text: "Blog",
          items: [
            { text: "AI-Native Map SDK (Jul 2026)", link: "/blog/2026-07-ai-native-map-sdk" },
            { text: "GIS Engine v1.2 (Jul 2026)", link: "/blog/2026-07-gis-engine-v1.2" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/HYNCM/gis-engine" }],

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the Apache-2.0 License.",
      copyright: "Copyright © 2026 GIS Engine contributors",
    },
  },
});
