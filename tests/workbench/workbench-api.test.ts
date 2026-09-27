import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWorkbenchProject, openWorkbenchProject } from "../../apps/workbench/server/project-store.mjs";
import {
  applyWorkbenchPlan,
  createWorkbenchApiRouter,
  createWorkbenchPlan,
  inspectWorkbenchData,
  previewWorkbenchPlan,
} from "../../apps/workbench/server/workbench-service.mjs";

const roots: string[] = [];
const createdAt = "2026-08-19T00:00:00.000Z";

function initialSpec() {
  return {
    version: "0.1",
    id: "places",
    revision: "0",
    view: { mode: "map2d", center: [121, 31], zoom: 8 },
    sources: {
      places: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [121, 31] },
              properties: { name: "Shanghai", population: 24_000_000 },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "places",
        type: "circle",
        source: "places",
        paint: { "circle-color": "#2563eb" },
      },
    ],
  };
}

async function projectRoot() {
  const root = await mkdtemp(join(tmpdir(), "gis-engine-workbench-api-"));
  roots.push(root);
  await createWorkbenchProject(
    { root, id: "project-1", name: "Places", initialSpec: initialSpec() },
    { now: () => createdAt },
  );
  return root;
}

function sha256(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function planInput(overrides: Record<string, unknown> = {}) {
  return {
    goal: "Make the places layer red",
    baseRevision: "0",
    promptHash: sha256("Make the places layer red"),
    commands: [
      {
        id: "paint-red",
        version: "0.1",
        type: "setPaint",
        layerId: "places",
        paint: { "circle-color": "#dc2626" },
      },
    ],
    affectedPaths: ["mapspec.json"],
    resourceRequests: [],
    unsupportedIntents: [],
    diagnostics: [],
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Workbench data inspection", () => {
  it("summarizes inline and pasted GeoJSON without retaining the data", () => {
    const geojson = initialSpec().sources.places.data;

    const inline = inspectWorkbenchData({ kind: "geojson", value: geojson });
    const pasted = inspectWorkbenchData({ kind: "geojson", value: JSON.stringify(geojson) });

    expect(inline).toMatchObject({
      ok: true,
      result: {
        kind: "geojson",
        featureCount: 1,
        geometryTypes: ["Point"],
        bounds: [121, 31, 121, 31],
      },
    });
    expect(pasted).toEqual(inline);
    expect(JSON.stringify(inline)).not.toContain("Shanghai");
  });

  it("inspects an existing MapSpec and tile descriptors", () => {
    const spec = inspectWorkbenchData({ kind: "mapspec", value: initialSpec() });
    const tiles = inspectWorkbenchData({
      kind: "tiles",
      value: { type: "vector", tiles: ["http://127.0.0.1:8080/{z}/{x}/{y}.pbf"] },
      confirmed: true,
    });

    expect(spec).toMatchObject({
      ok: true,
      result: { kind: "mapspec", sourceCount: 1, layerCount: 1, revision: "0" },
    });
    expect(tiles).toMatchObject({
      ok: true,
      result: { kind: "tiles", tileType: "vector", resourceCount: 1 },
    });
  });

  it("requires explicit network confirmation and applies the resource policy", () => {
    const unconfirmed = inspectWorkbenchData({
      kind: "url",
      value: "http://127.0.0.1:8080/data.geojson",
    });
    const blocked = inspectWorkbenchData({
      kind: "url",
      value: "https://example.com/data.geojson",
      confirmed: true,
    });

    expect(unconfirmed).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.NETWORK_CONFIRMATION_REQUIRED", path: "/confirmed" }],
    });
    expect(blocked).toMatchObject({
      ok: false,
      diagnostics: [{ code: "SECURITY.URL_BLOCKED" }],
    });
  });

  it("returns stable diagnostics for size limits and unsupported content", () => {
    const tooLarge = inspectWorkbenchData(
      { kind: "geojson", value: JSON.stringify(initialSpec().sources.places.data) },
      { maxBytes: 10 },
    );
    const unsupported = inspectWorkbenchData({ kind: "csv", value: "name,lat,lon" });

    expect(tooLarge).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.DATA_TOO_LARGE", path: "/value" }],
    });
    expect(unsupported).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.DATA_UNSUPPORTED", path: "/kind" }],
    });
  });

  it("attaches inspected GeoJSON into data/ and reopens it as a MapSpec source", async () => {
    const root = await projectRoot();
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const value = initialSpec().sources.places.data;
    const attached = await router({
      method: "POST",
      pathname: "/api/projects/project-1/data/attach",
      body: {
        kind: "geojson",
        value,
        sourceId: "cities",
        fileName: "cities.geojson",
        baseRevision: "0",
      },
    });

    expect(attached).toMatchObject({
      handled: true,
      status: 200,
      body: {
        result: {
          sourceId: "cities",
          path: "data/cities.geojson",
          bytes: expect.any(Number),
          sha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          revision: "1",
        },
      },
    });
    const file = await readFile(join(root, "data/cities.geojson"), "utf8");
    expect(JSON.parse(file)).toEqual(value);
    const reopened = await openWorkbenchProject(root);
    expect(reopened.spec.sources.cities).toEqual({ type: "geojson", data: value });

    const restartedRouter = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const current = await restartedRouter({ method: "GET", pathname: "/api/projects/current" });
    expect(current).toMatchObject({
      body: { project: { currentRevision: "1" }, spec: { sources: { cities: expect.anything() } } },
    });
  });

  it("rejects unsafe attachment filenames, oversize data, and unconfirmed remote sources", async () => {
    const root = await projectRoot();
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt, maxBytes: 10 });
    const value = initialSpec().sources.places.data;
    const unsafe = await router({
      method: "POST",
      pathname: "/api/projects/project-1/data/attach",
      body: { kind: "geojson", value, sourceId: "cities", fileName: "../cities.geojson", baseRevision: "0" },
    });
    expect(unsafe).toMatchObject({ status: 422, body: { diagnostics: [{ code: "WORKBENCH.UNSAFE_PATH" }] } });

    const tooLarge = await router({
      method: "POST",
      pathname: "/api/projects/project-1/data/attach",
      body: { kind: "geojson", value, sourceId: "cities", fileName: "cities.geojson", baseRevision: "0" },
    });
    expect(tooLarge).toMatchObject({ status: 409, body: { diagnostics: [{ code: "WORKBENCH.DATA_TOO_LARGE" }] } });

    const remote = await router({
      method: "POST",
      pathname: "/api/projects/project-1/data/attach",
      body: {
        kind: "url",
        value: "https://example.com/cities.geojson",
        sourceId: "remote",
        fileName: "remote.json",
        baseRevision: "0",
      },
    });
    expect(remote).toMatchObject({
      status: 409,
      body: { diagnostics: [{ code: "WORKBENCH.NETWORK_CONFIRMATION_REQUIRED" }] },
    });
  });
});

