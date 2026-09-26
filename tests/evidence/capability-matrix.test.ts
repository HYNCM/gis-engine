import { buildEngineCapabilityMatrix, type SourceReadinessEntry } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

function readinessEntry(sourceId: string, type: string, state: SourceReadinessEntry["state"]): SourceReadinessEntry {
  return {
    sourceId,
    type,
    state,
    displayReady: state === "supported",
    queryReady: state === "supported",
    resourcePolicy: "passed",
    diagnostics: [],
    limitations: [],
    nextAction: "none",
  };
}

function blockedSourceEntry(sourceId: string): SourceReadinessEntry {
  return readinessEntry(sourceId, "pmtiles", "blocked");
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
      readiness: [blockedSourceEntry("parcels"), readinessEntry("roads", "geojson", "supported")],
    });

    expect(matrix.blocked).toContainEqual(
      expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/sources/parcels" }),
    );
    expect(matrix.available).toContain("source.geojson");
    expect(matrix.available).not.toContain("source.pmtiles");
  });

  it("does not list a readiness-only source in either set", () => {
    const matrix = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [readinessEntry("tiles", "raster", "readiness-only")],
    });

    expect(matrix.available).not.toContain("source.raster");
    expect(matrix.blocked).toEqual([]);
  });

  it("orders blocked sources by source id, not by the order they were passed in", () => {
    const forward = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [blockedSourceEntry("alpha"), blockedSourceEntry("zeta")],
    });
    const reversed = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [blockedSourceEntry("zeta"), blockedSourceEntry("alpha")],
    });

    expect(forward.blocked.map((entry) => entry.path)).toEqual(["/sources/alpha", "/sources/zeta"]);
    expect(reversed.blocked).toEqual(forward.blocked);
  });

  it("escapes source ids in blocker paths the way diagnostics do", () => {
    const matrix = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [blockedSourceEntry("a/b~c")],
    });

    expect(matrix.blocked[0]?.path).toBe("/sources/a~1b~0c");
  });

  it("lists only capabilities with a truth source behind them, in canonical order", () => {
    const matrix = buildEngineCapabilityMatrix();

    // Sorted order is part of the contract: EvidenceRecord.recordId hashes this array, and
    // canonical hashing preserves array order.
    expect(matrix.available).toEqual([
      "commands.apply",
      "evidence.build",
      "export.spec",
      "mapspec.validate",
      "snapshot.smoke-mock",
    ]);
  });
});
