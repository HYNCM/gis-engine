import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readText(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function collectMarkdownFiles(paths: string[]): string[] {
  const result: string[] = [];
  for (const p of paths) {
    const full = resolve(repoRoot, p);
    if (statSync(full).isFile()) {
      result.push(p);
    } else {
      for (const entry of readdirSync(full, { recursive: true })) {
        if (String(entry).endsWith(".md")) {
          result.push(join(p, String(entry)));
        }
      }
    }
  }
  return result;
}

const currentMcpTools = [
  "apply_commands",
  "validate_spec",
  "export_spec",
  "get_context_summary",
  "snapshot_spec",
  "explain_spec",
  "export_example_app",
  "diff_specs",
  "generate_spec",
  "inspect_data",
  "edit_spec",
  "query_features",
  "style_recommend",
  "transform_data",
] as const;

const canonicalMcpInventory = currentMcpTools.join(", ");

function normalizeContractText(text: string): string {
  return text
    .replace(/`/g, "")
    .replace(/^\s*\/\/\s?/gm, "")
    .replace(/,\s+and\s+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function expectCanonicalMcpOrder(file: string): void {
  expect(normalizeContractText(readText(file)), `${file} should list the canonical tools/list order`).toContain(
    canonicalMcpInventory,
  );
}

describe("public docs consistency", () => {
  it("keeps v1.0.0 entry points aligned", () => {
    const files = ["CHANGELOG.md", "docs/website/release-notes.md", "docs/migration/v0.x-to-v1.0.md"];

    for (const file of files) {
      expect(readText(file), `${file} should mention v1.0.0`).toContain("v1.0.0");
    }
  });

  it("keeps current version entry points aligned", () => {
    const files = [
      "README.md",
      "docs/quickstart.md",
      "packages/cli/README.md",
      "docs/mcp-server-description.md",
      "docs/website/guide/quick-start.md",
      "docs/website/index.md",
    ];

    for (const file of files) {
      expect(readText(file), `${file} should mention v1.5.0`).toContain("v1.5.0");
    }
  });

  it("keeps v1.5 release notes free of date placeholders", () => {
    const changelog = readText("CHANGELOG.md");

    expect(changelog).toContain("## [1.5.0] - 2026-07-06");
    expect(changelog).not.toContain("2026-07-XX");
  });

  it("keeps v1.5 migration MCP surface aligned with the public feature matrix", () => {
    const migration = readText("docs/migration/v1.4-to-v1.5.md");
    const featureMatrix = readText("docs/engineering/supported-feature-matrix.md");

    expect(migration).toContain("14 MCP tools");
    for (const tool of currentMcpTools) {
      expect(featureMatrix, `feature matrix should list ${tool}`).toContain(tool);
      expect(migration, `migration guide should list ${tool}`).toContain(tool);
    }
    expectCanonicalMcpOrder("docs/engineering/supported-feature-matrix.md");
    expectCanonicalMcpOrder("docs/migration/v1.4-to-v1.5.md");
  });

  it("keeps the canonical 14-tool inventory aligned across active public contracts", () => {
    const files = [
      "AGENTS.md",
      "docs/spec/phase-1-ai-map-authoring.md",
      "docs/spec/contracts-and-interfaces.md",
      "docs/quickstart.md",
      "docs/mcp-server-description.md",
      "docs/engineering/contract-freeze.md",
      "docs/engineering/supported-feature-matrix.md",
      "docs/migration/v1.4-to-v1.5.md",
      "docs/blog/2026-07-ai-native-map-sdk.md",
      "docs/website/api/ai.md",
      "docs/website/mcp/overview.md",
      "docs/website/mcp/setup-guides.md",
      "packages/ai/README.md",
      "examples/mcp-server-setup/README.md",
      "skills/gis-engine-mcp-setup/SKILL.md",
    ];

    for (const file of files) {
      const text = readText(file);
      expect(text, `${file} should identify the 14-tool inventory`).toMatch(/14(?:-tool| MCP tool| tools|\s+tools)/i);
      for (const tool of currentMcpTools) {
        expect(text, `${file} should list ${tool}`).toContain(tool);
      }
      expectCanonicalMcpOrder(file);
    }
  });

  it("documents the stable MCP protocol and descriptor schema dialect at public setup surfaces", () => {
    const files = [
      "AGENTS.md",
      "packages/ai/README.md",
      "docs/website/mcp/overview.md",
      "docs/website/mcp/setup-guides.md",
      "examples/mcp-server-setup/README.md",
      "skills/gis-engine-mcp-setup/SKILL.md",
    ];

    for (const file of files) {
      const text = readText(file);
      expect(text, `${file} should name the stable MCP protocol`).toContain("2025-11-25");
      expect(text, `${file} should name the descriptor schema dialect`).toContain("draft-07");
    }
  });

  it("keeps both AI-native SDK research copies on the complete grouped 14-tool inventory", () => {
    for (const file of [
      "docs/research/ai-native-map-sdk-design.md",
      "docs/website/research/ai-native-map-sdk-design.md",
    ]) {
      const text = readText(file);
      expect(text, `${file} should describe all 14 MCP tools`).toContain("14 MCP tools");
      expect(text, `${file} should not retain the seven-tool claim`).not.toContain("exposes 7 MCP tools");
      expect(text, `${file} should name the Core lifecycle group`).toContain("Core lifecycle");
      expect(text, `${file} should name the Authoring extensions group`).toContain("Authoring extensions");
      expect(text, `${file} should name the Data intelligence group`).toContain("Data intelligence");
      expectCanonicalMcpOrder(file);
    }
  });

  it("keeps MCP overview summaries aligned with the public descriptors", () => {
    const overview = readText("docs/website/mcp/overview.md");

    expect(overview).toContain("`{ valid, diagnostics, stats }`");
    expect(overview).toContain("`{ spec, renderer?, snapshot? }`");
    expect(overview).toContain("`{ passed, diagnostics, dataUrl?, renderer, validation }`");
    expect(overview).toContain("`{ summary, validation, diagnostics }`");
    expect(overview).toContain("`{ exampleId, generationEvidence? }`");
    expect(overview).toContain("`{ exampleId, title, description, writesFiles, files, notes, generationEvidence? }`");
  });

  it("presents only the documented Core lifecycle pages in apply-first sidebar order", () => {
    const config = readText("docs/website/.vitepress/config.mjs");
    const mcpSidebar = config.slice(config.indexOf('"/mcp/": ['), config.indexOf('"/research/": ['));
    const setup = readText("docs/website/mcp/setup-guides.md");

    expect(mcpSidebar).toContain('text: "Core lifecycle tools"');
    expect(mcpSidebar).toContain('text: "apply_commands"');
    expect(mcpSidebar).toContain('text: "validate_spec"');
    expect(mcpSidebar.indexOf('text: "apply_commands"')).toBeLessThan(mcpSidebar.indexOf('text: "validate_spec"'));
    expect(setup).not.toContain("and individual tool pages");
    expect(setup).toContain("Core lifecycle tool pages");
  });

  it("documents export_spec failures as structured diagnostics with legacy text compatibility", () => {
    const exportSpec = readText("docs/website/mcp/export-spec.md");

    expect(exportSpec).toContain("{ diagnostics: Diagnostic[] }");
    expect(exportSpec).toContain("legacy JSON text");
    expect(exportSpec).not.toContain("On failure the output is a `Diagnostic[]` array");
  });

  it("keeps the MCP setup skill executable and aligned with public result envelopes", () => {
    const skill = readText("skills/gis-engine-mcp-setup/SKILL.md");

    expect(skill).toContain("StdioServerTransport");
    expect(skill).toContain("await server.connect(transport)");
    expect(skill).not.toContain("Server starts on stdio transport automatically");
    expect(skill).toContain('"isError": true');
    expect(skill).toContain('"structuredContent"');
    expect(skill).not.toContain('"ok": false');
    expect(skill).not.toContain("All tools require at minimum a `spec` field");
    expect(skill).toContain("Only the seven Core lifecycle tools are documented in detail below");
    expect(skill).toContain("MCP Tools Overview");
  });

  it("keeps executable MCP MapSpec examples on schema version 0.1", () => {
    for (const file of [
      "docs/mcp-server-description.md",
      "docs/website/mcp/setup-guides.md",
      "examples/mcp-server-setup/README.md",
      "skills/gis-engine-mcp-setup/SKILL.md",
    ]) {
      expect(readText(file), `${file} should not use an executable MapSpec version 1.0 example`).not.toMatch(
        /"version"\s*:\s*"1\.0"/,
      );
    }
  });

  it("documents the MCP structured result and compatible error contracts", () => {
    for (const file of [
      "AGENTS.md",
      "docs/spec/phase-1-ai-map-authoring.md",
      "docs/spec/contracts-and-interfaces.md",
      "docs/mcp-server-description.md",
      "packages/ai/README.md",
    ]) {
      const text = readText(file);
      expect(text, `${file} should require structuredContent`).toContain("structuredContent");
      expect(text, `${file} should document structured diagnostics`).toMatch(
        /diagnostics.*(?:envelope|结构化|structured)/is,
      );
    }
  });

  it("does not retain superseded MCP inventory claims in active public guides", () => {
    const files = [
      "docs/blog/2026-07-rendering-milestone.md",
      "docs/website/guide/mcp-server.md",
      "docs/website/guide/core-concepts.md",
      "docs/website/guide/what-is-gis-engine.md",
      "docs/website/blog/2026-07-ai-native-map-sdk.md",
    ];

    for (const file of files) {
      const text = readText(file);
      expect(text, `${file} should describe the canonical inventory`).toMatch(/14 (?:MCP )?tools/i);
      expect(text, `${file} should not claim a superseded seven- or nine-tool inventory`).not.toMatch(
        /(?:(?:exposes|Seven)\s+7?|(?:total to|Integration:)\s+(?:9|nine))\s*(?:\[MCP tools\]|MCP tools|tools)/i,
      );
    }
  });

  it("links migration index to the main v1.0 guide", () => {
    const migrationIndex = readText("docs/migration/README.md");

    expect(migrationIndex).toContain("./v0.x-to-v1.0.md");
    expect(migrationIndex).toContain("./v1.4-to-v1.5.md");
  });

  it("keeps generated API reference entry points visible", () => {
    expect(readText("docs/website/api/index.md")).toContain("/api/reference/engine/");
    expect(readText("docs/website/api/index.md")).toContain("/api/reference/ai/");
    expect(readText("docs/website/api/index.md")).toContain("/api/reference/cli/");
    expect(readText("docs/website/api/engine.md")).toContain("/api/reference/engine/");
    expect(readText("docs/website/api/ai.md")).toContain("/api/reference/ai/");
    expect(readText("docs/website/api/cli.md")).toContain("/api/reference/cli/");
    expect(readText("docs/website/api/reference/engine/index.md")).toContain("generated by `pnpm docs:api`");
  });

  it("keeps generated AI tool-name references on the v1.5 canonical inventory", () => {
    const typeReference = readText("docs/website/api/reference/ai/type-aliases/GisEngineToolName.md");
    expect(typeReference).toContain("@gis-engine/ai v1.5.0");
    expect(typeReference).toContain("typeof");
    expect(typeReference).toContain("GIS_ENGINE_TOOL_NAMES");
    expect(typeReference).toContain("number");

    for (const file of [
      "docs/website/api/reference/ai/variables/ContextSummaryToolResultSchema.md",
      "docs/website/api/reference/ai/variables/GenerationEvidenceBundleSchema.md",
    ]) {
      const text = readText(file);
      expect(text, `${file} should report the current AI package version`).toContain("@gis-engine/ai v1.5.0");

      let previousIndex = -1;
      for (const tool of currentMcpTools) {
        const toolIndex = text.indexOf(tool);
        expect(toolIndex, `${file} should contain ${tool}`).toBeGreaterThan(previousIndex);
        previousIndex = toolIndex;
      }
    }
  });

  it("keeps the three core example readmes in the standard structure", () => {
    const exampleFiles = [
      "examples/getting-started/README.md",
      "examples/basic-geojson/README.md",
      "examples/pmtiles-local/README.md",
    ];

    for (const file of exampleFiles) {
      const text = readText(file);
      expect(text, `${file} should have Goal section`).toContain("## Goal");
      expect(text, `${file} should have Prerequisites section`).toContain("## Prerequisites");
      expect(text, `${file} should have Run section`).toContain("## Run");
      expect(text, `${file} should have Expected Output section`).toContain("## Expected Output");
      expect(text, `${file} should have Limits And Follow-up section`).toContain("## Limits And Follow-up");
    }
  });

  it("checks generated API reference directories into the docs tree", () => {
    expect(existsSync(resolve(repoRoot, "docs/website/api/reference/engine/index.md"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "docs/website/api/reference/ai/index.md"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "docs/website/api/reference/cli/index.md"))).toBe(true);
  });

  it("describes MapSpec as core + extensions in key architecture docs", () => {
    const archDocs = ["docs/architecture/core-framework.md", "docs/spec/contracts-and-interfaces.md"];

    for (const file of archDocs) {
      const text = readText(file);
      expect(text, `${file} should mention core + extensions boundary`).toMatch(
        /core\s*\+\s*extensions?|extensions?\s*\+\s*core/i,
      );
    }
  });

  it("rejects 2D-only wording in public-facing docs", () => {
    const forbiddenPatterns = [
      /\b2D[\s-]only\b/i,
      /\bonly\s+2D\b/i,
      /\b2D\s+map\s+SDK\s+only\b/i,
      /\bexclusively\s+2D\b/i,
    ];

    const publicDocs = collectMarkdownFiles(["docs/website", "docs/quickstart.md"]);

    for (const file of publicDocs) {
      const text = readText(file);
      for (const pattern of forbiddenPatterns) {
        expect(text, `${file} should not contain ${pattern.source}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps core-framework field-level matrix in sync with MapSpec schema", () => {
    const coreFramework = readText("docs/architecture/core-framework.md");
    const requiredFields = ["version", "view", "sources", "layers", "interactions", "metadata", "extensions"];

    for (const field of requiredFields) {
      expect(coreFramework, `core-framework.md should document field: ${field}`).toContain(`\`${field}\``);
    }
  });
});
