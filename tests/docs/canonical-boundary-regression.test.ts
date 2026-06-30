import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readText(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const canonicalBoundaryDocs = [
  {
    file: "README.md",
    required: [/core \+ extensions model/i, /reference implementation/i, /minimum\s+closed\s+loop/i],
  },
  {
    file: "AGENTS.md",
    required: [/core \+ extensions contract/i, /reference implementation/i, /minimum\s+closed\s+loop/i],
  },
  {
    file: "docs/architecture/core-framework.md",
    required: [
      /core \+ extensions/i,
      /核心\s*\/\s*扩展矩阵/i,
      /参考实现|reference implementation/i,
      /最小闭环|minimum\s+closed\s+loop/i,
    ],
  },
  {
    file: "docs/spec/contracts-and-interfaces.md",
    required: [
      /(core \+ extensions|core \+ extensions 的协议边界)/i,
      /核心\s*\/\s*扩展矩阵/i,
      /参考实现|reference implementation/,
      /最小\s*闭环|minimum\s+closed\s+loop/,
    ],
  },
  {
    file: "docs/design/design-limits-and-generalization-boundaries.md",
    required: [/core \+ extensions/i, /reference implementation/i, /minimum\s+closed\s+loop/i],
  },
  {
    file: "docs/intent/project-definition.md",
    required: [/core contract plus extension surface/i, /hard-coded model centered on the current 2D path/i],
  },
] as const;

const forbiddenDriftPatterns = [/2D-only/i, /workflow-only/i, /product-shape/i];

describe("canonical boundary copy", () => {
  it("keeps core + extensions wording aligned across the boundary docs", () => {
    for (const { file, required } of canonicalBoundaryDocs) {
      const text = readText(file);
      for (const pattern of required) {
        expect(text, `${file} should match ${pattern}`).toMatch(pattern);
      }
    }
  });

  it("rejects 2D-only, workflow-only, and product-shape drift in the boundary docs", () => {
    for (const { file } of canonicalBoundaryDocs) {
      const text = readText(file);
      for (const pattern of forbiddenDriftPatterns) {
        expect(text, `${file} should not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
