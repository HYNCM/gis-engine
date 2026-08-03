import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { GIS_ENGINE_MCP_PROTOCOL_VERSION, listGisEngineTools } from "@gis-engine/ai";
import { describe, expect, it } from "vitest";

const requireFromAiPackage = createRequire(new URL("../../packages/ai/package.json", import.meta.url));
const { ListToolsResultSchema } = requireFromAiPackage("@modelcontextprotocol/sdk/types.js") as {
  ListToolsResultSchema: { safeParse(value: unknown): { success: boolean } };
};

const compatibilityFixtureUrl = new URL("../fixtures/mcp/compatibility-2026-07-28.json", import.meta.url);
const rfcUrl = new URL("../../docs/planning/feature-specs/mcp-2026-07-28-compatibility.md", import.meta.url);
const qualityDecisionUrl = new URL("../../docs/reviews/mcp-2026-07-28-quality-decision-2026-08-03.md", import.meta.url);
const aiPackageUrl = new URL("../../packages/ai/package.json", import.meta.url);
const lockfileUrl = new URL("../../pnpm-lock.yaml", import.meta.url);

const coverageKeys = [
  "discovery",
  "transportLifecycle",
  "resultType",
  "cacheMetadata",
  "subscriptions",
  "extensions",
  "oldClientBehavior",
] as const;

const canonicalToolNames = [
  "apply_commands",
  "validate_spec",
  "export_spec",
  "get_context_summary",
  "snapshot_spec",
  "explain_spec",
  "export_example_app",
  "diff_specs",
  "generate_spec",
  "inspect_data",
  "edit_spec",
  "query_features",
  "style_recommend",
  "transform_data",
] as const;

type CompatibilityFixture = {
  candidate: string;
  checkedAt: string;
  coverage: Record<
    (typeof coverageKeys)[number],
    { evidence: string; status: "supported" | "blocked" | "not-applicable" }
  >;
  currentDefault: string;
  decision: "go" | "no-go";
  frozenContract: {
    descriptorDialect: string;
    failureEnvelope: string;
    legacyJsonTextFallback: boolean;
    requiresInputSchema: boolean;
    requiresOutputSchema: boolean;
    successStructuredContent: boolean;
    toolNames: string[];
  };
  sdk: {
    candidateServerPackage: string;
    candidateServerVersion: string;
    currentLockedVersion: string;
    currentPackage: string;
    currentRange: string;
    legacyLatestVersion: string;
  };
};

function readFixture(): CompatibilityFixture {
  return JSON.parse(readFileSync(compatibilityFixtureUrl, "utf8")) as CompatibilityFixture;
}

