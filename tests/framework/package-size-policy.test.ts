import { chmodSync, mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  checkPackageSizes,
  loadPackageSizePolicy,
  measureCanonicalDistGzip,
  renderPackageSizeSummary,
  validatePackageSizeConsumerContent,
  validatePackageSizePolicy,
} from "../../scripts/package-size-policy.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");
const policyPath = join(repoRoot, "config/package-size-budgets.json");

describe("package size policy", () => {
  it("loads one strict, versioned authority for engine and CLI budgets", () => {
    const policy = loadPackageSizePolicy(policyPath);

    expect(policy).toMatchObject({
      schemaVersion: 1,
      measurement: {
        algorithm: "canonical-dist-gzip-v1",
        scope: "complete-dist",
        gzipLevel: 9,
      },
      advisoryRegressionPercent: 5,
      packages: {
        engine: {
          distPath: "packages/engine/dist",
          budgetBytes: 204_800,
          semantics: "blocking",
          baselineBytes: 193_998,
          baselineRevision: "c176f317227991781ab35b13b08bcf12923329d2",
        },
        cli: {
          distPath: "packages/cli/dist",
          budgetBytes: 65_536,
          semantics: "blocking",
          baselineBytes: 60_730,
          baselineRevision: "c176f317227991781ab35b13b08bcf12923329d2",
        },
      },
    });
    expect(policy.packages.engine.measuredAt).toMatch(/^2026-08-05T/);
    expect(policy.packages.engine.rationale).toContain("130");
    expect(policy.packages.cli.rationale).toContain("35");
  });

  it("uses stable path/length/content framing and ignores timestamps and permissions", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-size-policy-"));
    const dist = join(root, "dist");
    mkdirSync(join(dist, "nested"), { recursive: true });
    writeFileSync(join(dist, "z.js"), "export const z = 1;\n");
    writeFileSync(join(dist, "nested/a.d.ts"), "export declare const a: string;\n");

    const expectedFrame = Buffer.concat([
      Buffer.from("gis-engine-dist-gzip-v1\0"),
      frame("nested/a.d.ts", Buffer.from("export declare const a: string;\n")),
      frame("z.js", Buffer.from("export const z = 1;\n")),
    ]);
    const expectedBytes = gzipSync(expectedFrame, { level: 9, mtime: 0 }).byteLength;
    const first = measureCanonicalDistGzip(dist);

    expect(first).toEqual({ algorithm: "canonical-dist-gzip-v1", bytes: expectedBytes, fileCount: 2 });

    const old = new Date("2001-01-01T00:00:00Z");
    chmodSync(join(dist, "z.js"), 0o755);
    utimesSync(join(dist, "z.js"), old, old);
    expect(measureCanonicalDistGzip(dist)).toEqual(first);
  });

  it("measures the current dist against the checked-in baselines", () => {
    const policy = loadPackageSizePolicy(policyPath);
    const result = checkPackageSizes(policy, { rootDir: repoRoot });

    expect(result.results.engine).toMatchObject({ fileCount: 210, status: "pass" });
    expect(result.results.cli).toMatchObject({ bytes: 60_730, fileCount: 44, status: "pass" });
    expect(result.results.engine.bytes).toBeGreaterThanOrEqual(policy.packages.engine.baselineBytes);
    expect(result.results.engine.bytes).toBeLessThanOrEqual(policy.packages.engine.budgetBytes);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(renderPackageSizeSummary(result)).toContain("193998");
    expect(renderPackageSizeSummary(result)).toContain("blocking");
  });

  it("fails closed for malformed policy and missing dist directories", () => {
    const policy = loadPackageSizePolicy(policyPath);
    expect(() => validatePackageSizePolicy({ ...policy, schemaVersion: 2 })).toThrow(/schemaVersion/);
    expect(() =>
      validatePackageSizePolicy({
        ...policy,
        packages: { ...policy.packages, engine: { ...policy.packages.engine, semantics: "maybe" } },
      }),
    ).toThrow(/semantics/);

    const missing = checkPackageSizes(
      {
        ...policy,
        packages: { engine: { ...policy.packages.engine, distPath: "does-not-exist" } },
      },
      { rootDir: repoRoot },
    );
    expect(missing.exitCode).toBe(1);
    expect(missing.results.engine).toMatchObject({ status: "error", semantics: "blocking" });
  });

  it("blocks over-budget packages but reports advisory packages without failing", () => {
    const root = mkdtempSync(join(tmpdir(), "gis-engine-size-semantics-"));
    writeFixture(join(root, "blocking/dist/a.js"), "large payload".repeat(100));
    writeFixture(join(root, "advisory/dist/a.js"), "large payload".repeat(100));
    const basePolicy = loadPackageSizePolicy(policyPath);
    const packageRule = {
      ...basePolicy.packages.engine,
      budgetBytes: 1,
      baselineBytes: 1,
      baselineRevision: "test-revision",
      measuredAt: "2026-08-05T00:00:00Z",
      rationale: "deterministic semantics test fixture",
    };
    const result = checkPackageSizes(
      {
        ...basePolicy,
        packages: {
          blocking: { ...packageRule, distPath: "blocking/dist", semantics: "blocking" },
          advisory: { ...packageRule, distPath: "advisory/dist", semantics: "advisory" },
        },
      },
      { rootDir: root },
    );

    expect(result.results.blocking.status).toBe("fail");
    expect(result.results.advisory.status).toBe("warning");
    expect(result.exitCode).toBe(1);

    const advisoryOnly = checkPackageSizes(
      { ...basePolicy, packages: { advisory: { ...packageRule, distPath: "advisory/dist", semantics: "advisory" } } },
      { rootDir: root },
    );
    expect(advisoryOnly.results.advisory.status).toBe("warning");
    expect(advisoryOnly.exitCode).toBe(0);
  });

  it("keeps workflow, package script, and active docs aligned with the policy", () => {
    const workflow = readFileSync(join(repoRoot, ".github/workflows/bundle-size.yml"), "utf8");
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
    const docs = [
      "docs/engineering/contract-freeze.md",
      "docs/engineering/performance-benchmarks.md",
      "docs/website/guide/performance.md",
    ].map((path) => readFileSync(join(repoRoot, path), "utf8"));

    expect(packageJson.scripts["size:check"]).toBe("node scripts/check-package-size.mjs");
    expect(workflow).toContain("pnpm size:check");
    expect(workflow).toContain("config/package-size-budgets.json");
    expect(workflow).toContain("scripts/package-size-policy.mjs");
    expect(workflow).toContain("tests/framework/package-size-policy.test.ts");
    expect(workflow).not.toMatch(/BUDGET_LIMIT|170\s*KB|70\s*KB/);

    for (const content of docs) {
      expect(content).toContain("config/package-size-budgets.json");
      expect(content).toContain("canonical-dist-gzip-v1");
      expect(content).toMatch(/200\s*KiB/);
      expect(content).toMatch(/64\s*KiB/);
      expect(content).toMatch(/blocking/i);
      expect(content).toMatch(/5%/);
      expect(content).not.toMatch(/130\s*KB|35\s*KB/);
      expect(validatePackageSizeConsumerContent(policyPath, content)).toEqual({ valid: true, issues: [] });
    }
  });

  it("detects a tampered consumer budget instead of allowing policy drift", () => {
    const policy = loadPackageSizePolicy(policyPath);
    const activeDoc = readFileSync(join(repoRoot, "docs/engineering/contract-freeze.md"), "utf8");
    const tampered = activeDoc.replace("200 KiB", "201 KiB");

    expect(validatePackageSizeConsumerContent(policy, activeDoc).valid).toBe(true);
    expect(validatePackageSizeConsumerContent(policy, tampered)).toEqual({
      valid: false,
      issues: [expect.stringContaining("engine")],
    });
  });
});

function frame(relativePath: string, content: Buffer): Buffer {
  return Buffer.concat([Buffer.from(`${relativePath}\0${content.byteLength}\0`), content, Buffer.from("\0")]);
}

function writeFixture(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}
