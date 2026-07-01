import { applyCommandsTool, diffSpecsTool, type GenerateSpecToolInput, generateSpecTool } from "@gis-engine/ai";
import { DiagnosticCodes, type MapSpec, validateSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

// ─── Eval Prompts for generate_spec ────────────────────────────────────────

interface EvalPrompt {
  id: string;
  description: string;
  /** Expected primary layer type */
  expectedLayerType: string;
  /** Optional: extra input fields */
  extra?: Partial<GenerateSpecToolInput["intent"]>;
}

const EVAL_PROMPTS: EvalPrompt[] = [
  // Basic maps
  { id: "basic-world", description: "A world map centered on the equator", expectedLayerType: "fill" },
  { id: "basic-tokyo", description: "Map of Tokyo, Japan", expectedLayerType: "fill" },
  { id: "basic-france", description: "Overview of France", expectedLayerType: "fill" },
  { id: "basic-london", description: "Street map of London", expectedLayerType: "fill" },
  { id: "basic-new-york", description: "Overview of New York state regions", expectedLayerType: "fill" },

  // Data visualization
  {
    id: "choropleth-gdp",
    description: "Show GDP per capita by country as a choropleth map",
    expectedLayerType: "fill",
  },
  {
    id: "points-restaurants",
    description: "Display restaurant locations as colored dots in New York City",
    expectedLayerType: "circle",
  },
  { id: "lines-routes", description: "Show major highway routes across the United States", expectedLayerType: "line" },
  { id: "points-cities", description: "Show city locations across Asia", expectedLayerType: "circle" },
  { id: "lines-trails", description: "Display hiking trail paths in Europe", expectedLayerType: "line" },

  // Style variations
  {
    id: "dark-theme",
    description: "A dark-themed map of London",
    expectedLayerType: "fill",
    extra: { theme: "dark" },
  },
  {
    id: "dark-theme-custom",
    description: "A dark-themed choropleth of European countries",
    expectedLayerType: "fill",
    extra: { theme: "dark" },
  },

  // Interaction & options
  {
    id: "explicit-center",
    description: "A map of something",
    expectedLayerType: "fill",
    extra: { center: [10, 20], zoom: 8 },
  },
  {
    id: "circle-landmarks",
    description: "Show landmark point locations as dots across China",
    expectedLayerType: "circle",
  },
  {
    id: "data-driven-colors",
    description: "Color regions by population density using data-driven styling",
    expectedLayerType: "fill",
  },
];

// ─── Eval Diff pairs for diff_specs ────────────────────────────────────────

interface EvalDiff {
  id: string;
  before: MapSpec;
  after: MapSpec;
  expectedCommandTypes: string[];
}

const baseSpecForDiff: MapSpec = {
  version: "0.1",
  id: "eval-diff-base",
  view: { mode: "map2d", center: [120.15, 30.28], zoom: 11 },
  sources: {
    districts: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [120.15, 30.28] },
            properties: { name: "District A" },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: "district-fill",
      type: "fill",
      source: "districts",
      paint: { "fill-color": "#dbeafe", "fill-opacity": 0.7 },
    },
  ],
  interactions: { pan: true, zoom: true },
};

