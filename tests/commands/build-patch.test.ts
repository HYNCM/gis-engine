import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import { applyCommands, buildPatch, DiagnosticCodes, type MapCommand, type MapSpec } from "@gis-engine/engine";

describe("command patch generation", () => {
  it("merges paint properties without dropping existing paint", () => {
    const command: MapCommand = {
      id: "cmd-merge-paint",
      version: "0.1",
      type: "setPaint",
      baseRevision: "1",
      layerId: "district-fill",
      paint: {
        "fill-color": "#ef4444"
      }
    };

    const result = applyCommands(before as MapSpec, [command]);

    expect(result.spec.layers[0]?.paint).toEqual({
      "fill-color": "#ef4444",
      "fill-opacity": 0.7
    });
    expect(result.results[0]?.changedPaths).toEqual(["/layers/0/paint/fill-color", "/revision"]);
  });

  it("adds paint when the layer has no paint object", () => {
    const spec = structuredClone(before) as MapSpec;
    delete spec.layers[0]?.paint;

    const command: MapCommand = {
      id: "cmd-add-paint",
      version: "0.1",
      type: "setPaint",
      baseRevision: "1",
      layerId: "district-fill",
      paint: {
        "fill-color": "#ef4444"
      }
    };

    const result = applyCommands(spec, [command]);

    expect(result.spec.layers[0]?.paint).toEqual({ "fill-color": "#ef4444" });
    expect(result.results[0]?.patch?.[0]?.op).toBe("add");
  });

  it("reorders layers with remove and add operations", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.layers.push({ id: "district-line", type: "line", source: "districts" });

    const command: MapCommand = {
      id: "cmd-reorder",
      version: "0.1",
      type: "reorderLayer",
      baseRevision: "1",
      layerId: "district-fill"
    };

    const result = applyCommands(spec, [command]);

    expect(result.spec.layers.map((layer) => layer.id)).toEqual(["district-line", "district-fill"]);
    expect(result.results[0]?.patch?.map((operation) => operation.op)).toEqual(["remove", "add", "replace"]);
  });

  it("reports missing layer order anchors instead of silently appending", () => {
    const spec = structuredClone(before) as MapSpec;
    const addLayer = buildPatch(
      {
        id: "cmd-add-before-missing",
        version: "0.1",
        type: "addLayer",
        beforeLayerId: "missing-anchor",
        layer: { id: "district-line", type: "line", source: "districts" }
      },
      spec
    );
    const reorderLayer = buildPatch(
      {
        id: "cmd-reorder-before-missing",
        version: "0.1",
        type: "reorderLayer",
        layerId: "district-fill",
        beforeLayerId: "missing-anchor"
      },
      spec
    );

    for (const result of [addLayer, reorderLayer]) {
      expect(result.patch).toEqual([]);
      expect(result.diagnostics).toEqual([
        expect.objectContaining({
          severity: "error",
          code: DiagnosticCodes.LayerNotFound,
          path: "/beforeLayerId",
          relatedResources: [expect.objectContaining({ kind: "layer", id: "missing-anchor" })],
          fix: expect.objectContaining({ kind: "manual", confidence: "high" })
        })
      ]);
    }
  });

  it("skips no-op layer reorders", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.layers.push({ id: "district-line", type: "line", source: "districts" });

    const alreadyBeforeNext = buildPatch(
      {
        id: "cmd-noop-before-next",
        version: "0.1",
        type: "reorderLayer",
        layerId: "district-fill",
        beforeLayerId: "district-line"
      },
      spec
    );
    const beforeSelf = buildPatch(
      {
        id: "cmd-noop-before-self",
        version: "0.1",
        type: "reorderLayer",
        layerId: "district-fill",
        beforeLayerId: "district-fill"
      },
      spec
    );

    expect(alreadyBeforeNext).toEqual({ patch: [], diagnostics: [], skipped: true });
    expect(beforeSelf).toEqual({ patch: [], diagnostics: [], skipped: true });
  });

  it("returns field paths and suggested fixes for missing command targets", () => {
    const removeSource = buildPatch(
      {
        id: "cmd-remove-missing-source",
        version: "0.1",
        type: "removeSource",
        sourceId: "missing-source"
      },
      before as MapSpec
    );
    const setPaint = buildPatch(
      {
        id: "cmd-set-paint-missing-layer",
        version: "0.1",
        type: "setPaint",
        layerId: "missing-layer",
        paint: {
          "fill-color": "#ef4444"
        }
      },
      before as MapSpec
    );

    expect(removeSource.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.SourceNotFound,
        path: "/sourceId",
        relatedResources: [expect.objectContaining({ kind: "source", id: "missing-source" })],
        fix: expect.objectContaining({ kind: "manual", confidence: "high" })
      })
    ]);
    expect(setPaint.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.LayerNotFound,
        path: "/layerId",
        relatedResources: [expect.objectContaining({ kind: "layer", id: "missing-layer" })],
        fix: expect.objectContaining({ kind: "manual", confidence: "high" })
      })
    ]);
  });

  it("returns scene command diagnostics for missing scene targets", () => {
    const missingScene = buildPatch(
      {
        id: "cmd-scene-source-missing-extension",
        version: "0.1",
        type: "addSceneSource",
        sourceId: "city",
        source: { type: "3d-tiles", url: "./data/city/tileset.json" }
      },
      before as MapSpec
    );
    const missingSource = buildPatch(
      {
        id: "cmd-scene-layer-missing-source",
        version: "0.1",
        type: "addSceneLayer",
        layer: { id: "city", type: "tileset3d", source: "city" }
      },
      {
        ...(before as MapSpec),
        extensions: {
          scene3d: {
            camera: {
              position: [120.15, 30.28, 1200],
              target: [120.15, 30.28, 0]
            }
          }
        }
      }
    );
    const referencedSource = buildPatch(
      {
        id: "cmd-scene-remove-referenced-source",
        version: "0.1",
        type: "removeSceneSource",
        sourceId: "city"
      },
      {
        ...(before as MapSpec),
        extensions: {
          scene3d: {
            camera: {
              position: [120.15, 30.28, 1200],
              target: [120.15, 30.28, 0]
            },
            sources: {
              city: { type: "3d-tiles", url: "./data/city/tileset.json" }
            },
            layers: [{ id: "city", type: "tileset3d", source: "city" }]
          }
        }
      }
    );

    expect(missingScene.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.SpecMissingField,
        path: "/extensions/scene3d"
      })
    ]);
    expect(missingSource.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.SourceNotFound,
        path: "/layer/source"
      })
    ]);
    expect(referencedSource.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.LayerSourceIncompatible,
        path: "/sourceId"
      })
    ]);
  });

  it("returns a registered diagnostic for unsupported command types", () => {
    const result = buildPatch(
      {
        id: "cmd-unsupported",
        version: "0.1",
        type: "rotateMap"
      } as unknown as MapCommand,
      before as MapSpec
    );

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.CommandUnsupported,
        path: "/type",
        relatedResources: [expect.objectContaining({ kind: "command", id: "cmd-unsupported" })],
        fix: expect.objectContaining({ kind: "manual" })
      })
    ]);
  });
});
