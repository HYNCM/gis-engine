import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalHash, canonicalStringify } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

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