const EVAL_DIFFS: EvalDiff[] = [
  {
    id: "add-layer",
    before: baseSpecForDiff,
    after: {
      ...baseSpecForDiff,
      sources: {
        ...baseSpecForDiff.sources,
        parks: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [120.2, 30.3] },
                properties: { name: "Park" },
              },
            ],
          },
        },
      },
      layers: [
        ...baseSpecForDiff.layers,
        {
          id: "park-points",
          type: "circle",
          source: "parks",
          paint: { "circle-color": "#22c55e", "circle-radius": 5 },
        },
      ],
    },
    expectedCommandTypes: ["addSource", "addLayer"],
  },
  {
    id: "remove-source",
    before: {
      ...baseSpecForDiff,
      sources: {
        ...baseSpecForDiff.sources,
        extra: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
      layers: [...baseSpecForDiff.layers, { id: "extra-layer", type: "circle", source: "extra" }],
    },
    after: baseSpecForDiff,
    expectedCommandTypes: ["removeLayer", "removeSource"],
  },
  {
    id: "change-view",
    before: baseSpecForDiff,
    after: {
      ...baseSpecForDiff,
      view: { mode: "map2d", center: [139.6917, 35.6895], zoom: 10 },
    },
    expectedCommandTypes: ["setView"],
  },
  {
    id: "style-update",
    before: baseSpecForDiff,
    after: {
      ...baseSpecForDiff,
      layers: [
        {
          ...baseSpecForDiff.layers[0],
          paint: { "fill-color": "#ff0000", "fill-opacity": 0.9 },
        },
      ],
    },
    expectedCommandTypes: ["removeLayer", "addLayer"],
  },
  {
    id: "complex-change",
    before: baseSpecForDiff,
    after: {
      ...baseSpecForDiff,
      view: { mode: "map2d", center: [0, 0], zoom: 3 },
      sources: {
        regions: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
      layers: [
        {
          id: "region-fill",
          type: "fill",
          source: "regions",
          paint: { "fill-color": "#93c5fd" },
        },
      ],
      interactions: { pan: true, zoom: true, click: true, hover: true },
    },
    expectedCommandTypes: ["removeLayer", "removeSource", "addSource", "addLayer", "setView", "setInteractions"],
  },
];

// ─── Diagnostic accuracy eval cases ────────────────────────────────────────

interface EvalDiagnostic {
  id: string;
  spec: unknown;
  expectedCode: string;
  expectedPath?: string;
}

const EVAL_DIAGNOSTICS: EvalDiagnostic[] = [
  {
    id: "invalid-version",
    spec: { version: "99", view: { center: [0, 0], zoom: 2 }, sources: {}, layers: [] },
    expectedCode: DiagnosticCodes.SpecInvalidVersion,
  },
  {
    id: "missing-view",
    spec: { version: "0.1", sources: {}, layers: [] },
    expectedCode: DiagnosticCodes.SpecMissingField,
  },
  {
    id: "missing-layers",
    spec: { version: "0.1", view: { center: [0, 0], zoom: 2 }, sources: {} },
    expectedCode: DiagnosticCodes.SpecMissingField,
  },
  {
    id: "duplicate-layer-id",
    spec: {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {
        s: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
      layers: [
        { id: "dup", type: "circle", source: "s" },
        { id: "dup", type: "circle", source: "s" },
      ],
    },
    expectedCode: DiagnosticCodes.LayerDuplicateId,
    expectedPath: "/layers/1/id",
  },
  {
    id: "missing-source-ref",
    spec: {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {},
      layers: [{ id: "orphan", type: "circle", source: "nonexistent" }],
    },
    expectedCode: DiagnosticCodes.SourceNotFound,
    expectedPath: "/layers/0/source",
  },
  {
    id: "invalid-coordinates",
    spec: {
      version: "0.1",
      view: { center: [200, 100], zoom: 2 },
      sources: {},
      layers: [],
    },
    expectedCode: DiagnosticCodes.GeoInvalidCoordinates,
    expectedPath: "/view/center",
  },
];

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe("AI map generation evaluation suite", () => {
  // ── 1. generate_spec quality ────────────────────────────────────────────

  describe("generate_spec quality", () => {
    for (const prompt of EVAL_PROMPTS) {
      it(`[${prompt.id}] generates valid spec for: ${prompt.description}`, () => {
        const input: GenerateSpecToolInput = {
          intent: {
            description: prompt.description,
            ...prompt.extra,
          },
          options: { includeMetadata: false },
        };

        const response = generateSpecTool(input);
        expect(response.ok).toBe(true);
        if (!response.ok) return;

        // No error-level diagnostics from the tool itself
        const errors = response.result.diagnostics.filter((d) => d.severity === "error");
        expect(errors).toHaveLength(0);

        // Generated spec passes schema validation
        const validation = validateSpec(response.result.spec);
        expect(validation.valid).toBe(true);

        // Spec has expected structure
        expect(response.result.spec.version).toBe("0.1");
        expect(response.result.spec.view).toBeDefined();
        expect(response.result.spec.view.center).toHaveLength(2);
        expect(typeof response.result.spec.view.zoom).toBe("number");
        expect(Object.keys(response.result.spec.sources).length).toBeGreaterThanOrEqual(1);
        expect(response.result.spec.layers.length).toBeGreaterThanOrEqual(1);

        // Primary layer type matches expectation
        expect(response.result.spec.layers[0]?.type).toBe(prompt.expectedLayerType);
      });
    }
  });

  // ── 2. Output determinism ──────────────────────────────────────────────

  describe("output determinism", () => {
    it("produces consistent spec structure for the same input (excluding metadata)", () => {
      const input: GenerateSpecToolInput = {
        intent: { description: "Map of Tokyo, Japan" },
        options: { includeMetadata: false },
      };

      const r1 = generateSpecTool(input);
      const r2 = generateSpecTool(input);

      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
      if (!r1.ok || !r2.ok) return;

      // Without metadata, specs should be identical (deterministic generation)
      expect(JSON.stringify(r1.result.spec)).toEqual(JSON.stringify(r2.result.spec));
    });

    it("produces consistent diagnostics for the same input", () => {
      const input: GenerateSpecToolInput = {
        intent: { description: "Show highway routes across the United States" },
        options: { includeMetadata: false },
      };

      const r1 = generateSpecTool(input);
      const r2 = generateSpecTool(input);

      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
      if (!r1.ok || !r2.ok) return;

      expect(r1.result.diagnostics).toEqual(r2.result.diagnostics);
      expect(r1.result.suggestions).toEqual(r2.result.suggestions);
    });

    it("produces different specs for different theme options", () => {
      const lightInput: GenerateSpecToolInput = {
        intent: { description: "Map of London", theme: "light" },
        options: { includeMetadata: false },
      };
      const darkInput: GenerateSpecToolInput = {
        intent: { description: "Map of London", theme: "dark" },
        options: { includeMetadata: false },
      };

      const light = generateSpecTool(lightInput);
      const dark = generateSpecTool(darkInput);

      expect(light.ok).toBe(true);
      expect(dark.ok).toBe(true);
      if (!light.ok || !dark.ok) return;

      // Different themes should produce different paint colors
      expect(JSON.stringify(light.result.spec.layers)).not.toEqual(JSON.stringify(dark.result.spec.layers));
    });
  });

  // ── 3. diff_specs quality ──────────────────────────────────────────────

  describe("diff_specs quality", () => {
    for (const diff of EVAL_DIFFS) {
      it(`[${diff.id}] detects expected changes between spec pairs`, () => {
        const response = diffSpecsTool({ before: diff.before, after: diff.after });

        expect(response.ok).toBe(true);
        if (!response.ok) return;

        const { commands } = response.result;

        // All expected command types should be present
        for (const expectedType of diff.expectedCommandTypes) {
          const found = commands.some((cmd) => cmd.type === expectedType);
          expect(
            found,
            `Expected command type "${expectedType}" not found in: ${JSON.stringify(commands.map((c) => c.type))}`,
          ).toBe(true);
        }

        // Summary should have entries (view-only changes don't appear in summary)
        // Instead verify that expected commands were generated
        expect(commands.length).toBeGreaterThan(0);
      });
    }

    it("returns empty commands for identical specs", () => {
      const response = diffSpecsTool({ before: baseSpecForDiff, after: baseSpecForDiff });

      expect(response.ok).toBe(true);
      if (!response.ok) return;

      expect(response.result.commands).toEqual([]);
      expect(response.result.summary.added).toEqual([]);
      expect(response.result.summary.removed).toEqual([]);
      expect(response.result.summary.modified).toEqual([]);
    });

    it("returns structured diagnostics for invalid input", () => {
      const response = diffSpecsTool({ before: baseSpecForDiff });

      expect(response.ok).toBe(false);
      if (response.ok) return;

      expect(response.diagnostics.length).toBeGreaterThan(0);
    });
  });

  // ── 4. Command replay verification ─────────────────────────────────────

  describe("command replay verification", () => {
    for (const diff of EVAL_DIFFS) {
      it(`[${diff.id}] applying diff commands to before produces valid after-like spec`, () => {
        const diffResponse = diffSpecsTool({ before: diff.before, after: diff.after });
        expect(diffResponse.ok).toBe(true);
        if (!diffResponse.ok) return;

        const { commands } = diffResponse.result;
        if (commands.length === 0) return; // No commands for identical specs

        const applyResponse = applyCommandsTool({
          spec: diff.before,
          commands,
        });

        expect(applyResponse.ok).toBe(true);
        if (!applyResponse.ok) return;

        const resultSpec = applyResponse.result.spec;

        // The result spec should pass validation
        const validation = validateSpec(resultSpec);
        expect(validation.valid).toBe(true);

        // View should match after spec if setView was issued
        if (diff.expectedCommandTypes.includes("setView")) {
          expect(resultSpec.view.center).toEqual(diff.after.view.center);
          expect(resultSpec.view.zoom).toEqual(diff.after.view.zoom);
        }

        // Sources from after should exist in result
        for (const sourceId of Object.keys(diff.after.sources)) {
          expect(resultSpec.sources[sourceId]).toBeDefined();
        }

        // Layers from after should exist in result
        for (const afterLayer of diff.after.layers) {
          const resultLayer = resultSpec.layers.find((l) => l.id === afterLayer.id);
          expect(resultLayer).toBeDefined();
        }
      });
    }
  });

  // ── 5. Diagnostic accuracy ─────────────────────────────────────────────

  describe("diagnostic accuracy", () => {
    for (const diag of EVAL_DIAGNOSTICS) {
      it(`[${diag.id}] returns expected diagnostic code for known error`, () => {
        const validation = validateSpec(diag.spec);

        expect(validation.valid).toBe(false);

        const matchingDiag = validation.diagnostics.find((d) => d.code === diag.expectedCode);
        expect(matchingDiag).toBeDefined();
        expect(matchingDiag?.severity).toBe("error");

        if (diag.expectedPath) {
          expect(matchingDiag?.path).toBe(diag.expectedPath);
        }
      });
    }

    it("returns structured fix suggestions for missing source references", () => {
      const spec: MapSpec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [{ id: "orphan", type: "circle", source: "nonexistent" }],
      };

      const validation = validateSpec(spec);
      expect(validation.valid).toBe(false);

      const missingSourceDiag = validation.diagnostics.find((d) => d.code === DiagnosticCodes.SourceNotFound);
      expect(missingSourceDiag).toBeDefined();
      expect(missingSourceDiag?.fix).toBeDefined();
      expect(missingSourceDiag?.fix?.kind).toBe("manual");
      expect(missingSourceDiag?.relatedResources).toBeDefined();
    });

    it("reports stats even for invalid specs", () => {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {
          s: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
        },
        layers: [
          { id: "a", type: "circle", source: "s" },
          { id: "b", type: "line", source: "s" },
        ],
      };

      const validation = validateSpec(spec);
      expect(validation.stats.sourceCount).toBe(1);
      expect(validation.stats.layerCount).toBe(2);
      expect(validation.stats.visibleLayerCount).toBe(2);
    });
  });

  // ── 6. Summary metrics ─────────────────────────────────────────────────

  describe("evaluation metrics summary", () => {
    it("reports generation success rate across all prompts", () => {
      let successCount = 0;
      let validationPassCount = 0;

      for (const prompt of EVAL_PROMPTS) {
        const input: GenerateSpecToolInput = {
          intent: {
            description: prompt.description,
            ...prompt.extra,
          },
          options: { includeMetadata: false },
        };

        const response = generateSpecTool(input);
        if (response.ok) {
          successCount++;
          const validation = validateSpec(response.result.spec);
          if (validation.valid) validationPassCount++;
        }
      }

      const successRate = successCount / EVAL_PROMPTS.length;
      const validationRate = validationPassCount / EVAL_PROMPTS.length;

      // All prompts should succeed and validate
      expect(successRate).toBe(1);
      expect(validationRate).toBe(1);
    });

    it("reports diff_specs accuracy across all pairs", () => {
      let correctCount = 0;

      for (const diff of EVAL_DIFFS) {
        const response = diffSpecsTool({ before: diff.before, after: diff.after });
        if (!response.ok) continue;

        const { commands } = response.result;
        const allExpectedPresent = diff.expectedCommandTypes.every((type) => commands.some((cmd) => cmd.type === type));
        if (allExpectedPresent) correctCount++;
      }

      const accuracy = correctCount / EVAL_DIFFS.length;
      expect(accuracy).toBe(1);
    });

    it("reports diagnostic accuracy across all error scenarios", () => {
      let correctCount = 0;

      for (const diag of EVAL_DIAGNOSTICS) {
        const validation = validateSpec(diag.spec);
        const found = validation.diagnostics.some((d) => d.code === diag.expectedCode);
        if (found) correctCount++;
      }

      const accuracy = correctCount / EVAL_DIAGNOSTICS.length;
      expect(accuracy).toBe(1);
    });
  });
});
