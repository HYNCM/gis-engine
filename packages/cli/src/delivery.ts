import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { MapSpec } from "@gis-engine/engine";
import { createArtifactManifest } from "./generate.js";
import { preflightMapSpec } from "./preflight.js";
import { getTemplate } from "./templates/index.js";

export interface WriteMapProjectDeliveryOptions {
  outputDir: string;
  projectName: string;
  spec: MapSpec;
  generatedAt: string;
  providerKind?: "mock" | "openai-compatible";
  cliVersion?: string;
}

export interface WriteMapProjectDeliveryResult {
  outputDir: string;
  files: string[];
  preflight: ReturnType<typeof preflightMapSpec>;
}

const REQUIRED_FILES = ["mapspec.json", "preflight.json", "delivery-summary.json", "README.md"] as const;

export function writeMapProjectDelivery(options: WriteMapProjectDeliveryOptions): WriteMapProjectDeliveryResult {
  const outputDir = resolve(options.outputDir);
  const provider = options.providerKind ?? "mock";
  const template = getTemplate("vite-ts");
  if (!template) throw new Error("The built-in vite-ts template is unavailable.");

  mkdirSync(outputDir, { recursive: true });
  const files: string[] = [];
  for (const file of template.generate({
    projectName: options.projectName,
    provider,
    cliVersion: options.cliVersion ?? "1.5.0",
  })) {
    const content = file.path === "src/main.ts" ? renderMapEntry(options.projectName) : file.content;
    write(outputDir, file.path, content);
    files.push(file.path);
  }

  write(outputDir, "mapspec.json", `${JSON.stringify(options.spec, null, 2)}\n`);
  files.push("mapspec.json");
  write(
    outputDir,
    "resource-config.json",
    `${JSON.stringify({ schemaVersion: "gis-engine.resource-config.v1", allowNetwork: false, resources: [] }, null, 2)}\n`,
  );
  files.push("resource-config.json");
  write(outputDir, ".env.example", "# Add application-specific public configuration here.\n");
  files.push(".env.example");

  const preflight = {
    ...preflightMapSpec({ filePath: join(outputDir, "mapspec.json") }),
    filePath: "mapspec.json",
  };
  write(outputDir, "preflight.json", `${JSON.stringify(preflight, null, 2)}\n`);
  files.push("preflight.json");
  write(
    outputDir,
    "delivery-summary.json",
    `${JSON.stringify(
      {
        schemaVersion: "gis-engine.workbench-delivery.v1",
        generatedAt: options.generatedAt,
        status: preflight.status,
        preflight: {
          ok: preflight.ok,
          status: preflight.status,
          sourceReadiness: preflight.sourceReadiness.summary,
          diagnosticCount: preflight.diagnostics.length,
        },
        retainedRawPrompt: false,
      },
      null,
      2,
    )}\n`,
  );
  files.push("delivery-summary.json");

  const readme = `# ${options.projectName}

Exported by GIS Engine Workbench as a MapLibre 2D TypeScript application.

## Verify

\`\`\`bash
pnpm install
pnpm build
pnpm exec create-gis-map --preflight ./mapspec.json --json
pnpm exec create-gis-map --verify-artifacts . --json
\`\`\`

Credentials, raw provider responses, and raw prompts are not included.
`;
  write(outputDir, "README.md", readme);

  const manifest = createArtifactManifest({
    outDir: outputDir,
    files,
    projectName: options.projectName,
    provider,
    promptHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    traceId: "workbench-export",
    generatedAt: options.generatedAt,
    requiredReviewFiles: REQUIRED_FILES,
  });
  write(outputDir, "artifact-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  files.push("artifact-manifest.json");

  return { outputDir, files, preflight };
}

function write(outputDir: string, path: string, content: string) {
  const filePath = join(outputDir, path);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

function renderMapEntry(projectName: string) {
  return `import { createMap } from "@gis-engine/engine";
import "maplibre-gl/dist/maplibre-gl.css";

async function main() {
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container");
  const response = await fetch("./mapspec.json");
  if (!response.ok) throw new Error("Unable to load mapspec.json");
  const spec = await response.json();
  await createMap(container, spec, { renderer: "maplibre" });
}

main().catch((error) => console.error("[${projectName}] failed to initialize map", error));
`;
}
