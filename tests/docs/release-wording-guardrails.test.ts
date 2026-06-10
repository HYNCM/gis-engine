import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const publicWordingFiles = [
  "README.md",
  "CHANGELOG.md",
  "docs/website/release-notes.md",
  "docs/migration/v0.x-to-v1.0.md",
  "docs/website/api/scene3d.md",
  "docs/engineering/supported-feature-matrix.md",
  "docs/engineering/release-wording-guardrails.md",
  "docs/planning/feature-specs/generated-app-delivery-ux.md",
  "docs/planning/feature-specs/cloud-native-source-readiness.md",
  "docs/planning/feature-specs/spatial-analysis-promotion-criteria.md",
  "packages/ai/README.md",
  "packages/scene3d/README.md",
  "packages/scene3d-three-adapter/README.md",
] as const;

const requiredGuardrails: Array<{
  file: (typeof publicWordingFiles)[number];
  patterns: RegExp[];
}> = [
  {
    file: "README.md",
    patterns: [
      /Generated-app scene browsing is an extension-only delivery signal/,
      /stable\s+`view\.mode: "scene3d"` remains blocked/,
    ],
  },
  {
    file: "CHANGELOG.md",
    patterns: [
      /does not enable stable 3D runtime rendering/,
      /stable-runtime blocker codes.*stable `view\.mode: "scene3d"` blocked/s,
    ],
  },
  {
    file: "docs/website/release-notes.md",
    patterns: [/`view\.mode: "scene3d"` is reserved and not a stable runtime mode/, /runtime-blocked cloud-native loaders remain explicitly\s+blocked/],
  },
  {
    file: "docs/migration/v0.x-to-v1.0.md",
    patterns: [/The public MCP tool list remains/, /does not mean archive parsing, hidden fetches, worker-backed\s+runtime queries/],
  },
  {
    file: "docs/website/api/scene3d.md",
    patterns: [/Stable `view\.mode: "scene3d"` runtime: blocked/, /Do not read API presence here as evidence of stable 3D runtime support/],
  },
  {
    file: "packages/ai/README.md",
    patterns: [/Scene browsing remains extension-only/, /must not be cited as stable renderer evidence/],
  },
  {
    file: "docs/planning/feature-specs/generated-app-delivery-ux.md",
    patterns: [/does not make `export_example_app`\s+write files/, /does not enable stable `view\.mode: "scene3d"`/],
  },
  {
    file: "docs/planning/feature-specs/cloud-native-source-readiness.md",
    patterns: [/must not fetch resources, parse archives, or write files/],
  },
  {
    file: "docs/planning/feature-specs/spatial-analysis-promotion-criteria.md",
    patterns: [/does not implement geoprocessing/, /Buffer\/intersection\/overlay\/routing\/aggregation \| blocked/],
  },
  {
    file: "docs/engineering/release-wording-guardrails.md",
    patterns: [
      /stable `view\.mode: "scene3d"` remains blocked/,
      /`export_example_app` returns manifest and file metadata/,
      /GeoParquet, FlatGeobuf, and GeoTIFF are public `MapSpec` source contracts with runtime blocked/,
      /advanced geoprocessing as available capability/,
    ],
  },
];

const forbiddenClaims: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "stable scene3d runtime availability",
    pattern: /(?:stable\s+)?(?:SceneView3D|3D)\s+runtime\s+(?:is\s+)?(?:supported|enabled|available|ready)\b/i,
  },
  {
    name: "stable scene3d view mode availability",
    pattern: /view\.mode:\s*"scene3d"\s+(?:is\s+)?(?:stable|supported|enabled|available|ready)\b/i,
  },
  {
    name: "export_example_app file writes",
    pattern: /export_example_app.{0,120}\b(?:writes|creates|saves|persists)\b.{0,80}\b(?:file|files|disk|workspace)\b/i,
  },
  {
    name: "generated app file writes",
    pattern: /generated[- ]app.{0,120}\b(?:writes|creates|saves|persists)\b.{0,80}\b(?:file|files|disk|workspace)\b/i,
  },
  {
    name: "runtime-blocked cloud-native source support",
    pattern:
      /(?:GeoParquet|FlatGeobuf|GeoTIFF|GeoZarr).{0,80}\b(?:is|are|now)\s+(?:supported|implemented|available|ready)\b/i,
  },
  {
    name: "geotiff runtime capability claim",
    pattern:
      /GeoTIFF.{0,120}\b(?:runtime|loader|loading|display|sampling|query|decoder|worker).{0,80}\b(?:is|are|now)\s+(?:supported|implemented|available|ready|promoted)\b/i,
  },
  {
    name: "advanced spatial analysis support",
    pattern:
      /(?:buffer|intersection|overlay|routing|aggregation|geoprocessing).{0,120}\b(?:is|are|now)\s+(?:supported|implemented|available|ready|executable)\b/i,
  },
];

function readRepoFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function matchingLines(text: string, pattern: RegExp): string[] {
  return text
    .split("\n")
    .map((line, index) => ({ index: index + 1, line }))
    .filter(({ line }) => pattern.test(line))
    .map(({ index, line }) => `${index}: ${line}`);
}

describe("release wording guardrails", () => {
  it("keeps required public-copy guardrail statements visible", () => {
    for (const { file, patterns } of requiredGuardrails) {
      const text = readRepoFile(file);
      for (const pattern of patterns) {
        expect(text, `${file} should match ${pattern}`).toMatch(pattern);
      }
    }
  });

  it("does not include release-blocking positive capability claims", () => {
    const failures: string[] = [];

    for (const file of publicWordingFiles) {
      const text = readRepoFile(file);
      for (const claim of forbiddenClaims) {
        const matches = matchingLines(text, claim.pattern);
        if (matches.length > 0) {
          failures.push(`${file} has ${claim.name}: ${matches.join(" | ")}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
