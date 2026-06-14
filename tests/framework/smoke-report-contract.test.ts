import { describe, expect, it } from "vitest";
import { runCliInstallSmoke } from "../../scripts/cli-install-smoke.mjs";
import { renderFirstRunAcceptanceReport } from "../../scripts/first-run-acceptance.mjs";

describe("smoke report contract", () => {
  it("renders a smoke breakdown for the first-run report", () => {
    const report = renderFirstRunAcceptanceReport({
      startedAt: new Date("2026-06-14T00:00:00Z"),
      endedAt: new Date("2026-06-14T00:00:42Z"),
      elapsedMs: 42_000,
      maxMinutes: 30,
      smokeStatus: "passed",
      smoke: {
        passed: true,
        steps: [
          { name: "Fresh consumer path", status: "passed", evidence: "Built the generated app." },
          { name: "Generated map review path", status: "passed", evidence: "Preflight and artifact checks passed." },
        ],
        failureMessage: "",
      },
      withinBudget: true,
      releasePreflight: {
        ok: true,
        checks: [{ name: "node", status: "pass", evidence: "22.22.3" }],
      },
      releaseEnvReady: true,
      requireReleaseEnv: false,
      passed: true,
      failureMessage: "",
    });

    expect(report).toContain("## CLI Install Smoke Breakdown");
    expect(report).toContain("| Fresh consumer path | passed | Built the generated app. |");
    expect(report).toContain("| Generated map review path | passed | Preflight and artifact checks passed. |");
  });

  it("keeps the cli install smoke execution summary exportable", () => {
    expect(typeof runCliInstallSmoke).toBe("function");
  });
});
