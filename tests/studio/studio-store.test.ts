import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createInitialSpec } from "../../apps/studio/server/index.mjs";
import { deleteMap, listMaps, loadMap, resetStoreForTests, saveMap } from "../../apps/studio/server/store.mjs";

let tempDir = "";
let dbPath = "";

describe("Studio store persistence", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "studio-store-"));
    dbPath = join(tempDir, "studio.sqlite");
    process.env.STUDIO_DB_PATH = dbPath;
    resetStoreForTests();
  });

  afterEach(async () => {
    resetStoreForTests();
    delete process.env.STUDIO_DB_PATH;
    await rm(tempDir, { recursive: true, force: true });
  });

  it("persists saved maps across store reloads", async () => {
    const spec = createInitialSpec();
    spec.revision = "7";
    const auditRecords = [
      {
        recordVersion: "studio.audit.v1",
        id: "studio.test.1",
        sessionId: "studio.test",
        timestamp: "2026-06-03T00:00:00Z",
        status: "applied",
        providerId: "mock-ai",
        commandCount: 1,
        diagnosticCounts: { error: 0, warning: 0, info: 0 },
        fromRevision: "6",
        toRevision: "7",
      },
    ];
    const reviewDecisions = [
      {
        recordVersion: "studio.review.v1",
        decisionId: "review-1",
        createdAt: "2026-06-03T00:01:00Z",
        projectId: "project_studio",
        sessionId: "studio.test",
        auditRecordId: "studio.test.1",
        outcome: "accepted",
        providerId: "mock-ai",
        deliveryStatus: "applied",
        commandEvidence: {
          commandCount: 1,
          committed: true,
          rolledBack: false,
          failed: false,
          changedPathCount: 1,
        },
        diagnosticCounts: { error: 0, warning: 0, info: 0 },
        reasonCodes: ["review-accepted"],
      },
    ];

    await saveMap({
      id: spec.id,
      name: "Durable Studio Map",
      spec,
      revision: spec.revision,
      basemapId: "osm",
      auditRecords,
      reviewDecisions,
    });
    resetStoreForTests();

    const loaded = await loadMap(spec.id);
    expect(loaded).toMatchObject({
      id: spec.id,
      name: "Durable Studio Map",
      revision: "7",
      basemapId: "osm",
      auditRecordCount: 1,
      reviewDecisionCount: 1,
      spec: expect.objectContaining({
        id: spec.id,
        revision: "7",
      }),
      auditRecords,
      reviewDecisions,
    });

    const maps = await listMaps();
    expect(maps).toEqual([
      expect.objectContaining({
        id: spec.id,
        name: "Durable Studio Map",
        revision: "7",
        basemapId: "osm",
        auditRecordCount: 1,
        reviewDecisionCount: 1,
      }),
    ]);
  });

  it("deletes persisted maps after a reload", async () => {
    const spec = createInitialSpec();

    await saveMap({
      id: spec.id,
      name: "Delete Me",
      spec,
      revision: spec.revision,
    });
    resetStoreForTests();
    await deleteMap(spec.id);
    resetStoreForTests();

    expect(await loadMap(spec.id)).toBeNull();
    expect(await listMaps()).toEqual([]);
  });
});
