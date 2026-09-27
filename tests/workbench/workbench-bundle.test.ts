import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));

function readRepoFile(path: string): string {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("GIS Engine Workbench bundle", () => {
  it("keeps MapLibre out of the initial HTML preload chain", () => {
    const html = readRepoFile("apps/workbench/dist/index.html");
    expect(html).not.toMatch(/modulepreload[^>]+maplibre/i);
    expect(html).not.toMatch(/stylesheet[^>]+maplibre/i);

    const entryMatch = html.match(/src="\/assets\/([^"]+\.js)"/);
    expect(entryMatch?.[1]).toBeTruthy();

    const entrySource = readRepoFile(`apps/workbench/dist/assets/${entryMatch?.[1]}`);
    expect(entrySource).not.toMatch(/import\s*["']\.\/maplibre/i);
    expect(entrySource).toMatch(/import\("\.\/maplibre-gl-/);
  });

  it("keeps the MapStage renderer import runtime-only", () => {
    const mapStageSource = readRepoFile("apps/workbench/src/components/MapStage.tsx");
    expect(mapStageSource).not.toMatch(/^import\s+(?!type\b).*from "maplibre-gl";$/m);
    expect(mapStageSource).not.toMatch(/^import\s+"maplibre-gl\/dist\/maplibre-gl\.css";$/m);
    expect(mapStageSource).toContain('import("maplibre-gl")');
  });

  it("keeps the MapSpec and renderer foundations available to Workbench", () => {
    const mapSpecEditorSource = readRepoFile("apps/workbench/src/components/MapSpecEditor.tsx");
    const templatesSource = readRepoFile("apps/workbench/src/templates/index.ts");
    const appSource = readRepoFile("apps/workbench/src/App.tsx");

    // ── MapSpecEditor: JSON editor with diagnostics ──
    expect(mapSpecEditorSource).toContain("MAPSPEC");
    expect(mapSpecEditorSource).toContain("Format");
    expect(mapSpecEditorSource).toContain("Format JSON");
    expect(mapSpecEditorSource).toContain("ValidationDiagnostic");
    expect(mapSpecEditorSource).toContain("errorCount");
    expect(mapSpecEditorSource).toContain("warningCount");
    expect(mapSpecEditorSource).toContain("line-numbers");

    // ── Templates registry: all built-in templates ──
    expect(templatesSource).toContain("basicMapTemplate");
    expect(templatesSource).toContain("choroplethMapTemplate");
    expect(templatesSource).toContain("heatmapMapTemplate");
    expect(templatesSource).toContain("multiLayerMapTemplate");
    expect(templatesSource).toContain("ALL_TEMPLATES");
    expect(templatesSource).toContain("MapSpecTemplate");

    expect(appSource).toContain("Workbench");
    expect(appSource).toContain("CenterWorkspace");
    expect(appSource).toContain("ProjectRail");
    expect(appSource).toContain("TaskInspector");
    expect(appSource).toContain("preview");
  });

  it("ships the Workbench engineering workspace and reviewed golden path", () => {
    const appSource = readRepoFile("apps/workbench/src/App.tsx");
    const projectRail = readRepoFile("apps/workbench/src/components/ProjectRail.tsx");
    const centerWorkspace = readRepoFile("apps/workbench/src/components/CenterWorkspace.tsx");
    const taskInspector = readRepoFile("apps/workbench/src/components/TaskInspector.tsx");
    const progressTrack = readRepoFile("apps/workbench/src/components/ProgressTrack.tsx");

    expect(projectRail).toContain("Data sources");
    expect(projectRail).toContain("Layers");
    expect(projectRail).toContain("History");
    expect(centerWorkspace).toContain("MapSpec");
    expect(centerWorkspace).toContain("Files");
    expect(taskInspector).toContain("AI plan");
    expect(taskInspector).toContain("Diff");
    expect(taskInspector).toContain("Diagnostics");
    expect(taskInspector).toContain("Export");
    expect(progressTrack).toContain("Create project");
    expect(progressTrack).toContain("Inspect data");
    expect(progressTrack).toContain("Review plan");
    expect(progressTrack).toContain("Export app");

    expect(appSource).toContain("/api/projects/current");
    expect(appSource).toContain("/data/inspect");
    expect(appSource).toContain("/plans");
    expect(appSource).toContain("/preview");
    expect(appSource).toContain("/apply");
    expect(appSource).toContain("/restore");
    expect(appSource).toContain("/export/preview");
    expect(appSource).toContain("/export/commit");
    expect(taskInspector).toContain("Abandon plan");
    expect(taskInspector).toContain("Apply plan");
  });
});
