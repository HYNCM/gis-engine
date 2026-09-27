import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as engine from "@gis-engine/engine";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { applyLegacyIntent, applyProviderCommands, createInitialSpec } from "../../apps/workbench/server/index.mjs";

const callProvider = vi.hoisted(() => ({ current: null as null | (() => Promise<unknown>) }));

vi.mock("../../apps/workbench/server/provider.mjs", () => ({
  callOpenAiCompatibleProvider: () => {
    const handler = callProvider.current;
    if (!handler) throw new Error("No Workbench provider handler registered for this test.");
    return handler();
  },
}));

function circleRadius(
  spec: { layers?: Array<{ id: string; paint?: Record<string, unknown> }> } & Record<string, unknown>,
) {
  return spec.layers?.find((layer) => layer.id === "points-layer")?.paint?.["circle-radius"];
}

describe("Workbench chat map-session safety", () => {
  it("reports a mock-AI reset as a new map session without claiming command evidence", () => {
    const before = createInitialSpec();

    const result = applyLegacyIntent(engine, "reset the map", before);

    expect(result.status).toBe("reset");
    expect(result.diagnostics).toEqual([]);
    expect(result.evidence).toEqual({
      commandCount: 0,
      committed: false,
      rolledBack: false,
      failed: false,
      changedPathCount: 0,
      sessionReplaced: true,
    });
    expect(result.nextSpec.id).not.toBe(before.id);
    expect(result.nextSpec.revision).toBe("0");
  });

  it("reports a provider reset as a new map session without claiming command evidence", () => {
    const before = createInitialSpec();

    const result = applyProviderCommands(engine, { action: "reset", message: "reset" }, before);

    expect(result.status).toBe("reset");
    expect(result.evidence).toMatchObject({ commandCount: 0, committed: false, sessionReplaced: true });
    expect(result.nextSpec.id).not.toBe(before.id);
    expect(result.nextSpec.revision).toBe("0");
  });

  it("keeps an ordinary mock-AI edit claiming its own command evidence", () => {
    const before = createInitialSpec();

    const result = applyLegacyIntent(engine, "make the points smaller", before);

    expect(result.status).toBe("applied");
    expect(result.evidence).toMatchObject({ commandCount: 1, committed: true });
    expect(circleRadius(result.nextSpec)).toBe(4);
    expect(result.nextSpec.revision).toBe("1");
  });
});

type ChatPayload = {
  status?: string;
  spec?: Record<string, unknown>;
  summary?: { revision?: string; mapId?: string };
  diagnostics?: Array<Record<string, unknown>>;
  commandEvidence?: Record<string, unknown>;
};

function providerOutput(paint: Record<string, unknown>) {
  return {
    ok: true,
    providerOutput: {
      action: "setPaint",
      layerId: "points-layer",
      paint,
      promptHash: "sha256:workbench-session-test",
      traceId: "trace-workbench-session-test",
    },
  };
}

