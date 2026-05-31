import { describe, expect, it } from "vitest";
import { DiagnosticCodes } from "@gis-engine/engine";
import { normalizeWorkbenchProviderPlan } from "@gis-engine/ai";

describe("workbench provider plan normalization", () => {
  it("accepts structured provider intent and produces a planner plan", () => {
    const response = normalizeWorkbenchProviderPlan({
      providerId: "fixture-provider",
      promptHash: "sha256:provider-feature-display",
      traceId: "trace-provider-feature-display",
      intent: {
        mapId: "provider-feature-display",
        targetDomains: ["feature-display"],
        styleEdits: [
          {
            layerId: "poi-circles",
            paint: { "circle-color": "#ef4444" }
          }
        ]
      },
      confidence: {
        level: "medium",
        reasons: ["Provider returned structured feature-display intent."]
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected provider plan to normalize.");
    expect(response.result.plan.status).toBe("ready");
    expect(response.result.plan.request.promptHash).toBe("sha256:provider-feature-display");
    expect(response.result.plan.request.mapId).toBe("provider-feature-display");
    expect(response.result.provider).toMatchObject({
      providerId: "fixture-provider",
      retainedRawPrompt: false,
      confidence: {
        level: "medium",
        reasons: ["Provider returned structured feature-display intent."]
      }
    });
  });

  it("blocks raw prompt retention and free-form mutation output", () => {
    const response = normalizeWorkbenchProviderPlan({
      providerId: "unsafe-provider",
      promptHash: "sha256:unsafe-provider",
      rawPrompt: "make points red",
      javascript: "map.setPaintProperty('poi-circles', 'circle-color', 'red')"
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        path: "/providerOutput"
      })
    ]);
  });
});
