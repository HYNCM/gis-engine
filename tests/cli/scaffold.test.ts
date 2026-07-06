import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getTemplate, main, normalizeAppConfig, TEMPLATES } from "@gis-engine/cli";
import { describe, expect, it, vi } from "vitest";
import { isDirectCliExecution } from "../../packages/cli/src/bin.ts";
import { mustFindFile, mustGetTemplate } from "./helpers.ts";

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
    const tpl = mustGetTemplate("static-html");
    const ctx = { projectName: "test-project", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("index.html");
    expect(paths).toContain("README.md");
  });

  it("vite-ts template generates package.json, tsconfig.json, index.html, src/main.ts, README.md", () => {
    const tpl = mustGetTemplate("vite-ts");
    const ctx = { projectName: "test-project", provider: "mock", cliVersion: "1.1.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("package.json");
    expect(paths).toContain("tsconfig.json");
    expect(paths).toContain("index.html");
    expect(paths).toContain("src/main.ts");
    expect(paths).toContain("README.md");
    const pkgFile = mustFindFile(files, "package.json");
    const pkg = JSON.parse(pkgFile.content);
    expect(pkg.dependencies["@gis-engine/engine"]).toBe("1.x");
    expect(pkg.dependencies["@gis-engine/ai"]).toBe("1.x");
    expect(pkg.dependencies["maplibre-gl"]).toBeDefined();
    const mainFile = mustFindFile(files, "src/main.ts");
    expect(mainFile.content).toContain('import "maplibre-gl/dist/maplibre-gl.css";');
  });

  it("mapspec template generates map.json and README.md", () => {
    const tpl = mustGetTemplate("mapspec");
    const ctx = { projectName: "test-project", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("map.json");
    expect(paths).toContain("README.md");
    const readme = mustFindFile(files, "README.md");
    expect(readme.content).toContain("create-gis-map --preflight ./map.json --json");
  });

  it("generated files contain the project name", () => {
    const tpl = mustGetTemplate("static-html");
    const ctx = { projectName: "my-cool-map", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const indexHtml = mustFindFile(files, "index.html");
    const readme = mustFindFile(files, "README.md");
    expect(indexHtml.content).toContain("my-cool-map");
    expect(readme.content).toContain("my-cool-map");
  });

  it("scaffold templates include the required MapSpec view", () => {
    const ctx = { projectName: "view-test", provider: "mock", cliVersion: "1.0.0" };

    const staticHtml = mustFindFile(mustGetTemplate("static-html").generate(ctx), "index.html");
    expect(staticHtml.content).toContain("view:");
    expect(staticHtml.content).toContain('version: "0.1"');

    const viteMain = mustFindFile(mustGetTemplate("vite-ts").generate(ctx), "src/main.ts");
    expect(viteMain.content).toContain("view:");
    expect(viteMain.content).toContain('version: "0.1"');
    expect(viteMain.content).toContain("async function main()");
    expect(viteMain.content).not.toMatch(/^const map = await createMap/m);

    const mapspec = mustFindFile(mustGetTemplate("mapspec").generate(ctx), "map.json");
    expect(JSON.parse(mapspec.content).version).toBe("0.1");
    expect(JSON.parse(mapspec.content).view).toEqual({ center: [0, 0], zoom: 2 });

    const appMap = mustFindFile(mustGetTemplate("app").generate(ctx), "map.json");
    expect(JSON.parse(appMap.content).version).toBe("0.1");
    expect(JSON.parse(appMap.content).view).toEqual({ center: [0, 0], zoom: 2 });
  });

  it("generated package.json is valid JSON", () => {
    const tpl = mustGetTemplate("vite-ts");
    const ctx = { projectName: "json-test", provider: "mock", cliVersion: "0.0.0" };
    const files = tpl.generate(ctx);
    const pkgFile = mustFindFile(files, "package.json");
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
    const tpl = mustGetTemplate("app");
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
    const readme = mustFindFile(files, "README.md");
    expect(readme.content).toContain("create-gis-map --preflight ./map.json --json");
  });

  it("app template includes React and Tailwind dependencies", () => {
    const tpl = mustGetTemplate("app");
    const ctx = { projectName: "test-app", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const pkgFile = mustFindFile(files, "package.json");
    const pkg = JSON.parse(pkgFile.content);
    expect(pkg.dependencies["@gis-engine/engine"]).toBe("1.x");
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies["react-dom"]).toBeDefined();
    expect(pkg.dependencies["maplibre-gl"]).toBeDefined();
    expect(pkg.devDependencies.tailwindcss).toBeDefined();
    expect(pkg.devDependencies["@vitejs/plugin-react"]).toBeDefined();
  });

  it("app template generates all 5 UI components by default", () => {
    const tpl = mustGetTemplate("app");
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
    const tpl = mustGetTemplate("app");
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
    const tpl = mustGetTemplate("app");
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
    const tpl = mustGetTemplate("app");
    const ctx = { projectName: "test-app", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const appFile = mustFindFile(files, "src/App.tsx");
    expect(appFile.content).toContain('import LayerPanel from "./components/LayerPanel"');
    expect(appFile.content).toContain('import Legend from "./components/Legend"');
    expect(appFile.content).toContain('import FeaturePopup from "./components/FeaturePopup"');
    expect(appFile.content).toContain('import SearchBox from "./components/SearchBox"');
    expect(appFile.content).toContain('import BasemapSwitcher from "./components/BasemapSwitcher"');
    expect(appFile.content).toContain(
      'import { validateSpec, type Diagnostic, type ValidationReport } from "@gis-engine/engine";',
    );
    expect(appFile.content).toContain("const syncSpecToMap =");
    expect(appFile.content).toContain('nextMap.on("load"');
    expect(appFile.content).toContain('nextMap.on("error"');
    expect(appFile.content).toContain('setStatus("loading")');
    expect(appFile.content).toContain("const specValidation = useMemo(() => validateSpec(spec), [spec]);");
    expect(appFile.content).toContain("mapSpec as unknown as MapSpecShape");
    expect(appFile.content).toContain("buildValidationReport");
    expect(appFile.content).toContain("gis-engine.generated-app.mapspec-validation-report.v1");
    expect(appFile.content).toContain("diagnosticCounts: countDiagnostics(validation.diagnostics)");
    expect(appFile.content).toContain("const visibleSpecDiagnostics = useMemo(");
    expect(appFile.content).toContain("const blockingSpecDiagnostics = useMemo(");
    expect(appFile.content).toContain("MapSpec validation failed.");
    expect(appFile.content).toContain("targetMap.addSource");
    expect(appFile.content).toContain("targetMap.addLayer");
    expect(appFile.content).toContain('fetch("./delivery-summary.json"');
    expect(appFile.content).toContain('fetch("./artifact-manifest.json"');
    expect(appFile.content).toContain("type DeliveryLoadStatus");
    expect(appFile.content).toContain("type DeliverySectionSummary");
    expect(appFile.content).toContain("type ArtifactManifestShape");
    expect(appFile.content).toContain("isArtifactManifestShape");
    expect(appFile.content).toContain("isHtmlFallbackResponse");
    expect(appFile.content).toContain('"content-type"');
    expect(appFile.content).toContain("formatDeliveryState");
    expect(appFile.content).toContain("displayValue");
    expect(appFile.content).toContain("shortHash");
    expect(appFile.content).toContain("artifactFileHref");
    expect(appFile.content).toContain("type ArtifactVerificationFile");
    expect(appFile.content).toContain("isRequiredReviewArtifact");
    expect(appFile.content).toContain("normalizeSha256");
    expect(appFile.content).toContain('crypto.subtle.digest("SHA-256"');
    expect(appFile.content).toContain("verifyArtifactFile");
    expect(appFile.content).toContain("setArtifactVerificationStatus");
    expect(appFile.content).toContain("downloadJsonFile");
    expect(appFile.content).toContain("URL.createObjectURL");
    expect(appFile.content).toContain("link.download = filename");
    expect(appFile.content).toContain('trimmed.startsWith("/")');
    expect(appFile.content).toContain('part === ".."');
    expect(appFile.content).toContain('return "scaffold"');
    expect(appFile.content).toContain("deliverySummary?.preflight?.status");
    expect(appFile.content).toContain("deliverySummary?.preflight?.sourceReadiness?.summary");
    expect(appFile.content).toContain("deliverySummary?.preflight?.pmtiles?.summary");
    expect(appFile.content).toContain('setDeliveryLoadStatus("missing")');
    expect(appFile.content).toContain('setArtifactManifestLoadStatus("missing")');
    expect(appFile.content).toContain("artifactManifestState");
    expect(appFile.content).toContain("const [reviewDetailsOpen");
    expect(appFile.content).toContain("specValidation.valid ||");
    expect(appFile.content).not.toContain("setReviewDetailsOpen(false)");
  });

  it("app template exposes loading, reload, and responsive control states", () => {
    const tpl = mustGetTemplate("app");
    const ctx = { projectName: "test-app", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const appFile = mustFindFile(files, "src/App.tsx");
    const layerPanel = mustFindFile(files, "src/components/LayerPanel.tsx");
    const legend = mustFindFile(files, "src/components/Legend.tsx");
    const searchBox = mustFindFile(files, "src/components/SearchBox.tsx");
    const basemapSwitcher = mustFindFile(files, "src/components/BasemapSwitcher.tsx");
    const appCss = mustFindFile(files, "src/index.css");

    expect(appFile.content).toContain('type MapLoadStatus = "loading" | "ready" | "empty" | "error";');
    expect(appFile.content).toContain("Reload map.json");
    expect(appFile.content).toContain("Load map.json");
    expect(appFile.content).toContain("Download map.json");
    expect(appFile.content).toContain("Download validation report");
    expect(appFile.content).toContain("downloadCurrentSpec");
    expect(appFile.content).toContain("const reloadCurrentSpec = async () =>");
    expect(appFile.content).toContain('fetch("./map.json", { cache: "no-store" })');
    expect(appFile.content).toContain("Reloading map.json...");
    expect(appFile.content).toContain("Could not reload map.json.");
    expect(appFile.content).toContain("map.json must be available as a JSON file.");
    expect(appFile.content).toContain("!Array.isArray(value)");
    expect(appFile.content).toContain("downloadValidationReport");
    expect(appFile.content).toContain("mapspec-validation-report.json");
    expect(appFile.content).toContain("Could not download validation report.");
    expect(appFile.content).toContain("Could not download map.json.");
    expect(appFile.content).toContain("Could not load the selected map.json file.");
    expect(appFile.content).toContain("formatDiagnosticDetail");
    expect(appFile.content).toContain("Spec diagnostics");
    expect(appFile.content).toContain("Spec sources");
    expect(appFile.content).toContain("Spec layers");
    expect(appFile.content).toContain("specValidation.stats.visibleLayerCount");
    expect(appFile.content).toContain("visibleSpecDiagnostics.map");
    expect(appFile.content).toContain("No schema, semantic, or resource-policy diagnostics.");
    expect(appFile.content).toContain("diagnostic.code");
    expect(appFile.content).toContain("diagnostic.path");
    expect(appFile.content).toContain("diagnostic.message");
    expect(appFile.content).toContain('aria-live="polite"');
    expect(appFile.content).toContain('accept=".json,application/json"');
    expect(appFile.content).toContain("Delivery");
    expect(appFile.content).toContain("Preflight");
    expect(appFile.content).toContain("Sources");
    expect(appFile.content).toContain("Spatial");
    expect(appFile.content).toContain("Follow-ups");
    expect(appFile.content).toContain("Artifacts");
    expect(appFile.content).toContain("Integrity");
    expect(appFile.content).toContain("Artifact integrity");
    expect(appFile.content).toContain("Required review file integrity");
    expect(appFile.content).toContain("Checking required review artifacts...");
    expect(appFile.content).toContain("Review details");
    expect(appFile.content).toContain("disabled={!canShowReviewDetails}");
    expect(appFile.content).toContain("aria-expanded={reviewDetailsOpen}");
    expect(appFile.content).toContain("DeliverySectionSummary");
    expect(appFile.content).toContain("artifactManifestFiles.map");
    expect(appFile.content).toContain("artifactFileHref(file.path)");
    expect(appFile.content).toContain('aria-label={"Open " + (file.path ?? "artifact")}');
    expect(appFile.content).toContain('rel="noreferrer"');
    expect(appFile.content).toContain("deliverySections.map");
    expect(appFile.content).toContain("deliverySources.map");
    expect(appFile.content).toContain("deliveryPromotions.map");
    expect(appFile.content).toContain("deliveryConfirmations.map");
    expect(appFile.content).toContain("deliveryFollowUps.map");

    expect(layerPanel.content).toContain("No layers in this spec yet.");
    expect(layerPanel.content).toContain("max-md:top-32");
    expect(legend.content).toContain("No visible layers yet.");
    expect(searchBox.content).toContain('aria-label="Search features"');
    expect(searchBox.content).toContain('type="button"');
    expect(basemapSwitcher.content).toContain("aria-pressed={active === b.id}");
    expect(basemapSwitcher.content).toContain("max-md:top-16");
    expect(appCss.content.indexOf('@import "maplibre-gl/dist/maplibre-gl.css";')).toBeLessThan(
      appCss.content.indexOf("@tailwind base;"),
    );
  });

  it("app template review rail renders source next-action evidence", () => {
    const tpl = mustGetTemplate("app");
    const ctx = { projectName: "review-next-action", provider: "mock", cliVersion: "1.0.0" };
    const files = tpl.generate(ctx);
    const appFile = mustFindFile(files, "src/App.tsx");
    const readme = mustFindFile(files, "README.md");

    expect(appFile.content).toContain('confirmation {source.confirmationReasons.join(", ")}');
    expect(appFile.content).toContain('source.notes.join(" ")');
    expect(appFile.content).toContain("deliverySources.map");
    expect(readme.content).toContain("per-source confirmation reasons and next actions");
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
    const tpl = mustGetTemplate("app");
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
    const indexHtml = mustFindFile(files, "index.html");
    expect(indexHtml.content).toContain("2024 Global Earthquakes (M5+)");
    expect(indexHtml.content).toContain('<link rel="icon" href="data:," />');
    const readme = mustFindFile(files, "README.md");
    expect(readme.content).toContain("explorer");
    expect(readme.content).toContain("deepseek");
    expect(readme.content).toContain("delivery-summary.json");
    expect(readme.content).toContain("artifact-manifest.json");
    expect(readme.content).toContain("REVIEW.md");
    expect(readme.content).toContain("create-gis-map --verify-artifacts . --json");
  });
});

// ---------------------------------------------------------------------------
// bin.ts — scaffold integration (write to disk)
// ---------------------------------------------------------------------------

describe("cli-bin-scaffold-integration", () => {
  it("writes scaffold files to disk for static-html template", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const projectName = "test-static-html";
      await main([projectName, "--template", "static-html"]);

      const outDir = resolve(process.cwd(), projectName);
      try {
        expect(existsSync(join(outDir, "index.html"))).toBe(true);
        expect(existsSync(join(outDir, "README.md"))).toBe(true);
        const indexHtml = readFileSync(join(outDir, "index.html"), "utf-8");
        expect(indexHtml).toContain(projectName);
      } finally {
        rmSync(outDir, { recursive: true, force: true });
      }
    } finally {
      logSpy.mockRestore();
    }
  });

  it("dry-run mode does not write any files to disk", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const projectName = "test-dry-run-noop";
      const outDir = resolve(process.cwd(), projectName);
      // Ensure clean state
      rmSync(outDir, { recursive: true, force: true });

      await main([projectName, "--template", "vite-ts", "--dry-run"]);

      expect(existsSync(outDir)).toBe(false);
    } finally {
      logSpy.mockRestore();
    }
  });

  it("exits non-zero when project directory already exists without --yes", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const projectName = "dup-project";
      const outDir = resolve(process.cwd(), projectName);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, "placeholder.txt"), "existing", "utf-8");

      try {
        await expect(main([projectName])).rejects.toThrow("process.exit:1");
        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(errorSpy.mock.calls.some((call) => String(call[0]).includes("already exists"))).toBe(true);
      } finally {
        rmSync(outDir, { recursive: true, force: true });
      }
    } finally {
      errorSpy.mockRestore();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    }
  });

  it("overwrites existing directory with --yes flag", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const projectName = "overwrite-project";
      const outDir = resolve(process.cwd(), projectName);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, "old-file.txt"), "old content", "utf-8");

      try {
        await main([projectName, "--template", "mapspec", "--yes"]);

        expect(existsSync(join(outDir, "map.json"))).toBe(true);
        expect(existsSync(join(outDir, "README.md"))).toBe(true);
        // old file should still exist (--yes only overwrites scaffold files, doesn't delete others)
        expect(existsSync(join(outDir, "old-file.txt"))).toBe(true);
      } finally {
        rmSync(outDir, { recursive: true, force: true });
      }
    } finally {
      logSpy.mockRestore();
    }
  });

  it("exits non-zero when no project name and no mode flag provided", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await expect(main([])).rejects.toThrow("process.exit:1");
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy.mock.calls.some((call) => String(call[0]).includes("project-name"))).toBe(true);
    } finally {
      errorSpy.mockRestore();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    }
  });

  it("exits non-zero for unknown template name", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await expect(main(["some-project", "--template", "nonexistent-tpl"])).rejects.toThrow("process.exit:1");
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy.mock.calls.some((call) => String(call[0]).includes('unknown template "nonexistent-tpl"'))).toBe(
        true,
      );
    } finally {
      errorSpy.mockRestore();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    }
  });
});
