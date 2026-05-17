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
