import { type MapSpec, validateSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import validSpec from "../fixtures/specs/valid/basic-geojson.map.json";

function specWithLayer(layer: Record<string, unknown>): MapSpec {
  const spec = structuredClone(validSpec) as MapSpec;
  const base = { ...(structuredClone(spec.layers[1]) as object), ...layer };
  spec.layers = [
    {
      ...base,
      type: (layer.type as string) ?? "circle",
      source: "pois",
      ...(layer.paint ? { paint: layer.paint } : {}),
      ...(layer.layout ? { layout: layer.layout } : {}),
    },
  ] as MapSpec["layers"];
  return spec;
}

function diagnosticAt(report: ReturnType<typeof validateSpec>, path: string) {
  return report.diagnostics.filter((diagnostic) => diagnostic.path === path);
}

describe("style property validation", () => {
  it("rejects a non-numeric circle-radius instead of deferring the failure to the renderer", () => {
    const report = validateSpec(specWithLayer({ paint: { "circle-radius": "banana" } }));

    expect(report.valid).toBe(false);
    expect(diagnosticAt(report, "/layers/0/paint/circle-radius")).toEqual([
      expect.objectContaining({ severity: "error", code: "SPEC.INVALID_TYPE" }),
    ]);
  });

  it("rejects out-of-range opacity values", () => {
    for (const value of [1.5, -0.2]) {
      const report = validateSpec(specWithLayer({ paint: { "circle-opacity": value } }));
      expect(report.valid, `circle-opacity ${value} should be invalid`).toBe(false);
      expect(diagnosticAt(report, "/layers/0/paint/circle-opacity")[0]).toMatchObject({
        code: "SPEC.INVALID_TYPE",
      });
    }
  });

  it("rejects malformed color strings but accepts hex, rgb(a), and hsl(a)", () => {
    for (const bad of ["not-a-color", "rgba(300,0,0)", "rgb(0,0)"]) {
      const report = validateSpec(specWithLayer({ paint: { "circle-color": bad } }));
      expect(report.valid, `${bad} should be invalid`).toBe(false);
    }
    for (const good of ["#2563eb", "rgba(37, 99, 235, 0.5)", "hsl(220, 90%, 50%)", "red", "#abc"]) {
      const report = validateSpec(specWithLayer({ paint: { "circle-color": good } }));
      expect(diagnosticAt(report, "/layers/0/paint/circle-color"), `${good} should be valid`).toEqual([]);
    }
  });

  it("rejects negative widths and non-numeric dash arrays", () => {
    expect(validateSpec(specWithLayer({ type: "line", paint: { "line-width": -3 } })).valid).toBe(false);
    expect(validateSpec(specWithLayer({ type: "line", paint: { "line-dasharray": [1, "x"] } })).valid).toBe(false);
  });

  it("rejects unknown enum values in layout and unknown layout properties as warnings", () => {
    const badVisibility = validateSpec(specWithLayer({ layout: { visibility: "hidden-ish" } }));
    expect(badVisibility.valid).toBe(false);
    expect(diagnosticAt(badVisibility, "/layers/0/layout/visibility")[0]).toMatchObject({
      code: "SPEC.INVALID_TYPE",
    });

    const unknownProperty = validateSpec(specWithLayer({ paint: { "circle-llama-power": 3 } }));
    expect(unknownProperty.valid, "unknown properties are warnings, not errors").toBe(true);
    expect(unknownProperty.diagnostics).toContainEqual(
      expect.objectContaining({ severity: "warning", path: "/layers/0/paint/circle-llama-power" }),
    );
  });

  it("accepts numeric, boolean and expression forms of documented properties", () => {
    const report = validateSpec(
      specWithLayer({
        paint: {
          "circle-radius": 6,
          "circle-opacity": 0.8,
          "circle-blur": 1.2,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#111",
          "circle-color": ["interpolate", ["linear"], ["number", ["get", "mag"]], 0, "#fee2e2", 9, "#7f1d1d"],
          "circle-pitch-alignment": "viewport",
        },
      }),
    );

    expect(report.diagnostics.filter((diagnostic) => diagnostic.path.startsWith("/layers/0/paint"))).toEqual([]);
    expect(report.valid).toBe(true);
  });

  it("validates properties per layer type and does not apply circle rules to fill layers", () => {
    const fillReport = validateSpec(
      specWithLayer({ type: "fill", paint: { "fill-color": "#333", "fill-opacity": 1 } }),
    );
    expect(fillReport.valid).toBe(true);

    const crossType = validateSpec(specWithLayer({ type: "fill", paint: { "circle-radius": "banana" } }));
    expect(crossType.valid, "circle-* on a fill layer is not a documented fill property").toBe(true);
    expect(crossType.diagnostics).toContainEqual(
      expect.objectContaining({ severity: "warning", code: "SPEC.UNKNOWN_FIELD" }),
    );
  });

  it("keeps symbol-lite and heatmap numeric properties enforced", () => {
    expect(validateSpec(specWithLayer({ type: "heatmap", paint: { "heatmap-weight": "heavy" } })).valid).toBe(false);
  });

  it("still checks expression grammar on undocumented passthrough properties", () => {
    const report = validateSpec(specWithLayer({ layout: { "text-field": ["format"] } }));

    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({ severity: "warning", code: "SPEC.UNKNOWN_FIELD", path: "/layers/0/layout/text-field" }),
    );
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({ severity: "error", code: "EXPR.INVALID_ARITY", path: "/layers/0/layout/text-field" }),
    );
    expect(report.valid).toBe(false);
  });
});
