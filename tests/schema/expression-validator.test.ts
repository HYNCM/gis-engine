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

  it("reports unknown operators", () => {
    const unknown = validateSpec(withPaintAndLayout({ "circle-color": ["coalesce", ["get", "kind"], "#2563eb"] }));

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
  it("accepts concat expressions with string and number arguments", () => {
    const spec = withPaintAndLayout(
      { "circle-color": "#2563eb" },
      { "text-field": ["concat", "Hello, ", ["get", "name"]] },
    );
    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("accepts concat with multiple string literals", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["concat", "A", "B", "C"] });
    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("accepts concat with to-string conversion", () => {
    const spec = withPaintAndLayout(
      { "circle-color": "#2563eb" },
      { "text-field": ["concat", "Population: ", ["to-string", ["get", "population"]]] },
    );
    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports concat arity error when no arguments provided", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["concat"] });
    const report = validateSpec(spec);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
  });

  it("reports concat type error for boolean arguments", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["concat", true] });
    const report = validateSpec(spec);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("accepts upcase expressions", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["upcase", ["get", "name"]] });
    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("accepts upcase with literal string", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["upcase", "hello"] });
    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports upcase type error for number argument", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["upcase", 42] });
    const report = validateSpec(spec);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("reports upcase arity error when missing argument", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["upcase"] });
    const report = validateSpec(spec);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
  });

  it("accepts downcase expressions", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["downcase", ["get", "name"]] });
    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports downcase type error for number argument", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["downcase", 42] });
    const report = validateSpec(spec);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
      }),
    );
  });

  it("reports downcase arity error when missing argument", () => {
    const spec = withPaintAndLayout({ "circle-color": "#2563eb" }, { "text-field": ["downcase"] });
    const report = validateSpec(spec);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionInvalidArity,
      }),
    );
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
