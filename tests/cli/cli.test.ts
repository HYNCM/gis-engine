import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  parseArgs,
  createProviderDiagnostics,
  getTemplate,
  TEMPLATES,
  hashPrompt,
} from "@gis-engine/cli";

// ---------------------------------------------------------------------------
// config.ts — parseArgs
// ---------------------------------------------------------------------------

describe("cli-config-parseArgs", () => {
  const ENV_KEYS = ["GIS_ENGINE_TEMPLATE", "GIS_ENGINE_PROVIDER", "GIS_ENGINE_PROMPT", "GIS_ENGINE_MODEL", "GIS_ENGINE_BASE_URL"];
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
    const config = parseArgs([
      "my-map",
      "--generate",
      "-p", "mock",
      "--prompt", "test",
      "--dry-run",
    ]);
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
      "-p", "deepseek",
      "--model", "deepseek-chat",
      "--base-url", "https://api.deepseek.com/v1",
      "--prompt", "test",
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
// templates/index.ts — getTemplate, TEMPLATES
// ---------------------------------------------------------------------------

describe("cli-templates", () => {
  it("TEMPLATES contains the three known template names", () => {
    expect(TEMPLATES).toContain("static-html");
    expect(TEMPLATES).toContain("vite-ts");
    expect(TEMPLATES).toContain("mapspec");
  });

  it("getTemplate returns a Template for static-html", () => {
    const tpl = getTemplate("static-html");
    expect(tpl).toBeDefined();
    expect(tpl!.name).toBe("static-html");
  });

  it("getTemplate returns a Template for vite-ts", () => {
    const tpl = getTemplate("vite-ts");
    expect(tpl).toBeDefined();
    expect(tpl!.name).toBe("vite-ts");
  });

  it("getTemplate returns a Template for mapspec", () => {
    const tpl = getTemplate("mapspec");
    expect(tpl).toBeDefined();
    expect(tpl!.name).toBe("mapspec");
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
  });

  it("mapspec template generates map.json and README.md", () => {
    const tpl = getTemplate("mapspec")!;
    const ctx = { projectName: "test-project", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("map.json");
    expect(paths).toContain("README.md");
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

  it("generated package.json is valid JSON", () => {
    const tpl = getTemplate("vite-ts")!;
    const ctx = { projectName: "json-test", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const pkgFile = files.find((f) => f.path === "package.json")!;
    expect(() => JSON.parse(pkgFile.content)).not.toThrow();
    const pkg = JSON.parse(pkgFile.content);
    expect(pkg.name).toBe("json-test");
  });
});

// ---------------------------------------------------------------------------
// generate.ts — hashPrompt
// ---------------------------------------------------------------------------

describe("cli-generate-hashPrompt", () => {
  it("returns a 16-character hex string", () => {
    const hash = hashPrompt("Create a map with GeoJSON points");
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
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

  it("handles empty string without error", () => {
    const hash = hashPrompt("");
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
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
    const prompt = "Show me population density";
    const hash = hashPrompt(prompt);

    // A 16-char hex string cannot be base64-decoded back to the prompt
    // Verify the output space (16 hex chars) is far smaller than the input
    expect(hash.length).toBeLessThan(prompt.length);

    // Verify it is purely hex, not a reversible encoding
    expect(hash).toMatch(/^[0-9a-f]{16}$/);

    // Attempt base64 decode — should not yield the original prompt
    const decoded = Buffer.from(hash, "base64").toString("utf-8");
    expect(decoded).not.toContain(prompt);
  });
});
