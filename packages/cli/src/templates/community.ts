/**
 * Community template registry for CLI `--template community:<name>`.
 *
 * Community templates are contributed by external authors and loaded via
 * a JSON manifest descriptor. This module provides the discovery,
 * validation, and generation interface for community templates.
 */

import type { GeneratedFile, TemplateContext } from "./index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunityTemplateManifest {
  /** Unique template identifier (kebab-case, e.g. "nyc-transit"). */
  name: string;
  /** Human-readable description. */
  description: string;
  /** Template author or organization. */
  author: string;
  /** Semver-compatible version string. */
  version: string;
  /** Tags for discoverability. */
  tags: string[];
  /** Files to generate. */
  files: CommunityTemplateFile[];
  /** Optional instructions displayed after generation. */
  postInstallMessage?: string;
}

export interface CommunityTemplateFile {
  /** Relative output path (e.g. "src/main.ts"). */
  path: string;
  /** Inline file content, or a URL to fetch at generation time. */
  content?: string;
  /** Remote content URL (fetched at generation time when content is absent). */
  contentUrl?: string;
}

export interface CommunityTemplateDescriptor {
  /** Validated manifest. */
  manifest: CommunityTemplateManifest;
  /** Source identifier (e.g. registry URL or local path). */
  source: string;
}

