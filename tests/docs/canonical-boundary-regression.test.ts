import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readText(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const canonicalBoundaryDocs = [
  {
    file: "README.md",
    required: [
      /GIS Engine Workbench[\s\S]{0,160}local-first/i,
      /core \+ extensions model/i,
      /reference implementation/i,
      /minimum\s+closed\s+loop/i,
    ],
  },
  {
    file: "AGENTS.md",
    required: [/core \+ extensions contract/i, /reference implementation/i, /minimum\s+closed\s+loop/i],
  },
  {
    file: "docs/architecture/core-framework.md",
    required: [
      /core \+ extensions/i,
      /核心\s*\/\s*扩展矩阵/i,
      /参考实现|reference implementation/i,
      /最小闭环|minimum\s+closed\s+loop/i,
    ],
  },
  {
    file: "docs/spec/contracts-and-interfaces.md",
    required: [
      /(core \+ extensions|core \+ extensions 的协议边界)/i,
      /核心\s*\/\s*扩展矩阵/i,
      /参考实现|reference implementation/,
      /最小\s*闭环|minimum\s+closed\s+loop/,
    ],
  },
  {
    file: "docs/design/design-limits-and-generalization-boundaries.md",
    required: [/core \+ extensions/i, /reference implementation/i, /minimum\s+closed\s+loop/i],
  },
  {
    file: "docs/intent/project-definition.md",
    required: [/core contract plus extension surface/i, /hard-coded model centered on the current 2D path/i],
  },
] as const;

const forbiddenDriftPatterns = [/2D-only/i, /workflow-only/i, /product-shape/i];

const workbenchProductDocs = [
  "docs/intent/project-definition.md",
  "docs/planning/feature-specs/gis-engine-workbench-v1.md",
] as const;

const canonicalMcpTools = [
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

describe("canonical boundary copy", () => {
  it("keeps core + extensions wording aligned across the boundary docs", () => {
    for (const { file, required } of canonicalBoundaryDocs) {
      const text = readText(file);
      for (const pattern of required) {
        expect(text, `${file} should match ${pattern}`).toMatch(pattern);
      }
    }
  });

  it("rejects 2D-only, workflow-only, and product-shape drift in the boundary docs", () => {
    for (const { file } of canonicalBoundaryDocs) {
      const text = readText(file);
      for (const pattern of forbiddenDriftPatterns) {
        expect(text, `${file} should not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps generated core/extension matrix blocks in sync with the structured source", async () => {
    const { BOUNDARY_MATRIX_TARGETS, buildBoundaryMatrixOutputs, extractGeneratedBlock, readBoundaryMatrixSource } =
      await import("../../scripts/boundary-matrix.mjs");
    const expectedOutputs = buildBoundaryMatrixOutputs(readBoundaryMatrixSource());

    expect(expectedOutputs).toHaveLength(BOUNDARY_MATRIX_TARGETS.length);

    for (const expected of expectedOutputs) {
      const actual = extractGeneratedBlock(readText(expected.file), expected.marker);
      expect(actual, `${expected.file} should match generated boundary matrix source`).toBe(expected.content);
      expect(actual, `${expected.file} should identify the Workbench product consumer`).toContain("`apps/workbench`");
      expect(actual, `${expected.file} should preserve the Phase 1 example boundary`).toContain(
        "`examples/ai-map-workbench`",
      );
      expect(actual, `${expected.file} should prevent Workbench from redefining shared contracts`).toMatch(
        /(?:不得重定义|must not redefine)[\s\S]{0,80}(?:core|`RendererAdapter`)/i,
      );
    }
  });

  it("marks the prior current-product snapshot as superseded by the canonical Workbench definition", () => {
    const historicalDefinition = readText("docs/planning/feature-specs/current-product-definition.md");

    expect(historicalDefinition).toMatch(/^Status: Superseded$/m);
    expect(historicalDefinition).toContain("Historical Snapshot");
    expect(historicalDefinition).toContain(
      "[canonical Workbench product definition](../../intent/project-definition.md)",
    );
  });

  it("keeps Workbench as the local-first primary product with an independently gated 2D v1", () => {
    for (const file of workbenchProductDocs) {
      const text = readText(file);

      expect(text, `${file} should identify Workbench as the primary product`).toMatch(
        /GIS Engine Workbench[\s\S]{0,160}primary\s+(?:user-facing\s+)?product/i,
      );
      expect(text, `${file} should promise MapLibre 2D for Workbench v1`).toMatch(
        /(?:v1[\s\S]{0,80}MapLibre 2D|MapLibre 2D[\s\S]{0,80}v1)/i,
      );
      expect(text, `${file} should keep Workbench on an independent 0.x version`).toMatch(
        /Workbench[\s\S]{0,120}(?:independent|independently)[\s\S]{0,80}`?0\.x`?/i,
      );
      expect(text, `${file} should keep human-readable project files authoritative`).toMatch(
        /(?:human-readable )?project files[\s\S]{0,100}(?:source of truth|authoritative)/i,
      );
      expect(text, `${file} should keep hosted capability outside the v1 promotion`).toMatch(
        /(?:hosted|cloud)[\s\S]{0,160}(?:post-v1|does not promote|not promote|before local v1|out of scope)/i,
      );
      expect(text, `${file} should keep 3D behind an independent promotion gate`).toMatch(
        /3D[\s\S]{0,120}(?:independent|separate)[\s\S]{0,80}(?:promotion )?gate/i,
      );

      let previousToolIndex = -1;
      for (const tool of canonicalMcpTools) {
        const toolIndex = text.indexOf(tool);
        expect(toolIndex, `${file} should list ${tool} in the frozen MCP order`).toBeGreaterThan(previousToolIndex);
        previousToolIndex = toolIndex;
      }
    }
  });

  it("makes Workbench export and telemetry privacy exclusions unconditional", () => {
    const definition = readText("docs/intent/project-definition.md");

    expect(definition).toMatch(/Export never includes credentials or raw provider\s+responses\./);
    expect(definition).toMatch(
      /Telemetry never includes raw prompts, data, `MapSpec`, file paths,\s+credentials, or raw provider responses\./,
    );
    expect(definition).not.toContain("telemetry by default");
  });

  it("keeps the public entrypoint and migration guide aligned with the independent Workbench release", () => {
    const readme = readText("README.md");
    const migration = readText("docs/migration/workbench-0.1.md");
    const changelog = readText("CHANGELOG.md");

    expect(readme).toMatch(/Workbench release line is an independent `0\.x` local preview/);
    expect(readme).toContain("gis-engine-workbench ./my-map");
    expect(migration).toContain("workbench:migrate:export");
    expect(migration).toMatch(/never deletes the source/);
    expect(changelog).toMatch(/PR #47[\s\S]{0,180}does not promote Workbench/);
  });
});
