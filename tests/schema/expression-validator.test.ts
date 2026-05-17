import { describe, expect, it } from "vitest";
import { DiagnosticCodes, validateSpec, type MapSpec } from "@gis-engine/engine";

describe("expression validator", () => {
  it("accepts v0.1 supported expression operators", () => {
    const spec = withPaintAndLayout({
      "circle-color": ["step", ["get", "score"], "#2563eb", 80, "#dc2626"],
      "circle-radius": ["interpolate", ["linear"], ["get", "score"], 0, 4, 100, 12],
      "circle-opacity": ["literal", 0.8]
    });

    const report = validateSpec(spec);

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports unknown operators separately from unsupported v0.1 operators", () => {
    const unknown = validateSpec(withPaintAndLayout({ "circle-color": ["coalesce", ["get", "kind"], "#2563eb"] }));
    const unsupported = validateSpec(withPaintAndLayout({ "circle-color": ["match", ["get", "kind"], "a", "#fff", "#000"] }));

    expect(unknown.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.ExpressionUnknownOperator,
        path: "/layers/0/paint/circle-color/0"
      })
    );
    expect(unsupported.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        path: "/layers/0/paint/circle-color/0"
      })
    );
  });

  it("reports invalid arity, mixed branches, and invalid interpolate colors", () => {
    const invalidArity = validateSpec(withPaintAndLayout({ "circle-color": ["step", ["get", "score"], "#fff"] }));
    const mixedBranches = validateSpec(withPaintAndLayout({ "circle-color": ["step", ["get", "score"], "#fff", 50, 4] }));
    const invalidColor = validateSpec(withPaintAndLayout({ "circle-color": ["interpolate", ["linear"], ["get", "score"], 0, "blueish", 100, "#000"] }));

    expect(invalidArity.diagnostics).toContainEqual(expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidArity }));
    expect(mixedBranches.diagnostics).toContainEqual(expect.objectContaining({ code: DiagnosticCodes.ExpressionTypeMismatch }));
    expect(invalidColor.diagnostics).toContainEqual(expect.objectContaining({ code: DiagnosticCodes.ExpressionInvalidColor }));
  });
});

function withPaintAndLayout(paint: Record<string, unknown>, layout: Record<string, unknown> = {}): MapSpec {
  return {
    version: "0.1",
    id: "expression-test",
    view: { center: [120, 30], zoom: 10 },
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      }
    },
    layers: [
      {
        id: "points",
        type: "circle",
        source: "points",
        paint,
        layout
      }
    ]
  };
}
