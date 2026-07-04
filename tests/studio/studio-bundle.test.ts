import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));

function readRepoFile(path: string): string {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("AI Map Studio bundle", () => {
  it("keeps MapLibre out of the initial HTML preload chain", () => {
    const html = readRepoFile("apps/studio/dist/index.html");
    expect(html).not.toMatch(/modulepreload[^>]+maplibre/i);
    expect(html).not.toMatch(/stylesheet[^>]+maplibre/i);

    const entryMatch = html.match(/src="\/assets\/([^"]+\.js)"/);
    expect(entryMatch?.[1]).toBeTruthy();

    const entrySource = readRepoFile(`apps/studio/dist/assets/${entryMatch?.[1]}`);
    expect(entrySource).not.toMatch(/import\s*["']\.\/maplibre/i);
    expect(entrySource).toMatch(/import\("\.\/maplibre-gl-/);
  });

  it("keeps the MapStage renderer import runtime-only", () => {
    const mapStageSource = readRepoFile("apps/studio/src/components/MapStage.tsx");
    expect(mapStageSource).not.toMatch(/^import\s+(?!type\b).*from "maplibre-gl";$/m);
    expect(mapStageSource).not.toMatch(/^import\s+"maplibre-gl\/dist\/maplibre-gl\.css";$/m);
    expect(mapStageSource).toContain('import("maplibre-gl")');
  });

  it("keeps the Playground components and integration wiring intact", () => {
    const mapSpecEditorSource = readRepoFile("apps/studio/src/components/MapSpecEditor.tsx");
    const aiAssistantSource = readRepoFile("apps/studio/src/components/AIAssistant.tsx");
    const templateBarSource = readRepoFile("apps/studio/src/components/TemplateBar.tsx");
    const templatesSource = readRepoFile("apps/studio/src/templates/index.ts");
    const appSource = readRepoFile("apps/studio/src/App.tsx");

    // ── MapSpecEditor: JSON editor with diagnostics ──
    expect(mapSpecEditorSource).toContain("MAPSPEC");
    expect(mapSpecEditorSource).toContain("Format");
    expect(mapSpecEditorSource).toContain("Format JSON");
    expect(mapSpecEditorSource).toContain("ValidationDiagnostic");
    expect(mapSpecEditorSource).toContain("errorCount");
    expect(mapSpecEditorSource).toContain("warningCount");
    expect(mapSpecEditorSource).toContain("line-numbers");

    // ── AIAssistant: chat panel with quick actions ──
    expect(aiAssistantSource).toContain("AI ASSISTANT");
    expect(aiAssistantSource).toContain("QUICK_ACTIONS");
    expect(aiAssistantSource).toContain("Validate");
    expect(aiAssistantSource).toContain("Explain");
    expect(aiAssistantSource).toContain("Optimize");
    expect(aiAssistantSource).toContain("Diagnostics");
    expect(aiAssistantSource).toContain("Send");
    expect(aiAssistantSource).toContain("Ask AI about your map");

    // ── TemplateBar: template selector strip ──
    expect(templateBarSource).toContain("Templates");
    expect(templateBarSource).toContain("MapSpecTemplate");
    expect(templateBarSource).toContain("activeTemplateId");
    expect(templateBarSource).toContain("onSelect");

    // ── Templates registry: all built-in templates ──
    expect(templatesSource).toContain("basicMapTemplate");
    expect(templatesSource).toContain("choroplethMapTemplate");
    expect(templatesSource).toContain("heatmapMapTemplate");
    expect(templatesSource).toContain("multiLayerMapTemplate");
    expect(templatesSource).toContain("ALL_TEMPLATES");
    expect(templatesSource).toContain("MapSpecTemplate");

    // ── App.tsx: Playground integration wiring ──
    expect(appSource).toContain("MapSpec Playground");
    expect(appSource).toContain("GIS ENGINE");
    expect(appSource).toContain('fetch("/api/state")');
    expect(appSource).toContain('fetch("/api/chat"');
    expect(appSource).toContain('fetch("/api/providers")');
    expect(appSource).toContain('fetch("/api/basemaps")');
    expect(appSource).toContain("MapSpecEditor");
    expect(appSource).toContain("AIAssistant");
    expect(appSource).toContain("TemplateBar");
    expect(appSource).toContain("MapStage");
    expect(appSource).toContain("ALL_TEMPLATES");
    expect(appSource).toContain("handleSelectTemplate");
    expect(appSource).toContain("sendMessage");
    expect(appSource).toContain("previewSpec");
    expect(appSource).toContain("editorDiagnostics");
    expect(appSource).toContain("chatMode");
  });
});
