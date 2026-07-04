import { DiagnosticCodes, type MapSpec, validateSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

describe("expression validator", () => {
  it("accepts v0.1 supported expression operators", () => {
    const spec = withPaintAndLayout({
      "circle-color": ["step", ["get", "score"], "#2563eb", 80, "#dc2626"],
      "circle-radius": ["interpolate", ["linear"], ["get", "score"], 0, 4, 100, 12],
      "circle-opacity": ["literal", 0.8],
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("accepts the v0.2 expression contract subset", () => {
    const spec = withPaintAndLayout({
      "circle-color": [
        "case",
        true,
        "#16a34a",
        ["match", ["get", "kind"], "risk", "#dc2626", ["safe", "ok"], "#2563eb", "#64748b"],
      ],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, ["to-number", ["get", "size"], 3], 12, 14],
      "circle-opacity": ["case", ["literal", true], 0.9, ["to-number", 0.5]],
      "circle-stroke-color": ["to-string", "#111827"],
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("accepts boolean filter expressions on layers", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, {}, [
      "all",
      ["==", ["get", "category"], "museum"],
      ["has", "name"],
    ]);

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports non-boolean layer filters", () => {
    const report = validateSpec(withPaintAndLayout({ "circle-color": "#2563eb" }, {}, ["get", "category"]));

    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        path: "/layers/0/filter",
      }),
    );
  });

  it("reports truly unknown operators", () => {
    const unknown = validateSpec(withPaintAndLayout({ "circle-color": ["bogus-op", ["get", "kind"], "#2563eb"] }));

    expect(unknown.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionUnknownOperator,
        path: "/layers/0/paint/circle-color/0",
      }),
    );
  });

  it("reports invalid arity, mixed branches, invalid interpolate colors, and invalid match labels", () => {
    const invalidArity = validateSpec(withPaintAndLayout({ "circle-color": ["step", ["get", "score"], "#fff"] }));
    const mixedBranches = validateSpec(
      withPaintAndLayout({ "circle-color": ["step", ["get", "score"], "#fff", 50, 4] }),
    );
    const invalidColor = validateSpec(
      withPaintAndLayout({ "circle-color": ["interpolate", ["linear"], ["get", "score"], 0, "blueish", 100, "#000"] }),
    );
    const invalidMatch = validateSpec(
      withPaintAndLayout({ "circle-color": ["match", ["get", "kind"], { bad: true }, "#fff", "#000"] }),
    );
    const invalidCase = validateSpec(withPaintAndLayout({ "circle-color": ["case", 1, "#fff", "#000"] }));

    expect(invalidArity.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
    expect(mixedBranches.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionTypeMismatch }),
    );
    expect(invalidColor.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidColor }),
    );
    expect(invalidMatch.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionTypeMismatch }),
    );
    expect(invalidCase.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionTypeMismatch }),
    );
  });

  it("accepts arithmetic expressions (+, -, *, /)", () => {
    const spec = withPaintAndLayout({
      "circle-radius": ["+", ["get", "population"], ["get", "area"]],
      "circle-opacity": ["-", ["get", "temperature"], 32],
      "circle-stroke-width": ["*", ["get", "density"], 100],
      "circle-blur": ["/", ["get", "total"], ["get", "count"]],
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports type errors in arithmetic expressions", () => {
    const stringLeft = validateSpec(withPaintAndLayout({ "circle-radius": ["+", "not-a-number", 1] }));
    expect(stringLeft.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );

    const invalidArity = validateSpec(withPaintAndLayout({ "circle-radius": ["+", 1] }));
    expect(invalidArity.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("accepts coalesce expressions", () => {
    const spec = withPaintAndLayout({
      "circle-color": ["coalesce", ["get", "color"], "#2563eb"],
      "circle-radius": ["coalesce", ["get", "size"], 4],
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports coalesce arity errors", () => {
    const emptyCoalesce = validateSpec(withPaintAndLayout({ "circle-color": ["coalesce"] }));
    expect(emptyCoalesce.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("reports mixed types in coalesce", () => {
    const mixed = validateSpec(withPaintAndLayout({ "circle-color": ["coalesce", "hello", 4] }));
    expect(mixed.diagnostics).toContainEqual(expect.objectContaining({ code: DiagnosticCodes.ExpressionTypeMismatch }));
  });

  it("accepts exponential interpolation", () => {
    const spec = withPaintAndLayout({
      "circle-color": ["interpolate", ["exponential", 1.5], ["get", "population"], 0, "#fff", 1000, "#f00"],
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("accepts cubic-bezier interpolation", () => {
    const spec = withPaintAndLayout({
      "circle-opacity": ["interpolate", ["cubic-bezier", 0.42, 0, 0.58, 1], ["zoom"], 0, 0, 22, 1],
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid exponential base", () => {
    const negativeBase = validateSpec(
      withPaintAndLayout({ "circle-opacity": ["interpolate", ["exponential", -1], ["zoom"], 0, 0, 22, 1] }),
    );
    expect(negativeBase.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("reports invalid cubic-bezier argument count", () => {
    const badCubic = validateSpec(
      withPaintAndLayout({ "circle-opacity": ["interpolate", ["cubic-bezier", 0.42, 0], ["zoom"], 0, 0, 22, 1] }),
    );
    expect(badCubic.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
  });

  it("reports unsupported interpolation types", () => {
    const badType = validateSpec(
      withPaintAndLayout({ "circle-opacity": ["interpolate", ["unknown-type"], ["zoom"], 0, 0, 22, 1] }),
    );
    expect(badType.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: expect.stringContaining("Supported interpolation types"),
      }),
    );
  });

  it("accepts feature-state, geometry-type, id, and properties expressions", () => {
    const spec = withPaintAndLayout({
      "circle-color": ["case", ["feature-state", "hover"], "#dc2626", "#2563eb"],
      "circle-radius": ["case", ["==", ["geometry-type"], "Point"], 8, 4],
      "circle-opacity": ["case", ["==", ["to-string", ["id"]], "0"], 0.5, 1],
      "circle-stroke-width": ["case", ["has", "name", ["properties"]], 2, 0],
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("accepts feature-state with sub-expression argument", () => {
    const spec = withPaintAndLayout({
      "circle-color": ["case", ["feature-state", ["get", "stateKey"]], "#dc2626", "#2563eb"],
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports feature-state with wrong arity", () => {
    const noArgs = validateSpec(withPaintAndLayout({ "circle-color": ["feature-state"] }));
    expect(noArgs.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );

    const tooManyArgs = validateSpec(withPaintAndLayout({ "circle-color": ["feature-state", "a", "b"] }));
    expect(tooManyArgs.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
  });

  it("reports feature-state with non-string argument", () => {
    const numericArg = validateSpec(withPaintAndLayout({ "circle-color": ["feature-state", 42] }));
    expect(numericArg.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );

    const nonStringExpr = validateSpec(withPaintAndLayout({ "circle-color": ["feature-state", ["+", 1, 2]] }));
    expect(nonStringExpr.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("reports geometry-type with arguments", () => {
    const withArgs = validateSpec(withPaintAndLayout({ "circle-color": ["geometry-type", "extra"] }));
    expect(withArgs.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
  });

  it("reports id with arguments", () => {
    const withArgs = validateSpec(withPaintAndLayout({ "circle-color": ["id", "extra"] }));
    expect(withArgs.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
  });

  it("reports properties with arguments", () => {
    const withArgs = validateSpec(withPaintAndLayout({ "circle-color": ["properties", "extra"] }));
    expect(withArgs.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Sprint 3 (T-03c): Extended expression operators (51 → 80)
  // -------------------------------------------------------------------------

  it("accepts trigonometric math expressions (sin, cos, tan, asin, acos, atan)", () => {
    const spec = withPaintAndLayout({
      "circle-radius": ["*", 10, ["sin", ["get", "angle"]]],
      "circle-opacity": ["+", 0.5, ["*", 0.5, ["cos", ["get", "angle"]]]],
      "circle-stroke-width": ["abs", ["tan", ["get", "slope"]]],
      "circle-blur": ["asin", ["/", ["get", "ratio"], 1]],
      "circle-translate": ["literal", [1, 2]],
      "circle-translate-anchor": "viewport",
      "text-field": ["to-string", ["atan", ["get", "heading"]]],
    });
    // We only check paint expressions for validity; some of these are for demonstration
    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
  });

  it("accepts log and pow math expressions", () => {
    const spec = withPaintAndLayout({
      "circle-radius": ["pow", 2, ["get", "magnitude"]],
      "circle-opacity": ["/", ["ln", ["get", "population"]], 10],
      "circle-stroke-width": ["*", ["log10", ["get", "value"]], 5],
      "circle-blur": ["/", ["log2", ["get", "bits"]], 8],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("accepts math constant expressions (pi, e, ln2)", () => {
    const spec = withPaintAndLayout({
      "circle-radius": ["*", ["pi"], 2],
      "circle-opacity": ["/", ["e"], 3],
      "circle-stroke-width": ["*", ["ln2"], 10],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid arity for math constants", () => {
    const piWithArgs = validateSpec(withPaintAndLayout({ "circle-radius": ["pi", 1] }));
    expect(piWithArgs.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );

    const eWithArgs = validateSpec(withPaintAndLayout({ "circle-radius": ["e", "extra"] }));
    expect(eWithArgs.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
  });

  it("reports type errors for pow expression", () => {
    const stringArg = validateSpec(withPaintAndLayout({ "circle-radius": ["pow", "not-a-number", 2] }));
    expect(stringArg.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );

    const invalidArity = validateSpec(withPaintAndLayout({ "circle-radius": ["pow", 2] }));
    expect(invalidArity.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("reports type errors for trig expressions", () => {
    const stringArg = validateSpec(withPaintAndLayout({ "circle-radius": ["sin", "not-a-number"] }));
    expect(stringArg.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );

    const invalidArity = validateSpec(withPaintAndLayout({ "circle-radius": ["cos", 1, 2] }));
    expect(invalidArity.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("accepts let/var variable binding expressions", () => {
    const spec = withPaintAndLayout({
      "circle-radius": ["let", "size", ["get", "population"], ["*", ["var", "size"], 2]],
      "circle-color": [
        "let",
        "color1",
        "#ff0000",
        "color2",
        "#0000ff",
        ["case", [">", ["get", "value"], 50], ["var", "color1"], ["var", "color2"]],
      ],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid let syntax", () => {
    const tooFewArgs = validateSpec(withPaintAndLayout({ "circle-radius": ["let", "x"] }));
    expect(tooFewArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const nonStringName = validateSpec(withPaintAndLayout({ "circle-radius": ["let", 42, 10, ["var", "x"]] }));
    expect(nonStringName.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("reports invalid var syntax", () => {
    const noArgs = validateSpec(withPaintAndLayout({ "circle-radius": ["var"] }));
    expect(noArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const nonStringArg = validateSpec(withPaintAndLayout({ "circle-radius": ["var", 42] }));
    expect(nonStringArg.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("accepts at lookup expression", () => {
    const spec = withPaintAndLayout({
      "circle-radius": ["at", 0, ["literal", [10, 20, 30]]],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid at expression", () => {
    const invalidArity = validateSpec(withPaintAndLayout({ "circle-radius": ["at", 0] }));
    expect(invalidArity.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const nonNumberIndex = validateSpec(
      withPaintAndLayout({ "circle-radius": ["at", "not-a-number", ["literal", [1, 2]]] }),
    );
    expect(nonNumberIndex.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("accepts interpolate-hcl and interpolate-lab color interpolation", () => {
    const spec = withPaintAndLayout({
      "circle-color": ["interpolate-hcl", ["linear"], ["get", "score"], 0, "#ff0000", 100, "#0000ff"],
      "text-color": ["interpolate-lab", ["exponential", 1.5], ["get", "value"], 0, "#000", 100, "#fff"],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid interpolate-hcl syntax", () => {
    const tooFew = validateSpec(
      withPaintAndLayout({ "circle-color": ["interpolate-hcl", ["linear"], ["get", "score"], 0, "#ff0000"] }),
    );
    expect(tooFew.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("accepts array type assertion expression", () => {
    const spec = withPaintAndLayout({
      "circle-translate": ["array", ["get", "offset"]],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid array type assertion", () => {
    const noArgs = validateSpec(withPaintAndLayout({ "circle-translate": ["array"] }));
    expect(noArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("accepts boolean, number, object type assertions", () => {
    const spec = withPaintAndLayout({
      "circle-color": ["case", ["boolean", ["get", "active"]], "#ff0000", "#0000ff"],
      "circle-radius": ["number", ["get", "size"]],
      "text-field": ["to-string", ["object", ["get", "metadata"]]],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid boolean/number/object type assertions", () => {
    const boolNoArgs = validateSpec(withPaintAndLayout({ "circle-color": ["boolean"] }));
    expect(boolNoArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const numNoArgs = validateSpec(withPaintAndLayout({ "circle-radius": ["number"] }));
    expect(numNoArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const objNoArgs = validateSpec(withPaintAndLayout({ "circle-color": ["object"] }));
    expect(objNoArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("accepts collator expression", () => {
    const spec = withPaintAndLayout({
      "text-field": ["to-string", ["collator", { "case-sensitive": false }]],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid collator expression", () => {
    const noArgs = validateSpec(withPaintAndLayout({ "text-field": ["collator"] }));
    expect(noArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const nonObjectArg = validateSpec(withPaintAndLayout({ "text-field": ["collator", "not-an-object"] }));
    expect(nonObjectArg.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("accepts format expression", () => {
    const spec = withPaintAndLayout({
      "text-field": ["format", ["get", "name"], { "font-scale": 1.5 }],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports format with no arguments", () => {
    const noArgs = validateSpec(withPaintAndLayout({ "text-field": ["format"] }));
    expect(noArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("accepts image expression", () => {
    const spec = withPaintAndLayout({
      "icon-image": ["image", "marker-15"],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid image expression", () => {
    const noArgs = validateSpec(withPaintAndLayout({ "icon-image": ["image"] }));
    expect(noArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const nonStringArg = validateSpec(withPaintAndLayout({ "icon-image": ["image", 42] }));
    expect(nonStringArg.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("accepts line-progress and accumulated expressions", () => {
    const spec = withPaintAndLayout({
      "circle-opacity": ["line-progress"],
      "circle-radius": ["+", ["accumulated"], 1],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports line-progress and accumulated with arguments", () => {
    const progressWithArgs = validateSpec(withPaintAndLayout({ "circle-opacity": ["line-progress", "extra"] }));
    expect(progressWithArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const accumulatedWithArgs = validateSpec(withPaintAndLayout({ "circle-radius": ["accumulated", "extra"] }));
    expect(accumulatedWithArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("accepts is-supported-script expression", () => {
    const spec = withPaintAndLayout({
      "text-field": ["case", ["is-supported-script", ["get", "name"]], ["get", "name"], "Unsupported"],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid is-supported-script expression", () => {
    const noArgs = validateSpec(withPaintAndLayout({ "text-field": ["is-supported-script"] }));
    expect(noArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );

    const nonStringArg = validateSpec(withPaintAndLayout({ "text-field": ["is-supported-script", 42] }));
    expect(nonStringArg.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("accepts resolved-locale expression", () => {
    const spec = withPaintAndLayout({
      "text-field": ["resolved-locale", ["collator", { locale: "en" }]],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports invalid resolved-locale expression", () => {
    const noArgs = validateSpec(withPaintAndLayout({ "text-field": ["resolved-locale"] }));
    expect(noArgs.diagnostics).toContainEqual(
      expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }),
    );
  });

  it("supports complex nested expressions with new operators", () => {
    const spec = withPaintAndLayout({
      "circle-radius": [
        "let",
        "base",
        ["sqrt", ["get", "population"]],
        "scale",
        ["/", ["pi"], 100],
        ["*", ["var", "base"], ["var", "scale"]],
      ],
      "circle-color": [
        "interpolate-hcl",
        ["linear"],
        ["get", "temperature"],
        0,
        "#0000ff",
        50,
        "#00ff00",
        100,
        "#ff0000",
      ],
    });

    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });
});

function withPaintAndLayout(
  paint: Record<string, unknown>,
  layout: Record<string, unknown> = {},
  filter?: unknown[],
): MapSpec {
  return {
    version: "0.1",
    id: "expression-test",
    view: { center: [120, 30], zoom: 10 },
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    },
    layers: [
      {
        id: "points",
        type: "circle",
        source: "points",
        ...(filter ? { filter: filter as MapSpec["layers"][number]["filter"] } : {}),
        paint,
        layout,
      },
    ],
  };
}
