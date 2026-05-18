import { describe, expect, it } from "vitest";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";
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

  it("treats protocol-relative URLs as remote and applies host allowlisting", () => {
    const remote = validateSpec(withGeojsonData("//tiles.example.com/points.geojson"));
    const localhost = validateSpec(withGeojsonData("//localhost:5173/data/points.geojson"));

    expect(remote.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/sources/points/data"
      })
    );
    expect(localhost.valid).toBe(true);
  });

  it("points diagnostics at raster tile, PMTiles URL, and vector tile fields", () => {
    const raster = validateSpec(withRasterTile("file:///tmp/{z}/{x}/{y}.png"));
    const pmtiles = validateSpec(withPmtilesUrl("file:///tmp/parcels.pmtiles"));
    const vector = validateSpec(withVectorTile("file:///tmp/vector/{z}/{x}/{y}.pbf"));

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
    expect(vector.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/sources/vector/tiles/0"
      })
    );
  });

  it("applies resource policy to SceneView3D extension source URLs", () => {
    const blocked = withSceneSourceUrl("city-tiles", "file:///tmp/city/tileset.json");

    expect(blocked.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/extensions/scene3d/sources/city-tiles/url"
      })
    );
  });

  it("allows SceneView3D remote sources when the scene policy allowlists the host", () => {
    const spec = structuredClone(scene3dExtensionSpec) as MapSpec;
    const scene = spec.extensions?.scene3d as {
      sources: Record<string, { url: string }>;
      resourcePolicy: { allowedHosts: string[] };
    };

    scene.sources["city-tiles"]!.url = "https://tiles.example.com/city/tileset.json";
    scene.resourcePolicy.allowedHosts = ["tiles.example.com"];

    const report = validateSpec(spec);

    expect(report.diagnostics).not.toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/extensions/scene3d/sources/city-tiles/url"
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

function withVectorTile(tileUrl: string): MapSpec {
  return {
    version: "0.1",
    id: "resource-policy-vector",
    view: { center: [120, 30], zoom: 10 },
    sources: {
      vector: {
        type: "vector",
        tiles: [tileUrl]
      }
    },
    layers: [
      {
        id: "vector-fill",
        type: "fill",
        source: "vector",
        metadata: { "source-layer": "districts" }
      }
    ]
  };
}

function withSceneSourceUrl(sourceId: string, url: string) {
  const spec = structuredClone(scene3dExtensionSpec) as MapSpec;
  const scene = spec.extensions?.scene3d as { sources: Record<string, { url: string }> };
  scene.sources[sourceId]!.url = url;
  return validateSpec(spec);
}
