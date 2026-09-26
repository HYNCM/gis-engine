import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { canonicalHash, canonicalStringify } from "@gis-engine/engine/evidence";
import { describe, expect, it } from "vitest";

const ENGINE_SRC = "packages/engine/src";

describe("canonicalStringify", () => {
  it("is independent of key insertion order", () => {
    const a = canonicalStringify({ b: 1, a: { d: 2, c: 3 } });
    const b = canonicalStringify({ a: { c: 3, d: 2 }, b: 1 });

    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("keeps array order significant", () => {
    expect(canonicalStringify([1, 2])).not.toBe(canonicalStringify([2, 1]));
  });

  it("normalises undefined to null instead of dropping it silently", () => {
    expect(canonicalStringify(undefined)).toBe("null");
    expect(canonicalStringify({ a: undefined })).toBe('{"a":null}');
  });

  it("hashes equal-content objects identically regardless of key order", () => {
    expect(canonicalHash({ x: 1, y: "a" })).toBe(canonicalHash({ y: "a", x: 1 }));
    expect(canonicalHash({ x: 1 })).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

describe("hash convergence", () => {
  it("leaves no second canonical-stringify implementation in engine or ai", () => {
    const sources = ["packages/engine/src/sources/pmtiles-query.ts", "packages/ai/src/tools/generationEvidence.ts"];

    for (const path of sources) {
      const text = readFileSync(resolve(process.cwd(), path), "utf-8");
      expect(text).not.toMatch(/function stableStringify/);
      expect(text).not.toMatch(/createHash\("sha256"\)\.update\(JSON\.stringify/);
    }
  });
});

describe("browser-facing engine surface", () => {
  it("keeps node builtins out of every module the public root barrel reaches at runtime", () => {
    const queue = ["index.ts"];
    const visited = new Set<string>();
    const offenders: string[] = [];

    while (queue.length > 0) {
      const relativePath = queue.shift() as string;
      if (visited.has(relativePath)) continue;
      visited.add(relativePath);
      const file = resolve(ENGINE_SRC, relativePath);
      for (const specifier of runtimeDependencies(file)) {
        if (specifier.startsWith("node:")) {
          offenders.push(`${relativePath} -> ${specifier}`);
          continue;
        }
        if (!specifier.startsWith(".")) continue;
        const target = relative(ENGINE_SRC, resolve(dirname(file), specifier)).replace(/\.js$/, ".ts");
        if (!target.startsWith("..")) queue.push(target);
      }
    }

    // apps/studio and examples/* bundle the root barrel; record.ts is the Node-only hashing
    // entry and must stay reachable only through the ./evidence subpath export.
    expect(offenders).toEqual([]);
  });
});

/** Specifiers a module loads at runtime, i.e. every import/export statement minus `type`-only ones. */
function runtimeDependencies(file: string): string[] {
  const specifiers: string[] = [];
  for (const chunk of readFileSync(file, "utf-8").split(/;\n/)) {
    const statement = chunk.trim();
    if (!/^(?:import|export)\b/.test(statement)) continue;
    if (/^(?:import|export)\s+type\b/.test(statement)) continue;
    const from = /\bfrom\s+"([^"]+)"(?:\s+async)?/.exec(statement);
    const bare = /^import\s+"([^"]+)"/.exec(statement);
    if (from?.[1]) specifiers.push(from[1]);
    else if (bare?.[1]) specifiers.push(bare[1]);
  }
  return specifiers;
}
