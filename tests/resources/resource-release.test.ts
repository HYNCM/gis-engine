import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import { MapRuntime, MockAdapter, type MapSpec } from "@gis-engine/engine";

describe("resource release smoke", () => {
  it("destroys runtime resources and reports repeated destroy calls", async () => {
    const runtime = await MapRuntime.create(before as MapSpec, {
      adapter: new MockAdapter(),
      container: {} as HTMLElement
    });

    const firstReport = await runtime.destroy();
    const secondReport = await runtime.destroy();

    expect(firstReport.destroyed).toBe(true);
    expect(firstReport.diagnostics).toEqual([]);
    expect(secondReport.destroyed).toBe(true);
    expect(secondReport.diagnostics[0]?.code).toBe("RENDER.DESTROYED");
  });
});
