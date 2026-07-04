import { validateSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

describe("Scene3D Promotion Gate", () => {
  const scene3dSpec = {
    version: "0.1",
    view: { mode: "scene3d" as const },
    sources: {},
    layers: [],
    capabilities: { renderer: "scene3d" as const, dimensions: ["3d"] },
  };

  it('blocks scene3d by default (gate = "blocked")', () => {
    const result = validateSpec(scene3dSpec);
    const blockers = result.diagnostics.filter((d) => d.blockerCode?.startsWith("SCENE3D.STABLE_RUNTIME"));
    expect(blockers.length).toBeGreaterThan(0);
  });

  it('downgrades to warning when gate = "experimental"', () => {
    const result = validateSpec(scene3dSpec, { scene3dPromotionGate: "experimental" });
    const blockers = result.diagnostics.filter((d) => d.blockerCode?.startsWith("SCENE3D.STABLE_RUNTIME"));
    expect(blockers.length).toBe(0);
    const warnings = result.diagnostics.filter(
      (d) => d.severity === "warning" && d.code?.startsWith("SCENE3D.EXPERIMENTAL"),
    );
    expect(warnings.length).toBe(0);
    const experimentalWarnings = result.diagnostics.filter(
      (d) => d.severity === "warning" && d.message?.includes("experimental"),
    );
    expect(experimentalWarnings.length).toBeGreaterThan(0);
  });

  it('produces no scene3d diagnostics when gate = "stable"', () => {
    const result = validateSpec(scene3dSpec, { scene3dPromotionGate: "stable" });
    const scene3dDiags = result.diagnostics.filter((d) => d.blockerCode?.startsWith("SCENE3D.STABLE_RUNTIME"));
    expect(scene3dDiags.length).toBe(0);
    const experimentalDiags = result.diagnostics.filter((d) => d.message?.includes("experimental"));
    expect(experimentalDiags.length).toBe(0);
  });
});
