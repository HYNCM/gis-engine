import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "@gis-engine/cli";
import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// bin.ts — help and version modes
// ---------------------------------------------------------------------------

describe("cli-bin-help-version", () => {
  it("prints help text when --help is passed", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await main(["--help"]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = String(logSpy.mock.calls[0]?.[0]);
      expect(output).toContain("Usage: create-gis-map");
      expect(output).toContain("--generate");
      expect(output).toContain("--preflight");
      expect(output).toContain("--lint");
      expect(output).toContain("--verify-artifacts");
      expect(output).toContain("Templates");
    } finally {
      logSpy.mockRestore();
    }
  });

  it("prints help text when -h shorthand is passed", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await main(["-h"]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = String(logSpy.mock.calls[0]?.[0]);
      expect(output).toContain("Usage: create-gis-map");
    } finally {
      logSpy.mockRestore();
    }
  });

  it("prints version when --version is passed", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await main(["--version"]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = String(logSpy.mock.calls[0]?.[0]);
      expect(output).toMatch(/create-gis-map v\d+\.\d+\.\d+/);
    } finally {
      logSpy.mockRestore();
    }
  });

  it("prints version when -v shorthand is passed", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await main(["-v"]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = String(logSpy.mock.calls[0]?.[0]);
      expect(output).toMatch(/create-gis-map v\d+\.\d+\.\d+/);
    } finally {
      logSpy.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// bin.ts — error paths
// ---------------------------------------------------------------------------

describe("cli-bin-error-paths", () => {
  it("exits non-zero when no project name and no mode flag", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    try {
      await expect(main([])).rejects.toThrow("process.exit:1");

      expect(exitSpy).toHaveBeenCalledWith(1);
      const errorOutput = String(errorSpy.mock.calls[0]?.[0]);
      expect(errorOutput).toContain("<project-name> is required");
    } finally {
      errorSpy.mockRestore();
      logSpy.mockRestore();
      exitSpy.mockRestore();
    }
  });

  it("exits non-zero for unknown template name", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-cli-bin-err-"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    try {
      await expect(main(["my-project", "--template", "nonexistent-template"])).rejects.toThrow("process.exit:1");

      expect(exitSpy).toHaveBeenCalledWith(1);
      const errorOutput = String(errorSpy.mock.calls[0]?.[0]);
      expect(errorOutput).toContain("unknown template");
      expect(errorOutput).toContain("nonexistent-template");
    } finally {
      errorSpy.mockRestore();
      exitSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("suggests community templates when community: prefix is used with unknown name", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    try {
      await expect(main(["my-project", "--template", "community:nonexistent"])).rejects.toThrow("process.exit:1");

      expect(exitSpy).toHaveBeenCalledWith(1);
      const errorOutput = String(errorSpy.mock.calls[0]?.[0]);
      expect(errorOutput).toContain("unknown template");
      // Should list available community templates
      const secondCall = String(errorSpy.mock.calls[1]?.[0] ?? "");
      expect(secondCall).toContain("Available community templates");
    } finally {
      errorSpy.mockRestore();
      exitSpy.mockRestore();
    }
  });

  it("exits non-zero when target directory exists without --yes", async () => {
    const parentDir = mkdtempSync(join(tmpdir(), "gis-engine-cli-bin-exists-"));
    const cwd = process.cwd();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    try {
      process.chdir(parentDir);
      // Create the target directory first
      const { mkdirSync } = await import("node:fs");
      mkdirSync(join(parentDir, "existing-project"));

      await expect(main(["existing-project", "--template", "static-html"])).rejects.toThrow("process.exit:1");

      expect(exitSpy).toHaveBeenCalledWith(1);
      const errorOutput = String(errorSpy.mock.calls[0]?.[0]);
      expect(errorOutput).toContain("already exists");
    } finally {
      process.chdir(cwd);
      errorSpy.mockRestore();
      logSpy.mockRestore();
      exitSpy.mockRestore();
      rmSync(parentDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// bin.ts — scaffold mode (quick smoke)
// ---------------------------------------------------------------------------

describe("cli-bin-scaffold-smoke", () => {
  it("scaffolds a mapspec project with correct output", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-bin-scaffold-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);

      await main(["test-scaffold", "--template", "mapspec"]);

      const { existsSync, readFileSync } = await import("node:fs");
      expect(existsSync(join(dir, "test-scaffold", "map.json"))).toBe(true);
      const map = JSON.parse(readFileSync(join(dir, "test-scaffold", "map.json"), "utf-8"));
      expect(map.version).toBe("0.1");
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("scaffolds with --yes flag to overwrite existing directory", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-bin-scaffold-yes-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);

      // First scaffold
      await main(["overwrite-test", "--template", "mapspec"]);
      // Second scaffold with --yes
      await main(["overwrite-test", "--template", "mapspec", "--yes"]);

      const { existsSync } = await import("node:fs");
      expect(existsSync(join(dir, "overwrite-test", "map.json"))).toBe(true);
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("scaffolds with community template using community: prefix", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-bin-community-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);

      await main(["community-test", "--template", "community:geojson-explorer"]);

      const { existsSync } = await import("node:fs");
      expect(existsSync(join(dir, "community-test", "index.html"))).toBe(true);
      expect(existsSync(join(dir, "community-test", ".gis-engine-community.json"))).toBe(true);
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prints provider diagnostics in scaffold output", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-engine-bin-provider-"));
    const cwd = process.cwd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      process.chdir(dir);

      await main(["provider-test", "--template", "mapspec", "--provider", "mock"]);

      const logCalls = logSpy.mock.calls.map((call) => String(call[0]));
      const hasProviderLine = logCalls.some((line) => line.includes("Provider:") && line.includes("mock"));
      expect(hasProviderLine).toBe(true);
    } finally {
      process.chdir(cwd);
      logSpy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
