import { afterEach, describe, expect, it } from "vitest";
import { planMockAiEdit } from "../../examples/ai-map-workbench/mock-ai.mjs";
import { createWorkbenchServer } from "../../examples/ai-map-workbench/server.mjs";

let closeServer: (() => Promise<void>) | undefined;

afterEach(async () => {
  await closeServer?.();
  closeServer = undefined;
});

describe("ai-map-workbench mock planner", () => {
  it("maps a red point request to a setPaint command", () => {
    const plan = planMockAiEdit("make points red");

    expect(plan.status).toBe("planned");
    expect(plan.commands).toEqual([
      expect.objectContaining({
        type: "setPaint",
        layerId: "poi-circles",
        paint: expect.objectContaining({
          "circle-color": "#ef4444"
        })
      })
    ]);
  });

  it("returns unsupported without commands for unknown text", () => {
    const plan = planMockAiEdit("build a 3d terrain city");

    expect(plan.status).toBe("unsupported");
    expect(plan.commands).toEqual([]);
  });
});

describe("ai-map-workbench API", () => {
  it("serves the initial workbench state with a MapLibre style", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/state`);
    const state = await response.json();

    expect(response.ok).toBe(true);
    expect(state.status).toBe("ready");
    expect(state.spec).toMatchObject({
      id: "ai-map-workbench",
      revision: "1"
    });
    expect(state.style).toMatchObject({
      version: 8,
      sources: expect.objectContaining({
        pois: expect.objectContaining({ type: "geojson" })
      })
    });
    expect(state.validation.valid).toBe(true);
    expect(state.diagnostics).toEqual([]);
  });

  it("applies a supported chat prompt through command evidence", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "make points red"
      })
    });
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("applied");
    expect(result.plan).toMatchObject({
      status: "planned",
      intent: "style-red"
    });
    expect(result.commandEvidence).toMatchObject({
      commandCount: 1,
      committed: true,
      failed: false
    });
    expect(result.results[0]).toMatchObject({
      status: "applied",
      commandId: "cmd-mock-red-points"
    });
    expect(result.spec.layers.find((layer: { id: string }) => layer.id === "poi-circles")?.paint).toMatchObject({
      "circle-color": "#ef4444"
    });
    expect(result.diagnostics).toEqual([]);
  });

  it("applies injected provider output through the command path", async () => {
    const server = await createWorkbenchServer({
      port: 0,
      plannerProvider: async () => ({
        providerId: "fixture-provider",
        promptHash: "sha256:server-provider",
        traceId: "trace-server-provider",
        intent: {
          mapId: "server-provider",
          targetDomains: ["feature-display"],
          styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
        }
      })
    });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "make the point layer red with provider mode"
      })
    });
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("applied");
    expect(result.provider).toMatchObject({
      providerId: "fixture-provider",
      retainedRawPrompt: false
    });
    expect(result.generationEvidence.delivery.status).toBe("ready");
    expect(result.generationEvidence.planner.provided).toBe(true);
    expect(result.skeleton).toBeUndefined();
    expect(JSON.stringify(result.generationEvidence)).not.toContain("West Lake");
    expect(result.commandEvidence.committed).toBe(true);
    expect(result.summary.revision).toBe("2");
  });

  it("blocks unsafe provider output without mutating the active spec", async () => {
    const server = await createWorkbenchServer({
      port: 0,
      plannerProvider: async () => ({
        providerId: "unsafe-provider",
        promptHash: "sha256:unsafe-server-provider",
        rawPrompt: "make points red",
        javascript: "map.setPaintProperty('poi-circles', 'circle-color', 'red')"
      })
    });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "unsafe provider output"
      })
    });
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.summary.revision).toBe("1");
    expect(result.diagnostics.map((diagnostic: { code: string }) => diagnostic.code)).toContain("CAPABILITY.UNSUPPORTED");
  });

  it("queries inline map features through the engine", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/query`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        bbox: [120.13, 30.23, 120.16, 30.26],
        layers: ["poi-circles"]
      })
    });
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("queried");
    expect(result.query.features).toEqual([
      expect.objectContaining({
        properties: expect.objectContaining({
          name: "West Lake"
        })
      })
    ]);
    expect(result.query.diagnostics).toEqual([]);
  });

  it("keeps bounded payload-free audit records", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "make points red"
      })
    });
    const response = await fetch(`${server.url}/api/audit`);
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      status: "applied",
      commandCount: 1,
      fromRevision: "1",
      toRevision: "2"
    });
    expect(JSON.stringify(result.records[0])).not.toContain("West Lake");
    expect(JSON.stringify(result.records[0])).not.toContain("make points red");
  });
});

