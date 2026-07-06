import type { CommunityTemplateDescriptor } from "@gis-engine/cli";
import {
  generateCommunityTemplate,
  getCommunityTemplate,
  isCommunityTemplateName,
  listCommunityTemplates,
  parseCommunityTemplateName,
  registerCommunityTemplate,
  unregisterCommunityTemplate,
  validateCommunityManifest,
} from "@gis-engine/cli";
import { afterEach, describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROJECT_NAME_PLACEHOLDER = "$" + "{{projectName}}";
const CLI_VERSION_PLACEHOLDER = "$" + "{{cliVersion}}";
const PROVIDER_PLACEHOLDER = "$" + "{{provider}}";

const TEST_TEMPLATE: CommunityTemplateDescriptor = {
  manifest: {
    name: "test-fixture",
    description: "A test fixture template",
    author: "test-author",
    version: "0.1.0",
    tags: ["test", "fixture"],
    files: [{ path: "README.md", content: `# ${PROJECT_NAME_PLACEHOLDER}\nVersion: ${CLI_VERSION_PLACEHOLDER}` }],
  },
  source: "test",
};

function cleanupTestTemplates(): void {
  unregisterCommunityTemplate("test-fixture");
  unregisterCommunityTemplate("test-custom");
  unregisterCommunityTemplate("test-url-only");
  unregisterCommunityTemplate("test-empty-content");
}

afterEach(cleanupTestTemplates);

// ---------------------------------------------------------------------------
// Name helpers
// ---------------------------------------------------------------------------

describe("cli-community-name-helpers", () => {
  it("isCommunityTemplateName returns true for community: prefix", () => {
    expect(isCommunityTemplateName("community:geojson-explorer")).toBe(true);
    expect(isCommunityTemplateName("community:test")).toBe(true);
  });

  it("isCommunityTemplateName returns false for non-community names", () => {
    expect(isCommunityTemplateName("static-html")).toBe(false);
    expect(isCommunityTemplateName("vite-ts")).toBe(false);
    expect(isCommunityTemplateName("")).toBe(false);
  });

  it("parseCommunityTemplateName strips the prefix", () => {
    expect(parseCommunityTemplateName("community:geojson-explorer")).toBe("geojson-explorer");
    expect(parseCommunityTemplateName("community:test")).toBe("test");
  });

  it("parseCommunityTemplateName returns the name unchanged when no prefix", () => {
    expect(parseCommunityTemplateName("static-html")).toBe("static-html");
    expect(parseCommunityTemplateName("my-template")).toBe("my-template");
  });
});

// ---------------------------------------------------------------------------
// Registry — register / get / unregister / list
// ---------------------------------------------------------------------------

describe("cli-community-registry", () => {
  it("registers and retrieves a template", () => {
    registerCommunityTemplate(TEST_TEMPLATE);

    const result = getCommunityTemplate("test-fixture");
    expect(result).toBeDefined();
    expect(result?.manifest.name).toBe("test-fixture");
    expect(result?.manifest.author).toBe("test-author");
    expect(result?.source).toBe("test");
  });

  it("returns undefined for unregistered template", () => {
    expect(getCommunityTemplate("nonexistent-template")).toBeUndefined();
  });

  it("unregisters a template and returns true", () => {
    registerCommunityTemplate(TEST_TEMPLATE);
    expect(unregisterCommunityTemplate("test-fixture")).toBe(true);
    expect(getCommunityTemplate("test-fixture")).toBeUndefined();
  });

  it("unregister returns false for non-existent template", () => {
    expect(unregisterCommunityTemplate("nonexistent-template")).toBe(false);
  });

  it("listCommunityTemplates returns sorted entries including built-ins", () => {
    const list = listCommunityTemplates();

    // Built-in templates should be present
    const names = list.map((entry) => entry.name);
    expect(names).toContain("geojson-explorer");
    expect(names).toContain("pmtiles-viewer");

    // Should be sorted alphabetically
    for (let i = 1; i < names.length; i++) {
      const current = names[i] ?? "";
      const previous = names[i - 1] ?? "";
      expect(current >= previous).toBe(true);
    }
  });

  it("listCommunityTemplates includes custom registered templates", () => {
    registerCommunityTemplate(TEST_TEMPLATE);

    const list = listCommunityTemplates();
    const testEntry = list.find((entry) => entry.name === "test-fixture");

    expect(testEntry).toBeDefined();
    expect(testEntry?.description).toBe("A test fixture template");
    expect(testEntry?.author).toBe("test-author");
    expect(testEntry?.version).toBe("0.1.0");
    expect(testEntry?.tags).toEqual(["test", "fixture"]);
    expect(testEntry?.source).toBe("test");
  });

  it("registerCommunityTemplate throws for invalid manifest", () => {
    expect(() =>
      registerCommunityTemplate({
        manifest: { name: "INVALID_NAME", description: "", author: "", version: "", tags: [], files: [] },
        source: "test",
      }),
    ).toThrow("Invalid community template manifest");
  });

  it("built-in geojson-explorer has expected structure", () => {
    const descriptor = getCommunityTemplate("geojson-explorer");
    expect(descriptor).toBeDefined();
    expect(descriptor?.manifest.files).toHaveLength(1);
    expect(descriptor?.manifest.files[0]?.path).toBe("index.html");
    expect(descriptor?.manifest.postInstallMessage).toContain("Open index.html");
    expect(descriptor?.source).toBe("built-in");
  });

  it("built-in pmtiles-viewer has expected structure", () => {
    const descriptor = getCommunityTemplate("pmtiles-viewer");
    expect(descriptor).toBeDefined();
    expect(descriptor?.manifest.files).toHaveLength(1);
    expect(descriptor?.manifest.files[0]?.path).toBe("index.html");
    expect(descriptor?.source).toBe("built-in");
  });
});

// ---------------------------------------------------------------------------
// Validation — validateCommunityManifest
// ---------------------------------------------------------------------------

describe("cli-community-validate-manifest", () => {
  it("returns valid for a correct manifest", () => {
    const result = validateCommunityManifest({
      name: "valid-template",
      description: "A valid template",
      author: "author",
      version: "1.0.0",
      tags: ["test"],
      files: [{ path: "index.html", content: "<html></html>" }],
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects null manifest", () => {
    const result = validateCommunityManifest(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Manifest must be a non-null object.");
  });

  it("rejects non-object manifest", () => {
    const result = validateCommunityManifest("not-an-object");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Manifest must be a non-null object.");
  });

  it("rejects empty name", () => {
    const result = validateCommunityManifest({
      name: "",
      description: "desc",
      author: "auth",
      version: "1.0.0",
      tags: [],
      files: [{ path: "f.txt", content: "x" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("name"))).toBe(true);
  });

  it("rejects non-kebab-case name", () => {
    const result = validateCommunityManifest({
      name: "INVALID_NAME",
      description: "desc",
      author: "auth",
      version: "1.0.0",
      tags: [],
      files: [{ path: "f.txt", content: "x" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("kebab-case"))).toBe(true);
  });

  it("rejects missing description", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "",
      author: "auth",
      version: "1.0.0",
      tags: [],
      files: [{ path: "f.txt", content: "x" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("description"))).toBe(true);
  });

  it("rejects missing author", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "desc",
      author: "",
      version: "1.0.0",
      tags: [],
      files: [{ path: "f.txt", content: "x" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("author"))).toBe(true);
  });

  it("rejects missing version", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "desc",
      author: "auth",
      version: "",
      tags: [],
      files: [{ path: "f.txt", content: "x" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("version"))).toBe(true);
  });

  it("rejects non-array tags", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "desc",
      author: "auth",
      version: "1.0.0",
      tags: "not-an-array",
      files: [{ path: "f.txt", content: "x" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("tags"))).toBe(true);
  });

  it("rejects non-string tag entries", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "desc",
      author: "auth",
      version: "1.0.0",
      tags: ["valid", 42],
      files: [{ path: "f.txt", content: "x" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("tags[1]"))).toBe(true);
  });

  it("rejects empty files array", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "desc",
      author: "auth",
      version: "1.0.0",
      tags: [],
      files: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("files"))).toBe(true);
  });

  it("rejects file without content or contentUrl", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "desc",
      author: "auth",
      version: "1.0.0",
      tags: [],
      files: [{ path: "f.txt" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("content or contentUrl"))).toBe(true);
  });

  it("rejects file with empty path", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "desc",
      author: "auth",
      version: "1.0.0",
      tags: [],
      files: [{ path: "", content: "x" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("path"))).toBe(true);
  });

  it("rejects non-object file entry", () => {
    const result = validateCommunityManifest({
      name: "valid-name",
      description: "desc",
      author: "auth",
      version: "1.0.0",
      tags: [],
      files: [null],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("must be an object"))).toBe(true);
  });

  it("collects multiple errors", () => {
    const result = validateCommunityManifest({
      name: "",
      description: "",
      author: "",
      version: "",
      tags: "bad",
      files: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Generation — generateCommunityTemplate
// ---------------------------------------------------------------------------

describe("cli-community-generate", () => {
  it("generates files from inline content with variable interpolation", () => {
    registerCommunityTemplate(TEST_TEMPLATE);

    const result = generateCommunityTemplate("community:test-fixture", {
      projectName: "my-project",
      cliVersion: "1.5.0",
      provider: "mock",
    });

    expect(result).toBeDefined();
    expect(result?.manifest.name).toBe("test-fixture");
    expect(result?.warnings).toHaveLength(0);

    // Should have README.md + .gis-engine-community.json
    expect(result?.files.length).toBe(2);

    const readme = result?.files.find((f) => f.path === "README.md");
    expect(readme?.content).toContain("# my-project");
    expect(readme?.content).toContain("Version: 1.5.0");
    expect(readme?.content).not.toContain(PROJECT_NAME_PLACEHOLDER);
    expect(readme?.content).not.toContain(CLI_VERSION_PLACEHOLDER);
  });

  it("always emits .gis-engine-community.json metadata", () => {
    registerCommunityTemplate(TEST_TEMPLATE);

    const result = generateCommunityTemplate("community:test-fixture", {
      projectName: "my-project",
      cliVersion: "1.5.0",
      provider: "mock",
    });

    const metadata = result?.files.find((f) => f.path === ".gis-engine-community.json");
    expect(metadata).toBeDefined();
    if (!metadata) throw new Error("Expected generated community metadata.");
    const parsed = JSON.parse(metadata.content);
    expect(parsed.template).toBe("test-fixture");
    expect(parsed.version).toBe("0.1.0");
    expect(parsed.author).toBe("test-author");
    expect(parsed.cliVersion).toBe("1.5.0");
    expect(parsed.projectName).toBe("my-project");
    expect(parsed.generatedAt).toBeDefined();
  });

  it("emits placeholder for contentUrl-only files", () => {
    registerCommunityTemplate({
      manifest: {
        name: "test-url-only",
        description: "URL-only template",
        author: "test",
        version: "1.0.0",
        tags: [],
        files: [{ path: "data.json", contentUrl: "https://example.com/data.json" }],
      },
      source: "test",
    });

    const result = generateCommunityTemplate("community:test-url-only", {
      projectName: "test",
      cliVersion: "1.5.0",
      provider: "mock",
    });

    expect(result?.warnings).toHaveLength(1);
    expect(result?.warnings[0]).toContain("https://example.com/data.json");
    expect(result?.warnings[0]).toContain("Download it manually");

    const dataFile = result?.files.find((f) => f.path === "data.json");
    expect(dataFile?.content).toContain("TODO: Download from");
  });

  it("emits warning for files with no content or contentUrl", () => {
    registerCommunityTemplate({
      manifest: {
        name: "test-empty-content",
        description: "Empty content template",
        author: "test",
        version: "1.0.0",
        tags: [],
        files: [{ path: "empty.txt", content: "", contentUrl: "" }],
      },
      source: "test",
    });

    const result = generateCommunityTemplate("community:test-empty-content", {
      projectName: "test",
      cliVersion: "1.5.0",
      provider: "mock",
    });

    expect(result?.warnings).toHaveLength(1);
    expect(result?.warnings[0]).toContain("no content or contentUrl");
    expect(result?.warnings[0]).toContain("skipped");
  });

  it("returns undefined for unregistered template name", () => {
    const result = generateCommunityTemplate("community:nonexistent", {
      projectName: "test",
      cliVersion: "1.5.0",
      provider: "mock",
    });

    expect(result).toBeUndefined();
  });

  it("interpolates provider variable", () => {
    registerCommunityTemplate({
      manifest: {
        name: "test-custom",
        description: "Provider test",
        author: "test",
        version: "1.0.0",
        tags: [],
        files: [{ path: "config.txt", content: `provider=${PROVIDER_PLACEHOLDER}` }],
      },
      source: "test",
    });

    const result = generateCommunityTemplate("community:test-custom", {
      projectName: "test",
      cliVersion: "1.5.0",
      provider: "deepseek",
    });

    const config = result?.files.find((f) => f.path === "config.txt");
    expect(config?.content).toBe("provider=deepseek");
  });

  it("generates built-in geojson-explorer with interpolated project name", () => {
    const result = generateCommunityTemplate("community:geojson-explorer", {
      projectName: "nyc-parks",
      cliVersion: "1.5.0",
      provider: "mock",
    });

    expect(result).toBeDefined();
    const html = result?.files.find((f) => f.path === "index.html");
    expect(html?.content).toContain("nyc-parks");
    expect(html?.content).not.toContain(PROJECT_NAME_PLACEHOLDER);
  });
});
