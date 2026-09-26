import { buildEngineCapabilityMatrix } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

function blockedSourceEntry(sourceId: string) {
  return { sourceId, type: "pmtiles", state: "blocked" } as never;
}

describe("buildEngineCapabilityMatrix", () => {
  it("blocks the three scene3d stable runtime surfaces at the default gate", () => {
    const matrix = buildEngineCapabilityMatrix();

    expect(matrix.schemaVersion).toBe("engine-capabilities.v0.1");
    expect(matrix.blocked.map((entry) => entry.code)).toEqual([
      "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
      "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
      "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
    ]);
  });

  it("keeps scene3d blocked-list empty only at the stable gate", () => {
    const matrix = buildEngineCapabilityMatrix({ scene3dPromotionGate: "stable" });

    expect(matrix.blocked.filter((entry) => entry.code.startsWith("SCENE3D."))).toEqual([]);
  });

  it("warns instead of blocking at the experimental gate", () => {
    const matrix = buildEngineCapabilityMatrix({ scene3dPromotionGate: "experimental" });

    expect(matrix.blocked.filter((entry) => entry.code.startsWith("SCENE3D."))).toEqual([]);
    expect(matrix.available).toContain("scene3d.experimental-gate");
  });

  it("marks a blocked source as blocked and a supported source as available", () => {
    const matrix = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [blockedSourceEntry("parcels"), { sourceId: "roads", type: "geojson", state: "supported" } as never],
    });

    expect(matrix.blocked).toContainEqual(
      expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/sources/parcels" }),
    );
    expect(matrix.available).toContain("source.geojson");
    expect(matrix.available).not.toContain("source.pmtiles");
  });

  it("never lists a capability that has no truth source behind it", () => {
    const matrix = buildEngineCapabilityMatrix();

    expect(matrix.available).toEqual([
      "mapspec.validate",
      "commands.apply",
      "export.spec",
      "snapshot.smoke-mock",
      "evidence.build",
    ]);
  });
});
