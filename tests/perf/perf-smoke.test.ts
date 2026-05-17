import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import { applyCommands, type MapCommand, type MapSpec } from "@gis-engine/engine";

describe("performance smoke", () => {
  it("replays a small command batch within the v0.1 smoke budget", () => {
    const commands: MapCommand[] = Array.from({ length: 50 }, (_, index) => ({
      id: `cmd-view-${index}`,
      version: "0.1",
      type: "setView",
      view: {
        zoom: 11 + index / 100
      }
    }));
    const startedAt = performance.now();

    const result = applyCommands(before as MapSpec, commands, { transaction: "best-effort" });

    expect(result.results.every((commandResult) => commandResult.status === "applied")).toBe(true);
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });
});