describe("MCP 2026-07-28 no-default-change compatibility gate", () => {
  it("records a complete, dated No-go compatibility matrix", () => {
    const fixture = readFixture();
    const aiPackage = JSON.parse(readFileSync(aiPackageUrl, "utf8")) as {
      dependencies: Record<string, string>;
    };
    const lockfile = readFileSync(lockfileUrl, "utf8");

    expect(fixture).toMatchObject({
      currentDefault: "2025-11-25",
      candidate: "2026-07-28",
      decision: "no-go",
      checkedAt: "2026-08-04",
      sdk: {
        currentPackage: "@modelcontextprotocol/sdk",
        currentRange: "^1.29.0",
        currentLockedVersion: "1.29.0",
        legacyLatestVersion: "1.30.0",
        candidateServerPackage: "@modelcontextprotocol/server",
        candidateServerVersion: "2.0.0",
      },
    });
    expect(Object.keys(fixture.coverage).sort()).toEqual([...coverageKeys].sort());
    expect(Object.fromEntries(Object.entries(fixture.coverage).map(([key, { status }]) => [key, status]))).toEqual({
      discovery: "blocked",
      transportLifecycle: "blocked",
      resultType: "blocked",
      cacheMetadata: "blocked",
      subscriptions: "blocked",
      extensions: "not-applicable",
      oldClientBehavior: "supported",
    });
    expect(aiPackage.dependencies[fixture.sdk.currentPackage]).toBe(fixture.sdk.currentRange);
    expect(lockfile).toContain(`'@modelcontextprotocol/sdk@${fixture.sdk.currentLockedVersion}':`);
    expect(fixture.coverage.discovery.evidence).toContain("The 2026-07-28 server MUST implement server/discover");
    expect(fixture.coverage.discovery.evidence).toContain(
      "client MAY call it before other requests or use it as a probe",
    );
    expect(fixture.coverage.oldClientBehavior.evidence).toContain(
      "A 2026-07-28 client MUST treat a result from an earlier-protocol server that omits resultType as complete",
    );
    expect(fixture.coverage.oldClientBehavior.evidence).not.toContain("old client response");
  });

  it("keeps the current protocol and canonical descriptors frozen", async () => {
    const fixture = readFixture();
    const listedTools = await listGisEngineTools();

    expect(GIS_ENGINE_MCP_PROTOCOL_VERSION).toBe("2025-11-25");
    expect(ListToolsResultSchema.safeParse(listedTools).success).toBe(true);
    expect(listedTools.tools.map(({ name }) => name)).toEqual(canonicalToolNames);
    expect(
      listedTools.tools.every(
        ({ inputSchema, outputSchema }) =>
          inputSchema.$schema === "http://json-schema.org/draft-07/schema#" &&
          outputSchema?.$schema === "http://json-schema.org/draft-07/schema#",
      ),
    ).toBe(true);
    expect(fixture.frozenContract).toEqual({
      toolNames: canonicalToolNames,
      descriptorDialect: "http://json-schema.org/draft-07/schema#",
      requiresInputSchema: true,
      requiresOutputSchema: true,
      successStructuredContent: true,
      failureEnvelope: "{ diagnostics: Diagnostic[] }",
      legacyJsonTextFallback: true,
    });
  });

  it("documents every compatibility behavior, rollback, and promotion prohibition", () => {
    const rfc = readFileSync(rfcUrl, "utf8");
    const decision = readFileSync(qualityDecisionUrl, "utf8");

    for (const key of coverageKeys) {
      expect(rfc, `RFC should map ${key}`).toContain(`\`${key}\``);
    }
    expect(rfc).toContain("https://modelcontextprotocol.io/specification/2026-07-28/changelog.md");
    expect(rfc).toContain("https://github.com/modelcontextprotocol/typescript-sdk/blob/main/README.md");
    expect(rfc).toContain("@modelcontextprotocol/server@2.0.0");
    expect(rfc).toContain("@modelcontextprotocol/sdk@^1.29.0");
    expect(rfc).toContain("Rollback");
    expect(rfc).toContain("No-go");
    expect(rfc).toContain("2025-11-25");
    expect(rfc).toContain("2026-07-28");
    expect(rfc).toContain("server/discover");
    expect(rfc).toContain("server MUST implement `server/discover`");
    expect(rfc).toContain("client MAY call it before other requests or use it as a probe");
    expect(rfc).not.toContain("mandatory before normal requests");
    expect(rfc).toContain("subscriptions/listen");
    expect(rfc).toContain("resultType");
    expect(rfc).toContain("ttlMs");
    expect(rfc).toContain("cacheScope");
    expect(rfc).toContain(
      "A `2026-07-28` client MUST treat a result from an earlier-protocol server that omits `resultType` as complete",
    );
    expect(rfc).not.toContain("old client response");
    expect(rfc).not.toContain("from an old client");

    for (const invariant of canonicalToolNames) {
      expect(rfc, `RFC should freeze ${invariant}`).toContain(`\`${invariant}\``);
    }
    expect(decision).toContain("**No-go**");
    expect(decision).toContain("14-tool");
    expect(decision).toContain("draft-07");
    expect(decision).toContain("structuredContent");
    expect(decision).toContain("legacy JSON");
    expect(decision).toContain(
      "A `2026-07-28` client MUST treat a result from an earlier-protocol server that omits `resultType` as complete",
    );
    expect(decision).not.toContain("for old clients");
  });
});
