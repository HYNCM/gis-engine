import { describe, expect, it } from "vitest";
import {
  isMapLibreV6AdoptionApproved,
  isMapLibreV6Compatible,
  isMapLibreV6RuntimeCompatible,
  runMapLibreV6Audit,
} from "../../packages/engine/src/index.js";

describe("MapLibre exact-version compatibility audit", () => {
  it("keeps 5.24.0 as the release baseline and 6.0.0-22 evidence-only", () => {
    const report = runMapLibreV6Audit();

    expect(report.checkedVersions).toEqual(["5.24.0", "6.0.0-22"]);
    expect(report.releaseBaseline).toBe("5.24.0");
    expect(report.candidateDecision).toBe("keep-baseline");
    expect(report.status).toBe("warnings");
    expect(isMapLibreV6RuntimeCompatible(report)).toBe(true);
    expect(isMapLibreV6Compatible()).toBe(true);
    expect(isMapLibreV6AdoptionApproved(report)).toBe(false);
  });

  it("does not turn runtime compatibility into adoption approval", () => {
    const report = runMapLibreV6Audit();
    const approved = { ...report, candidateDecision: "bump-approved" as const };
    const incompatible = { ...approved, status: "incompatible" as const };

    expect(isMapLibreV6RuntimeCompatible(report)).toBe(true);
    expect(isMapLibreV6AdoptionApproved(report)).toBe(false);
    expect(isMapLibreV6AdoptionApproved(approved)).toBe(true);
    expect(isMapLibreV6AdoptionApproved(incompatible)).toBe(false);
  });

  it("records peer, ESM/type, event, and strict visual evidence separately", () => {
    const report = runMapLibreV6Audit();
    const byId = new Map(report.entries.map((entry) => [entry.id, entry]));

    expect(byId.get("prerelease-peer-range")?.severity).toBe("warning");
    expect(byId.get("public-adapter-types")?.severity).toBe("pass");
    expect(byId.get("esm-generated-example")?.severity).toBe("warning");
    expect(byId.get("adapter-lifecycle-events")?.severity).toBe("pass");
    expect(byId.get("strict-visual-readiness")?.severity).toBe("pass");
  });
});