describe("ai-map-workbench provider profiles", () => {
  it("returns mock plus safe DeepSeek metadata without leaking credentials", async () => {
    const { buildProviderProfiles, publicProviderProfiles } = await import(
      "../../examples/ai-map-workbench/provider-profiles.mjs"
    );
    const profiles = buildProviderProfiles({
      DEEPSEEK_API_KEY: "secret-deepseek-key"
    });

    expect(publicProviderProfiles(profiles)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "mock-ai",
          label: "Mock AI",
          protocol: "mock",
          model: "deterministic-mock",
          enabled: true,
          missingCredential: false
        }),
        expect.objectContaining({
          id: "deepseek",
          label: "DeepSeek",
          protocol: "openai-chat-completions",
          enabled: true,
          missingCredential: false
        })
      ])
    );
    expect(JSON.stringify(publicProviderProfiles(profiles))).not.toContain("secret-deepseek-key");
  });

  it("marks DeepSeek disabled when its credential is whitespace only", async () => {
    const { buildProviderProfiles, publicProviderProfiles, readProviderApiKey } = await import(
      "../../examples/ai-map-workbench/provider-profiles.mjs"
    );
    const env = {
      DEEPSEEK_API_KEY: "   "
    };
    const profiles = buildProviderProfiles(env);
    const deepSeekProfile = profiles.find((profile) => profile.id === "deepseek");

    expect(publicProviderProfiles(profiles)).toContainEqual(
      expect.objectContaining({
        id: "deepseek",
        enabled: false,
        missingCredential: true
      })
    );
    expect(readProviderApiKey(deepSeekProfile, env)).toBeUndefined();
  });

  it("uses default DeepSeek base URL and model when overrides are blank", async () => {
    const { buildProviderProfiles, DEFAULT_DEEPSEEK_BASE_URL, DEFAULT_DEEPSEEK_MODEL } = await import(
      "../../examples/ai-map-workbench/provider-profiles.mjs"
    );
    const profiles = buildProviderProfiles({
      DEEPSEEK_API_KEY: "secret-deepseek-key",
      GIS_WORKBENCH_DEEPSEEK_BASE_URL: "   ",
      GIS_WORKBENCH_DEEPSEEK_MODEL: ""
    });

    expect(profiles.find((profile) => profile.id === "deepseek")).toMatchObject({
      baseUrl: DEFAULT_DEEPSEEK_BASE_URL,
      model: DEFAULT_DEEPSEEK_MODEL
    });
  });

  it("marks OpenAI-compatible custom profiles disabled when their credential is missing", async () => {
    const { buildProviderProfiles, publicProviderProfiles } = await import(
      "../../examples/ai-map-workbench/provider-profiles.mjs"
    );
    const profiles = buildProviderProfiles({
      GIS_WORKBENCH_CUSTOM_PROVIDER_ID: "my-provider",
      GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL: "My Provider",
      GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL: "https://example.test/v1",
      GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL: "my-model",
      GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV: "MY_PROVIDER_API_KEY"
    });

    expect(publicProviderProfiles(profiles)).toContainEqual(
      expect.objectContaining({
        id: "my-provider",
        label: "My Provider",
        protocol: "openai-chat-completions",
        model: "my-model",
        enabled: false,
        missingCredential: true
      })
    );
  });

  it("marks OpenAI-compatible custom profiles disabled when their credential is whitespace only", async () => {
    const { buildProviderProfiles, publicProviderProfiles, readProviderApiKey } = await import(
      "../../examples/ai-map-workbench/provider-profiles.mjs"
    );
    const env = {
      GIS_WORKBENCH_CUSTOM_PROVIDER_ID: "my-provider",
      GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL: "My Provider",
      GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL: "https://example.test/v1",
      GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL: "my-model",
      GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV: "MY_PROVIDER_API_KEY",
      MY_PROVIDER_API_KEY: "  "
    };
    const profiles = buildProviderProfiles(env);
    const customProfile = profiles.find((profile) => profile.id === "my-provider");

    expect(publicProviderProfiles(profiles)).toContainEqual(
      expect.objectContaining({
        id: "my-provider",
        enabled: false,
        missingCredential: true
      })
    );
    expect(readProviderApiKey(customProfile, env)).toBeUndefined();
  });
});

