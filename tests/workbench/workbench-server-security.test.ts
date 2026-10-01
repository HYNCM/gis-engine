import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type TrustPayload = {
  ok?: boolean;
  diagnostics?: Array<{ code?: string; message?: string; path?: string }>;
  project?: { currentRevision?: string };
};

function initialSpec() {
  return {
    version: "0.1",
    id: "trust-review",
    revision: "0",
    view: { mode: "map2d", center: [121, 31], zoom: 8 },
    sources: {},
    layers: [],
  };
}

describe("Workbench local server trust boundary", () => {
  let projectRoot = "";
  let dbDir = "";
  let port = 0;
  let server:
    | {
        address: () => { port: number };
        close: (callback: () => void) => void;
        closeAllConnections?: () => void;
      }
    | undefined;

  beforeAll(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "gis-workbench-trust-root-"));
    dbDir = await mkdtemp(join(tmpdir(), "gis-workbench-trust-db-"));
    vi.stubEnv("WORKBENCH_PROJECT_ROOT", projectRoot);
    vi.stubEnv("WORKBENCH_DB_PATH", join(dbDir, "workbench.sqlite"));
    vi.stubEnv("HOST", "127.0.0.1");
    vi.stubEnv("PORT", "0");
    const workbenchServer = await import("../../apps/workbench/server/index.mjs");
    server = (await workbenchServer.main()) as typeof server;
    port = server?.address().port ?? 0;
  });

  afterAll(async () => {
    const closing = new Promise((resolve) => server?.close(resolve));
    server?.closeAllConnections?.();
    await closing;
    if (projectRoot) await rm(projectRoot, { recursive: true, force: true });
    if (dbDir) await rm(dbDir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  async function getToken(): Promise<string> {
    const response = await fetch(`http://127.0.0.1:${port}/api/workbench-token`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { token?: string };
    expect(body.token).toEqual(expect.any(String));
    return body.token as string;
  }

  it("rejects a cross-origin simple-content-type mutation without touching the project", async () => {
    const token = await getToken();
    const created = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-workbench-token": token },
      body: JSON.stringify({ id: "review-project", name: "Review", initialSpec: initialSpec() }),
    });
    expect(created.status).toBe(201);

    const rejected = await fetch(`http://127.0.0.1:${port}/api/projects/review-project/data/attach`, {
      method: "POST",
      headers: {
        origin: "https://example.invalid",
        "content-type": "text/plain;charset=UTF-8",
      },
      body: JSON.stringify({ baseRevision: "0", kind: "url", value: "http://example.invalid/a.geojson" }),
    });
    expect(rejected.status).toBe(403);
    expect((await rejected.json()) as TrustPayload).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.ORIGIN_FORBIDDEN" }],
    });

    const current = await fetch(`http://127.0.0.1:${port}/api/projects/review-project`);
    const state = (await current.json()) as TrustPayload;
    expect(state.project?.currentRevision).toBe("0");
  });

  it("rejects a JSON mutation that lacks the unguessable token", async () => {
    const rejected = await fetch(`http://127.0.0.1:${port}/api/projects/current`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(rejected.status).toBe(401);
    expect((await rejected.json()) as TrustPayload).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.ORIGIN_FORBIDDEN" }],
    });
  });

  it("rejects a JSON mutation with an incorrect token", async () => {
    const rejected = await fetch(`http://127.0.0.1:${port}/api/projects/current`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-workbench-token": "wrong-token" },
      body: "{}",
    });
    expect(rejected.status).toBe(401);
    expect((await rejected.json()) as TrustPayload).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.ORIGIN_FORBIDDEN", path: "/x-workbench-token" }],
    });
  });

  it.each([
    "https://example.invalid",
    "null",
    "not-an-origin",
  ])("rejects the foreign or invalid Origin %s even with a valid token", async (origin) => {
    const token = await getToken();
    const rejected = await fetch(`http://127.0.0.1:${port}/api/projects/current`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-workbench-token": token, origin },
      body: "{}",
    });
    expect(rejected.status).toBe(403);
    expect((await rejected.json()) as TrustPayload).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.ORIGIN_FORBIDDEN", path: "/origin" }],
    });
  });

  it("rejects a mutation whose body is not application/json even with a valid token", async () => {
    const token = await getToken();
    const rejected = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: "POST",
      headers: { "content-type": "text/plain", "x-workbench-token": token, origin: "http://127.0.0.1" },
      body: '{"name":"form-attack"}',
    });
    expect(rejected.status).toBe(415);
    expect((await rejected.json()) as TrustPayload).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.MEDIA_TYPE_INVALID" }],
    });
  });

  it.each([
    "application/jsonp",
    "application/json-patch+json",
    "application/json-invalid",
  ])("rejects the invalid JSON media type %s even with a valid token", async (contentType) => {
    const token = await getToken();
    const rejected = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: "POST",
      headers: { "content-type": contentType, "x-workbench-token": token },
      body: "{}",
    });
    expect(rejected.status).toBe(415);
    expect((await rejected.json()) as TrustPayload).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.MEDIA_TYPE_INVALID" }],
    });
  });

  it("rejects a request with a foreign Host header (DNS rebinding)", async () => {
    const { request } = await import("node:http");
    const status = await new Promise<number>((resolve, reject) => {
      const req = request(
        { host: "127.0.0.1", port, method: "POST", path: "/api/projects", headers: { host: "attacker.example" } },
        (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        },
      );
      req.on("error", reject);
      req.end("{}");
    });
    expect(status).toBe(403);
  });

  it("accepts a same-origin token-carrying JSON mutation", async () => {
    const token = await getToken();
    const response = await fetch(`http://127.0.0.1:${port}/api/projects/review-project/data/attach`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "x-workbench-token": token,
        origin: `http://127.0.0.1:${port}`,
      },
      body: JSON.stringify({
        baseRevision: "0",
        kind: "geojson",
        sourceId: "approved",
        value: { type: "FeatureCollection", features: [] },
      }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      result: { sourceId: "approved", previousRevision: "0", revision: "1" },
    });
  });
});
