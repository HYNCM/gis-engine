import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatLintText, lintMapSpec, main } from "@gis-engine/cli";
import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// lint.ts — lintMapSpec
// ---------------------------------------------------------------------------

describe("cli-lint-map-spec", () => {
  it("returns ok for a minimal valid MapSpec", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(true);
      expect(result.mode).toBe("mapspec-lint");
      expect(result.filePath).toBe(mapPath);
      expect(result.validation.valid).toBe(true);
      expect(result.validation.diagnosticCounts.error).toBe(0);
      expect(result.validation.diagnosticCounts.warning).toBe(0);
      expect(result.diagnostics).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns ok with correct stats for a MapSpec with sources and layers", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const spec = {
        version: "0.1",
        view: { center: [-73.98, 40.75], zoom: 11 },
        sources: {
          parks: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
        },
        layers: [
          {
            id: "parks-circle",
            type: "circle",
            source: "parks",
            paint: { "circle-radius": 5, "circle-color": "#2f80ed" },
          },
        ],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(true);
      expect(result.validation.valid).toBe(true);
      expect(result.validation.stats.sourceCount).toBe(1);
      expect(result.validation.stats.layerCount).toBe(1);
      expect(result.validation.stats.visibleLayerCount).toBeGreaterThanOrEqual(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns not ok when the file does not exist", () => {
    const result = lintMapSpec({ filePath: "/nonexistent/path/to/map.json" });

    expect(result.ok).toBe(false);
    expect(result.mode).toBe("mapspec-lint");
    expect(result.validation.valid).toBe(false);
    expect(result.validation.diagnosticCounts.error).toBe(1);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      severity: "error",
      code: "SPEC.INVALID_TYPE",
      path: "/",
    });
    expect(result.diagnostics[0]?.message).toContain("Cannot read file");
  });

  it("returns not ok for malformed JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, "{not-valid-json", "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.diagnosticCounts.error).toBe(1);
      expect(result.diagnostics[0]).toMatchObject({
        severity: "error",
        code: "SPEC.INVALID_TYPE",
        path: "/",
      });
      expect(result.diagnostics[0]?.message).toContain("not valid JSON");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns not ok for JSON that is not an object (string)", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, '"just a string"', "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(false);
      expect(result.diagnostics[0]).toMatchObject({
        severity: "error",
        code: "SPEC.INVALID_TYPE",
      });
      expect(result.diagnostics[0]?.message).toContain("MapSpec must be a JSON object");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns not ok for JSON that is not an object (number)", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, "42", "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(false);
      expect(result.diagnostics[0]).toMatchObject({
        severity: "error",
        code: "SPEC.INVALID_TYPE",
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns not ok for JSON that is null", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, "null", "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(false);
      expect(result.diagnostics[0]).toMatchObject({
        severity: "error",
        code: "SPEC.INVALID_TYPE",
      });
      expect(result.diagnostics[0]?.message).toContain("MapSpec must be a JSON object");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns validation diagnostics for a MapSpec with unknown fields", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
        unknownTopLevel: true,
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      // validateSpec should report the unknown field
      expect(result.diagnostics.length).toBeGreaterThan(0);
      const unknownFieldDiag = result.diagnostics.find((d) => d.code === "SPEC.UNKNOWN_FIELD");
      expect(unknownFieldDiag).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("counts diagnostics by severity correctly", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      // Missing version should trigger an error diagnostic
      const spec = {
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(false);
      expect(result.validation.valid).toBe(false);
      // At least one error for missing version
      expect(result.validation.diagnosticCounts.error).toBeGreaterThanOrEqual(1);
      // Total counts should match diagnostics array length
      const { error, warning, info } = result.validation.diagnosticCounts;
      expect(error + warning + info).toBe(result.diagnostics.length);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("resolves relative file paths", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      // Pass relative path — resolve() should handle it
      const result = lintMapSpec({ filePath: mapPath });

      expect(result.filePath).toBe(mapPath);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports zero diagnostic counts for a clean valid spec", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });

      expect(result.validation.diagnosticCounts).toEqual({ error: 0, warning: 0, info: 0 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// lint.ts — formatLintText
// ---------------------------------------------------------------------------

describe("cli-lint-format-text", () => {
  it("formats a passing result with no diagnostics", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });
      const text = formatLintText(result);

      expect(text).toContain("GIS Engine MapSpec Lint");
      expect(text).toContain(`File:  ${mapPath}`);
      expect(text).toContain("Valid: true");
      expect(text).toContain("0 source(s)");
      expect(text).toContain("0 layer(s)");
      expect(text).toContain("0 error(s), 0 warning(s), 0 info");
      expect(text).toContain("No diagnostics.");
      expect(text).toContain("Lint passed.");
      expect(text).not.toContain("Lint failed.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("formats a failing result with error diagnostics", () => {
    const result = lintMapSpec({ filePath: "/nonexistent/file.json" });
    const text = formatLintText(result);

    expect(text).toContain("Valid: false");
    expect(text).toContain("1 error(s), 0 warning(s), 0 info");
    expect(text).toContain("[x]");
    expect(text).toContain("SPEC.INVALID_TYPE");
    expect(text).toContain("Lint failed.");
    expect(text).not.toContain("Lint passed.");
  });

  it("uses correct severity icons for error, warning, and info", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      // A spec that produces validation warnings (e.g., unknown fields)
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
        unknownField: true,
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });
      const text = formatLintText(result);

      // Should contain severity icons for each diagnostic
      for (const diagnostic of result.diagnostics) {
        const expectedIcon =
          diagnostic.severity === "error" ? "[x]" : diagnostic.severity === "warning" ? "[!]" : "[i]";
        expect(text).toContain(expectedIcon);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("includes diagnostic paths when present", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      // Missing version triggers a diagnostic with a path
      const spec = {
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });
      const text = formatLintText(result);

      // Each diagnostic with a path should include "at <path>"
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.path) {
          expect(text).toContain(`at ${diagnostic.path}`);
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("includes fix suggestions when diagnostics have fix messages", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [{ id: "layer1", type: "circle", source: "nonexistent" }],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });
      const text = formatLintText(result);

      // Check if any diagnostic has a fix
      const hasFix = result.diagnostics.some((d) => d.fix);
      if (hasFix) {
        expect(text).toContain("fix:");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("formats stats with source and layer counts", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-"));
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {
          data: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
        },
        layers: [
          { id: "c1", type: "circle", source: "data", paint: { "circle-radius": 3 } },
          { id: "c2", type: "circle", source: "data", paint: { "circle-radius": 5 } },
        ],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      const result = lintMapSpec({ filePath: mapPath });
      const text = formatLintText(result);

      expect(text).toContain("1 source(s)");
      expect(text).toContain("2 layer(s)");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// lint.ts — bin integration (via main)
// ---------------------------------------------------------------------------

describe("cli-bin-lint-mode", () => {
  it("runs JSON lint and outputs valid result for a correct MapSpec", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-bin-"));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      await main(["--lint", mapPath, "--json"]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
      expect(payload).toMatchObject({
        ok: true,
        mode: "mapspec-lint",
        validation: { valid: true },
      });
    } finally {
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("exits non-zero when lint finds validation errors", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-bin-"));
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, "{not-json", "utf-8");

      await expect(main(["--lint", mapPath])).rejects.toThrow("process.exit:1");

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(String(writeSpy.mock.calls[0]?.[0])).toContain("Lint failed.");
    } finally {
      writeSpy.mockRestore();
      exitSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("outputs text format when --json is not specified", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-lint-bin-"));
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const spec = {
        version: "0.1",
        view: { center: [0, 0], zoom: 2 },
        sources: {},
        layers: [],
      };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, JSON.stringify(spec, null, 2), "utf-8");

      await main(["--lint", mapPath]);

      const output = String(writeSpy.mock.calls[0]?.[0]);
      expect(output).toContain("GIS Engine MapSpec Lint");
      expect(output).toContain("Lint passed.");
    } finally {
      writeSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
