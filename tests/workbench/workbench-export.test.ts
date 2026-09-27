import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyArtifacts } from "@gis-engine/cli";
import { afterEach, describe, expect, it } from "vitest";
import { commitWorkbenchExport, previewWorkbenchExport } from "../../apps/workbench/server/export-service.mjs";
import { createWorkbenchProject } from "../../apps/workbench/server/project-store.mjs";

const roots: string[] = [];
const now = () => "2026-08-19T01:00:00.000Z";

function spec() {
  return {
    version: "0.1",
    id: "delivery-map",
    revision: "0",
    view: { mode: "map2d", center: [0, 0], zoom: 2 },
    sources: {
      points: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
    },
    layers: [{ id: "points", type: "circle", source: "points" }],
  };
}

async function projectRoot() {
  const root = await mkdtemp(join(tmpdir(), "gis-engine-workbench-export-"));
  roots.push(root);
  await createWorkbenchProject({ root, id: "project-1", name: "Delivery Map", initialSpec: spec() }, { now });
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Workbench confirmed export", () => {
  it("previews a standard project without writing the selected target", async () => {
    const root = await projectRoot();
    await writeFile(join(root, ".env"), "OPENAI_API_KEY=secret-value\nRAW_PROMPT=private customer locations\n");

    const result = await previewWorkbenchExport(root, { targetRelativePath: "exports/delivery-map" }, { now });

    expect(result).toMatchObject({
      ok: true,
      result: {
        schemaVersion: "gis-engine.workbench.export-preview.v1",
        projectId: "project-1",
        targetRelativePath: "exports/delivery-map",
        previewHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        preflightCommands: ["pnpm install", "pnpm build"],
        files: expect.arrayContaining([
          expect.objectContaining({ path: "package.json", collision: false }),
          expect.objectContaining({ path: "mapspec.json", collision: false }),
          expect.objectContaining({ path: "artifact-manifest.json", collision: false }),
          expect.objectContaining({ path: ".env.example", collision: false }),
        ]),
      },
    });
    await expect(readFile(join(root, "exports/delivery-map/package.json"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(JSON.stringify(result)).not.toContain("secret-value");
    expect(JSON.stringify(result)).not.toContain("private customer locations");
  });

  it("reports collisions and refuses to overwrite an existing target", async () => {
    const root = await projectRoot();
    await mkdir(join(root, "exports/delivery-map"), { recursive: true });
    await writeFile(join(root, "exports/delivery-map/package.json"), "user-owned\n");

    const preview = await previewWorkbenchExport(root, { targetRelativePath: "exports/delivery-map" }, { now });
    expect(preview).toMatchObject({
      ok: true,
      result: {
        files: expect.arrayContaining([expect.objectContaining({ path: "package.json", collision: true })]),
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: "WORKBENCH.EXPORT_COLLISION" })]),
      },
    });
    if (!preview.ok) throw new Error("preview failed");
    expect(
      await commitWorkbenchExport(root, preview.result, { previewHash: preview.result.previewHash }, { now }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.EXPORT_COLLISION" }],
    });
    expect(await readFile(join(root, "exports/delivery-map/package.json"), "utf8")).toBe("user-owned\n");
  });

  it("rejects path traversal and a mismatched preview confirmation", async () => {
    const root = await projectRoot();
    expect(await previewWorkbenchExport(root, { targetRelativePath: "../escaped" }, { now })).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.UNSAFE_PATH" }],
    });

    const preview = await previewWorkbenchExport(root, { targetRelativePath: "exports/delivery-map" }, { now });
    if (!preview.ok) throw new Error("preview failed");
    expect(
      await commitWorkbenchExport(root, preview.result, { previewHash: `sha256:${"f".repeat(64)}` }, { now }),
    ).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.EXPORT_PREVIEW_MISMATCH" }],
    });
  });

  it("rejects export paths whose ancestor is a symbolic link", async () => {
    const root = await projectRoot();
    const outside = await mkdtemp(join(tmpdir(), "gis-engine-workbench-export-outside-"));
    roots.push(outside);
    await symlink(outside, join(root, "linked-export"));

    expect(await previewWorkbenchExport(root, { targetRelativePath: "linked-export/app" }, { now })).toMatchObject({
      ok: false,
      diagnostics: [{ code: "WORKBENCH.UNSAFE_PATH" }],
    });
  });

  it("writes only after confirmation and returns a verifiable receipt", async () => {
    const root = await projectRoot();
    const preview = await previewWorkbenchExport(root, { targetRelativePath: "exports/delivery-map" }, { now });
    if (!preview.ok) throw new Error("preview failed");

    const committed = await commitWorkbenchExport(
      root,
      preview.result,
      { previewHash: preview.result.previewHash },
      { now },
    );

    expect(committed).toMatchObject({
      ok: true,
      result: {
        schemaVersion: "gis-engine.workbench.export-receipt.v1",
        projectId: "project-1",
        previewHash: preview.result.previewHash,
        manifestHash: expect.stringMatching(/^sha256:/),
        writtenFiles: expect.arrayContaining([expect.objectContaining({ path: "artifact-manifest.json" })]),
      },
    });
    expect(verifyArtifacts({ projectDir: join(root, "exports/delivery-map") })).toMatchObject({
      ok: true,
      status: "verified",
    });
  });
});
