import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createWorkbenchProject } from "../../apps/workbench/server/project-store.mjs";
import { createLocalTelemetrySink, recordWorkbenchTelemetry } from "../../apps/workbench/server/telemetry.mjs";

const roots: string[] = [];
const occurredAt = "2026-08-19T02:00:00.000Z";

function initialSpec() {
  return {
    version: "0.1",
    revision: "0",
    view: { mode: "map2d", center: [0, 0], zoom: 2 },
    sources: {},
    layers: [],
  };
}

async function projectRoot(telemetryConsent = false) {
  const root = await mkdtemp(join(tmpdir(), "gis-engine-workbench-telemetry-"));
  roots.push(root);
  await createWorkbenchProject({
    root,
    id: "project-1",
    name: "Telemetry test",
    initialSpec: initialSpec(),
    telemetryConsent,
  });
  return root;
}

function event(properties: Record<string, unknown> = {}) {
  return {
    schemaVersion: "gis-engine.workbench.telemetry.v1",
    event: "plan_applied",
    occurredAt,
    projectId: "project-1",
    consent: true,
    properties: { commandCount: 2, outcome: "success", ...properties },
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Workbench local opt-in telemetry", () => {
  it("is off by default and records nothing without project consent", async () => {
    const root = await projectRoot();
    const sink = createLocalTelemetrySink();

    expect(await recordWorkbenchTelemetry(root, event(), sink)).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.TELEMETRY_CONSENT_REQUIRED" }],
    });
    expect(sink.list()).toEqual([]);
  });

  it("records only schema-conforming anonymous metrics after explicit consent", async () => {
    const root = await projectRoot(true);
    const sink = createLocalTelemetrySink();

    expect(await recordWorkbenchTelemetry(root, event(), sink)).toEqual({ ok: true, recorded: true, diagnostics: [] });
    expect(sink.list()).toEqual([event()]);
    expect(sink.transport).toBe("local-memory");
  });

  it.each([
    ["prompt", "private request"],
    ["data", { type: "FeatureCollection", features: [] }],
    ["mapSpec", initialSpec()],
    ["filePath", "/Users/customer/private.geojson"],
    ["apiKey", "secret"],
    ["credential", "secret"],
    ["providerBody", { choices: [] }],
  ])("rejects sensitive telemetry property %s", async (key, value) => {
    const root = await projectRoot(true);
    const sink = createLocalTelemetrySink();

    expect(await recordWorkbenchTelemetry(root, event({ [key]: value }), sink)).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.TELEMETRY_PAYLOAD_REJECTED" }],
    });
    expect(sink.list()).toEqual([]);
  });

  it("rejects events for a different project", async () => {
    const root = await projectRoot(true);
    const sink = createLocalTelemetrySink();

    expect(await recordWorkbenchTelemetry(root, { ...event(), projectId: "project-2" }, sink)).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.TELEMETRY_PAYLOAD_REJECTED", path: "/projectId" }],
    });
  });
});
