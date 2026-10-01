import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeMapProjectDelivery } from "@gis-engine/cli";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { makeTempDir, mustFindFile, mustGetTemplate, pmtilesPreflightSpec, removeTempDir } from "./helpers.ts";

const QUOTE_NAME = 'Cities "2026"';
const MIXED_NAME = 'Cities "2026" \\ C:\\data\nnext';

function parseErrors(source: string, fileName: string): string[] {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const diagnostics = (file as unknown as { parseDiagnostics: readonly ts.DiagnosticMessage[] }).parseDiagnostics;
  return diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
}

describe("hostile project name escaping", () => {
  it("generates parseable src/main.ts from the vite-ts template", () => {
    const files = mustGetTemplate("vite-ts").generate({
      projectName: MIXED_NAME,
      provider: "mock",
      cliVersion: "1.5.0",
    });
    const mainFile = mustFindFile(files, "src/main.ts");
    expect(parseErrors(mainFile.content, "main.ts")).toEqual([]);
  });

  it("generates parseable inline scripts from the static-html template", () => {
    const files = mustGetTemplate("static-html").generate({
      projectName: QUOTE_NAME,
      provider: "mock",
      cliVersion: "1.5.0",
    });
    const indexHtml = mustFindFile(files, "index.html").content;
    const script = indexHtml.match(/<script type="module">([\s\S]*?)<\/script>/);
    expect(script, "inline module script missing").not.toBeNull();
    expect(parseErrors(script?.[1] ?? "", "index.html")).toEqual([]);
  });

  it("keeps script-closing project names inside the static-html module string", () => {
    const files = mustGetTemplate("static-html").generate({
      projectName: "</script><script>globalThis.__gisNameInjected = true</script>",
      provider: "mock",
      cliVersion: "1.5.0",
    });
    const indexHtml = mustFindFile(files, "index.html").content;
    expect(indexHtml.match(/<script\b/gi)).toHaveLength(1);
    expect(indexHtml.match(/<\/script>/gi)).toHaveLength(1);
    const script = indexHtml.match(/<script type="module">([\s\S]*?)<\/script>/);
    expect(script).not.toBeNull();
    expect(parseErrors(script?.[1] ?? "", "index.html")).toEqual([]);
    expect(script?.[1]).toContain("\\u003c/script>");
  });

  it("escapes the project name in generated HTML titles", () => {
    for (const templateName of ["static-html", "vite-ts"] as const) {
      const files = mustGetTemplate(templateName).generate({
        projectName: QUOTE_NAME,
        provider: "mock",
        cliVersion: "1.5.0",
      });
      const indexHtml = mustFindFile(files, "index.html").content;
      expect(indexHtml, templateName).toContain("Cities &quot;2026&quot;");
      expect(indexHtml, templateName).not.toMatch(/<title>[^<]*"[^<]*<\/title>/);
    }
  });

  it("writes a parseable delivery package entry for hostile project names", () => {
    const dir = makeTempDir("gis-engine-delivery-escape-");
    try {
      writeMapProjectDelivery({
        outputDir: dir,
        projectName: MIXED_NAME,
        spec: pmtilesPreflightSpec(),
        generatedAt: "2026-10-01T00:00:00.000Z",
      });
      const main = readFileSync(join(dir, "src/main.ts"), "utf8");
      expect(parseErrors(main, "main.ts")).toEqual([]);
    } finally {
      removeTempDir(dir);
    }
  });
});
