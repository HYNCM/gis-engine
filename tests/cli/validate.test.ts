import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  formatPreflightText,
  formatVerifyArtifactsText,
  generate,
  main,
  preflightMapSpec,
  verifyArtifacts,
} from "@gis-engine/cli";
import { describe, expect, it, vi } from "vitest";
import { pmtilesPreflightSpec, validPMTilesArchiveMetadata } from "./helpers.ts";

// ---------------------------------------------------------------------------
// preflight.ts — preflightMapSpec
// ---------------------------------------------------------------------------

describe("cli-preflight-map-spec", () => {
  it("returns ready for a valid PMTiles MapSpec with source-layer metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-preflight-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, `${JSON.stringify(pmtilesPreflightSpec(), null, 2)}\n`, "utf-8");

      const result = preflightMapSpec({ filePath: mapPath });
      const text = formatPreflightText(result);

      expect(result.ok).toBe(true);
      expect(result.mode).toBe("mapspec-preflight");
      expect(result.inputs).toEqual({ requireArchiveMetadata: false, pmtilesMetadataSourceIds: [] });
      expect(result.status).toBe("ready");
      expect(result.validation.valid).toBe(true);
      expect(result.pmtiles.status).toBe("ready");
      expect(result.pmtiles.summary.pmtilesSourceCount).toBe(1);
      expect(result.pmtiles.sources[0]?.sourceLayerIds).toEqual(["parcels"]);
      expect(result.sourceReadiness.status).toBe("follow-up-required");
      expect(result.sourceReadiness.sources[0]).toMatchObject({
        sourceId: "parcels",
        type: "pmtiles",
        state: "readiness-only",
        displayReady: true,
        queryReady: false,
        resourcePolicy: "passed",
      });
      expect(result.diagnostics).toEqual([]);
      expect(text).toContain("Status:     ready");
      expect(text).toContain("Readiness:  follow-up-required (0 supported, 1 readiness-only, 0 blocked)");
      expect(text).toContain("PMTiles:    ready (1 sources)");
      expect(text).toContain("Source parcels: pmtiles / readiness-only / display yes / query no / policy passed");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns ready with caller-supplied PMTiles archive metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-preflight-"));
    try {
      const mapPath = join(dir, "map.json");
      const metadataPath = join(dir, "parcels.metadata.json");
      writeFileSync(mapPath, `${JSON.stringify(pmtilesPreflightSpec(), null, 2)}\n`, "utf-8");
      writeFileSync(metadataPath, `${JSON.stringify(validPMTilesArchiveMetadata(), null, 2)}\n`, "utf-8");

      const result = preflightMapSpec({
        filePath: mapPath,
        requireArchiveMetadata: true,
        pmtilesMetadata: [`parcels=${metadataPath}`],
      });

      expect(result.ok).toBe(true);
      expect(result.status).toBe("ready");
      expect(result.inputs).toEqual({ requireArchiveMetadata: true, pmtilesMetadataSourceIds: ["parcels"] });
      expect(result.pmtiles.sources[0]?.metadata).toMatchObject({ specVersion: 3, tileType: "vector" });
      expect(result.pmtiles.sources[0]?.requirements.archiveMetadata).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("marks required PMTiles archive metadata as not ok when absent", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-preflight-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, `${JSON.stringify(pmtilesPreflightSpec(), null, 2)}\n`, "utf-8");

      const result = preflightMapSpec({ filePath: mapPath, requireArchiveMetadata: true });

      expect(result.ok).toBe(false);
      expect(result.status).toBe("metadata-required");
      expect(result.pmtiles.status).toBe("metadata-required");
      expect(result.sourceReadiness.sources[0]).toMatchObject({
        sourceId: "parcels",
        state: "readiness-only",
        displayReady: false,
      });
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: "CAPABILITY.UNSUPPORTED",
          path: "/sources/parcels/archiveMetadata",
          severity: "warning",
        }),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("blocks malformed PMTiles archive metadata input", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-preflight-"));
    try {
      const mapPath = join(dir, "map.json");
      const metadataPath = join(dir, "parcels.metadata.json");
      writeFileSync(mapPath, `${JSON.stringify(pmtilesPreflightSpec(), null, 2)}\n`, "utf-8");
      writeFileSync(metadataPath, '{"specVersion":3}', "utf-8");

      const result = preflightMapSpec({ filePath: mapPath, pmtilesMetadata: [`parcels=${metadataPath}`] });

      expect(result.ok).toBe(false);
      expect(result.status).toBe("blocked");
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: "SCHEMA.INVALID",
          path: "/pmtilesMetadata/parcels",
        }),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("blocks PMTiles preflight when vector layers omit source-layer metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-preflight-"));
    try {
      const spec = pmtilesPreflightSpec();
      const firstLayer = spec.layers[0];
      if (!firstLayer) throw new Error("Expected PMTiles fixture layer.");
      spec.layers[0] = { ...firstLayer, metadata: undefined };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, `${JSON.stringify(spec, null, 2)}\n`, "utf-8");

      const result = preflightMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(false);
      expect(result.status).toBe("blocked");
      expect(result.pmtiles.status).toBe("blocked");
      expect(result.sourceReadiness.status).toBe("blocked");
      expect(result.sourceReadiness.sources[0]).toMatchObject({
        sourceId: "parcels",
        state: "blocked",
        displayReady: false,
      });
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: "LAYER.SOURCE_INCOMPATIBLE",
          path: "/layers/0/metadata/source-layer",
        }),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps FlatGeobuf in follow-up-required source readiness without blocking validation", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-preflight-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(
        mapPath,
        `${JSON.stringify(
          {
            version: "0.1",
            view: { center: [0, 0], zoom: 2 },
            sources: { parcels: { type: "flatgeobuf", url: "./data/parcels.fgb" } },
            layers: [],
          },
          null,
          2,
        )}\n`,
        "utf-8",
      );

      const result = preflightMapSpec({ filePath: mapPath });
      const text = formatPreflightText(result);

      expect(result.ok).toBe(true);
      expect(result.status).toBe("ready");
      expect(result.validation.valid).toBe(true);
      expect(result.sourceReadiness.status).toBe("follow-up-required");
      expect(result.sourceReadiness.sources).toEqual([
        expect.objectContaining({
          sourceId: "parcels",
          type: "flatgeobuf",
          state: "readiness-only",
          displayReady: false,
          queryReady: false,
          resourcePolicy: "passed",
        }),
      ]);
      expect(text).toContain("Readiness:  follow-up-required (0 supported, 1 readiness-only, 0 blocked)");
      expect(text).toContain("Source parcels: flatgeobuf / readiness-only / display no / query no / policy passed");
      expect(text).toContain(
        "Limitations: FlatGeobuf runtime loading, query, and export handoff remain blocked until a promotion gate lands.",
      );
      expect(text).toContain(
        "Next:      Keep FlatGeobuf as readiness-only evidence until public runtime loading or query promotion is approved.",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("blocks malformed JSON with a structured diagnostic", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-preflight-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, "{not-json", "utf-8");

      const result = preflightMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(false);
      expect(result.status).toBe("blocked");
      expect(result.validation.valid).toBe(false);
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: "SPEC.INVALID_TYPE",
          path: "/",
        }),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// artifacts.ts — verifyArtifacts
