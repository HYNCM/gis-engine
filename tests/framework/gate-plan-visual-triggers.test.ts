import { describe, expect, it } from "vitest";
import { buildGatePlan } from "../../scripts/gate-plan.mjs";

const STRICT_VISUAL = "GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual";

function gateCommands(files: string[]): string[] {
  return buildGatePlan(files).gates.map((gate: { command: string }) => gate.command);
}

describe("gate-plan strict visual triggers", () => {
  it("requires strict visual evidence when the Playwright harness config changes", () => {
    expect(gateCommands(["playwright.config.ts"])).toContain(STRICT_VISUAL);
  });

  it("requires strict visual evidence when committed pixel baselines change", () => {
    expect(
      gateCommands(["tests/__snapshots__/snapshot/visual/maplibre-visual.spec.ts/maplibre-geojson-darwin.png"]),
    ).toContain(STRICT_VISUAL);
  });

  it("requires strict visual evidence for every visual spec, not only the MapLibre one", () => {
    for (const spec of [
      "tests/snapshot/visual/maplibre-visual.spec.ts",
      "tests/snapshot/visual/scene3d-three-adapter.spec.ts",
    ]) {
      expect(gateCommands([spec]), spec).toContain(STRICT_VISUAL);
    }
  });

  it("keeps non-visual snapshot changes on the smoke gate only", () => {
    const commands = gateCommands(["tests/snapshot/smoke/fixture-build.test.ts"]);
    expect(commands).toContain("pnpm test:snapshot:smoke");
    expect(commands).not.toContain(STRICT_VISUAL);
  });
});
