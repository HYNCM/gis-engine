import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import after from "../fixtures/commands/replay/style-update/after.map.json";
import { applyCommands, type MapCommand, type MapSpec } from "@gis-engine/engine";

describe("applyCommands", () => {
  it("applies a style update and returns patch metadata", () => {
    const result = applyCommands(before as MapSpec, commands as MapCommand[]);

    expect(result.spec).toEqual(after);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.status).toBe("applied");
    expect(result.results[0]?.sequenceId).toBe(0);
    expect(result.results[0]?.traceId).toBe(result.traceId);
    expect(result.results[0]?.changedPaths).toEqual(["/layers/0/paint/fill-color", "/layers/0/paint/fill-opacity", "/revision"]);
    expect(result.results[0]?.inversePatch).toHaveLength(3);
    expect(result.transaction).toBe("atomic");
    expect(result.dryRun).toBe(false);
    expect(result.committed).toBe(true);
    expect(result.rolledBack).toBe(false);
  });

  it("rejects stale baseRevision without changing the spec", () => {
    const staleCommand = { ...(commands as MapCommand[])[0], baseRevision: "stale" } as MapCommand;
    const result = applyCommands(before as MapSpec, [staleCommand]);

    expect(result.spec).toEqual(before);
    expect(result.results[0]?.status).toBe("failed");
    expect(result.results[0]?.sequenceId).toBe(0);
    expect(result.results[0]?.diagnostics[0]?.code).toBe("CONFLICT.BASE_REVISION");
    expect(result.committed).toBe(false);
    expect(result.rolledBack).toBe(true);
  });

  it("rolls back the returned spec when an atomic batch fails", () => {
    const styleCommand = (commands as MapCommand[])[0]!;
    const failingCommand: MapCommand = {
      id: "cmd-remove-missing-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "2",
      layerId: "missing-layer"
    };

    const result = applyCommands(before as MapSpec, [styleCommand, failingCommand]);

    expect(result.spec).toEqual(before);
    expect(result.results.map((commandResult) => commandResult.status)).toEqual(["applied", "failed"]);
    expect(result.results.map((commandResult) => commandResult.sequenceId)).toEqual([0, 1]);
    expect(result.results[1]?.diagnostics[0]?.code).toBe("LAYER.NOT_FOUND");
    expect(result.committed).toBe(false);
    expect(result.rolledBack).toBe(true);
  });

  it("keeps successful commands in best-effort mode", () => {
    const styleCommand = (commands as MapCommand[])[0]!;
    const failingCommand: MapCommand = {
      id: "cmd-remove-missing-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "2",
      layerId: "missing-layer"
    };

    const result = applyCommands(before as MapSpec, [styleCommand, failingCommand], { transaction: "best-effort" });

    expect(result.spec).toEqual(after);
    expect(result.results.map((commandResult) => commandResult.status)).toEqual(["applied", "failed"]);
    expect(result.results[1]?.diagnostics[0]?.code).toBe("LAYER.NOT_FOUND");
    expect(result.transaction).toBe("best-effort");
    expect(result.committed).toBe(true);
    expect(result.rolledBack).toBe(false);
  });

  it("returns patches during dry runs without changing the returned spec", () => {
    const result = applyCommands(before as MapSpec, commands as MapCommand[], { dryRun: true });

    expect(result.spec).toEqual(before);
    expect(result.results[0]?.status).toBe("applied");
    expect(result.results[0]?.patch).toHaveLength(3);
    expect(result.results[0]?.nextRevision).toBe("2");
    expect(result.dryRun).toBe(true);
    expect(result.committed).toBe(false);
    expect(result.rolledBack).toBe(false);
  });

  it("uses caller trace ids for batch and command results", () => {
    const result = applyCommands(before as MapSpec, commands as MapCommand[], { traceId: "trace-review-1" });

    expect(result.traceId).toBe("trace-review-1");
    expect(result.results[0]?.traceId).toBe("trace-review-1");
  });
});
