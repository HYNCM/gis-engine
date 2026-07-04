import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getTemplate } from "@gis-engine/cli";
import type { MapSpec, PMTilesArchiveMetadata } from "@gis-engine/engine";

type Template = NonNullable<ReturnType<typeof getTemplate>>;
type TemplateFile = ReturnType<Template["generate"]>[number];

/** Get a template or throw if it does not exist. */
export function mustGetTemplate(name: Parameters<typeof getTemplate>[0]): Template {
  const template = getTemplate(name);
  if (!template) throw new Error(`Expected ${name} template.`);
  return template;
}

/** Find a generated file by path or throw. */
export function mustFindFile(files: TemplateFile[], path: string): TemplateFile {
  const file = files.find((entry) => entry.path === path);
  if (!file) throw new Error(`Expected generated file ${path}.`);
  return file;
}

/** Build a PMTiles MapSpec suitable for preflight tests. */
export function pmtilesPreflightSpec(): MapSpec {
  return {
    version: "0.1",
    view: { center: [-73.98, 40.75], zoom: 11 },
    sources: {
      parcels: {
        type: "pmtiles",
        url: "pmtiles://local/parcels.pmtiles",
      },
    },
    layers: [
      {
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        metadata: { "source-layer": "parcels" },
        paint: { "fill-color": "#2f80ed", "fill-opacity": 0.55 },
      },
    ],
  };
}

/** Build a valid PMTilesArchiveMetadata fixture. */
export function validPMTilesArchiveMetadata(): PMTilesArchiveMetadata {
  return {
    specVersion: 3,
    archiveBytes: 1_000_000,
    rootDirectoryOffset: 0,
    rootDirectoryLength: 1024,
    hasVectorTiles: true,
    hasRasterTiles: false,
    tileType: "vector",
    minZoom: 0,
    maxZoom: 14,
    bounds: [-74.1, 40.6, -73.7, 40.9],
  };
}

/** Create a temporary directory with an auto-generated name and return its path. */
export function makeTempDir(prefix = "gis-engine-cli-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** Safely remove a temporary directory created by {@link makeTempDir}. */
export function removeTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

export type { Template, TemplateFile };
