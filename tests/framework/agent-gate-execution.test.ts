import { describe, expect, it } from "vitest";
import { GATE_TIMEOUT_MS, runGates } from "../../scripts/agent-runner.mjs";

const PROBE = "node -e \"process.stderr.write('gate-boom-detail');process.exit(3)\"";
const SLOW_PROBE = 'node -e "setTimeout(() => process.exit(0), 4000)"';

describe("agent gate execution", () => {
  it("keeps the merge-gate budget above the wall clock `pnpm check` needs", () => {
    expect(GATE_TIMEOUT_MS).toBeGreaterThanOrEqual(30 * 60_000);
  });

  it("reports a gate that ran out of budget as a timeout, not an opaque failure", () => {
    const lines: string[] = [];
    const results = runGates([SLOW_PROBE], { timeoutMs: 500, log: (line: string) => lines.push(line) });

    expect(results[0]?.status).toBe("failed");
    expect(lines.join("\n")).toMatch(/timed out after 500ms/i);
  });

  it("surfaces the failing command output in the run log, not only in the report", () => {
    const lines: string[] = [];
    const results = runGates([PROBE], { timeoutMs: 60_000, log: (line: string) => lines.push(line) });

    expect(results[0]?.status).toBe("failed");
    expect(results[0]?.output).toContain("gate-boom-detail");
    expect(lines.join("\n")).toContain("gate-boom-detail");
  });

  it("keeps passing gates silent so the log stays readable", () => {
    const lines: string[] = [];
    const results = runGates(["node -e \"process.stdout.write('ok')\""], {
      timeoutMs: 60_000,
      log: (line: string) => lines.push(line),
    });

    expect(results[0]?.status).toBe("passed");
    expect(lines).toEqual([]);
  });
});
