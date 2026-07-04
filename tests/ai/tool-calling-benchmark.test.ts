import { gisEngineTools } from "@gis-engine/ai";
import { Ajv } from "ajv/dist/ajv.js";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolSelectionScenario {
  id: string;
  userIntent: string;
  expectedTool: string;
  /** Keywords that MUST appear in the expected tool's description for this scenario */
  positiveKeywords: string[];
  /** If true, the scenario describes a case where expectedTool should NOT be chosen */
  isNegative?: boolean;
  /** When isNegative, the tool that SHOULD be chosen instead */
  preferredTool?: string;
}

interface ParamComplianceScenario {
  id: string;
  toolName: string;
  params: Record<string, unknown>;
  shouldValidate: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ajv = new Ajv({ allErrors: true, strict: false });
const toolMap = new Map(gisEngineTools.map((t) => [t.name, t]));
const compiledValidators = new Map(gisEngineTools.map((t) => [t.name, ajv.compile(t.inputSchema as object)]));

/**
 * Check that the expected tool's description contains all positive keywords
 * (case-insensitive). Returns missing keywords.
 */
function findMissingKeywords(toolName: string, keywords: string[]): string[] {
  const tool = toolMap.get(toolName);
  if (!tool) return [`tool "${toolName}" not found`];
  const desc = tool.description.toLowerCase();
  return keywords.filter((kw) => !desc.includes(kw.toLowerCase()));
}

/**
 * For negative scenarios: check that the tool's description contains exclusion
 * language ("Do NOT use when" or similar) relevant to the scenario.
 */
function hasExclusionLanguage(toolName: string, keywords: string[]): boolean {
  const tool = toolMap.get(toolName);
  if (!tool) return false;
  const desc = tool.description.toLowerCase();
  // The description must contain "do not use when" plus at least one keyword
  if (!desc.includes("do not use when")) return false;
  return keywords.some((kw) => desc.includes(kw.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Tool Selection Scenarios (50+)
// ---------------------------------------------------------------------------

const toolSelectionScenarios: ToolSelectionScenario[] = [
  // ── validate_spec (4) ──────────────────────────────────────────────────
  {
    id: "VS-1",
    userIntent: "用户提交新 MapSpec 需要验证其正确性",
    expectedTool: "validate_spec",
    positiveKeywords: ["validate", "MapSpec", "correctness"],
  },
  {
    id: "VS-2",
    userIntent: "用户想在 apply_commands 之前做预检",
    expectedTool: "validate_spec",
    positiveKeywords: ["pre-check", "apply_commands"],
  },
  {
    id: "VS-3",
    userIntent: "用户需要检查 spec 是否合法后再部署",
    expectedTool: "validate_spec",
    positiveKeywords: ["validate", "diagnostics"],
  },
  {
    id: "VS-4",
    userIntent: "用户仅需导出 JSON，不需要验证",
    expectedTool: "validate_spec",
    isNegative: true,
    preferredTool: "export_spec",
    positiveKeywords: ["export", "only"],
  },

  // ── apply_commands (5) ─────────────────────────────────────────────────
  {
    id: "AC-1",
    userIntent: "用户说'添加一个热力图层'",
    expectedTool: "apply_commands",
    positiveKeywords: ["add layers", "mutation"],
  },
  {
    id: "AC-2",
    userIntent: "用户说'修改地图中心到北京'",
    expectedTool: "apply_commands",
    positiveKeywords: ["set the view", "state mutation"],
  },
  {
    id: "AC-3",
    userIntent: "用户说'删除名为 roads 的图层'",
    expectedTool: "apply_commands",
    positiveKeywords: ["change styles", "mutation"],
  },
  {
    id: "AC-4",
    userIntent: "用户说'显示地图的结构'",
    expectedTool: "apply_commands",
    isNegative: true,
    preferredTool: "get_context_summary",
    positiveKeywords: ["read", "query"],
  },
  {
    id: "AC-5",
    userIntent: "用户想预检修改但不提交",
    expectedTool: "apply_commands",
    positiveKeywords: ["pre-check modifications", "committing"],
  },

  // ── export_spec (4) ────────────────────────────────────────────────────
  {
    id: "ES-1",
    userIntent: "用户需要最终的 MapSpec JSON 用于部署",
    expectedTool: "export_spec",
    positiveKeywords: ["final", "MapSpec JSON", "deployment"],
  },
  {
    id: "ES-2",
    userIntent: "用户需要分享 spec 给同事",
    expectedTool: "export_spec",
    positiveKeywords: ["sharing", "MapSpec"],
  },
  {
    id: "ES-3",
    userIntent: "用户想应用一批命令并一步导出结果",
    expectedTool: "export_spec",
    positiveKeywords: ["batch of commands", "exporting"],
  },
  {
    id: "ES-4",
    userIntent: "用户仅需预览，不需要完整输出",
    expectedTool: "export_spec",
    isNegative: true,
    preferredTool: "explain_spec",
    positiveKeywords: ["preview", "only"],
  },

  // ── get_context_summary (4) ────────────────────────────────────────────
  {
    id: "CS-1",
    userIntent: "用户想了解地图有哪些图层和数据源",
    expectedTool: "get_context_summary",
    positiveKeywords: ["overview", "layers", "sources"],
  },
  {
    id: "CS-2",
    userIntent: "AI Agent 需要规划下一步操作",
    expectedTool: "get_context_summary",
    positiveKeywords: ["AI agent", "planning"],
  },
  {
    id: "CS-3",
    userIntent: "用户想了解 capability 状态",
    expectedTool: "get_context_summary",
    positiveKeywords: ["capability", "status"],
  },
  {
    id: "CS-4",
    userIntent: "用户想修改地图样式",
    expectedTool: "get_context_summary",
    isNegative: true,
    preferredTool: "apply_commands",
    positiveKeywords: ["modify", "map"],
  },

  // ── snapshot_spec (4) ──────────────────────────────────────────────────
  {
    id: "SS-1",
    userIntent: "用户需要地图截图作为验证证据",
    expectedTool: "snapshot_spec",
    positiveKeywords: ["screenshot", "visual", "evidence"],
  },
  {
    id: "SS-2",
    userIntent: "用户需要可视化预览",
    expectedTool: "snapshot_spec",
    positiveKeywords: ["screenshot", "visual review"],
  },
  {
    id: "SS-3",
    userIntent: "用户需要 headless 快照",
    expectedTool: "snapshot_spec",
    positiveKeywords: ["headless", "snapshot"],
  },
  {
    id: "SS-4",
    userIntent: "用户只需要文本摘要",
    expectedTool: "snapshot_spec",
    isNegative: true,
    preferredTool: "explain_spec",
    positiveKeywords: ["text summary", "data"],
  },

  // ── explain_spec (4) ───────────────────────────────────────────────────
  {
    id: "EX-1",
    userIntent: "用户需要理解 MapSpec 各层的含义",
    expectedTool: "explain_spec",
    positiveKeywords: ["understand", "MapSpec contains", "layers"],
  },
  {
    id: "EX-2",
    userIntent: "AI Agent 需要机器可读的 spec 分析",
    expectedTool: "explain_spec",
    positiveKeywords: ["AI agent", "machine-readable"],
  },
  {
    id: "EX-3",
    userIntent: "用户需要完整的验证诊断信息",
    expectedTool: "explain_spec",
    positiveKeywords: ["validation diagnostics"],
  },
  {
    id: "EX-4",
    userIntent: "用户想修改 spec",
    expectedTool: "explain_spec",
    isNegative: true,
    preferredTool: "apply_commands",
    positiveKeywords: ["modify", "map"],
  },

  // ── export_example_app (4) ─────────────────────────────────────────────
  {
    id: "EA-1",
    userIntent: "用户需要一个完整可运行的示例应用",
    expectedTool: "export_example_app",
    positiveKeywords: ["runnable example", "spec", "data"],
  },
  {
    id: "EA-2",
    userIntent: "用户需要学习或演示用的代码包",
    expectedTool: "export_example_app",
    positiveKeywords: ["learning", "demonstration"],
  },
  {
    id: "EA-3",
    userIntent: "用户需要包含脚本和数据的打包清单",
    expectedTool: "export_example_app",
    positiveKeywords: ["manifest", "file list"],
  },
  {
    id: "EA-4",
    userIntent: "用户只需要 MapSpec JSON",
    expectedTool: "export_example_app",
    isNegative: true,
    preferredTool: "export_spec",
    positiveKeywords: ["MapSpec JSON", "only"],
  },

  // ── diff_specs (4) ─────────────────────────────────────────────────────
  {
    id: "DS-1",
    userIntent: "用户需要比较两个版本的 MapSpec",
    expectedTool: "diff_specs",
    positiveKeywords: ["compare two", "MapSpec"],
  },
  {
    id: "DS-2",
    userIntent: "用户想了解两个版本之间改了什么",
    expectedTool: "diff_specs",
    positiveKeywords: ["what changed", "versions"],
  },
  {
    id: "DS-3",
    userIntent: "用户需要生成迁移命令集",
    expectedTool: "diff_specs",
    positiveKeywords: ["migration commands"],
  },
  {
    id: "DS-4",
    userIntent: "用户只需要查看单个 spec 的内容",
    expectedTool: "diff_specs",
    isNegative: true,
    preferredTool: "explain_spec",
    positiveKeywords: ["single spec"],
  },

  // ── generate_spec (5) ──────────────────────────────────────────────────
  {
    id: "GS-1",
    userIntent: "用户说'创建中国各省GDP分级统计图'",
    expectedTool: "generate_spec",
    positiveKeywords: ["MapSpec created from scratch", "natural language"],
  },
  {
    id: "GS-2",
    userIntent: "用户说'生成一个暗色主题的疫情分布地图'",
    expectedTool: "generate_spec",
    positiveKeywords: ["desired map", "natural language"],
  },
  {
    id: "GS-3",
    userIntent: "用户从零开始描述想要的地图",
    expectedTool: "generate_spec",
    positiveKeywords: ["from scratch", "describes"],
  },
  {
    id: "GS-4",
    userIntent: "用户说'创建一个多图层的人口密度图'",
    expectedTool: "generate_spec",
    positiveKeywords: ["MapSpec", "natural language"],
  },
  {
    id: "GS-5",
    userIntent: "用户已有 spec 只想小改",
    expectedTool: "generate_spec",
    isNegative: true,
    preferredTool: "edit_spec",
    positiveKeywords: ["already exists", "small modifications"],
  },

  // ── inspect_data (4) ───────────────────────────────────────────────────
  {
    id: "ID-1",
    userIntent: "用户需要了解 GeoJSON 数据的属性结构",
    expectedTool: "inspect_data",
    positiveKeywords: ["GeoJSON data", "structure", "property types"],
  },
  {
    id: "ID-2",
    userIntent: "用户想在可视化之前检查数据统计摘要",
    expectedTool: "inspect_data",
    positiveKeywords: ["statistical summary", "GeoJSON"],
  },
  {
    id: "ID-3",
    userIntent: "用户需要确认 geometry 类型和 bounds",
    expectedTool: "inspect_data",
    positiveKeywords: ["geometry types"],
  },
  {
    id: "ID-4",
    userIntent: "用户想过滤或聚合数据",
    expectedTool: "inspect_data",
    isNegative: true,
    preferredTool: "transform_data",
    positiveKeywords: ["transform", "data"],
  },

  // ── edit_spec (4) ──────────────────────────────────────────────────────
  {
    id: "ED-1",
    userIntent: "用户想给现有 spec 添加一个新图层",
    expectedTool: "edit_spec",
    positiveKeywords: ["MapSpec already exists", "natural language"],
  },
  {
    id: "ED-2",
    userIntent: "用户想修改现有 spec 的样式属性",
    expectedTool: "edit_spec",
    positiveKeywords: ["paint", "layout", "properties"],
  },
  {
    id: "ED-3",
    userIntent: "用户用自然语言指令编辑 spec",
    expectedTool: "edit_spec",
    positiveKeywords: ["natural language", "moderate changes"],
  },
  {
    id: "ED-4",
    userIntent: "从零创建新 spec",
    expectedTool: "edit_spec",
    isNegative: true,
    preferredTool: "generate_spec",
    positiveKeywords: ["creating", "from scratch"],
  },

  // ── query_features (4) ─────────────────────────────────────────────────
  {
    id: "QF-1",
    userIntent: "用户点击地图某处查询要素",
    expectedTool: "query_features",
    positiveKeywords: ["features", "point", "location"],
  },
  {
    id: "QF-2",
    userIntent: "用户在 bbox 范围内查找要素",
    expectedTool: "query_features",
    positiveKeywords: ["bounding box", "features"],
  },
  {
    id: "QF-3",
    userIntent: "用户需要查询特定图层的要素属性",
    expectedTool: "query_features",
    positiveKeywords: ["features", "interaction"],
  },
  {
    id: "QF-4",
    userIntent: "用户需要全局数据摘要",
    expectedTool: "query_features",
    isNegative: true,
    preferredTool: "inspect_data",
    positiveKeywords: ["global data summary"],
  },

  // ── style_recommend (4) ────────────────────────────────────────────────
  {
    id: "SR-1",
    userIntent: "用户有 GeoJSON 数据，不确定用什么样式",
    expectedTool: "style_recommend",
    positiveKeywords: ["GeoJSON data", "data-driven suggestions", "styling"],
  },
  {
    id: "SR-2",
    userIntent: "用户想要数据驱动的可视化建议",
    expectedTool: "style_recommend",
    positiveKeywords: ["recommend", "visualization styling"],
  },
  {
    id: "SR-3",
    userIntent: "用户需要 paint 属性推荐",
    expectedTool: "style_recommend",
    positiveKeywords: ["paint properties", "recommendations"],
  },
  {
    id: "SR-4",
    userIntent: "用户已指定了精确样式参数",
    expectedTool: "style_recommend",
    isNegative: true,
    preferredTool: "apply_commands",
    positiveKeywords: ["already specified", "exact style"],
  },

  // ── transform_data (4) ─────────────────────────────────────────────────
  {
    id: "TD-1",
    userIntent: "用户想过滤 GeoJSON 数据",
    expectedTool: "transform_data",
    positiveKeywords: ["filter", "GeoJSON data"],
  },
  {
    id: "TD-2",
    userIntent: "用户想按属性分组聚合数据",
    expectedTool: "transform_data",
    positiveKeywords: ["aggregate", "group-by"],
  },
  {
    id: "TD-3",
    userIntent: "用户想排序和重命名属性",
    expectedTool: "transform_data",
    positiveKeywords: ["sort", "rename"],
  },
  {
    id: "TD-4",
    userIntent: "用户只想了解数据结构",
    expectedTool: "transform_data",
    isNegative: true,
    preferredTool: "inspect_data",
    positiveKeywords: ["inspect", "data structure"],
  },
];

// ---------------------------------------------------------------------------
// Parameter Compliance Scenarios
// ---------------------------------------------------------------------------

const MINIMAL_SPEC = {
  version: "0.1",
  view: { center: [0, 0], zoom: 2 },
  sources: {},
  layers: [],
};

const MINIMAL_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { name: "test", value: 42 },
    },
  ],
};

const paramComplianceScenarios: ParamComplianceScenario[] = [
  // validate_spec
  { id: "PC-VS-1", toolName: "validate_spec", params: { spec: MINIMAL_SPEC }, shouldValidate: true },
  { id: "PC-VS-2", toolName: "validate_spec", params: {}, shouldValidate: false },
  { id: "PC-VS-3", toolName: "validate_spec", params: { spec: MINIMAL_SPEC, extra: true }, shouldValidate: false },

  // apply_commands
  {
    id: "PC-AC-1",
    toolName: "apply_commands",
    params: { spec: MINIMAL_SPEC, commands: [] },
    shouldValidate: true,
  },
  {
    id: "PC-AC-2",
    toolName: "apply_commands",
    params: { spec: MINIMAL_SPEC, commands: [], dryRun: true, transaction: "atomic" },
    shouldValidate: true,
  },
  { id: "PC-AC-3", toolName: "apply_commands", params: { spec: MINIMAL_SPEC }, shouldValidate: false },
  { id: "PC-AC-4", toolName: "apply_commands", params: { commands: [] }, shouldValidate: false },
  {
    id: "PC-AC-5",
    toolName: "apply_commands",
    params: { spec: MINIMAL_SPEC, commands: [], transaction: "invalid-mode" },
    shouldValidate: false,
  },

  // export_spec
  { id: "PC-EX-1", toolName: "export_spec", params: { spec: MINIMAL_SPEC }, shouldValidate: true },
  {
    id: "PC-EX-2",
    toolName: "export_spec",
    params: { spec: MINIMAL_SPEC, commands: [], dryRun: false, transaction: "best-effort" },
    shouldValidate: true,
  },
  { id: "PC-EX-3", toolName: "export_spec", params: {}, shouldValidate: false },
  { id: "PC-EX-4", toolName: "export_spec", params: { spec: MINIMAL_SPEC, unknown: 1 }, shouldValidate: false },

  // get_context_summary
  { id: "PC-CS-1", toolName: "get_context_summary", params: { spec: MINIMAL_SPEC }, shouldValidate: true },
  { id: "PC-CS-2", toolName: "get_context_summary", params: {}, shouldValidate: false },
  {
    id: "PC-CS-3",
    toolName: "get_context_summary",
    params: { spec: MINIMAL_SPEC, unexpected: true },
    shouldValidate: false,
  },

  // snapshot_spec
  { id: "PC-SS-1", toolName: "snapshot_spec", params: { spec: MINIMAL_SPEC }, shouldValidate: true },
  {
    id: "PC-SS-2",
    toolName: "snapshot_spec",
    params: { spec: MINIMAL_SPEC, renderer: "maplibre", snapshot: { width: 320, height: 180 } },
    shouldValidate: true,
  },
  { id: "PC-SS-3", toolName: "snapshot_spec", params: {}, shouldValidate: false },
  {
    id: "PC-SS-4",
    toolName: "snapshot_spec",
    params: { spec: MINIMAL_SPEC, renderer: "scene3d" },
    shouldValidate: false,
  },

  // explain_spec
  { id: "PC-EX1", toolName: "explain_spec", params: { spec: MINIMAL_SPEC }, shouldValidate: true },
  { id: "PC-EX2", toolName: "explain_spec", params: {}, shouldValidate: false },
  { id: "PC-EX3", toolName: "explain_spec", params: { spec: MINIMAL_SPEC, extra: 1 }, shouldValidate: false },

  // export_example_app
  { id: "PC-EA-1", toolName: "export_example_app", params: { exampleId: "basic-geojson" }, shouldValidate: true },
  {
    id: "PC-EA-2",
    toolName: "export_example_app",
    params: { exampleId: "pmtiles-local" },
    shouldValidate: true,
  },
  { id: "PC-EA-3", toolName: "export_example_app", params: {}, shouldValidate: false },
  {
    id: "PC-EA-4",
    toolName: "export_example_app",
    params: { exampleId: "non-existent-example" },
    shouldValidate: false,
  },

  // diff_specs
  {
    id: "PC-DS-1",
    toolName: "diff_specs",
    params: { before: MINIMAL_SPEC, after: MINIMAL_SPEC },
    shouldValidate: true,
  },
  {
    id: "PC-DS-2",
    toolName: "diff_specs",
    params: {
      before: MINIMAL_SPEC,
      after: MINIMAL_SPEC,
      options: { ignoreMetadata: true, ignoreRevision: true },
    },
    shouldValidate: true,
  },
  { id: "PC-DS-3", toolName: "diff_specs", params: { before: MINIMAL_SPEC }, shouldValidate: false },
  { id: "PC-DS-4", toolName: "diff_specs", params: {}, shouldValidate: false },

  // generate_spec
  {
    id: "PC-GS-1",
    toolName: "generate_spec",
    params: { intent: { description: "A choropleth map of GDP" } },
    shouldValidate: true,
  },
  {
    id: "PC-GS-2",
    toolName: "generate_spec",
    params: { intent: { description: "Heatmap", dataType: "geojson", zoom: 5 } },
    shouldValidate: true,
  },
  { id: "PC-GS-3", toolName: "generate_spec", params: {}, shouldValidate: false },
  { id: "PC-GS-4", toolName: "generate_spec", params: { intent: {} }, shouldValidate: false },
  {
    id: "PC-GS-5",
    toolName: "generate_spec",
    params: { intent: { description: "test", dataType: "invalid-type" } },
    shouldValidate: false,
  },

  // inspect_data
  { id: "PC-ID-1", toolName: "inspect_data", params: { geojson: MINIMAL_GEOJSON }, shouldValidate: true },
  {
    id: "PC-ID-2",
    toolName: "inspect_data",
    params: { url: "https://example.com/data.geojson" },
    shouldValidate: true,
  },
  {
    id: "PC-ID-3",
    toolName: "inspect_data",
    params: { geojson: MINIMAL_GEOJSON, sampleSize: 10 },
    shouldValidate: true,
  },
  {
    id: "PC-ID-4",
    toolName: "inspect_data",
    params: { geojson: MINIMAL_GEOJSON, sampleSize: 200 },
    shouldValidate: false,
  },
  { id: "PC-ID-5", toolName: "inspect_data", params: { unknown: true }, shouldValidate: false },

  // edit_spec
  {
    id: "PC-ED-1",
    toolName: "edit_spec",
    params: { spec: MINIMAL_SPEC, instruction: "Add a heatmap layer" },
    shouldValidate: true,
  },
  { id: "PC-ED-2", toolName: "edit_spec", params: { spec: MINIMAL_SPEC }, shouldValidate: false },
  { id: "PC-ED-3", toolName: "edit_spec", params: { instruction: "Add layer" }, shouldValidate: false },
  {
    id: "PC-ED-4",
    toolName: "edit_spec",
    params: { spec: MINIMAL_SPEC, instruction: "" },
    shouldValidate: false,
  },

  // query_features
  {
    id: "PC-QF-1",
    toolName: "query_features",
    params: { geojson: MINIMAL_GEOJSON, point: [0, 0] },
    shouldValidate: true,
  },
  {
    id: "PC-QF-2",
    toolName: "query_features",
    params: { geojson: MINIMAL_GEOJSON, bbox: [-1, -1, 1, 1] },
    shouldValidate: true,
  },
  { id: "PC-QF-3", toolName: "query_features", params: { geojson: MINIMAL_GEOJSON }, shouldValidate: true },
  { id: "PC-QF-4", toolName: "query_features", params: { point: [0, 0] }, shouldValidate: false },
  {
    id: "PC-QF-5",
    toolName: "query_features",
    params: { geojson: MINIMAL_GEOJSON, maxFeatures: 5000 },
    shouldValidate: false,
  },

  // style_recommend
  {
    id: "PC-SR-1",
    toolName: "style_recommend",
    params: { geojson: MINIMAL_GEOJSON },
    shouldValidate: true,
  },
  {
    id: "PC-SR-2",
    toolName: "style_recommend",
    params: { geojson: MINIMAL_GEOJSON, hints: { theme: "dark", density: "high" } },
    shouldValidate: true,
  },
  { id: "PC-SR-3", toolName: "style_recommend", params: {}, shouldValidate: false },
  {
    id: "PC-SR-4",
    toolName: "style_recommend",
    params: { geojson: MINIMAL_GEOJSON, hints: { theme: "neon" } },
    shouldValidate: false,
  },

  // transform_data
  {
    id: "PC-TD-1",
    toolName: "transform_data",
    params: {
      geojson: MINIMAL_GEOJSON,
      operations: [{ type: "filter", property: "value", operator: ">", value: 10 }],
    },
    shouldValidate: true,
  },
  {
    id: "PC-TD-2",
    toolName: "transform_data",
    params: {
      geojson: MINIMAL_GEOJSON,
      operations: [{ type: "aggregate", groupBy: "name", aggregation: "count" }],
    },
    shouldValidate: true,
  },
  { id: "PC-TD-3", toolName: "transform_data", params: { geojson: MINIMAL_GEOJSON }, shouldValidate: false },
  { id: "PC-TD-4", toolName: "transform_data", params: { operations: [] }, shouldValidate: false },
  {
    id: "PC-TD-5",
    toolName: "transform_data",
    params: { geojson: MINIMAL_GEOJSON, operations: [{ type: "unknown-op" }] },
    shouldValidate: false,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP Tool Calling Benchmark", () => {
  // Collect results for the summary
  const selectionResults: Array<{ id: string; passed: boolean; expectedTool: string; isNegative: boolean }> = [];
  const complianceResults: Array<{ id: string; passed: boolean; toolName: string }> = [];

  describe("Tool Inventory", () => {
    it("should expose exactly 14 tools", () => {
      expect(gisEngineTools).toHaveLength(14);
    });

    it("should have all tools in snake_case", () => {
      for (const tool of gisEngineTools) {
        expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    });

    it("should have inputSchema and outputSchema for every tool", () => {
      for (const tool of gisEngineTools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.outputSchema).toBeDefined();
      }
    });

    it("should have description with Use when / Do NOT use when sections", () => {
      for (const tool of gisEngineTools) {
        const desc = tool.description;
        expect(desc.toLowerCase()).toContain("use when");
        expect(desc.toLowerCase()).toContain("do not use when");
      }
    });
  });

  describe("Tool Selection Accuracy", () => {
    for (const scenario of toolSelectionScenarios) {
      it(`[${scenario.id}] ${scenario.userIntent}`, () => {
        const tool = toolMap.get(scenario.expectedTool);
        expect(tool, `Tool "${scenario.expectedTool}" must exist`).toBeDefined();

        if (scenario.isNegative) {
          // Negative: the tool's description should have exclusion language
          // matching at least one keyword, confirming it would NOT be chosen
          const excluded = hasExclusionLanguage(scenario.expectedTool, scenario.positiveKeywords);
          selectionResults.push({
            id: scenario.id,
            passed: excluded,
            expectedTool: scenario.expectedTool,
            isNegative: true,
          });
          expect(
            excluded,
            `[${scenario.id}] "${scenario.expectedTool}" description should contain "Do NOT use when" + keywords for negative scenario`,
          ).toBe(true);

          // Also verify the preferred tool exists and has matching positive keywords
          if (scenario.preferredTool) {
            const preferred = toolMap.get(scenario.preferredTool);
            expect(preferred, `Preferred tool "${scenario.preferredTool}" must exist`).toBeDefined();
          }
        } else {
          // Positive: the expected tool's description should contain all keywords
          const missing = findMissingKeywords(scenario.expectedTool, scenario.positiveKeywords);
          const passed = missing.length === 0;
          selectionResults.push({
            id: scenario.id,
            passed,
            expectedTool: scenario.expectedTool,
            isNegative: false,
          });
          expect(
            missing,
            `[${scenario.id}] "${scenario.expectedTool}" description missing keywords: ${missing.join(", ")}`,
          ).toEqual([]);
        }
      });
    }
  });

  describe("Parameter Compliance", () => {
    for (const scenario of paramComplianceScenarios) {
      it(`[${scenario.id}] ${scenario.toolName} params ${scenario.shouldValidate ? "should" : "should NOT"} validate`, () => {
        const validator = compiledValidators.get(scenario.toolName);
        expect(validator, `Validator for "${scenario.toolName}" must exist`).toBeDefined();

        const valid = validator(scenario.params);
        const passed = valid === scenario.shouldValidate;
        complianceResults.push({ id: scenario.id, passed, toolName: scenario.toolName });

        if (scenario.shouldValidate) {
          expect(
            valid,
            `[${scenario.id}] ${scenario.toolName} params should validate but got errors: ${JSON.stringify(validator.errors)}`,
          ).toBe(true);
        } else {
          expect(valid, `[${scenario.id}] ${scenario.toolName} params should NOT validate but passed`).toBe(false);
        }
      });
    }
  });

  describe("Benchmark Summary", () => {
    it("should report accuracy metrics for all scenarios", () => {
      // ── Selection metrics ──────────────────────────────────────────
      const positiveScenarios = selectionResults.filter((r) => !r.isNegative);
      const negativeScenarios = selectionResults.filter((r) => r.isNegative);
      const positivePassed = positiveScenarios.filter((r) => r.passed).length;
      const negativePassed = negativeScenarios.filter((r) => r.passed).length;

      const selectionAccuracy = positiveScenarios.length > 0 ? positivePassed / positiveScenarios.length : 1;
      const exclusionAccuracy = negativeScenarios.length > 0 ? negativePassed / negativeScenarios.length : 1;

      // ── Compliance metrics ─────────────────────────────────────────
      const compliancePassed = complianceResults.filter((r) => r.passed).length;
      const complianceAccuracy = complianceResults.length > 0 ? compliancePassed / complianceResults.length : 1;

      // ── Per-tool breakdown ─────────────────────────────────────────
      const perTool = new Map<string, { total: number; passed: number }>();
      for (const r of [...selectionResults, ...complianceResults]) {
        const key = "expectedTool" in r ? r.expectedTool : r.toolName;
        const entry = perTool.get(key) ?? { total: 0, passed: 0 };
        entry.total++;
        if (r.passed) entry.passed++;
        perTool.set(key, entry);
      }

      // ── Report ─────────────────────────────────────────────────────
      const report = {
        selectionAccuracy: `${(selectionAccuracy * 100).toFixed(1)}%`,
        exclusionAccuracy: `${(exclusionAccuracy * 100).toFixed(1)}%`,
        parameterCompliance: `${(complianceAccuracy * 100).toFixed(1)}%`,
        totalSelectionScenarios: selectionResults.length,
        totalComplianceScenarios: complianceResults.length,
        perToolBreakdown: Object.fromEntries(
          [...perTool.entries()].map(([tool, stats]) => [
            tool,
            { ...stats, accuracy: `${((stats.passed / stats.total) * 100).toFixed(1)}%` },
          ]),
        ),
      };

      // Log the report for CI trend tracking
      // eslint-disable-next-line no-console
      console.log("\n═══ MCP Tool Calling Benchmark Report ═══");
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(report, null, 2));
      // eslint-disable-next-line no-console
      console.log("═══════════════════════════════════════════\n");

      // Core assertions — target ≥ 90%
      expect(selectionAccuracy).toBeGreaterThanOrEqual(0.9);
      expect(exclusionAccuracy).toBeGreaterThanOrEqual(0.9);
      expect(complianceAccuracy).toBe(1); // Parameter compliance must be 100%

      // All 14 tools should have coverage
      expect(perTool.size).toBeGreaterThanOrEqual(14);
    });
  });
});
