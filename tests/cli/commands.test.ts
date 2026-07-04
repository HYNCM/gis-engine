import {
  CLI_API_KEY_ENVS,
  createProviderDiagnostics,
  parseArgs,
  readProviderApiKey,
  resolveProviderProfile,
} from "@gis-engine/cli";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    expect(config.verifyArtifacts).toBeUndefined();
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

  it("sets verifyArtifacts via --verify-artifacts with separate value", () => {
    const config = parseArgs(["--verify-artifacts", "./generated-map", "--json"]);
    expect(config.projectName).toBe("");
    expect(config.verifyArtifacts).toBe("./generated-map");
    expect(config.json).toBe(true);
  });

  it("sets verifyArtifacts via --verify-artifacts=value equals form", () => {
    const config = parseArgs(["--verify-artifacts=./generated-map"]);
    expect(config.verifyArtifacts).toBe("./generated-map");
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

  it("treats invalid timeout values as help-triggering input errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = parseArgs(["--timeout", "abc"]);
    expect(config.timeout).toBeUndefined();
    expect(config.help).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith("Error: --timeout must be a positive number of milliseconds.\n");
    errorSpy.mockRestore();
  });

  it("treats invalid timeout equals syntax as help-triggering input errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = parseArgs(["--timeout=0"]);
    expect(config.timeout).toBeUndefined();
    expect(config.help).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith("Error: --timeout must be a positive number of milliseconds.\n");
    errorSpy.mockRestore();
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