describe("ai-map-workbench OpenAI-compatible provider adapter", () => {
  const profile = {
    id: "deepseek",
    label: "DeepSeek",
    protocol: "openai-chat-completions",
    baseUrl: "https://api.deepseek.example",
    model: "deepseek-chat"
  };
  const summary = { mapId: "ai-map-workbench", revision: "1", sourceCount: 1, layerCount: 2 };
  const rawMessage = "make points red";
  const apiKey = "secret-key";
  const rawProviderBody = "provider raw body with make points red and secret-key";

  it("turns a chat completion JSON response into structured provider output", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async (url: string, init: RequestInit) => {
        expect(String(url)).toBe("https://api.deepseek.example/chat/completions");
        expect(init.headers).toMatchObject({
          authorization: "Bearer secret-key",
          "content-type": "application/json"
        });
        const requestBody = JSON.parse(String(init.body));
        expect(requestBody.model).toBe("deepseek-chat");
        expect(requestBody.response_format).toEqual({ type: "json_object" });
        expect(requestBody.messages.map((message: { role: string }) => message.role)).toEqual(["system", "user"]);
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    intent: {
                      mapId: "ai-map-workbench",
                      targetDomains: ["feature-display"],
                      styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
                    },
                    confidence: { level: "medium", reasons: ["User asked for red points."] }
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected provider call to succeed.");
    expect(response.providerOutput).toMatchObject({
      providerId: "deepseek",
      intent: {
        styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
      },
      confidence: { level: "medium", reasons: ["User asked for red points."] }
    });
    expect(response.providerOutput.promptHash).toMatch(/^sha256:/);
    expect(response.providerOutput.traceId).toMatch(/^provider.deepseek./);
  });

  it("bounds provider confidence reasons before returning provider output", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const longReason = "x".repeat(180);
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    intent: {
                      mapId: "ai-map-workbench",
                      targetDomains: ["feature-display"],
                      styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
                    },
                    confidence: {
                      level: "high",
                      reasons: [longReason, "second", "third", "fourth"],
                      rawProviderText: rawProviderBody
                    }
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected provider call to succeed.");
    expect(response.providerOutput.confidence).toEqual({
      level: "high",
      reasons: [`${"x".repeat(160)}`, "second", "third"]
    });
    expect(JSON.stringify(response.providerOutput)).not.toContain(rawProviderBody);
    expect(JSON.stringify(response.providerOutput)).not.toContain(rawMessage);
  });

  it("omits confidence reasons that contain prompt, credential, or raw provider markers", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const providerMarker = "provider-private-marker";
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    intent: {
                      mapId: "ai-map-workbench",
                      targetDomains: ["feature-display"],
                      styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
                    },
                    rawProviderTrace: providerMarker,
                    confidence: {
                      level: "medium",
                      reasons: [rawMessage, apiKey, providerMarker]
                    }
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected provider call to succeed.");
    expect(response.providerOutput.confidence).toBeUndefined();
    const serialized = JSON.stringify(response.providerOutput);
    expect(serialized).not.toContain(rawMessage);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(providerMarker);
  });

  it("omits shortened sensitive confidence substrings", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    intent: {
                      mapId: "ai-map-workbench",
                      targetDomains: ["feature-display"],
                      styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
                    },
                    confidence: {
                      level: "medium",
                      reasons: ["secret", "safe confidence reason"]
                    }
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected provider call to succeed.");
    expect(response.providerOutput.confidence).toEqual({
      level: "medium",
      reasons: ["safe confidence reason"]
    });
    expect(JSON.stringify(response.providerOutput)).not.toContain("secret");
  });

  it("returns diagnostics when provider intent contains raw or sensitive content", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const providerMarker = "provider-private-marker";
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    intent: {
                      mapId: "ai-map-workbench",
                      targetDomains: ["feature-display"],
                      styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }],
                      rawProviderTrace: providerMarker
                    }
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerResponse"
      })
    );
    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain(providerMarker);
    expect(serialized).not.toContain(rawMessage);
    expect(serialized).not.toContain(apiKey);
  });

  it("omits invalid provider confidence instead of returning raw invalid content", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    intent: {
                      mapId: "ai-map-workbench",
                      targetDomains: ["feature-display"],
                      styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
                    },
                    confidence: { level: "certain", reasons: [rawProviderBody] }
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected provider call to succeed.");
    expect(response.providerOutput.confidence).toBeUndefined();
    expect(JSON.stringify(response.providerOutput)).not.toContain(rawProviderBody);
  });

  it("returns structured diagnostics for non-JSON model content", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: rawProviderBody } }] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerResponse"
      })
    );
    expectProviderFailureSafe(response);
  });

  it("returns structured diagnostics when the provider credential is missing", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey: "",
      message: rawMessage,
      summary,
      fetchImpl: async () => {
        throw new Error("fetch should not be called");
      }
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerProfile"
      })
    );
    expectProviderFailureSafe(response);
  });

  it("returns structured diagnostics for non-OK provider responses without leaking response body", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(rawProviderBody, {
          status: 429,
          headers: { "content-type": "text/plain" }
        })
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerRequest"
      })
    );
    expectProviderFailureSafe(response);
  });

  it("returns structured diagnostics when fetch throws or response JSON is invalid", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const thrownResponse = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () => {
        throw new Error(rawProviderBody);
      }
    });
    const invalidJsonResponse = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(rawProviderBody, {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    });

    for (const response of [thrownResponse, invalidJsonResponse]) {
      expect(response.ok).toBe(false);
      expect(response.diagnostics).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          path: "/providerRequest"
        })
      );
      expectProviderFailureSafe(response);
    }
  });

  it("returns structured diagnostics when provider message content is missing", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      fetchImpl: async () =>
        new Response(JSON.stringify({ choices: [{ message: { refusal: rawProviderBody } }] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerResponse"
      })
    );
    expectProviderFailureSafe(response);
  });
});

function expectProviderFailureSafe(response: unknown) {
  const serialized = JSON.stringify(response);
  expect(serialized).not.toContain("make points red");
  expect(serialized).not.toContain("secret-key");
  expect(serialized).not.toContain("provider raw body");
}