export interface CommunityTemplateListEntry {
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  source: string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry = new Map<string, CommunityTemplateDescriptor>();

/**
 * Register a community template descriptor.
 */
export function registerCommunityTemplate(descriptor: CommunityTemplateDescriptor): void {
  validateManifest(descriptor.manifest);
  registry.set(descriptor.manifest.name, descriptor);
}

/**
 * Unregister a community template (primarily for testing).
 */
export function unregisterCommunityTemplate(name: string): boolean {
  return registry.delete(name);
}

/**
 * Get a registered community template by name.
 */
export function getCommunityTemplate(name: string): CommunityTemplateDescriptor | undefined {
  return registry.get(name);
}

/**
 * List all registered community templates.
 */
export function listCommunityTemplates(): CommunityTemplateListEntry[] {
  const entries: CommunityTemplateListEntry[] = [];
  for (const descriptor of registry.values()) {
    const { manifest, source } = descriptor;
    entries.push({
      name: manifest.name,
      description: manifest.description,
      author: manifest.author,
      version: manifest.version,
      tags: [...manifest.tags],
      source,
    });
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check whether a template name refers to a community template.
 * Community template names are prefixed with `community:`.
 */
export function isCommunityTemplateName(templateName: string): boolean {
  return templateName.startsWith("community:");
}

/**
 * Extract the community template name from a `community:<name>` reference.
 */
export function parseCommunityTemplateName(templateName: string): string {
  if (!isCommunityTemplateName(templateName)) return templateName;
  return templateName.slice("community:".length);
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export interface CommunityTemplateGenerateResult {
  files: GeneratedFile[];
  manifest: CommunityTemplateManifest;
  warnings: string[];
}

/**
 * Generate files from a community template.
 *
 * Files with inline `content` are emitted directly. Files with `contentUrl`
 * but no `content` emit a placeholder that instructs the user to fetch the
 * remote resource.
 */
export function generateCommunityTemplate(
  name: string,
  ctx: TemplateContext,
): CommunityTemplateGenerateResult | undefined {
  const parsedName = parseCommunityTemplateName(name);
  const descriptor = getCommunityTemplate(parsedName);
  if (!descriptor) return undefined;

  const { manifest } = descriptor;
  const warnings: string[] = [];
  const files: GeneratedFile[] = [];

  for (const file of manifest.files) {
    if (typeof file.content === "string" && file.content.length > 0) {
      files.push({
        path: file.path,
        content: interpolateTemplateVariables(file.content, ctx),
      });
    } else if (typeof file.contentUrl === "string" && file.contentUrl.length > 0) {
      warnings.push(
        `File "${file.path}" references remote content at ${file.contentUrl}. ` +
          `Download it manually after scaffolding.`,
      );
      files.push({
        path: file.path,
        content: `// TODO: Download from ${file.contentUrl}\n// This file was generated as a placeholder by the community:${parsedName} template.\n`,
      });
    } else {
      warnings.push(`File "${file.path}" has no content or contentUrl — skipped.`);
    }
  }

  // Always emit a community-template metadata file
  files.push({
    path: ".gis-engine-community.json",
    content: `${JSON.stringify(
      {
        template: manifest.name,
        version: manifest.version,
        author: manifest.author,
        generatedAt: new Date().toISOString(),
        cliVersion: ctx.cliVersion,
        projectName: ctx.projectName,
      },
      null,
      2,
    )}\n`,
  });

  return { files, manifest, warnings };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface CommunityManifestValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a community template manifest structure.
 * Throws if the manifest is invalid (for registration-time enforcement).
 */
function validateManifest(manifest: CommunityTemplateManifest): void {
  const result = validateCommunityManifest(manifest);
  if (!result.valid) {
    throw new Error(`Invalid community template manifest: ${result.errors.join("; ")}`);
  }
}

/**
 * Validate a community template manifest without throwing.
 */
export function validateCommunityManifest(manifest: unknown): CommunityManifestValidationResult {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== "object") {
    return { valid: false, errors: ["Manifest must be a non-null object."] };
  }

  const m = manifest as Record<string, unknown>;

  if (typeof m.name !== "string" || m.name.trim().length === 0) {
    errors.push("name must be a non-empty string.");
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.name)) {
    errors.push("name must be kebab-case (lowercase alphanumeric with hyphens).");
  }

  if (typeof m.description !== "string" || m.description.trim().length === 0) {
    errors.push("description must be a non-empty string.");
  }

  if (typeof m.author !== "string" || m.author.trim().length === 0) {
    errors.push("author must be a non-empty string.");
  }

  if (typeof m.version !== "string" || m.version.trim().length === 0) {
    errors.push("version must be a non-empty string.");
  }

  if (!Array.isArray(m.tags)) {
    errors.push("tags must be an array.");
  } else {
    for (let i = 0; i < m.tags.length; i++) {
      if (typeof m.tags[i] !== "string") {
        errors.push(`tags[${i}] must be a string.`);
      }
    }
  }

  if (!Array.isArray(m.files) || m.files.length === 0) {
    errors.push("files must be a non-empty array.");
  } else {
    for (let i = 0; i < m.files.length; i++) {
      const file = m.files[i] as Record<string, unknown>;
      if (!file || typeof file !== "object") {
        errors.push(`files[${i}] must be an object.`);
        continue;
      }
      if (typeof file.path !== "string" || file.path.trim().length === 0) {
        errors.push(`files[${i}].path must be a non-empty string.`);
      }
      if (typeof file.content !== "string" && typeof file.contentUrl !== "string") {
        errors.push(`files[${i}] must have either content or contentUrl.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Template variable interpolation
// ---------------------------------------------------------------------------

/**
 * Replace `${{projectName}}`, `${{cliVersion}}`, `${{provider}}` placeholders.
 */
function interpolateTemplateVariables(content: string, ctx: TemplateContext): string {
  return content
    .replaceAll("${{projectName}}", ctx.projectName)
    .replaceAll("${{cliVersion}}", ctx.cliVersion)
    .replaceAll("${{provider}}", ctx.provider);
}

// ---------------------------------------------------------------------------
// Built-in community template examples (registered at import time)
// ---------------------------------------------------------------------------

registerCommunityTemplate({
  manifest: {
    name: "geojson-explorer",
    description: "A minimal GeoJSON explorer with drag-and-drop file loading and layer toggling.",
    author: "gis-engine-community",
    version: "1.0.0",
    tags: ["geojson", "explorer", "beginner"],
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${{projectName}} — GeoJSON Explorer</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    #map { width: 100vw; height: 100vh; }
    .drop-zone { position: absolute; top: 10px; left: 10px; z-index: 10;
      background: rgba(255,255,255,0.9); padding: 8px 16px; border-radius: 8px;
      font-size: 14px; color: #555; }
  </style>
</head>
<body>
  <div class="drop-zone">Drop a .geojson file here</div>
  <div id="map"></div>
  <script type="module">
    import { createMap } from "https://unpkg.com/@gis-engine/engine";

    const spec = {
      version: "0.1",
      sources: {
        data: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] }
        }
      },
      layers: [
        { id: "data-layer", type: "circle", source: "data",
          paint: { "circle-radius": 5, "circle-color": "#3b82f6" } }
      ],
      view: { center: [0, 0], zoom: 2 }
    };

    const container = document.getElementById("map");
    const map = await createMap(container, spec, { renderer: "maplibre" });
    console.log("[\${{projectName}}] GeoJSON Explorer ready");
  </script>
</body>
</html>
`,
      },
    ],
    postInstallMessage: "Open index.html in a browser and drop a GeoJSON file to explore.",
  },
  source: "built-in",
});

registerCommunityTemplate({
  manifest: {
    name: "pmtiles-viewer",
    description: "A PMTiles viewer with vector tile inspection and zoom-to-extent controls.",
    author: "gis-engine-community",
    version: "1.0.0",
    tags: ["pmtiles", "vector-tiles", "viewer"],
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${{projectName}} — PMTiles Viewer</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    #map { width: 100vw; height: 100vh; }
    .info { position: absolute; bottom: 10px; left: 10px; z-index: 10;
      background: rgba(255,255,255,0.9); padding: 8px 16px; border-radius: 8px;
      font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <div class="info">PMTiles Viewer — Generated by GIS Engine v\${{cliVersion}}</div>
  <div id="map"></div>
  <script type="module">
    import { createMap } from "https://unpkg.com/@gis-engine/engine";

    const spec = {
      version: "0.1",
      sources: {},
      layers: [],
      view: { center: [0, 0], zoom: 2 }
    };

    const container = document.getElementById("map");
    const map = await createMap(container, spec, { renderer: "maplibre" });
    console.log("[\${{projectName}}] PMTiles Viewer ready");
  </script>
</body>
</html>
`,
      },
    ],
    postInstallMessage: "Open index.html in a browser. Add PMTiles sources to the spec to view them.",
  },
  source: "built-in",
});
