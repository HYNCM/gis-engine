import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CLI_API_KEY_ENVS,
  createProviderDiagnostics,
  formatPreflightText,
  generate,
  getTemplate,
  hashPrompt,
  main,
  normalizeAppConfig,
  parseArgs,
  preflightMapSpec,
  readProviderApiKey,
  resolveProviderProfile,
  TEMPLATES,
} from "@gis-engine/cli";
import type { MapSpec, PMTilesArchiveMetadata } from "@gis-engine/engine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDirectCliExecution } from "../../packages/cli/src/bin.ts";

// ---------------------------------------------------------------------------
// bin.ts — direct execution guard
// ---------------------------------------------------------------------------

describe("cli-bin-direct-execution", () => {
  it("detects direct execution through npm-style symlinked bin paths", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-bin-"));
    try {
      const target = join(dir, "bin.js");
      const symlink = join(dir, "create-gis-map");
      writeFileSync(target, "#!/usr/bin/env node\n", "utf-8");
      symlinkSync(target, symlink);

      expect(isDirectCliExecution(pathToFileURL(target).href, symlink)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not treat unrelated process entrypoints as direct CLI execution", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-bin-"));
    try {
      const target = join(dir, "bin.js");
      const runner = join(dir, "vitest.js");
      writeFileSync(target, "#!/usr/bin/env node\n", "utf-8");
      writeFileSync(runner, "#!/usr/bin/env node\n", "utf-8");

      expect(isDirectCliExecution(pathToFileURL(target).href, runner)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

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
// config.ts — parseArgs
// ---------------------------------------------------------------------------

describe("cli-config-parseArgs", () => {
  const ENV_KEYS = [
    "GIS_ENGINE_TEMPLATE",
    "GIS_ENGINE_PROVIDER",
    "GIS_ENGINE_PROMPT",
    "GIS_ENGINE_MODEL",
    "GIS_ENGINE_BASE_URL",
    "GIS_ENGINE_API_KEY",
    "GIS_ENGINE_TIMEOUT",
  ];
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  it("returns defaults for empty argv", () => {
    const config = parseArgs([]);
    expect(config.projectName).toBe("");
    expect(config.template).toBe("static-html");
    expect(config.provider).toBe("mock");
    expect(config.dryRun).toBe(false);
    expect(config.generate).toBe(false);
    expect(config.yes).toBe(false);
    expect(config.help).toBe(false);
    expect(config.version).toBe(false);
    expect(config.prompt).toBeUndefined();
    expect(config.model).toBeUndefined();
    expect(config.baseUrl).toBeUndefined();
    expect(config.apiKey).toBeUndefined();
    expect(config.timeout).toBeUndefined();
    expect(config.preflight).toBeUndefined();
    expect(config.requireArchiveMetadata).toBe(false);
    expect(config.pmtilesMetadata).toEqual([]);
    expect(config.json).toBe(false);
  });

  it("sets template via --template flag", () => {
    const config = parseArgs(["--template", "vite-ts"]);
    expect(config.template).toBe("vite-ts");
  });

  it("sets template via -t short flag", () => {
    const config = parseArgs(["-t", "mapspec"]);
    expect(config.template).toBe("mapspec");
  });

  it("sets provider via --provider flag", () => {
    const config = parseArgs(["--provider", "deepseek"]);
    expect(config.provider).toBe("deepseek");
  });

  it("sets provider via -p short flag", () => {
    const config = parseArgs(["-p", "openai"]);
    expect(config.provider).toBe("openai");
  });

  it("sets dryRun via --dry-run", () => {
    const config = parseArgs(["--dry-run"]);
    expect(config.dryRun).toBe(true);
  });

  it("sets json via --json", () => {
    const config = parseArgs(["--json"]);
    expect(config.json).toBe(true);
  });

  it("sets preflight via --preflight with separate value", () => {
    const config = parseArgs(["--preflight", "./map.json", "--json"]);
    expect(config.projectName).toBe("");
    expect(config.preflight).toBe("./map.json");
    expect(config.json).toBe(true);
  });

  it("sets preflight via --preflight=value equals form", () => {
    const config = parseArgs(["--preflight=./map.json"]);
    expect(config.preflight).toBe("./map.json");
  });

  it("sets PMTiles archive metadata preflight flags", () => {
    const config = parseArgs([
      "--preflight",
      "./map.json",
      "--require-archive-metadata",
      "--pmtiles-metadata",
      "parcels=./parcels.metadata.json",
      "--pmtiles-metadata=buildings=./buildings.metadata.json",
    ]);
    expect(config.requireArchiveMetadata).toBe(true);
    expect(config.pmtilesMetadata).toEqual(["parcels=./parcels.metadata.json", "buildings=./buildings.metadata.json"]);
  });

  it("sets help via --help", () => {
    const config = parseArgs(["--help"]);
    expect(config.help).toBe(true);
  });

  it("sets help via -h", () => {
    const config = parseArgs(["-h"]);
    expect(config.help).toBe(true);
  });

  it("sets version via --version", () => {
    const config = parseArgs(["--version"]);
    expect(config.version).toBe(true);
  });

  it("sets version via -v", () => {
    const config = parseArgs(["-v"]);
    expect(config.version).toBe(true);
  });

  it("captures positional project name", () => {
    const config = parseArgs(["my-map"]);
    expect(config.projectName).toBe("my-map");
  });

  it("sets generate via --generate", () => {
    const config = parseArgs(["--generate"]);
    expect(config.generate).toBe(true);
  });

  it("sets generate via -g short flag", () => {
    const config = parseArgs(["-g"]);
    expect(config.generate).toBe(true);
  });

  it("sets prompt via --prompt with separate value", () => {
    const config = parseArgs(["--prompt", "some text"]);
    expect(config.prompt).toBe("some text");
  });

  it("sets prompt via --prompt=text equals form", () => {
    const config = parseArgs(["--prompt=text"]);
    expect(config.prompt).toBe("text");
  });

  it("sets template via --template=value equals form", () => {
    const config = parseArgs(["--template=vite-ts"]);
    expect(config.template).toBe("vite-ts");
  });

  it("parses a combined set of arguments", () => {
    const config = parseArgs(["my-map", "--generate", "-p", "mock", "--prompt", "test", "--dry-run"]);
    expect(config.projectName).toBe("my-map");
    expect(config.generate).toBe(true);
    expect(config.provider).toBe("mock");
    expect(config.prompt).toBe("test");
    expect(config.dryRun).toBe(true);
  });

  it("warns on unknown arguments", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      parseArgs(["--foobar"]);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain("--foobar");
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("sets yes via --yes flag", () => {
    const config = parseArgs(["--yes"]);
    expect(config.yes).toBe(true);
  });

  it("sets yes via --force flag (alias)", () => {
    const config = parseArgs(["--force"]);
    expect(config.yes).toBe(true);
  });

  it("sets yes via -y short flag", () => {
    const config = parseArgs(["-y"]);
    expect(config.yes).toBe(true);
  });

  it("sets model via --model flag", () => {
    const config = parseArgs(["--model", "deepseek-chat"]);
    expect(config.model).toBe("deepseek-chat");
  });

  it("sets model via --model=value equals form", () => {
    const config = parseArgs(["--model=gpt-4o"]);
    expect(config.model).toBe("gpt-4o");
  });

  it("sets baseUrl via --base-url flag", () => {
    const config = parseArgs(["--base-url", "https://api.deepseek.com/v1"]);
    expect(config.baseUrl).toBe("https://api.deepseek.com/v1");
  });

  it("sets baseUrl via --base-url=value equals form", () => {
    const config = parseArgs(["--base-url=https://api.openai.com/v1"]);
    expect(config.baseUrl).toBe("https://api.openai.com/v1");
  });

  it("reads model from GIS_ENGINE_MODEL env var", () => {
    process.env.GIS_ENGINE_MODEL = "env-model";
    const config = parseArgs([]);
    expect(config.model).toBe("env-model");
  });

  it("reads baseUrl from GIS_ENGINE_BASE_URL env var", () => {
    process.env.GIS_ENGINE_BASE_URL = "https://env.example.com";
    const config = parseArgs([]);
    expect(config.baseUrl).toBe("https://env.example.com");
  });

  it("flag overrides env var for model", () => {
    process.env.GIS_ENGINE_MODEL = "env-model";
    const config = parseArgs(["--model", "flag-model"]);
    expect(config.model).toBe("flag-model");
  });

  it("parses a full generate set with model and base-url", () => {
    const config = parseArgs([
      "my-map",
      "--generate",
      "-p",
      "deepseek",
      "--model",
      "deepseek-chat",
      "--base-url",
      "https://api.deepseek.com/v1",
      "--prompt",
      "test",
      "--yes",
      "--dry-run",
    ]);
    expect(config.projectName).toBe("my-map");
    expect(config.generate).toBe(true);
    expect(config.provider).toBe("deepseek");
    expect(config.model).toBe("deepseek-chat");
    expect(config.baseUrl).toBe("https://api.deepseek.com/v1");
    expect(config.prompt).toBe("test");
    expect(config.yes).toBe(true);
    expect(config.dryRun).toBe(true);
  });

  it("sets apiKey via --api-key flag", () => {
    const config = parseArgs(["--api-key", "sk-test-123"]);
    expect(config.apiKey).toBe("sk-test-123");
  });

  it("sets apiKey via --api-key=value equals form", () => {
    const config = parseArgs(["--api-key=sk-test-456"]);
    expect(config.apiKey).toBe("sk-test-456");
  });

  it("sets timeout via --timeout flag", () => {
    const config = parseArgs(["--timeout", "30000"]);
    expect(config.timeout).toBe(30000);
  });

  it("sets timeout via --timeout=value equals form", () => {
    const config = parseArgs(["--timeout=15000"]);
    expect(config.timeout).toBe(15000);
  });

  it("ignores invalid timeout values", () => {
    const config = parseArgs(["--timeout", "abc"]);
    expect(config.timeout).toBeUndefined();
  });

  it("reads apiKey from GIS_ENGINE_API_KEY env var", () => {
    process.env.GIS_ENGINE_API_KEY = "sk-env-key";
    const config = parseArgs([]);
    expect(config.apiKey).toBe("sk-env-key");
  });

  it("reads timeout from GIS_ENGINE_TIMEOUT env var", () => {
    process.env.GIS_ENGINE_TIMEOUT = "25000";
    const config = parseArgs([]);
    expect(config.timeout).toBe(25000);
  });

  it("flag overrides env var for apiKey", () => {
    process.env.GIS_ENGINE_API_KEY = "sk-env-key";
    const config = parseArgs(["--api-key", "sk-flag-key"]);
    expect(config.apiKey).toBe("sk-flag-key");
  });
});

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

  it("keeps unsupported cloud-native source types blocked in source readiness", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-preflight-"));
    try {
      const mapPath = join(dir, "map.json");
      writeFileSync(
        mapPath,
        `${JSON.stringify(
          {
            version: "0.1",
            view: { center: [0, 0], zoom: 2 },
            sources: { parquet: { type: "geoparquet", url: "./data/parcels.parquet" } },
            layers: [],
          },
          null,
          2,
        )}\n`,
        "utf-8",
      );

      const result = preflightMapSpec({ filePath: mapPath });

      expect(result.ok).toBe(false);
      expect(result.status).toBe("blocked");
      expect(result.validation.valid).toBe(false);
      expect(result.sourceReadiness.status).toBe("blocked");
      expect(result.sourceReadiness.sources).toEqual([
        expect.objectContaining({
          sourceId: "parquet",
          type: "geoparquet",
          state: "blocked",
          resourcePolicy: "not-applicable",
        }),
      ]);
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

function pmtilesPreflightSpec(): MapSpec {
  return {
    version: "0.1",
    view: { center: [-73.98, 40.75], zoom: 11 },
    sources: {
      parcels: {
        type: "pmtiles",
        url: "pmtiles://local/parcels.pmtiles",
      },
    },
    layers: [
      {
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        metadata: { "source-layer": "parcels" },
        paint: { "fill-color": "#2f80ed", "fill-opacity": 0.55 },
      },
    ],
  };
}

function validPMTilesArchiveMetadata(): PMTilesArchiveMetadata {
  return {
    specVersion: 3,
    archiveBytes: 1_000_000,
    rootDirectoryOffset: 0,
    rootDirectoryLength: 1024,
    hasVectorTiles: true,
    hasRasterTiles: false,
    tileType: "vector",
    minZoom: 0,
    maxZoom: 14,
    bounds: [-74.1, 40.6, -73.7, 40.9],
  };
}

// ---------------------------------------------------------------------------
// provider.ts — createProviderDiagnostics
// ---------------------------------------------------------------------------

describe("cli-provider-diagnostics", () => {
  it("returns mock status for mock provider", () => {
    const diag = createProviderDiagnostics("mock");
    expect(diag.providerId).toBe("mock");
    expect(diag.status).toBe("mock");
    expect(diag.mode).toBe("mock");
    expect(diag.diagnostics).toContain("MOCK.PLANNER_ACTIVE");
  });

  it("returns unconfigured for deepseek provider", () => {
    const diag = createProviderDiagnostics("deepseek");
    expect(diag.providerId).toBe("deepseek");
    expect(diag.status).toBe("unconfigured");
    expect(diag.mode).toBe("openai-compatible");
    expect(diag.diagnostics).toContain("PROVIDER.CONFIG_REQUIRED");
    expect(diag.model).toBe("deepseek-chat");
    expect(diag.baseUrl).toBe("https://api.deepseek.com/v1");
    expect(diag.diagnostics).toContain("PROVIDER.USING_DEFAULT_MODEL");
    expect(diag.diagnostics).toContain("PROVIDER.USING_DEFAULT_BASE_URL");
  });

  it("returns unconfigured for openai provider", () => {
    const diag = createProviderDiagnostics("openai");
    expect(diag.providerId).toBe("openai");
    expect(diag.status).toBe("unconfigured");
    expect(diag.mode).toBe("openai-compatible");
    expect(diag.model).toBe("gpt-4o-mini");
    expect(diag.baseUrl).toBe("https://api.openai.com/v1");
  });

  it("accepts custom model and baseUrl for known providers", () => {
    const diag = createProviderDiagnostics("deepseek", {
      model: "deepseek-coder",
      baseUrl: "https://custom.api.com/v1",
    });
    expect(diag.providerId).toBe("deepseek");
    expect(diag.model).toBe("deepseek-coder");
    expect(diag.baseUrl).toBe("https://custom.api.com/v1");
    expect(diag.diagnostics).not.toContain("PROVIDER.USING_DEFAULT_MODEL");
    expect(diag.diagnostics).not.toContain("PROVIDER.USING_DEFAULT_BASE_URL");
  });

  it("accepts partial options — model only", () => {
    const diag = createProviderDiagnostics("openai", { model: "gpt-4o" });
    expect(diag.model).toBe("gpt-4o");
    expect(diag.baseUrl).toBe("https://api.openai.com/v1");
    expect(diag.diagnostics).not.toContain("PROVIDER.USING_DEFAULT_MODEL");
    expect(diag.diagnostics).toContain("PROVIDER.USING_DEFAULT_BASE_URL");
  });

  it("returns unknown-id diagnostic for unknown provider", () => {
    const diag = createProviderDiagnostics("xyz");
    expect(diag.providerId).toBe("xyz");
    expect(diag.status).toBe("unconfigured");
    expect(diag.diagnostics).toContain("PROVIDER.UNKNOWN_ID");
  });

  it("is case insensitive — Mock resolves same as mock", () => {
    const diag = createProviderDiagnostics("Mock");
    expect(diag.providerId).toBe("mock");
    expect(diag.status).toBe("mock");
    expect(diag.mode).toBe("mock");
    expect(diag.diagnostics).toContain("MOCK.PLANNER_ACTIVE");
  });
});

// ---------------------------------------------------------------------------
// templates/index.ts — getTemplate, TEMPLATES
// ---------------------------------------------------------------------------

describe("cli-templates", () => {
  it("TEMPLATES contains all known template names", () => {
    expect(TEMPLATES).toContain("static-html");
    expect(TEMPLATES).toContain("vite-ts");
    expect(TEMPLATES).toContain("mapspec");
    expect(TEMPLATES).toContain("app");
  });

  it("getTemplate returns a Template for static-html", () => {
    const tpl = getTemplate("static-html");
    expect(tpl).toBeDefined();
    expect(tpl?.name).toBe("static-html");
  });

  it("getTemplate returns a Template for vite-ts", () => {
    const tpl = getTemplate("vite-ts");
    expect(tpl).toBeDefined();
    expect(tpl?.name).toBe("vite-ts");
  });

  it("getTemplate returns a Template for mapspec", () => {
    const tpl = getTemplate("mapspec");
    expect(tpl).toBeDefined();
    expect(tpl?.name).toBe("mapspec");
  });

  it("getTemplate returns undefined for nonexistent template", () => {
    expect(getTemplate("nonexistent")).toBeUndefined();
  });

  it("static-html template generates index.html and README.md", () => {
    const tpl = getTemplate("static-html")!;
    const ctx = { projectName: "test-project", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("index.html");
    expect(paths).toContain("README.md");
  });

  it("vite-ts template generates package.json, tsconfig.json, index.html, src/main.ts, README.md", () => {
    const tpl = getTemplate("vite-ts")!;
    const ctx = { projectName: "test-project", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("package.json");
    expect(paths).toContain("tsconfig.json");
    expect(paths).toContain("index.html");
    expect(paths).toContain("src/main.ts");
    expect(paths).toContain("README.md");
    const pkgFile = files.find((f) => f.path === "package.json")!;
    const pkg = JSON.parse(pkgFile.content);
    expect(pkg.dependencies["@gis-engine/engine"]).toBe("^1.0.0");
    expect(pkg.dependencies["@gis-engine/ai"]).toBe("^1.0.0");
  });

  it("mapspec template generates map.json and README.md", () => {
    const tpl = getTemplate("mapspec")!;
    const ctx = { projectName: "test-project", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("map.json");
    expect(paths).toContain("README.md");
    const readme = files.find((f) => f.path === "README.md")!;
    expect(readme.content).toContain("create-gis-map --preflight ./map.json --json");
  });

  it("generated files contain the project name", () => {
    const tpl = getTemplate("static-html")!;
    const ctx = { projectName: "my-cool-map", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const indexHtml = files.find((f) => f.path === "index.html")!;
    const readme = files.find((f) => f.path === "README.md")!;
    expect(indexHtml.content).toContain("my-cool-map");
    expect(readme.content).toContain("my-cool-map");
  });

  it("scaffold templates include the required MapSpec view", () => {
    const ctx = { projectName: "view-test", provider: "mock", cliVersion: "1.0.0" };

    const staticHtml = getTemplate("static-html")!
      .generate(ctx)
      .find((f) => f.path === "index.html")!;
    expect(staticHtml.content).toContain("view:");
    expect(staticHtml.content).toContain('version: "0.1"');

    const viteMain = getTemplate("vite-ts")!
      .generate(ctx)
      .find((f) => f.path === "src/main.ts")!;
    expect(viteMain.content).toContain("view:");
    expect(viteMain.content).toContain('version: "0.1"');
    expect(viteMain.content).toContain("async function main()");
    expect(viteMain.content).not.toMatch(/^const map = await createMap/m);

    const mapspec = getTemplate("mapspec")!
      .generate(ctx)
      .find((f) => f.path === "map.json")!;
    expect(JSON.parse(mapspec.content).version).toBe("0.1");
    expect(JSON.parse(mapspec.content).view).toEqual({ center: [0, 0], zoom: 2 });

    const appMap = getTemplate("app")!
      .generate(ctx)
      .find((f) => f.path === "map.json")!;
    expect(JSON.parse(appMap.content).version).toBe("0.1");
    expect(JSON.parse(appMap.content).view).toEqual({ center: [0, 0], zoom: 2 });
  });

  it("generated package.json is valid JSON", () => {
    const tpl = getTemplate("vite-ts")!;
    const ctx = { projectName: "json-test", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const pkgFile = files.find((f) => f.path === "package.json")!;
    expect(() => JSON.parse(pkgFile.content)).not.toThrow();
    const pkg = JSON.parse(pkgFile.content);
    expect(pkg.name).toBe("json-test");
  });

  it("getTemplate returns a Template for app", () => {
    const tpl = getTemplate("app");
    expect(tpl).toBeDefined();
    expect(tpl?.name).toBe("app");
  });

  it("app template generates full interactive application files", () => {
    const tpl = getTemplate("app")!;
    const ctx = { projectName: "quake-app", provider: "deepseek", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("package.json");
    expect(paths).toContain("vite.config.ts");
    expect(paths).toContain("tsconfig.json");
    expect(paths).toContain("tailwind.config.js");
    expect(paths).toContain("postcss.config.js");
    expect(paths).toContain("index.html");
    expect(paths).toContain("src/main.tsx");
    expect(paths).toContain("src/App.tsx");
    expect(paths).toContain("src/index.css");
    expect(paths).toContain("src/vite-env.d.ts");
    expect(paths).toContain("map.json");
    expect(paths).toContain("README.md");
    const readme = files.find((f) => f.path === "README.md")!;
    expect(readme.content).toContain("create-gis-map --preflight ./map.json --json");
  });

  it("app template includes React and Tailwind dependencies", () => {
    const tpl = getTemplate("app")!;
    const ctx = { projectName: "test-app", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const pkgFile = files.find((f) => f.path === "package.json")!;
    const pkg = JSON.parse(pkgFile.content);
    expect(pkg.dependencies["@gis-engine/engine"]).toBe("^1.0.0");
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies["react-dom"]).toBeDefined();
    expect(pkg.dependencies["maplibre-gl"]).toBeDefined();
    expect(pkg.devDependencies.tailwindcss).toBeDefined();
    expect(pkg.devDependencies["@vitejs/plugin-react"]).toBeDefined();
  });

  it("app template generates all 5 UI components by default", () => {
    const tpl = getTemplate("app")!;
    const ctx = { projectName: "full-app", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("src/components/LayerPanel.tsx");
    expect(paths).toContain("src/components/FeaturePopup.tsx");
    expect(paths).toContain("src/components/Legend.tsx");
    expect(paths).toContain("src/components/SearchBox.tsx");
    expect(paths).toContain("src/components/BasemapSwitcher.tsx");
  });

  it("app template imports maplibre-gl in each generated component", () => {
    const tpl = getTemplate("app")!;
    const ctx = { projectName: "import-test", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    for (const path of [
      "src/components/LayerPanel.tsx",
      "src/components/FeaturePopup.tsx",
      "src/components/Legend.tsx",
      "src/components/SearchBox.tsx",
      "src/components/BasemapSwitcher.tsx",
    ]) {
      const file = files.find((entry) => entry.path === path);
      expect(file).toBeDefined();
      expect(file?.content).toContain('import maplibregl from "maplibre-gl";');
    }
  });

  it("app template respects custom appConfig with fewer components", () => {
    const tpl = getTemplate("app")!;
    const ctx = {
      projectName: "locator-app",
      provider: "mock",
      cliVersion: "1.0.0",
      appConfig: {
        appType: "locator" as const,
        title: "My Locator",
        description: "Find places",
        components: ["SearchBox", "BasemapSwitcher"],
      },
    };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("src/components/SearchBox.tsx");
    expect(paths).toContain("src/components/BasemapSwitcher.tsx");
    expect(paths).not.toContain("src/components/LayerPanel.tsx");
    expect(paths).not.toContain("src/components/Legend.tsx");
    expect(paths).not.toContain("src/components/FeaturePopup.tsx");
  });

  it("normalizeAppConfig filters unknown components and falls back cleanly", () => {
    const normalized = normalizeAppConfig(
      {
        appType: "locator",
        title: "Lookup",
        description: "Search nearby places",
        components: ["SearchBox", "Bogus", "BasemapSwitcher", "SearchBox"],
      },
      { projectName: "lookup-app", description: "fallback description" },
    );

    expect(normalized.appType).toBe("locator");
    expect(normalized.components).toEqual(["SearchBox", "BasemapSwitcher"]);

    const fallback = normalizeAppConfig(
      {
        appType: "dashboard",
        title: "",
        description: "",
        components: ["Bogus", "StillBogus"],
      },
      { projectName: "dashboard-app", description: "fallback description" },
    );

    expect(fallback.appType).toBe("dashboard");
    expect(fallback.title).toBe("dashboard-app");
    expect(fallback.components).toEqual(["LayerPanel", "Legend", "FeaturePopup"]);
  });

  it("app template App.tsx imports all configured components", () => {
    const tpl = getTemplate("app")!;
    const ctx = { projectName: "test-app", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const appFile = files.find((f) => f.path === "src/App.tsx")!;
    expect(appFile.content).toContain('import LayerPanel from "./components/LayerPanel"');
    expect(appFile.content).toContain('import Legend from "./components/Legend"');
    expect(appFile.content).toContain('import FeaturePopup from "./components/FeaturePopup"');
    expect(appFile.content).toContain('import SearchBox from "./components/SearchBox"');
    expect(appFile.content).toContain('import BasemapSwitcher from "./components/BasemapSwitcher"');
    expect(appFile.content).toContain("const syncSpecToMap =");
    expect(appFile.content).toContain('nextMap.on("load"');
    expect(appFile.content).toContain('nextMap.on("error"');
    expect(appFile.content).toContain('setStatus("loading")');
    expect(appFile.content).toContain("targetMap.addSource");
    expect(appFile.content).toContain("targetMap.addLayer");
    expect(appFile.content).toContain('fetch("./delivery-summary.json"');
    expect(appFile.content).toContain("type DeliveryLoadStatus");
    expect(appFile.content).toContain("formatDeliveryState");
    expect(appFile.content).toContain('return "scaffold"');
    expect(appFile.content).toContain("deliverySummary?.preflight?.status");
  });

  it("app template exposes loading, reload, and responsive control states", () => {
    const tpl = getTemplate("app")!;
    const ctx = { projectName: "test-app", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const appFile = files.find((f) => f.path === "src/App.tsx")!;
    const layerPanel = files.find((f) => f.path === "src/components/LayerPanel.tsx")!;
    const legend = files.find((f) => f.path === "src/components/Legend.tsx")!;
    const searchBox = files.find((f) => f.path === "src/components/SearchBox.tsx")!;
    const basemapSwitcher = files.find((f) => f.path === "src/components/BasemapSwitcher.tsx")!;

    expect(appFile.content).toContain('type MapLoadStatus = "loading" | "ready" | "empty" | "error";');
    expect(appFile.content).toContain("Reload map.json");
    expect(appFile.content).toContain("Load map.json");
    expect(appFile.content).toContain("Could not load the selected map.json file.");
    expect(appFile.content).toContain('aria-live="polite"');
    expect(appFile.content).toContain('accept=".json,application/json"');
    expect(appFile.content).toContain("Delivery");
    expect(appFile.content).toContain("Preflight");
    expect(appFile.content).toContain("Sources");
    expect(appFile.content).toContain("Spatial");
    expect(appFile.content).toContain("Follow-ups");

    expect(layerPanel.content).toContain("No layers in this spec yet.");
    expect(layerPanel.content).toContain("max-md:top-32");
    expect(legend.content).toContain("No visible layers yet.");
    expect(searchBox.content).toContain('aria-label="Search features"');
    expect(searchBox.content).toContain('type="button"');
    expect(basemapSwitcher.content).toContain("aria-pressed={active === b.id}");
    expect(basemapSwitcher.content).toContain("max-md:top-16");
  });
});

// ---------------------------------------------------------------------------
// generate.ts — hashPrompt
// ---------------------------------------------------------------------------

describe("cli-generate-hashPrompt", () => {
  it("returns sha256:<64-hex> format", () => {
    const hash = hashPrompt("Create a map with GeoJSON points");
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(hash).toHaveLength(71); // "sha256:" (7) + 64 hex chars
  });

  it("is deterministic — same input yields same hash", () => {
    const a = hashPrompt("hello world");
    const b = hashPrompt("hello world");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = hashPrompt("prompt one");
    const b = hashPrompt("prompt two");
    expect(a).not.toBe(b);
  });

  it("matches the normalizeWorkbenchProviderPlan regex", () => {
    const hash = hashPrompt("test prompt");
    // normalizeWorkbenchProviderPlan validates: /^sha256:[A-Za-z0-9._:-]{1,96}$/
    expect(hash).toMatch(/^sha256:[A-Za-z0-9._:-]{1,96}$/);
  });
});

describe("cli-generate-delivery-summary", () => {
  it("writes review-ready delivery evidence without raw prompt retention", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-generate-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);

      const result = await generate({
        projectName: "reviewable-map",
        provider: "mock",
        prompt: "Create a map showing private customer locations in Berlin",
        dryRun: false,
      });

      const summary = JSON.parse(readFileSync(join(dir, "reviewable-map", "delivery-summary.json"), "utf-8"));
      const evidence = JSON.parse(readFileSync(join(dir, "reviewable-map", "evidence.json"), "utf-8"));
      const preflight = JSON.parse(readFileSync(join(dir, "reviewable-map", "preflight.json"), "utf-8"));

      expect(result.files).toContain("preflight.json");
      expect(result.files).toContain("delivery-summary.json");
      expect(summary.retainedRawPrompt).toBe(false);
      expect(JSON.stringify(summary)).not.toContain("private customer locations");
      expect(JSON.stringify(preflight)).not.toContain("private customer locations");
      expect(summary.preflight).toMatchObject({
        ok: preflight.ok,
        status: preflight.status,
        validation: {
          valid: preflight.validation.valid,
          sourceCount: preflight.validation.stats.sourceCount,
          layerCount: preflight.validation.stats.layerCount,
          diagnosticCounts: preflight.validation.diagnosticCounts,
        },
        sourceReadiness: {
          status: preflight.sourceReadiness.status,
          summary: preflight.sourceReadiness.summary,
        },
        pmtiles: {
          status: preflight.pmtiles.status,
          summary: preflight.pmtiles.summary,
        },
      });
      expect(summary.delivery).toMatchObject({
        status: evidence.delivery.status,
        acceptance: evidence.delivery.acceptance,
        confirmationRequired: evidence.delivery.confirmationRequired,
      });
      expect(summary.delivery.sections).toEqual(evidence.delivery.sections);
      expect(summary.delivery.sourceReadiness).toMatchObject({
        total: evidence.delivery.sourceReadiness.length,
        supported: evidence.delivery.sourceReadiness.filter((source: { state: string }) => source.state === "supported")
          .length,
        readinessOnly: evidence.delivery.sourceReadiness.filter(
          (source: { state: string }) => source.state === "readiness-only",
        ).length,
        blocked: evidence.delivery.sourceReadiness.filter((source: { state: string }) => source.state === "blocked")
          .length,
        sources: evidence.delivery.sourceReadiness,
      });
      expect(summary.delivery.spatialQueryReadiness).toEqual(evidence.delivery.spatialQueryReadiness);
      expect(summary.delivery.sourcePromotionCandidates).toEqual(evidence.delivery.sourcePromotionCandidates ?? []);
      expect(summary.delivery.confirmations).toEqual(evidence.delivery.confirmations);
      expect(summary.delivery.followUps).toEqual(evidence.delivery.followUps);
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// app template — earthquake explorer demo
// ---------------------------------------------------------------------------

describe("cli-app-template-earthquake-demo", () => {
  it("earthquake fixture is valid JSON with required MapSpec fields", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const fixturePath = resolve(__dirname, "../fixtures/specs/valid/earthquake-explorer.json");
    const raw = readFileSync(fixturePath, "utf-8");
    const spec = JSON.parse(raw);
    expect(spec.version).toBe("0.2");
    expect(spec.sources).toBeDefined();
    expect(spec.sources.earthquakes).toBeDefined();
    expect(spec.sources.earthquakes.type).toBe("geojson");
    expect(spec.layers).toBeDefined();
    expect(spec.layers.length).toBeGreaterThan(0);
    expect(spec.view).toBeDefined();
  });

  it("earthquake fixture has GeoJSON features with magnitude data", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const fixturePath = resolve(__dirname, "../fixtures/specs/valid/earthquake-explorer.json");
    const raw = readFileSync(fixturePath, "utf-8");
    const spec = JSON.parse(raw);
    const features = spec.sources.earthquakes.data.features;
    expect(features.length).toBeGreaterThan(5);
    for (const feature of features) {
      expect(feature.geometry.type).toBe("Point");
      expect(feature.properties.mag).toBeGreaterThanOrEqual(5);
      expect(feature.properties.place).toBeDefined();
    }
  });

  it("app template can generate earthquake explorer project", () => {
    const tpl = getTemplate("app")!;
    const ctx = {
      projectName: "earthquake-explorer",
      provider: "deepseek",
      cliVersion: "1.0.0",
      appConfig: {
        appType: "explorer" as const,
        title: "2024 Global Earthquakes (M5+)",
        description: "Interactive map of significant earthquakes in 2024, colored by magnitude",
        components: ["LayerPanel", "Legend", "FeaturePopup", "SearchBox", "BasemapSwitcher"],
      },
    };
    const files = tpl.generate(ctx);
    const indexHtml = files.find((f) => f.path === "index.html")!;
    expect(indexHtml.content).toContain("2024 Global Earthquakes (M5+)");
    const readme = files.find((f) => f.path === "README.md")!;
    expect(readme.content).toContain("explorer");
    expect(readme.content).toContain("deepseek");
    expect(readme.content).toContain("delivery-summary.json");
  });
});

// ---------------------------------------------------------------------------
// no raw prompt retention
// ---------------------------------------------------------------------------

describe("cli-no-raw-prompt-retention", () => {
  it("hashPrompt output does not contain the original prompt text", () => {
    const prompt = "Create a map showing earthquake data in Japan";
    const hash = hashPrompt(prompt);
    expect(hash).not.toContain(prompt);
    expect(hash).not.toContain("earthquake");
    expect(hash).not.toContain("Japan");
  });

  it("hash is irreversible — not base64 or similar reversible encoding", () => {
    const prompt = "Show me population density across major cities in the world";
    const hash = hashPrompt(prompt);

    // The hash value after "sha256:" is 64 hex chars — far smaller than long prompts
    const hexPart = hash.slice(7); // strip "sha256:"
    expect(hexPart).toHaveLength(64);

    // Verify it is purely hex after the prefix
    expect(hexPart).toMatch(/^[0-9a-f]{64}$/);

    // Attempt base64 decode — should not yield the original prompt
    const decoded = Buffer.from(hexPart, "base64").toString("utf-8");
    expect(decoded).not.toContain(prompt);

    // The hash does not contain any recognizable substring from the prompt
    expect(hash).not.toContain("population");
    expect(hash).not.toContain("density");
  });
});

// ---------------------------------------------------------------------------
// provider.ts — resolveProviderProfile, readProviderApiKey, CLI_API_KEY_ENVS
// ---------------------------------------------------------------------------

describe("cli-provider-profile", () => {
  const ENV_KEYS = ["DEEPSEEK_API_KEY", "OPENAI_API_KEY"];
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  it("CLI_API_KEY_ENVS maps deepseek to DEEPSEEK_API_KEY", () => {
    expect(CLI_API_KEY_ENVS.deepseek).toBe("DEEPSEEK_API_KEY");
  });

  it("CLI_API_KEY_ENVS maps openai to OPENAI_API_KEY", () => {
    expect(CLI_API_KEY_ENVS.openai).toBe("OPENAI_API_KEY");
  });

  it("resolveProviderProfile uses defaults for deepseek", () => {
    const profile = resolveProviderProfile("deepseek");
    expect(profile.id).toBe("deepseek");
    expect(profile.model).toBe("deepseek-chat");
    expect(profile.baseUrl).toBe("https://api.deepseek.com/v1");
  });

  it("resolveProviderProfile uses defaults for openai", () => {
    const profile = resolveProviderProfile("openai");
    expect(profile.id).toBe("openai");
    expect(profile.model).toBe("gpt-4o-mini");
    expect(profile.baseUrl).toBe("https://api.openai.com/v1");
  });

  it("resolveProviderProfile overrides with custom model and baseUrl", () => {
    const profile = resolveProviderProfile("deepseek", {
      model: "deepseek-v2",
      baseUrl: "https://custom.api.com/v1",
    });
    expect(profile.model).toBe("deepseek-v2");
    expect(profile.baseUrl).toBe("https://custom.api.com/v1");
  });

  it("resolveProviderProfile lowercases the id", () => {
    const profile = resolveProviderProfile("DeepSeek");
    expect(profile.id).toBe("deepseek");
  });

  it("resolveProviderProfile returns empty strings for unknown provider", () => {
    const profile = resolveProviderProfile("unknown-provider");
    expect(profile.id).toBe("unknown-provider");
    expect(profile.model).toBe("");
    expect(profile.baseUrl).toBe("");
  });

  it("readProviderApiKey returns undefined when no env var set", () => {
    expect(readProviderApiKey("deepseek")).toBeUndefined();
  });

  it("readProviderApiKey reads DEEPSEEK_API_KEY", () => {
    process.env.DEEPSEEK_API_KEY = "sk-deepseek-test";
    expect(readProviderApiKey("deepseek")).toBe("sk-deepseek-test");
  });

  it("readProviderApiKey reads OPENAI_API_KEY", () => {
    process.env.OPENAI_API_KEY = "sk-openai-test";
    expect(readProviderApiKey("openai")).toBe("sk-openai-test");
  });

  it("readProviderApiKey trims whitespace", () => {
    process.env.DEEPSEEK_API_KEY = "  sk-trimmed  ";
    expect(readProviderApiKey("deepseek")).toBe("sk-trimmed");
  });

  it("readProviderApiKey returns undefined for empty string", () => {
    process.env.DEEPSEEK_API_KEY = "";
    expect(readProviderApiKey("deepseek")).toBeUndefined();
  });

  it("readProviderApiKey returns undefined for unknown provider", () => {
    expect(readProviderApiKey("unknown")).toBeUndefined();
  });
});
