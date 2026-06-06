import { applyCommands, type MapCommand, type MapSpec, MockAdapter } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import after from "../fixtures/commands/replay/style-update/after.map.json";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import { createAdapterContractSuite } from "./createAdapterContractSuite.js";

createAdapterContractSuite("mock", () => new MockAdapter());

describe("MockAdapter state", () => {
  it("keeps its internal spec in sync after patches are applied", async () => {
    const adapter = new MockAdapter();
    await adapter.load(before as MapSpec, { container: {} as HTMLElement });
    const result = applyCommands(before as MapSpec, commands as MapCommand[]);
    const patch = result.results.flatMap((commandResult) => commandResult.patch ?? []);

    const adapterResult = await adapter.applyPatch(patch, { container: {} as HTMLElement });

    expect(adapterResult.diagnostics).toEqual([]);
    expect(adapter.exportSpec()).toEqual(after);
  });

  it("keeps the last committed spec when a patch fails validation", async () => {
    const adapter = new MockAdapter();
    await adapter.load(before as MapSpec, { container: {} as HTMLElement });

    const adapterResult = await adapter.applyPatch(
      [
        {
          op: "add",
          path: "/layers/1",
          value: { id: "invalid-fill", type: "fill", source: "missing-source" },
        },
      ],
      { container: {} as HTMLElement },
    );

    expect(adapterResult.diagnostics.some((diagnostic) => diagnostic.severity === "error")).toBe(true);
    expect(adapter.exportSpec()).toEqual(before);
  });
});
