import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPlan } from "../../scripts/gate-plan.mjs";

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("Workbench application convergence", () => {
  it("uses apps/workbench and the @gis-engine/workbench package as the canonical product surface", () => {
    expect(existsSync("apps/workbench/package.json")).toBe(true);
    expect(existsSync("apps/studio")).toBe(false);

    const manifest = readJson("apps/workbench/package.json");
    expect(manifest.name).toBe("@gis-engine/workbench");
    expect(manifest.version).toBe("0.1.0");
    expect(manifest.private).toBe(true);
  });

  it("makes Workbench scripts canonical and keeps Studio commands as aliases only", () => {
    const rootManifest = readJson("package.json");
    const scripts = rootManifest.scripts as Record<string, string>;

    expect(scripts["workbench:dev"]).toBe("pnpm --filter @gis-engine/workbench dev");
    expect(scripts["workbench:build"]).toBe("pnpm --filter @gis-engine/workbench build");
    expect(scripts["workbench:server"]).toBe("node apps/workbench/server/index.mjs");
    expect(scripts["test:workbench"]).toBe("vitest run tests/workbench");
    expect(scripts["studio:dev"]).toBe("pnpm workbench:dev");
    expect(scripts["studio:build"]).toBe("pnpm workbench:build");
    expect(scripts["studio:server"]).toBe("pnpm workbench:server");
    expect(scripts["test:studio"]).toBe("pnpm test:workbench");
    expect(scripts.check).toContain("pnpm test:workbench");
    expect(scripts.check).not.toContain("pnpm test:studio");
  });

  it("routes path-aware product gates through Workbench commands", () => {
    const gatePlan = readFileSync("scripts/gate-plan.mjs", "utf8");
    expect(gatePlan).toContain('addGate(gates, "pnpm workbench:build", "Workbench bundle")');
    expect(gatePlan).toContain('addGate(gates, "pnpm test:workbench", "Workbench behavior")');
    expect(gatePlan).toContain('addGate(gates, "pnpm test:workbench:security"');
    expect(gatePlan).toContain('addGate(gates, "pnpm test:workbench:e2e"');
    expect(gatePlan).toContain('addGate(gates, "pnpm test:workbench:delivery"');
    expect(gatePlan).toContain('"GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual"');
    expect(gatePlan).not.toContain('addGate(gates, "pnpm studio:build"');
    expect(gatePlan).not.toContain('addGate(gates, "pnpm test:studio"');

    const deliveryPlan = [...buildPlan(["packages/cli/src/delivery.ts"]).keys()];
    expect(deliveryPlan).toContain("pnpm test:workbench:delivery");
    expect(deliveryPlan).toContain("pnpm test:workbench:security");
  });
});