// ---------------------------------------------------------------------------

describe("cli-artifact-manifest-verify", () => {
  it("returns a structured diagnostic when artifact-manifest.json is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-artifacts-"));
    try {
      const result = verifyArtifacts({ projectDir: dir });
      const text = formatVerifyArtifactsText(result);

      expect(result.ok).toBe(false);
      expect(result.status).toBe("blocked");
      expect(result.diagnostics[0]).toMatchObject({
        severity: "error",
        code: "ARTIFACT_MANIFEST.READ_FAILED",
        path: "artifact-manifest.json",
      });
      expect(text).toContain("Artifact manifest verification");
      expect(text).toContain("Status:     blocked");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns structured diagnostics for malformed artifact manifest entries", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-artifacts-"));
    try {
      mkdirSync(join(dir, "nested"));
      writeFileSync(
        join(dir, "artifact-manifest.json"),
        `${JSON.stringify(
          {
            requiredReviewFiles: ["map.json", 42],
            files: [
              null,
              { path: "../outside.txt", role: "mapspec", required: true, bytes: 0, sha256: `sha256:${"0".repeat(64)}` },
              { path: "nested", role: "app", required: false, bytes: 0, sha256: `sha256:${"0".repeat(64)}` },
            ],
          },
          null,
          2,
        )}\n`,
        "utf-8",
      );

      const result = verifyArtifacts({ projectDir: dir });
      const codes = result.diagnostics.map((diagnostic) => diagnostic.code);

      expect(result.ok).toBe(false);
      expect(result.status).toBe("blocked");
      expect(codes).toEqual(
        expect.arrayContaining([
          "ARTIFACT_MANIFEST.INVALID_REQUIRED_REVIEW_FILE",
          "ARTIFACT_MANIFEST.INVALID_ENTRY",
          "ARTIFACT_MANIFEST.INVALID_PATH",
          "ARTIFACT_MANIFEST.NOT_FILE",
          "ARTIFACT_MANIFEST.REQUIRED_ENTRY_MISSING",
        ]),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// bin.ts — preflight mode (via main)
// ---------------------------------------------------------------------------

describe("cli-bin-preflight-mode", () => {
  it("runs JSON preflight without requiring a project name", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-main-preflight-"));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, `${JSON.stringify(pmtilesPreflightSpec(), null, 2)}\n`, "utf-8");

      await main(["--preflight", mapPath, "--json"]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
      expect(payload).toMatchObject({
        ok: true,
        mode: "mapspec-preflight",
        status: "ready",
        validation: { valid: true },
        sourceReadiness: {
          status: "follow-up-required",
          summary: { readinessOnlySourceCount: 1, blockedSourceCount: 0 },
        },
        pmtiles: { status: "ready" },
      });
    } finally {
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("exits non-zero when preflight reports blockers", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-main-preflight-"));
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    try {
      const spec = pmtilesPreflightSpec();
      const firstLayer = spec.layers[0];
      if (!firstLayer) throw new Error("Expected PMTiles fixture layer.");
      spec.layers[0] = { ...firstLayer, metadata: undefined };
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, `${JSON.stringify(spec, null, 2)}\n`, "utf-8");

      await expect(main(["--preflight", mapPath])).rejects.toThrow("process.exit:1");

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(String(writeSpy.mock.calls[0]?.[0])).toContain("Status:     blocked");
    } finally {
      writeSpy.mockRestore();
      exitSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("exits non-zero when required PMTiles archive metadata is missing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-main-preflight-"));
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(mapPath, `${JSON.stringify(pmtilesPreflightSpec(), null, 2)}\n`, "utf-8");

      await expect(main(["--preflight", mapPath, "--require-archive-metadata"])).rejects.toThrow("process.exit:1");

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(String(writeSpy.mock.calls[0]?.[0])).toContain("Status:     metadata-required");
    } finally {
      writeSpy.mockRestore();
      exitSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// bin.ts — artifact verify mode (via main)
// ---------------------------------------------------------------------------

describe("cli-bin-artifact-verify-mode", () => {
  it("runs JSON artifact verification without requiring a project name", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-main-artifacts-"));
    const cwd = process.cwd();
    const generateLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);
      await generate({
        projectName: "reviewable-map",
        provider: "mock",
        prompt: "Create a map showing private verifier locations",
        dryRun: false,
      });
      generateLogSpy.mockRestore();

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        await main(["--verify-artifacts", join(dir, "reviewable-map"), "--json"]);

        expect(logSpy).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
        expect(payload).toMatchObject({
          ok: true,
          mode: "artifact-manifest-verify",
          status: "verified",
          summary: {
            requiredFileCount: 4,
            missingFileCount: 0,
            byteMismatchCount: 0,
            hashMismatchCount: 0,
          },
        });
        expect(payload.files.map((file: { path: string }) => file.path)).toContain("map.json");
        expect(JSON.stringify(payload)).not.toContain("private verifier locations");
      } finally {
        logSpy.mockRestore();
      }
    } finally {
      process.chdir(cwd);
      generateLogSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("exits non-zero when artifact verification finds a changed file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-main-artifacts-"));
    const cwd = process.cwd();
    const generateLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    try {
      process.chdir(dir);
      await generate({
        projectName: "reviewable-map",
        provider: "mock",
        prompt: "Create a map showing changed artifact locations",
        dryRun: false,
      });
      writeFileSync(join(dir, "reviewable-map", "map.json"), "{}\n", "utf-8");

      await expect(main(["--verify-artifacts", join(dir, "reviewable-map")])).rejects.toThrow("process.exit:1");

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(String(writeSpy.mock.calls[0]?.[0])).toContain("Status:     blocked");
      expect(String(writeSpy.mock.calls[0]?.[0])).toContain("ARTIFACT_MANIFEST.BYTE_MISMATCH");
    } finally {
      process.chdir(cwd);
      generateLogSpy.mockRestore();
      writeSpy.mockRestore();
      exitSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// edge cases — preflight and verify with bad inputs
// ---------------------------------------------------------------------------

describe("cli-edge-case-preflight-nonexistent-file", () => {
  it("returns blocked when preflight target file does not exist", () => {
    const result = preflightMapSpec({ filePath: "/nonexistent/path/to/map.json" });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "SPEC.INVALID_TYPE",
      }),
    );
    expect(result.diagnostics[0]?.message).toContain("Could not read or parse MapSpec JSON");
  });
});

describe("cli-edge-case-verify-nonexistent-dir", () => {
  it("returns blocked when project directory has no manifest", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-verify-empty-"));
    try {
      const result = verifyArtifacts({ projectDir: dir });

      expect(result.ok).toBe(false);
      expect(result.status).toBe("blocked");
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "ARTIFACT_MANIFEST.READ_FAILED",
        }),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
