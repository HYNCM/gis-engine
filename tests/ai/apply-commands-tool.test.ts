import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import type { MapCommand } from "@gis-engine/engine";
import { applyCommandsTool } from "@gis-engine/ai";

describe("applyCommandsTool", () => {
  it("validates input before applying commands", () => {
    const result = applyCommandsTool({ spec: before, commands });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.result.spec.revision).toBe("2");
  });

  it("returns diagnostics for invalid input", () => {
    const result = applyCommandsTool({ commands });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics[0]?.code).toBe("SPEC.MISSING_FIELD");
  });

  it("passes transaction mode through to applyCommands", () => {
    const failingCommand: MapCommand = {
      id: "cmd-remove-missing-layer",
      version: "0.1",
      type: "removeLayer",
      baseRevision: "2",
      layerId: "missing-layer"
    };
    const result = applyCommandsTool({
      spec: before,
      commands: [...(commands as MapCommand[]), failingCommand],
      transaction: "best-effort"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.spec.revision).toBe("2");
      expect(result.result.results.map((commandResult) => commandResult.status)).toEqual(["applied", "failed"]);
    }
  });

  it("maps unknown tool fields to schema diagnostics", () => {
    const result = applyCommandsTool({ spec: before, commands, unexpected: true });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics[0]?.code).toBe("SPEC.UNKNOWN_FIELD");
  });
});
