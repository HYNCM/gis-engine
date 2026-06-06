import { normalizeWorkbenchProviderPlan } from "@gis-engine/ai";
import { DiagnosticCodes } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

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
            paint: { "circle-color": "#ef4444" },
          },
        ],
      },
      confidence: {
        level: "medium",
        reasons: ["Provider returned structured feature-display intent."],
      },
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
        reasons: ["Provider returned structured feature-display intent."],
      },
    });
  });

  it("blocks raw prompt retention and free-form mutation output", () => {
    const response = normalizeWorkbenchProviderPlan({
      providerId: "unsafe-provider",
      promptHash: "sha256:unsafe-provider",
      rawPrompt: "make points red",
      javascript: "map.setPaintProperty('poi-circles', 'circle-color', 'red')",
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        path: "/providerOutput",
      }),
    ]);
  });

  it("normalizes unsafe provider ids before exposing planner evidence", () => {
    const rawProviderId = "secret provider token private task label";
    const rawTraceId = "secret trace token private task label";
    const response = normalizeWorkbenchProviderPlan({
      providerId: rawProviderId,
      promptHash: "sha256:provider-feature-display",
      traceId: rawTraceId,
      intent: {
        mapId: "provider-feature-display",
        targetDomains: ["feature-display"],
        styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }],
      },
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected provider plan to normalize.");
    expect(response.result.provider.providerId).toBe("workbench-provider");
    expect(response.result.plan.provenance.plannerId).toBe("workbench-provider");
    expect(response.result.plan.traceId).not.toBe(rawTraceId);
    const serialized = JSON.stringify(response.result);
    expect(serialized).not.toContain(rawProviderId);
    expect(serialized).not.toContain(rawTraceId);
  });

  it("blocks unsafe prompt hash values before planner evidence is created", () => {
    const rawPromptHash = "make points red with private task label";
    const response = normalizeWorkbenchProviderPlan({
      providerId: "fixture-provider",
      promptHash: rawPromptHash,
      intent: {
        mapId: "provider-feature-display",
        targetDomains: ["feature-display"],
        styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }],
      },
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        path: "/providerOutput",
      }),
    );
    expect(JSON.stringify(response)).not.toContain(rawPromptHash);
  });
});
