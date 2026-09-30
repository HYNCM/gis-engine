import { validateSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

const validLayer = { id: "l1", type: "circle", source: "s1" };

function malformedSpec(patch: Record<string, unknown>) {
  return {
    version: "0.1",
    view: { mode: "map2d", center: [0, 0], zoom: 1 },
    sources: { s1: { type: "geojson", data: { type: "FeatureCollection", features: [] } } },
    layers: [validLayer],
    ...patch,
  };
}

describe("validateSpec malformed input contract", () => {
  it("returns diagnostics instead of throwing when a layer entry is null", () => {
    expect(() => validateSpec(malformedSpec({ layers: [null] }))).not.toThrow();

    const report = validateSpec(malformedSpec({ layers: [null] }));
    expect(report.valid).toBe(false);
    expect(report.diagnostics.some((diagnostic) => diagnostic.severity === "error")).toBe(true);
  });

  it("returns diagnostics instead of throwing when view is not an object", () => {
    expect(() => validateSpec(malformedSpec({ view: "map2d" }))).not.toThrow();
    expect(validateSpec(malformedSpec({ view: "map2d" })).valid).toBe(false);
  });

  it("returns diagnostics instead of throwing when sources is an array", () => {
    expect(() => validateSpec(malformedSpec({ sources: [] }))).not.toThrow();
    expect(validateSpec(malformedSpec({ sources: [] })).valid).toBe(false);
  });

  it("returns diagnostics instead of throwing when a source entry is null", () => {
    expect(() => validateSpec(malformedSpec({ sources: { s1: null } }))).not.toThrow();
    expect(validateSpec(malformedSpec({ sources: { s1: null } })).valid).toBe(false);
  });

  it("returns diagnostics instead of throwing when layers contain non-object entries", () => {
    expect(() => validateSpec(malformedSpec({ layers: ["circle", 42] }))).not.toThrow();
    const report = validateSpec(malformedSpec({ layers: ["circle", 42] }));
    expect(report.valid).toBe(false);
    expect(report.stats.layerCount).toBe(2);
  });

  it("never throws for a battery of hostile JSON payloads", () => {
    const payloads: unknown[] = [
      null,
      [],
      "spec",
      {},
      { version: "0.1" },
      { version: "0.1", view: {}, sources: {}, layers: [] },
      { version: "0.1", view: { mode: "map2d" }, sources: {}, layers: [{}] },
      { version: "0.1", view: { mode: "scene3d" }, sources: {}, layers: [null, {}] },
      { version: "0.1", view: { mode: "map2d", center: [1e9, -1e9] }, sources: {}, layers: [] },
      { version: 0.1, view: { mode: "map2d" }, sources: {}, layers: [] },
      { version: "0.1", view: { mode: "map2d" }, sources: { a: {} }, layers: [{ id: 1 }] },
      { version: "0.1", view: { mode: "map2d" }, sources: {}, layers: [], extensions: { scene3d: null } },
      { version: "0.1", view: { mode: "map2d" }, sources: {}, layers: [], interactions: null },
      { version: "0.1", view: { mode: "map2d" }, sources: {}, layers: [], capabilities: "all" },
    ];

    for (const payload of payloads) {
      expect(() => validateSpec(payload)).not.toThrow();
      const report = validateSpec(payload);
      expect(typeof report.valid).toBe("boolean");
      expect(Array.isArray(report.diagnostics)).toBe(true);
      expect(report.stats).toBeTypeOf("object");
    }
  });
});
