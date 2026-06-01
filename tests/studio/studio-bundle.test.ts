import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
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
});