describe("Workbench plan preview and application", () => {
  it("creates a validated plan from structured input without retaining raw provider output", () => {
    const result = createWorkbenchPlan(planInput(), {
      id: "plan-1",
      now: () => createdAt,
    });

    expect(result).toMatchObject({
      ok: true,
      result: {
        plan: {
          schemaVersion: "gis-engine.workbench.plan.v1",
          id: "plan-1",
          baseRevision: "0",
        },
        planHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      },
    });
    expect(JSON.stringify(result)).not.toContain("providerBody");

    const forbidden = createWorkbenchPlan({ ...planInput(), providerBody: { choices: [] } });
    expect(forbidden).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.PLAN_INVALID" }],
    });
  });

  it("previews on an isolated copy and applies only with matching hash and revision", async () => {
    const root = await projectRoot();
    const created = createWorkbenchPlan(planInput(), { id: "plan-1", now: () => createdAt });
    if (!created.ok) throw new Error("plan creation failed");
    const beforeBytes = await readFile(join(root, "mapspec.json"));

    const preview = await previewWorkbenchPlan(root, created.result.plan);

    expect(preview).toMatchObject({
      ok: true,
      result: {
        planHash: created.result.planHash,
        baseRevision: "0",
        canApply: true,
        affectedPaths: expect.arrayContaining(["/layers"]),
      },
    });
    expect(await readFile(join(root, "mapspec.json"))).toEqual(beforeBytes);

    const mismatch = await applyWorkbenchPlan(root, created.result.plan, {
      schemaVersion: "gis-engine.workbench.apply-request.v1",
      projectId: "project-1",
      planHash: sha256("wrong"),
      baseRevision: "0",
    });
    expect(mismatch).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.PLAN_HASH_MISMATCH" }],
    });

    const applied = await applyWorkbenchPlan(root, created.result.plan, {
      schemaVersion: "gis-engine.workbench.apply-request.v1",
      projectId: "project-1",
      planHash: created.result.planHash,
      baseRevision: "0",
    });
    expect(applied).toMatchObject({ ok: true, result: { previousRevision: "0", revision: "1" } });
    expect((await openWorkbenchProject(root)).spec.layers[0]?.paint).toEqual({ "circle-color": "#dc2626" });
  });

  it("rejects stale previews and preserves state after an atomic apply failure", async () => {
    const root = await projectRoot();
    const stale = createWorkbenchPlan(planInput({ baseRevision: "old" }), {
      id: "stale-plan",
      now: () => createdAt,
    });
    if (!stale.ok) throw new Error("stale plan creation failed");
    expect(await previewWorkbenchPlan(root, stale.result.plan)).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.REVISION_CONFLICT" }],
    });

    const invalid = createWorkbenchPlan(
      planInput({
        commands: [
          ...(planInput().commands as unknown[]),
          {
            id: "remove-used-source",
            version: "0.1",
            type: "removeSource",
            sourceId: "places",
          },
        ],
      }),
      { id: "invalid-plan", now: () => createdAt },
    );
    if (!invalid.ok) throw new Error("invalid plan creation failed");
    const before = await openWorkbenchProject(root);
    const applied = await applyWorkbenchPlan(root, invalid.result.plan, {
      schemaVersion: "gis-engine.workbench.apply-request.v1",
      projectId: "project-1",
      planHash: invalid.result.planHash,
      baseRevision: "0",
    });

    expect(applied).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: "WORKBENCH.TRANSACTION_FAILED" }),
        expect.objectContaining({ code: "SRC.NOT_FOUND" }),
      ]),
    });
    expect(await openWorkbenchProject(root)).toEqual(before);
  });
});

