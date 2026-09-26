import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type StudioPayload = {
  status?: string;
  spec?: Record<string, unknown>;
  diagnostics?: Array<Record<string, unknown>>;
  commandEvidence?: Record<string, unknown>;
};

function specField(payload: StudioPayload, key: string) {
  return payload.spec?.[key];
}

function revisionOf(payload: StudioPayload) {
  return String(specField(payload, "revision"));
}

function mapIdOf(payload: StudioPayload) {
  return String(specField(payload, "id"));
}

type Deferred = {
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
};

function createDeferred(): Deferred {
  let resolve: (value: unknown) => void = () => {};
  const promise = new Promise<unknown>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const callProvider = vi.hoisted(() => ({ current: null as null | (() => Promise<unknown>) }));

vi.mock("/apps/studio/server/provider.mjs", () => ({
  callOpenAiCompatibleProvider: (input: unknown) => {
    const handler = callProvider.current;
    if (!handler) throw new Error("No studio provider handler registered for this test.");
    void input;
    return handler();
  },
}));

function providerResult(output: Record<string, unknown>) {
  return {
    ok: true,
    providerOutput: { ...output, promptHash: "sha256:studio-session-test", traceId: "trace-studio-session-test" },
  };
}

describe("Studio chat map-session safety", () => {
  let dbDir = "";
  let port = 0;
  let server: { close: () => Promise<void> } | undefined;

  async function bootServer() {
    vi.resetModules();
    const dbRoot = await mkdtemp(join(tmpdir(), "gis-studio-session-"));
    dbDir = dbRoot;
    vi.stubEnv("STUDIO_DB_PATH", join(dbRoot, "studio.sqlite"));
    vi.stubEnv("HOST", "127.0.0.1");
    vi.stubEnv("PORT", "0");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key-not-real");
    const studioServer = await import("/apps/studio/server/index.mjs");
    const instance = (await studioServer.start()) as { close: () => Promise<void> };
    server = instance;
    port = (instance as unknown as { address: () => { port: number } }).address().port;
  }

  async function post(pathname: string, body: Record<string, unknown>) {
    const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: (await response.json()) as StudioPayload };
  }

  async function getState() {
    const response = await fetch(`http://127.0.0.1:${port}/api/state`);
    return (await response.json()) as StudioPayload;
  }

  beforeAll(bootServer);

  afterAll(async () => {
    await server?.close();
    if (dbDir) await rm(dbDir, { recursive: true, force: true });
    callProvider.current = null;
    vi.unstubAllEnvs();
  });

  it("applies a provider result while the map session is unchanged", async () => {
    callProvider.current = async () =>
      providerResult({ action: "setPaint", layerId: "points-layer", paint: { "circle-color": "#22c55e" } });

    const applied = await post("/api/chat", { message: "make points green", providerId: "deepseek" });

    expect(applied.status).toBe(200);
    expect(applied.body.status).toBe("applied");
    expect(applied.body.commandEvidence).toMatchObject({ commandCount: 1, committed: true });
    const state = await getState();
    expect(revisionOf(state)).toBe("1");
  });

  it("rejects a provider result that arrives after the map session was replaced", async () => {
    const pending = createDeferred();
    callProvider.current = () => pending.promise;

    const baseline = await getState();
    expect(revisionOf(baseline)).toBe("1");

    const inFlight = post("/api/chat", { message: "make points red", providerId: "deepseek" });
    // The reviewer starts a new map while the provider request is still running.
    await post("/api/chat", { message: "reset", providerId: "mock-ai" });

    pending.resolve(
      providerResult({ action: "setPaint", layerId: "points-layer", paint: { "circle-color": "#ef4444" } }),
    );
    const stale = await inFlight;

    expect(stale.status).toBe(409);
    expect(stale.body.status).toBe("blocked");
    expect(stale.body.diagnostics).toEqual([
      expect.objectContaining({ code: "STUDIO.PROVIDER_RESULT_STALE", severity: "error" }),
    ]);
    expect(stale.body.commandEvidence).toMatchObject({ commandCount: 0, committed: false });
    const after = await getState();
    expect(mapIdOf(after)).not.toBe(mapIdOf(baseline));
    expect(revisionOf(after)).toBe("0");
    expect(JSON.stringify(after.spec)).not.toContain("#ef4444");
  });

  it("reports a reset as a new map session without claiming command evidence", async () => {
    const before = await getState();
    expect(revisionOf(before)).toBe("0");

    const reset = await post("/api/chat", { message: "reset", providerId: "mock-ai" });

    expect(reset.body.status).toBe("reset");
    expect(reset.body.commandEvidence).toMatchObject({
      commandCount: 0,
      committed: false,
      rolledBack: false,
      failed: false,
      changedPathCount: 0,
      sessionReplaced: true,
    });
    expect(mapIdOf(reset.body)).not.toBe(mapIdOf(before));
    expect(revisionOf(reset.body)).toBe("0");
  });
});
