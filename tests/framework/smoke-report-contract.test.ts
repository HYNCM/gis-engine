import { describe, expect, it } from "vitest";
import { runCliInstallSmoke } from "../../scripts/cli-install-smoke.mjs";
import {
  renderFirstRunAcceptanceReport,
  resolveNextAction,
  runFirstRunAcceptance,
} from "../../scripts/first-run-acceptance.mjs";

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

  it("renders a next action for advisory release parity failures", () => {
    const report = renderFirstRunAcceptanceReport({
      startedAt: new Date("2026-06-14T00:00:00Z"),
      endedAt: new Date("2026-06-14T00:00:30Z"),
      elapsedMs: 30_000,
      maxMinutes: 30,
      smokeStatus: "passed",
      smoke: {
        passed: true,
        steps: [],
        failureMessage: "",
      },
      withinBudget: true,
      releasePreflight: {
        ok: false,
        checks: [{ name: "node", status: "fail", evidence: "expected major 22; found 26.0.0" }],
      },
      releaseEnvReady: false,
      requireReleaseEnv: false,
      passed: true,
      failureMessage: "",
    });

    expect(report).toContain("## Next Action");
    expect(report).toContain("pnpm smoke:first-run --require-release-env");
  });

  it("returns machine-readable next action metadata for advisory parity failures", () => {
    const result = runFirstRunAcceptanceResultFixture({
      releaseEnvReady: false,
      requireReleaseEnv: false,
      passed: true,
    });

    expect(resolveNextAction(result)).toEqual({
      kind: "rerun-with-strict-release-env",
      command: "pnpm smoke:first-run --require-release-env",
      reason: "release-runner parity is advisory-only",
      summary: "Local acceptance passed, but release-runner parity is still advisory-only.",
      guidance: "Re-run with the strict release environment check before using this as release-grade local evidence:",
    });
  });

  it("embeds machine-readable next action fields in the report front matter", () => {
    const report = renderFirstRunAcceptanceReport(runFirstRunAcceptanceResultFixture());

    expect(report).toContain("next_action_kind: rerun-with-strict-release-env");
    expect(report).toContain('next_action_command: "pnpm smoke:first-run --require-release-env"');
    expect(report).toContain('next_action_reason: "release-runner parity is advisory-only"');
  });

  it("keeps the cli install smoke execution summary exportable", () => {
    expect(typeof runCliInstallSmoke).toBe("function");
    expect(typeof runFirstRunAcceptance).toBe("function");
  });
});

function runFirstRunAcceptanceResultFixture(overrides = {}) {
  const base = {
    startedAt: new Date("2026-06-14T00:00:00Z"),
    endedAt: new Date("2026-06-14T00:00:30Z"),
    elapsedMs: 30_000,
    maxMinutes: 30,
    smokeStatus: "passed",
    smoke: {
      passed: true,
      steps: [],
      failureMessage: "",
    },
    withinBudget: true,
    releasePreflight: {
      ok: false,
      checks: [{ name: "node", status: "fail", evidence: "expected major 22; found 26.0.0" }],
    },
    releaseEnvReady: false,
    requireReleaseEnv: false,
    passed: true,
    failureMessage: "",
    ...overrides,
  };

  return {
    ...base,
    nextAction: resolveNextAction(base),
  };
}