describe("Workbench project API router", () => {
  it("returns an empty current-project state before a project is created", async () => {
    const root = await mkdtemp(join(tmpdir(), "gis-engine-workbench-router-empty-"));
    roots.push(root);
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });

    expect(await router({ method: "GET", pathname: "/api/projects/current" })).toEqual({
      handled: true,
      status: 200,
      body: null,
    });
  });

  it("runs create, read, inspect, plan, preview, apply, and restore as project routes", async () => {
    const root = await mkdtemp(join(tmpdir(), "gis-engine-workbench-router-"));
    roots.push(root);
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });

    const created = await router({
      method: "POST",
      pathname: "/api/projects",
      body: { id: "project-1", name: "Places", initialSpec: initialSpec() },
    });
    expect(created).toMatchObject({ handled: true, status: 201, body: { project: { id: "project-1" } } });

    const read = await router({ method: "GET", pathname: "/api/projects/project-1" });
    expect(read).toMatchObject({ handled: true, status: 200, body: { project: { currentRevision: "0" } } });
    expect(await router({ method: "GET", pathname: "/api/projects/current" })).toMatchObject({
      handled: true,
      status: 200,
      body: { project: { id: "project-1" } },
    });

    const inspected = await router({
      method: "POST",
      pathname: "/api/projects/project-1/data/inspect",
      body: { kind: "geojson", value: initialSpec().sources.places.data },
    });
    expect(inspected).toMatchObject({ handled: true, status: 200, body: { result: { featureCount: 1 } } });

    const planned = await router({
      method: "POST",
      pathname: "/api/projects/project-1/plans",
      body: planInput(),
    });
    expect(planned).toMatchObject({
      handled: true,
      status: 201,
      body: { result: { planHash: expect.stringMatching(/^sha256:/) } },
    });
    const planHash = planned.body.result.planHash;

    const previewed = await router({
      method: "POST",
      pathname: `/api/projects/project-1/plans/${planHash}/preview`,
    });
    expect(previewed).toMatchObject({ handled: true, status: 200, body: { result: { canApply: true } } });

    const applied = await router({
      method: "POST",
      pathname: "/api/projects/project-1/apply",
      body: {
        schemaVersion: "gis-engine.workbench.apply-request.v1",
        projectId: "project-1",
        planHash,
        baseRevision: "0",
      },
    });
    expect(applied).toMatchObject({ handled: true, status: 200, body: { result: { revision: "1" } } });

    const restored = await router({
      method: "POST",
      pathname: "/api/projects/project-1/revisions/0/restore",
      body: { baseRevision: "1" },
    });
    expect(restored).toMatchObject({
      handled: true,
      status: 200,
      body: { result: { revision: expect.stringMatching(/^[2-9][0-9]*$/) } },
    });

    const exportPreview = await router({
      method: "POST",
      pathname: "/api/projects/project-1/export/preview",
      body: { targetRelativePath: "exports/delivery" },
    });
    expect(exportPreview).toMatchObject({
      handled: true,
      status: 200,
      body: { result: { previewHash: expect.stringMatching(/^sha256:/) } },
    });
    const previewHash = exportPreview.body.result.previewHash;
    const exportCommit = await router({
      method: "POST",
      pathname: "/api/projects/project-1/export/commit",
      body: { previewHash },
    });
    expect(exportCommit).toMatchObject({
      handled: true,
      status: 200,
      body: { result: { previewHash, targetRelativePath: "exports/delivery" } },
    });

    expect(await router({ method: "GET", pathname: "/api/not-workbench" })).toEqual({ handled: false });
  });

  it("turns a transient mock prompt into a structured plan without retaining the prompt", async () => {
    const root = await projectRoot();
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const result = await router({
      method: "POST",
      pathname: "/api/projects/project-1/plans",
      body: { prompt: "make the private customer locations red" },
    });

    expect(result).toMatchObject({
      status: 201,
      body: {
        result: {
          plan: {
            goal: "Update layer styling for places",
            promptHash: expect.stringMatching(/^sha256:/),
            commands: [expect.objectContaining({ type: "setPaint", layerId: "places" })],
          },
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain("private customer locations");
  });

  it("reopens reviewed plans and export previews after the API router is recreated", async () => {
    const root = await projectRoot();
    const firstRouter = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const planned = await firstRouter({
      method: "POST",
      pathname: "/api/projects/project-1/plans",
      body: { prompt: "make the places red" },
    });
    const planHash = planned.body.result.planHash;

    const secondRouter = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const previewed = await secondRouter({
      method: "POST",
      pathname: `/api/projects/project-1/plans/${planHash}/preview`,
    });
    expect(previewed).toMatchObject({ status: 200, body: { result: { planHash } } });

    const exportPreview = await secondRouter({
      method: "POST",
      pathname: "/api/projects/project-1/export/preview",
      body: { targetRelativePath: "exports/reopen-check" },
    });
    const previewHash = exportPreview.body.result.previewHash;

    const thirdRouter = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const committed = await thirdRouter({
      method: "POST",
      pathname: "/api/projects/project-1/export/commit",
      body: { previewHash },
    });
    expect(committed).toMatchObject({ status: 200, body: { result: { previewHash } } });
    expect(
      await readFile(join(root, ".gis-engine", "exports", `${previewHash.slice(7)}.receipt.json`), "utf8"),
    ).toContain(previewHash);
  });

  it("rejects malformed artifact identifiers before reading project artifacts", async () => {
    const root = await projectRoot();
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const traversal = "../.gis-engine/exports/foreign";

    const apply = await router({
      method: "POST",
      pathname: "/api/projects/project-1/apply",
      body: {
        schemaVersion: "gis-engine.workbench.apply-request.v1",
        projectId: "project-1",
        planHash: traversal,
        baseRevision: "0",
      },
    });
    expect(apply).toMatchObject({
      status: 422,
      body: { diagnostics: [{ code: "WORKBENCH.UNSAFE_PATH", path: "/planHash" }] },
    });

    const commit = await router({
      method: "POST",
      pathname: "/api/projects/project-1/export/commit",
      body: { previewHash: traversal },
    });
    expect(commit).toMatchObject({
      status: 422,
      body: { diagnostics: [{ code: "WORKBENCH.UNSAFE_PATH", path: "/previewHash" }] },
    });

    // A well-formed but unknown identifier still takes the missing-artifact path.
    const unknown = await router({
      method: "POST",
      pathname: "/api/projects/project-1/apply",
      body: {
        schemaVersion: "gis-engine.workbench.apply-request.v1",
        projectId: "project-1",
        planHash: sha256("absent-plan"),
        baseRevision: "0",
      },
    });
    expect(unknown).toMatchObject({
      status: 404,
      body: { diagnostics: [{ code: "WORKBENCH.PLAN_HASH_MISMATCH" }] },
    });
  });

  it("rejects a persisted export preview whose content no longer matches its hash", async () => {
    const root = await projectRoot();
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const previewed = await router({
      method: "POST",
      pathname: "/api/projects/project-1/export/preview",
      body: { targetRelativePath: "exports/tamper-check" },
    });
    const previewHash = String((previewed.body as { result: { previewHash: string } }).result.previewHash);
    const artifactPath = join(root, ".gis-engine", "exports", `${previewHash.slice(7)}.preview.json`);
    const tampered = JSON.parse(await readFile(artifactPath, "utf8"));
    tampered.baseRevision = "9";
    await writeFile(artifactPath, `${JSON.stringify(tampered, null, 2)}\n`, "utf8");

    const reopened = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });
    const committed = await reopened({
      method: "POST",
      pathname: "/api/projects/project-1/export/commit",
      body: { previewHash },
    });

    expect(committed).toMatchObject({
      status: 409,
      body: { diagnostics: [{ code: "WORKBENCH.EXPORT_PREVIEW_MISMATCH", path: "/previewHash" }] },
    });
    await expect(readFile(join(root, "exports", "tamper-check", "package.json"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("validates attachment evidence before the project or data directory can change", async () => {
    const root = await projectRoot();
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => "not-an-iso-timestamp" });
    const value = initialSpec().sources.places.data;

    const attached = await router({
      method: "POST",
      pathname: "/api/projects/project-1/data/attach",
      body: { kind: "geojson", value, sourceId: "cities", fileName: "cities.geojson", baseRevision: "0" },
    });

    expect(attached.status).toBe(409);
    expect((await openWorkbenchProject(root)).project.currentRevision).toBe("0");
    await expect(readFile(join(root, "data", "cities.geojson"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("turns a server-held OpenAI-compatible response into a structured plan", async () => {
    const root = await mkdtemp(join(tmpdir(), "gis-engine-workbench-provider-"));
    roots.push(root);
    await createWorkbenchProject(
      {
        root,
        id: "project-1",
        name: "Places",
        initialSpec: initialSpec(),
        provider: { kind: "openai-compatible", profileId: "deepseek", model: "fixture-model" },
      },
      { now: () => createdAt },
    );
    const call = vi.fn(async () => ({
      ok: true,
      providerOutput: {
        providerId: "deepseek",
        action: "setPaint",
        layerId: "places",
        paint: { "circle-color": "#dc2626" },
        providerBody: "must-not-be-retained",
      },
    }));
    const router = createWorkbenchApiRouter({
      projectRoot: root,
      now: () => createdAt,
      openAiProvider: {
        profile: { id: "deepseek", baseUrl: "https://example.invalid", model: "fixture-model" },
        apiKey: "sk-test",
        call,
      },
    });

    const result = await router({
      method: "POST",
      pathname: "/api/projects/project-1/plans",
      body: { prompt: "make the private customer locations red" },
    });

    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({ message: "make the private customer locations red", apiKey: "sk-test" }),
    );
    expect(result).toMatchObject({
      status: 201,
      body: {
        result: {
          plan: {
            promptHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
            commands: [expect.objectContaining({ type: "setPaint", layerId: "places" })],
          },
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain("private customer locations");
    expect(JSON.stringify(result)).not.toContain("must-not-be-retained");
    expect(JSON.stringify(result)).not.toContain("sk-test");
  });

  it("blocks an unconfigured server-held provider with a stable diagnostic", async () => {
    const root = await mkdtemp(join(tmpdir(), "gis-engine-workbench-provider-missing-"));
    roots.push(root);
    await createWorkbenchProject(
      {
        root,
        id: "project-1",
        name: "Places",
        initialSpec: initialSpec(),
        provider: { kind: "openai-compatible", profileId: "deepseek", model: "fixture-model" },
      },
      { now: () => createdAt },
    );
    const router = createWorkbenchApiRouter({ projectRoot: root, now: () => createdAt });

    expect(
      await router({
        method: "POST",
        pathname: "/api/projects/project-1/plans",
        body: { prompt: "make the points red" },
      }),
    ).toMatchObject({
      status: 422,
      body: { ok: false, diagnostics: [{ code: "WORKBENCH.PROVIDER_UNAVAILABLE", path: "/provider" }] },
    });
  });
});
