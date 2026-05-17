import { Ajv } from "ajv/dist/ajv.js";
import type { Diagnostic } from "@gis-engine/engine";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

const exampleIds = ["basic-geojson", "ai-map-edit", "raster-basemap", "pmtiles-local", "vector-tile-url"] as const;

export type ExampleId = (typeof exampleIds)[number];

export const ExportExampleAppToolInputSchema = {
  type: "object",
  properties: {
    exampleId: { type: "string", enum: exampleIds }
  },
  required: ["exampleId"],
  additionalProperties: false
} as const;

export interface ExportExampleAppToolInput {
  exampleId: ExampleId;
}

export interface ExampleAppFile {
  path: string;
  role: "spec" | "data" | "commands" | "script";
  mediaType: string;
  required: boolean;
  description: string;
}

export interface ExampleAppManifest {
  exampleId: ExampleId;
  title: string;
  description: string;
  writesFiles: false;
  files: ExampleAppFile[];
  notes: string[];
}

export type ExportExampleAppToolResponse =
  | { ok: true; result: ExampleAppManifest; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const manifests: Record<ExampleId, ExampleAppManifest> = {
  "basic-geojson": {
    exampleId: "basic-geojson",
    title: "Basic GeoJSON",
    description: "A minimal point layer backed by a local GeoJSON file.",
    writesFiles: false,
    files: [
      {
        path: "examples/basic-geojson/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec for the point layer example."
      },
      {
        path: "examples/basic-geojson/data/points.geojson",
        role: "data",
        mediaType: "application/geo+json",
        required: true,
        description: "Local point features used by the GeoJSON source."
      },
      {
        path: "examples/basic-geojson/validate.ts",
        role: "script",
        mediaType: "text/typescript",
        required: false,
        description: "Validation helper for the example MapSpec."
      }
    ],
    notes: ["The manifest is descriptive only; export_example_app does not create or modify files."]
  },
  "ai-map-edit": {
    exampleId: "ai-map-edit",
    title: "AI Map Edit",
    description: "A command replay example that mutates a base MapSpec.",
    writesFiles: false,
    files: [
      {
        path: "examples/ai-map-edit/before.map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "Initial MapSpec before command replay."
      },
      {
        path: "examples/ai-map-edit/commands.json",
        role: "commands",
        mediaType: "application/json",
        required: true,
        description: "MapCommands applied to the initial spec."
      },
      {
        path: "examples/ai-map-edit/audit.commands.json",
        role: "commands",
        mediaType: "application/json",
        required: false,
        description: "Optional command replay example with author, reason, timestamp, and prompt-hash provenance."
      }
    ],
    notes: ["The manifest is descriptive only; export_example_app does not create or modify files."]
  },
  "raster-basemap": {
    exampleId: "raster-basemap",
    title: "Raster Basemap",
    description: "A local raster tile template rendered below a GeoJSON overlay.",
    writesFiles: false,
    files: [
      {
        path: "examples/raster-basemap/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec with a raster basemap source and overlay layer."
      }
    ],
    notes: ["The raster URL is a tile template path; tests validate and transform it without fetching tiles."]
  },
  "pmtiles-local": {
    exampleId: "pmtiles-local",
    title: "PMTiles Local",
    description: "A PMTiles URL-path example for transformer and validation coverage.",
    writesFiles: false,
    files: [
      {
        path: "examples/pmtiles-local/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec with a local PMTiles URL path."
      }
    ],
    notes: ["PMTiles coverage validates and transforms the URL path only; it does not parse PMTiles binaries."]
  },
  "vector-tile-url": {
    exampleId: "vector-tile-url",
    title: "Vector Tile URL",
    description: "A generic vector tile URL-template example with source-layer metadata and v0.2 expressions.",
    writesFiles: false,
    files: [
      {
        path: "examples/vector-tile-url/map.json",
        role: "spec",
        mediaType: "application/json",
        required: true,
        description: "MapSpec with a local vector tile URL template."
      }
    ],
    notes: ["Vector tile coverage validates URL templates, source-layer metadata, expressions, and snapshot contracts without requiring network tile fetches."]
  }
};

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(ExportExampleAppToolInputSchema);

export function exportExampleAppTool(input: unknown): ExportExampleAppToolResponse {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid export_example_app tool input.")
    };
  }

  const typedInput = input as ExportExampleAppToolInput;
  return {
    ok: true,
    result: structuredClone(manifests[typedInput.exampleId]),
    diagnostics: []
  };
}
