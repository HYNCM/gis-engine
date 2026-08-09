import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const generatedMarkdown = new Set([
  "docs/planning/AGENT_HEALTH_DASHBOARD.md",
  "docs/planning/issues-snapshot.md",
  "docs/reviews/doc-link-audit.md",
]);

function trackedFiles(pattern: string): string[] {
  return execFileSync("git", ["ls-files", pattern], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);
}

function readRepoFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function lineCount(path: string): number {
  return readRepoFile(path).split(/\r?\n/).length;
}

function wordCount(path: string): number {
  return readRepoFile(path).trim().split(/\s+/).filter(Boolean).length;
}

function handwrittenMarkdown(): string[] {
  return trackedFiles("*.md").filter(
    (path) =>
      (path === "README.md" || path.startsWith("docs/") || path.endsWith("/README.md")) &&
      !path.startsWith(".changeset/") &&
      !path.startsWith("docs/website/api/reference/") &&
      path !== "CHANGELOG.md" &&
      !generatedMarkdown.has(path),
  );
}

describe("documentation minimalism", () => {
  it("audits every relative Markdown link", async () => {
    const { extractRelativeMarkdownLinks } = await import("../../scripts/doc-generator.mjs");

    expect(
      extractRelativeMarkdownLinks(
        "[same](./guide.md#run) [parent](../README.md) [web](https://example.com) [anchor](#run)",
      ),
    ).toEqual([
      { label: "same", target: "./guide.md" },
      { label: "parent", target: "../README.md" },
    ]);
  });

  it("keeps every active README below 500 words", () => {
    const oversized = trackedFiles("*README.md")
      .filter((path) => !path.startsWith("docs/archive/"))
      .map((path) => ({ path, words: wordCount(path) }))
      .filter(({ words }) => words >= 500);

    expect(oversized).toEqual([]);
  });

  it("keeps historical prose in Git instead of an in-tree archive", () => {
    expect(trackedFiles("docs/archive/*.md")).toEqual([]);
    expect(readRepoFile("scripts/evolution-pattern-extractor.mjs")).not.toContain("docs/archive");
  });

  it("keeps one canonical copy of each handwritten document", () => {
    const hashes = new Map<string, string[]>();
    for (const path of handwrittenMarkdown()) {
      const hash = createHash("sha256").update(readRepoFile(path)).digest("hex");
      hashes.set(hash, [...(hashes.get(hash) ?? []), path]);
    }

    const duplicates = [...hashes.values()].filter((paths) => paths.length > 1);
    expect(duplicates).toEqual([]);
  });

  it("keeps handwritten documentation at or below 20 percent of code", () => {
    const codeFiles = ["*.ts", "*.tsx", "*.mjs", "*.js"].flatMap(trackedFiles);
    const documentationLines = handwrittenMarkdown().reduce((total, path) => total + lineCount(path), 0);
    const codeLines = codeFiles.reduce((total, path) => total + lineCount(path), 0);

    expect(documentationLines / codeLines).toBeLessThanOrEqual(0.2);
  });
});
