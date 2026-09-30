import { applyCommands, type MapCommand, MapCommandSchema, type MapSpec, validateSpec } from "@gis-engine/engine";
import { Ajv } from "ajv";
import { describe, expect, it } from "vitest";
import validSpec from "../fixtures/specs/valid/basic-geojson.map.json";

function specWith(patch: Record<string, unknown>): MapSpec {
  return { ...(structuredClone(validSpec) as MapSpec), ...patch };
}

function setViewCommand(baseRevision?: string): MapCommand {
  return {
    id: "cmd-f5-set-view",
    version: "0.1",
    type: "setView",
    ...(baseRevision ? { baseRevision } : {}),
    view: { zoom: 5 },
  };
}

describe("revision contract", () => {
  it("rejects a non-numeric spec revision instead of silently reinterpreting it", () => {
    const report = validateSpec(specWith({ revision: "abc" }));

    expect(report.valid).toBe(false);
    expect(report.diagnostics).toContainEqual(expect.objectContaining({ severity: "error", path: "/revision" }));
  });

  it("rejects negative and fractional revisions", () => {
    for (const revision of ["-1", "1.5", "007", " 1"]) {
      const report = validateSpec(specWith({ revision }));
      expect(report.valid, `revision ${JSON.stringify(revision)} should be invalid`).toBe(false);
    }
  });

  it("accepts canonical non-negative integer revisions", () => {
    for (const revision of ["0", "1", "42", "9007199254740991"]) {
      const report = validateSpec(specWith({ revision }));
      expect(report.diagnostics.filter((diagnostic) => diagnostic.path === "/revision")).toEqual([]);
    }
  });

  it("refuses to apply commands onto a spec with an invalid revision and does not rewrite history", () => {
    const corrupted = specWith({ revision: "abc" });

    const result = applyCommands(corrupted, setViewCommand());

    expect(result.committed).toBe(false);
    expect(result.results[0]?.status).toBe("failed");
    expect(result.results[0]?.diagnostics.some((diagnostic) => diagnostic.path === "/revision")).toBe(true);
    expect(result.spec.revision).toBe("abc");
  });

  it("rejects commands whose baseRevision is not a canonical revision", () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(MapCommandSchema);

    expect(validate(setViewCommand("r7"))).toBe(false);
    expect(validate(setViewCommand("3"))).toBe(true);
    expect(validate(setViewCommand())).toBe(true);
  });

  it("increments canonical revisions deterministically and exposes the next revision", () => {
    const result = applyCommands(specWith({ revision: "3" }), setViewCommand("3"));

    expect(result.results[0]?.status).toBe("applied");
    expect(result.results[0]?.nextRevision).toBe("4");
    expect(result.spec.revision).toBe("4");
  });

  it("fails instead of overflowing past the safe integer ceiling", () => {
    const result = applyCommands(specWith({ revision: "9007199254740991" }), setViewCommand("9007199254740991"));

    expect(result.results[0]?.status).toBe("failed");
    expect(result.committed).toBe(false);
    expect(result.spec.revision).toBe("9007199254740991");
  });
});
