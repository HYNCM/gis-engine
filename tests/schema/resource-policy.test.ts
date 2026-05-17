import { describe, expect, it } from "vitest";
import { DiagnosticCodes, defaultResourcePolicy, validateResourceUrl, validateSpec, type MapSpec } from "@gis-engine/engine";

describe("ResourcePolicy validation", () => {
  it("allows relative, localhost, and pmtiles resources by default", () => {
    const relative = validateSpec(withGeojsonData("./data/points.geojson"));
    const localhost = validateSpec(withGeojsonData("http://localhost:5173/data/points.geojson"));
    const pmtiles = validateSpec(withPmtilesUrl("pmtiles://local/parcels.pmtiles"));

    expect(relative.valid).toBe(true);
    expect(localhost.valid).toBe(true);
    expect(pmtiles.valid).toBe(true);
  });

  it("blocks file URLs and remote hosts that are not allowlisted", () => {
    const fileUrl = validateSpec(withGeojsonData("file:///tmp/points.geojson"));
    const remoteUrl = validateSpec(withGeojsonData("https://tiles.example.com/points.geojson"));

    expect(fileUrl.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/sources/points/data"
      })
    );
    expect(remoteUrl.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/sources/points/data"
      })
    );
  });

  it("allows remote http resources only when their host is allowlisted", () => {
    const diagnostics = validateResourceUrl("https://tiles.example.com/tiles/{z}/{x}/{y}.png", "/sources/raster/tiles/0", {
      ...defaultResourcePolicy,
      allowedHosts: [...defaultResourcePolicy.allowedHosts, "tiles.example.com"]
    });

    expect(diagnostics).toEqual([]);
  });

  it("points diagnostics at raster tile and PMTiles URL fields", () => {
    const raster = validateSpec(withRasterTile("file:///tmp/{z}/{x}/{y}.png"));
    const pmtiles = validateSpec(withPmtilesUrl("file:///tmp/parcels.pmtiles"));

    expect(raster.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/sources/raster/tiles/0"
      })
    );
    expect(pmtiles.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/sources/parcels/url"
      })
    );
  });
});

function withGeojsonData(data: string): MapSpec {
  return {
    version: "0.1",
    id: "resource-policy-geojson",
    view: { center: [120, 30], zoom: 10 },
    sources: {
      points: {
        type: "geojson",
        data
      }
    },
    layers: [
      {
        id: "points",
        type: "circle",
        source: "points",
        paint: { "circle-color": "#2563eb" }
      }
    ]
  };
}

function withRasterTile(tileUrl: string): MapSpec {
  return {
    version: "0.1",
    id: "resource-policy-raster",
    view: { center: [120, 30], zoom: 10 },
    sources: {
      raster: {
        type: "raster",
        tiles: [tileUrl]
      }
    },
    layers: [
      {
        id: "raster-layer",
        type: "raster",
        source: "raster"
      }
    ]
  };
}

function withPmtilesUrl(url: string): MapSpec {
  return {
    version: "0.1",
    id: "resource-policy-pmtiles",
    view: { center: [120, 30], zoom: 10 },
    sources: {
      parcels: {
        type: "pmtiles",
        url
      }
    },
    layers: [
      {
        id: "parcels",
        type: "fill",
        source: "parcels",
        metadata: { "source-layer": "parcels" },
        paint: { "fill-color": "#22c55e" }
      }
    ]
  };
}
