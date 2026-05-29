import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import { createMapGenerationCommandSkeleton, type MapGenerationCommandSkeleton } from "@gis-engine/engine";
import {
  GenerationEvidenceBundleInputSchema,
  GenerationEvidenceBundleSchema,
  createGenerationEvidenceBundle
} from "@gis-engine/ai";

describe("generation evidence bundle", () => {
  it("composes existing MCP tool contracts without adding tool aliases", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-evidence",
      promptHash: "sha256:nla-evidence",
      traceId: "trace-nla-evidence",
      targetDomains: ["feature-display"],
      view: {
        center: [120.15, 30.28],
        zoom: 11
      },
      sources: {
        services: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        }
      },
      layers: [
        {
          id: "service-points",
          type: "circle",
          source: "services",
          paint: {
            "circle-color": "#2563eb",
            "circle-radius": 6
          }
        }
      ]
    });

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:nla-evidence",
      skeleton,
      snapshot: {
        renderer: "maplibre",
        options: {
          width: 320,
          height: 180,
          format: "data-url",
          targetLayers: ["service-points"]
        }
      },
      exampleId: "ai-map-edit"
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected generation evidence bundle to succeed.");

    expect(response.result.status).toBe("ready");
    expect(response.result.toolSequence).toEqual([
      "get_context_summary",
      "validate_spec",
      "apply_commands",
      "snapshot_spec",
      "export_spec",
      "export_example_app"
    ]);
    expect(response.result.toolSequence.every((tool) => /^[a-z]+(?:_[a-z]+)*$/.test(tool))).toBe(true);
    expect(response.result.toolSequence).not.toContain("generate_map_app");
    expect(response.result.commandEvidence).toMatchObject({
      usedApplyCommands: true,
      traceId: "trace-nla-evidence",
      commandCount: 3,
      committed: true,
      rolledBack: false,
      diagnosticCounts: { error: 0, warning: 0, info: 0 }
    });
    expect(response.result.snapshotEvidence).toMatchObject({
      requested: true,
      renderer: "maplibre",
      passed: true,
      dataUrlPresent: true
    });
    expect(response.result.exportEvidence).toMatchObject({
      ready: true,
      sourceCount: 1,
      layerCount: 1
    });
    expect(response.result.exampleEvidence).toMatchObject({
      exampleId: "ai-map-edit",
      writesFiles: false,
      fileCount: 3
    });
    expect(response.result.summary.capabilitySummary.domains.map((domain) => domain.id)).toEqual([
      "feature-display",
      "spatial-analysis",
      "scene-browsing"
    ]);
  });

  it("blocks evidence when a skeleton spec bypasses command replay", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "tampered-evidence",
      promptHash: "sha256:tampered-evidence",
      traceId: "trace-tampered-evidence",
      view: { zoom: 8 }
    });
    const tampered: MapGenerationCommandSkeleton = {
      ...skeleton,
      spec: {
        ...skeleton.spec,
        view: {
          ...skeleton.spec.view,
          zoom: 99
        }
      }
    };

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:tampered-evidence",
      skeleton: tampered
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected generation evidence bundle to return structured evidence.");
    expect(response.result.status).toBe("blocked");
    expect(response.result.commandEvidence.diagnosticCounts.error).toBe(1);
    expect(response.result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "COMMAND.INVALID_PATCH",
        path: "/skeleton/spec"
      })
    );
  });

  it("keeps generation evidence schemas strict and Ajv-compilable", async () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validateInput = ajv.compile(GenerationEvidenceBundleInputSchema);
    const validateBundle = ajv.compile(GenerationEvidenceBundleSchema);
    const skeleton = createMapGenerationCommandSkeleton({ mapId: "schema-evidence" });
    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:schema-evidence",
      skeleton
    });

    expect(validateInput({ promptHash: "sha256:schema-evidence", skeleton, unexpected: true })).toBe(false);
    expect(validateInput.errors?.some((error) => error.keyword === "additionalProperties")).toBe(true);
    expect(
      validateInput({
        promptHash: "sha256:schema-evidence",
        skeleton,
        snapshot: { renderer: "scene3d" }
      })
    ).toBe(false);
    expect(validateInput.errors?.some((error) => error.instancePath === "/snapshot/renderer")).toBe(true);
    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected generation evidence bundle to succeed.");
    expect(validateBundle(response.result)).toBe(true);
  });
});