function createDeferred() {
  let resolve: (value: unknown) => void = () => {};
  const promise = new Promise<unknown>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("Workbench chat provider race", () => {
  let dbDir = "";
  let port = 0;
  let server:
    | {
        address: () => { port: number };
        close: (callback: () => void) => void;
        closeAllConnections?: () => void;
      }
    | undefined;

  async function post(pathname: string, body: Record<string, unknown>) {
    const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: (await response.json()) as ChatPayload };
  }

  async function getState() {
    const response = await fetch(`http://127.0.0.1:${port}/api/state`);
    return (await response.json()) as ChatPayload;
  }

  function pointPaint(spec: ChatPayload | undefined) {
    const layers = (spec?.spec as { layers?: Array<{ id: string; paint?: Record<string, unknown> }> } | undefined)
      ?.layers;
    return layers?.find((layer) => layer.id === "points-layer")?.paint;
  }

  beforeAll(async () => {
    dbDir = await mkdtemp(join(tmpdir(), "gis-workbench-session-"));
    vi.stubEnv("WORKBENCH_DB_PATH", join(dbDir, "workbench.sqlite"));
    vi.stubEnv("HOST", "127.0.0.1");
    vi.stubEnv("PORT", "0");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key-not-real");
    const workbenchServer = await import("../../apps/workbench/server/index.mjs");
    server = (await workbenchServer.main()) as typeof server;
    port = server?.address().port ?? 0;
  });

  afterAll(async () => {
    const closing = new Promise((resolve) => server?.close(resolve));
    // fetch keeps its sockets alive, and server.close() only settles once they are gone.
    server?.closeAllConnections?.();
    await closing;
    if (dbDir) await rm(dbDir, { recursive: true, force: true });
    callProvider.current = null;
    vi.unstubAllEnvs();
  });

  it("applies a provider result while the map session is unchanged", async () => {
    callProvider.current = async () => providerOutput({ "circle-color": "#22c55e" });

    const applied = await post("/api/chat", { message: "make points green", providerId: "deepseek" });

    expect(applied.status).toBe(200);
    expect(applied.body.status).toBe("applied");
    expect(applied.body.commandEvidence).toMatchObject({ commandCount: 1, committed: true });
    expect(pointPaint(applied.body)).toMatchObject({ "circle-color": "#22c55e" });
  });

  it("rejects a provider result that arrives after the map session moved on", async () => {
    const pending = createDeferred();
    callProvider.current = () => pending.promise;

    const baseline = await getState();
    const inFlight = post("/api/chat", { message: "make points red through the provider", providerId: "deepseek" });

    // The reviewer edits the map from another tab while the provider request is running.
    const concurrent = await post("/api/chat", { message: "make the points smaller" });
    expect(concurrent.body.status).toBe("applied");

    pending.resolve(providerOutput({ "circle-color": "#ef4444" }));
    const stale = await inFlight;

    expect(stale.status).toBe(409);
    expect(stale.body.status).toBe("blocked");
    expect(stale.body.diagnostics).toEqual([
      expect.objectContaining({
        code: "WORKBENCH.PROVIDER_RESULT_STALE",
        severity: "error",
        path: "/providerSession",
      }),
    ]);
    expect(stale.body.commandEvidence).toMatchObject({ commandCount: 0, committed: false });
    expect(pointPaint(stale.body)).not.toMatchObject({ "circle-color": "#ef4444" });

    const after = await getState();
    expect(after.summary?.revision).toBe(concurrent.body.summary?.revision);
    expect(pointPaint(after)).not.toMatchObject({ "circle-color": "#ef4444" });
    expect(after.summary?.mapId).toBe(baseline.summary?.mapId);
  });

  it("rejects a provider result that arrives after a reset restored the same revision", async () => {
    const pending = createDeferred();
    callProvider.current = () => pending.promise;

    const beforeReset = await getState();
    const inFlight = post("/api/chat", { message: "make points red through the provider", providerId: "deepseek" });

    const reset = await post("/api/chat", { message: "reset" });
    expect(reset.body.status).toBe("reset");
    expect(reset.body.summary?.revision).toBe("0");
    expect(reset.body.summary?.mapId).not.toBe(beforeReset.summary?.mapId);
    expect(reset.body.commandEvidence).toMatchObject({ commandCount: 0, committed: false, sessionReplaced: true });

    pending.resolve(providerOutput({ "circle-color": "#ef4444" }));
    const stale = await inFlight;

    expect(stale.status).toBe(409);
    expect(stale.body.status).toBe("blocked");
    expect(stale.body.diagnostics).toEqual([
      expect.objectContaining({ code: "WORKBENCH.PROVIDER_RESULT_STALE", severity: "error" }),
    ]);

    const after = await getState();
    expect(pointPaint(after)).not.toMatchObject({ "circle-color": "#ef4444" });
    expect(after.summary?.mapId).toBe(reset.body.summary?.mapId);
  });
});
