import { describe, expect, it } from "vitest";

describe("agent recovery incident reconciliation", () => {
  it("builds a deterministic identity from workflow name and failed run id", async () => {
    const { buildIncidentMarker } = await import("../../scripts/recovery-incident.mjs");

    expect(buildIncidentMarker("Agent Daily Cadence", "29710687953")).toBe(
      "<!-- agent-recovery:Agent%20Daily%20Cadence:29710687953 -->",
    );
    expect(buildIncidentMarker("Agent Daily Cadence", "29710687954")).not.toBe(
      buildIncidentMarker("Agent Daily Cadence", "29710687953"),
    );
  });

  it("updates and comments on the oldest matching open incident without creating another", async () => {
    const { buildIncidentMarker, reconcileRecoveryIncident } = await import("../../scripts/recovery-incident.mjs");
    const marker = buildIncidentMarker("Agent Daily Cadence", "29710687953");
    const calls: string[][] = [];
    const runGh = (args: string[]) => {
      calls.push(args);
      if (args[0] === "issue" && args[1] === "list") {
        return {
          stdout: JSON.stringify([
            { number: 35, state: "OPEN", body: marker },
            { number: 32, state: "OPEN", body: marker },
          ]),
        };
      }
      return { stdout: "" };
    };

    const result = reconcileRecoveryIncident(
      { workflow: "Agent Daily Cadence", failedRunId: "29710687953" },
      { runGh },
    );

    expect(result).toMatchObject({ action: "updated", issueNumber: 32 });
    expect(calls).toContainEqual(expect.arrayContaining(["issue", "edit", "32"]));
    expect(calls).toContainEqual(expect.arrayContaining(["issue", "comment", "32"]));
    expect(calls.some((args) => args[0] === "issue" && args[1] === "create")).toBe(false);
  });

  it("reopens the canonical closed incident before updating it", async () => {
    const { buildIncidentMarker, reconcileRecoveryIncident } = await import("../../scripts/recovery-incident.mjs");
    const marker = buildIncidentMarker("Agent Weekly Cadence", "29710687953");
    const calls: string[][] = [];
    const runGh = (args: string[]) => {
      calls.push(args);
      if (args[0] === "issue" && args[1] === "list") {
        return { stdout: JSON.stringify([{ number: 32, state: "CLOSED", body: marker }]) };
      }
      return { stdout: "" };
    };

    const result = reconcileRecoveryIncident(
      { workflow: "Agent Weekly Cadence", failedRunId: "29710687953" },
      { runGh },
    );

    expect(result).toMatchObject({ action: "reopened", issueNumber: 32 });
    const reopenIndex = calls.findIndex((args) => args[0] === "issue" && args[1] === "reopen");
    const editIndex = calls.findIndex((args) => args[0] === "issue" && args[1] === "edit");
    expect(reopenIndex).toBeGreaterThan(-1);
    expect(editIndex).toBeGreaterThan(reopenIndex);
  });

  it("creates a distinct incident when the failed run identity is absent", async () => {
    const { buildIncidentMarker, reconcileRecoveryIncident } = await import("../../scripts/recovery-incident.mjs");
    const oldMarker = buildIncidentMarker("Agent Daily Cadence", "29710687953");
    const calls: string[][] = [];
    const runGh = (args: string[]) => {
      calls.push(args);
      if (args[0] === "issue" && args[1] === "list") {
        return { stdout: JSON.stringify([{ number: 32, state: "OPEN", body: oldMarker }]) };
      }
      if (args[0] === "issue" && args[1] === "create") return { stdout: "https://github.test/issues/43\n" };
      return { stdout: "" };
    };

    const result = reconcileRecoveryIncident(
      { workflow: "Agent Daily Cadence", failedRunId: "29710687954" },
      { runGh },
    );

    expect(result).toMatchObject({ action: "created", url: "https://github.test/issues/43" });
    const create = calls.find((args) => args[0] === "issue" && args[1] === "create");
    expect(create).toEqual(expect.arrayContaining(["--body", expect.stringContaining("29710687954")]));
    expect(create).not.toEqual(expect.arrayContaining([expect.stringContaining("29710687953")]));
  });
});
