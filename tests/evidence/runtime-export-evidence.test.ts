import { createHash } from "node:crypto";
import {
  applyCommands,
  buildEngineCapabilityMatrix,
  createSourceReadinessReport,
  type MapCommand,
  MapRuntime,
  type MapSpec,
  MockAdapter,
} from "@gis-engine/engine";
import { buildCommandTransitionEvidence, verifyEvidenceRecord } from "@gis-engine/engine/evidence";
import { assert, describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";

const zoomCommand: MapCommand = { id: "cmd-zoom", version: "0.1", type: "setView", view: { zoom: 12 } };

function specArtifact(spec: MapSpec) {
  const serialized = `${JSON.stringify(spec, null, 2)}\n`;
  return {
    serialized,
    artifact: {
      path: "mapspec.json",
      role: "mapspec",
      bytes: Buffer.byteLength(serialized, "utf8"),
      sha256: `sha256:${createHash("sha256").update(serialized, "utf8").digest("hex")}`,
    },
  };
}

describe("MapRuntime export evidence", () => {
  it("builds a verifiable EvidenceRecord from runtime apply history and exportSpec", async () => {
    const baseSpec = structuredClone(before) as MapSpec;
    const runtime = await MapRuntime.create(baseSpec, { adapter: new MockAdapter(), container: {} as HTMLElement });

    const firstBatch = commands as MapCommand[];
    const secondBatch = [zoomCommand];
    const results = [...(await runtime.apply(firstBatch)), ...(await runtime.apply(secondBatch))];
    const spec = runtime.exportSpec();
    await runtime.destroy();

    const { serialized, artifact } = specArtifact(spec);
    const built = buildCommandTransitionEvidence({
      projectId: "runtime-evidence",
      baseSpec,
      spec,
      commands: [...firstBatch, ...secondBatch],
      results,
      origin: { actor: "runtime-test", providerKind: "test" },
      artifacts: [artifact],
      capabilities: buildEngineCapabilityMatrix({ readiness: createSourceReadinessReport(spec).sources }),
      toolchain: {
        engineVersion: "test",
        nodeMajor: process.versions.node.split(".")[0] ?? "unknown",
        pnpmVersion: "test",
      },
      issuer: "runtime-export-evidence-test",
    });

    assert(built.ok, JSON.stringify(built.ok ? [] : built.diagnostics));
    expect(built.record.project).toMatchObject({ baseRevision: "1", revision: "3" });
    const verification = await verifyEvidenceRecord(built.record, {
      readArtifact: async () => Buffer.from(serialized, "utf8"),
    });
    expect(verification.diagnostics).toEqual([]);
    expect(verification.ok).toBe(true);
  });

  it("refuses applied results without a revision anchor instead of emitting an unverifiable record", () => {
    const unanchored = structuredClone(before) as MapSpec;
    delete unanchored.revision;
    const applied = applyCommands(unanchored, [zoomCommand]);
    const { artifact } = specArtifact(applied.spec);

    const built = buildCommandTransitionEvidence({
      projectId: "unanchored",
      baseSpec: unanchored,
      spec: applied.spec,
      commands: [zoomCommand],
      results: applied.results,
      origin: { actor: "runtime-test", providerKind: "test" },
      artifacts: [artifact],
      capabilities: buildEngineCapabilityMatrix({ readiness: [] }),
      toolchain: { engineVersion: "test", nodeMajor: "22", pnpmVersion: "test" },
      issuer: "runtime-export-evidence-test",
    });

    expect(built.ok).toBe(false);
    assert(!built.ok);
    expect(built.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.INPUT_INVALID", path: "/spec/revision" }),
    );
  });

  it("refuses results whose command is missing from the submitted batch", () => {
    const baseSpec = structuredClone(before) as MapSpec;
    const applied = applyCommands(baseSpec, [zoomCommand]);
    const { artifact } = specArtifact(applied.spec);

    const built = buildCommandTransitionEvidence({
      projectId: "missing-command",
      baseSpec,
      spec: applied.spec,
      commands: [],
      results: applied.results,
      origin: { actor: "runtime-test", providerKind: "test" },
      artifacts: [artifact],
      capabilities: buildEngineCapabilityMatrix({ readiness: [] }),
      toolchain: { engineVersion: "test", nodeMajor: "22", pnpmVersion: "test" },
      issuer: "runtime-export-evidence-test",
    });

    expect(built.ok).toBe(false);
    assert(!built.ok);
    expect(built.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.INPUT_INVALID", path: "/commands/0" }),
    );
  });
});