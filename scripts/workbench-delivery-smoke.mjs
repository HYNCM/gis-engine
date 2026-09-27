#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { commitWorkbenchExport, previewWorkbenchExport } from "../apps/workbench/server/export-service.mjs";
import { createWorkbenchProject } from "../apps/workbench/server/project-store.mjs";
import { verifyArtifacts } from "../packages/cli/dist/index.js";

const generatedAt = new Date().toISOString();
const root = await mkdtemp(join(tmpdir(), "gis-engine-workbench-delivery-"));

try {
  await createWorkbenchProject(
    {
      root,
      id: "delivery-project",
      name: "Workbench Delivery Smoke",
      initialSpec: {
        version: "0.1",
        id: "delivery-map",
        revision: "0",
        view: { mode: "map2d", center: [120.8, 30.75], zoom: 6 },
        sources: {
          points: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                { type: "Feature", geometry: { type: "Point", coordinates: [121.47, 31.23] }, properties: {} },
              ],
            },
          },
        },
        layers: [{ id: "points-layer", type: "circle", source: "points", paint: { "circle-color": "#2563eb" } }],
      },
      provider: { kind: "mock" },
    },
    { now: () => generatedAt },
  );

  const preview = await previewWorkbenchExport(
    root,
    { targetRelativePath: "exports/delivery" },
    { now: () => generatedAt },
  );
  if (!preview.ok) throw new Error(JSON.stringify(preview));
  if (preview.result.diagnostics.length > 0)
    throw new Error(`Export preview diagnostics: ${JSON.stringify(preview.result.diagnostics)}`);

  const committed = await commitWorkbenchExport(
    root,
    preview.result,
    { previewHash: preview.result.previewHash },
    { now: () => generatedAt },
  );
  if (!committed.ok) throw new Error(JSON.stringify(committed));
  const projectDir = join(root, "exports/delivery");
  const verification = verifyArtifacts({ projectDir });
  if (!verification.ok || verification.summary?.hashMismatchCount !== 0) {
    throw new Error(`Artifact verification failed: ${JSON.stringify(verification)}`);
  }

  const packageJsonPath = join(projectDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const engineTarball = execFileSync("pnpm", ["--dir", "packages/engine", "pack", "--pack-destination", root], {
    cwd: process.cwd(),
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .findLast((line) => line.endsWith(".tgz"));
  if (!engineTarball) throw new Error("Could not locate the packed engine tarball.");
  packageJson.dependencies["@gis-engine/engine"] = `file:${engineTarball}`;
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  execFileSync("npm", ["install", "--ignore-scripts"], { cwd: projectDir, stdio: "inherit" });
  execFileSync("npm", ["run", "build"], { cwd: projectDir, stdio: "inherit" });
  const preflight = JSON.parse(
    execFileSync("node", ["packages/cli/dist/bin.js", "--preflight", join(projectDir, "mapspec.json"), "--json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }),
  );
  if (preflight.ok !== true || preflight.status !== "ready")
    throw new Error(`Preflight failed: ${JSON.stringify(preflight)}`);

  const retained = await findSensitiveText(projectDir, [
    "private customer",
    "OPENAI_API_KEY",
    "sk-test",
    "providerBody",
  ]);
  if (retained.length > 0) throw new Error(`Export retained sensitive text: ${retained.join(", ")}`);
  console.log(
    JSON.stringify({
      ok: true,
      projectDir,
      fileCount: committed.result.writtenFiles.length,
      manifestHash: committed.result.manifestHash,
    }),
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

async function findSensitiveText(directory, needles) {
  const matches = [];
  const visit = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      else {
        const content = await readFile(path, "utf8");
        if (needles.some((needle) => content.includes(needle))) matches.push(path);
      }
    }
  };
  await visit(directory);
  return matches;
}
