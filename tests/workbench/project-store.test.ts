import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyWorkbenchProject,
  createWorkbenchProject,
  exportLegacyWorkbenchProjects,
  openWorkbenchProject,
  replayWorkbenchProject,
  restoreWorkbenchRevision,
} from "../../apps/workbench/server/project-store.mjs";
import { resetStoreForTests, saveMap } from "../../apps/workbench/server/store.mjs";

const createdAt = "2026-08-19T00:00:00.000Z";
const planHash = `sha256:${"a".repeat(64)}`;
const tempRoots: string[] = [];

function initialSpec() {
  return {
    version: "0.1",
    id: "earthquakes",
    revision: "0",
    view: { mode: "map2d", center: [120, 30], zoom: 8 },
    sources: {
      earthquakes: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
    },
    layers: [
      {
        id: "earthquakes",
        type: "circle",
        source: "earthquakes",
        paint: { "circle-color": "#2563eb" },
      },
    ],
  };
}

async function createTempRoot(prefix = "gis-engine-workbench-project-") {
  const root = await mkdtemp(join(tmpdir(), prefix));
  tempRoots.push(root);
  return root;
}

async function fileDigest(path: string) {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

afterEach(async () => {
  resetStoreForTests();
  delete process.env.WORKBENCH_DB_PATH;
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Workbench file-backed project store", () => {
  it("creates canonical files and reopens the project without SQLite", async () => {
    const root = await createTempRoot();

    const created = await createWorkbenchProject(
      { root, id: "project-1", name: "Earthquake review", initialSpec: initialSpec() },
      { now: () => createdAt },
    );
    const reopened = await openWorkbenchProject(root);

    expect(created.project.currentRevision).toBe("0");
    expect(JSON.parse(await readFile(join(root, "gis-engine.project.json"), "utf8"))).toEqual(created.project);
    expect(JSON.parse(await readFile(join(root, "mapspec.json"), "utf8"))).toEqual(initialSpec());
    expect(reopened).toMatchObject({ project: created.project, spec: initialSpec() });
    expect(reopened.history).toEqual([
      expect.objectContaining({ revision: "0", previousRevision: null, kind: "create" }),
    ]);
  });

  it("refuses to overwrite an existing file-backed project", async () => {
    const root = await createTempRoot();
    await createWorkbenchProject(
      { root, id: "project-1", name: "Earthquake review", initialSpec: initialSpec() },
      { now: () => createdAt },
    );
    const projectPath = join(root, "gis-engine.project.json");
    const specPath = join(root, "mapspec.json");
    const before = [await fileDigest(projectPath), await fileDigest(specPath)];

    await expect(
      createWorkbenchProject({
        root,
        id: "project-2",
        name: "Replacement",
        initialSpec: { ...initialSpec(), id: "replacement" },
      }),
    ).rejects.toMatchObject({
      diagnostics: [{ code: "WORKBENCH.REVISION_CONFLICT" }],
    });
    expect([await fileDigest(projectPath), await fileDigest(specPath)]).toEqual(before);
  });

  it("rejects stale revisions without changing canonical files", async () => {
    const root = await createTempRoot();
    await createWorkbenchProject(
      { root, id: "project-1", name: "Earthquake review", initialSpec: initialSpec() },
      { now: () => createdAt },
    );
    const applied = await applyWorkbenchProject(
      root,
      {
        baseRevision: "0",
        planHash,
        commands: [
          {
            id: "paint-red",
            version: "0.1",
            type: "setPaint",
            layerId: "earthquakes",
            paint: { "circle-color": "#dc2626" },
          },
        ],
      },
      { now: () => "2026-08-19T00:01:00.000Z" },
    );
    expect(applied.ok).toBe(true);

    const projectPath = join(root, "gis-engine.project.json");
    const specPath = join(root, "mapspec.json");
    const before = [await fileDigest(projectPath), await fileDigest(specPath)];
    const conflict = await applyWorkbenchProject(root, {
      baseRevision: "0",
      planHash,
      commands: [],
    });

    expect(conflict).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.REVISION_CONFLICT", path: "/baseRevision" }],
    });
    expect([await fileDigest(projectPath), await fileDigest(specPath)]).toEqual(before);
  });

  it("keeps the original state when an atomic command batch fails", async () => {
    const root = await createTempRoot();
    await createWorkbenchProject(
      { root, id: "project-1", name: "Earthquake review", initialSpec: initialSpec() },
      { now: () => createdAt },
    );
    const before = await openWorkbenchProject(root);

    const result = await applyWorkbenchProject(root, {
      baseRevision: "0",
      planHash,
      commands: [
        {
          id: "paint-red",
          version: "0.1",
          type: "setPaint",
          layerId: "earthquakes",
          paint: { "circle-color": "#dc2626" },
        },
        {
          id: "remove-live-source",
          version: "0.1",
          type: "removeSource",
          sourceId: "earthquakes",
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("transaction unexpectedly succeeded");
    expect(result.diagnostics[0]).toMatchObject({ code: "WORKBENCH.TRANSACTION_FAILED" });
    expect(result.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "SRC.NOT_FOUND" })]));
    expect(await openWorkbenchProject(root)).toEqual(before);
  });

  it("restores through commands into a new revision and replays the audited history", async () => {
    const root = await createTempRoot();
    await createWorkbenchProject(
      { root, id: "project-1", name: "Earthquake review", initialSpec: initialSpec() },
      { now: () => createdAt },
    );
    const applied = await applyWorkbenchProject(root, {
      baseRevision: "0",
      planHash,
      commands: [
        {
          id: "paint-red",
          version: "0.1",
          type: "setPaint",
          layerId: "earthquakes",
          paint: { "circle-color": "#dc2626" },
        },
      ],
    });
    expect(applied.ok).toBe(true);

    const restored = await restoreWorkbenchRevision(root, {
      baseRevision: "1",
      targetRevision: "0",
    });
    expect(restored.ok).toBe(true);
    if (!restored.ok) throw new Error("restore failed");
    expect(Number(restored.result.revision)).toBeGreaterThan(1);

    const reopened = await openWorkbenchProject(root);
    expect(reopened.spec.layers[0]?.paint).toEqual({ "circle-color": "#2563eb" });
    expect(reopened.history.at(-1)).toMatchObject({
      revision: restored.result.revision,
      previousRevision: "1",
      kind: "restore",
      restoredFromRevision: "0",
    });
    expect(await replayWorkbenchProject(root)).toEqual({ ok: true, spec: reopened.spec });
  });

  it("exports legacy SQLite rows without mutating the source database", async () => {
    const root = await createTempRoot("gis-engine-workbench-legacy-");
    const dbPath = join(root, "studio.sqlite");
    process.env.WORKBENCH_DB_PATH = dbPath;
    resetStoreForTests();
    await saveMap({
      id: "legacy-1",
      name: "Legacy map",
      spec: initialSpec(),
      revision: "0",
      basemapId: "none",
    });
    resetStoreForTests();
    delete process.env.WORKBENCH_DB_PATH;

    const before = await fileDigest(dbPath);
    const exported = await exportLegacyWorkbenchProjects(dbPath);

    expect(exported).toEqual([
      expect.objectContaining({ id: "legacy-1", name: "Legacy map", revision: "0", spec: initialSpec() }),
    ]);
    expect(await fileDigest(dbPath)).toBe(before);
  });
});
