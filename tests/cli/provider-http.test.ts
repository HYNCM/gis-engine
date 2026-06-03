import { describe, expect, it, vi } from "vitest";
import {
  callProvider,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  DEFAULT_PROVIDER_BYTE_CAP,
  type ProviderProfile,
} from "@gis-engine/cli";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PROFILE: ProviderProfile = {
  id: "test-provider",
  baseUrl: "https://api.test.com/v1",
  model: "test-model",
};

const TEST_API_KEY = "sk-test-key-1234567890";

/**
 * Build a mock fetch that returns a successful JSON response.
 * The response wraps the provider's content JSON inside the standard
 * OpenAI chat/completions envelope.
 */
function mockFetchSuccess(content: Record<string, unknown>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    body: null,
    text: () => Promise.resolve(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    })),
  });
}

/**
 * Build a mock fetch that returns an HTTP error.
 */
function mockFetchHttpError(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    headers: new Headers(),
    body: null,
    text: () => Promise.resolve(""),
  });
}

/**
 * Build a mock fetch that returns invalid (non-JSON) text.
 */
function mockFetchBadJson(text: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/plain" }),
    body: null,
    text: () => Promise.resolve(text),
  });
}

/**
 * Build a mock fetch that never resolves (for timeout testing).
 */
function mockFetchNeverResolve() {
  return vi.fn().mockImplementation(() => new Promise(() => {}));
}

/**
 * Build a mock fetch that throws a network error.
 */
function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError("fetch failed"));
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("provider-http-happy-path", () => {
  it("returns ok result with intent from valid JSON response", async () => {
    const fetchImpl = mockFetchSuccess({
      intent: { targetDomains: ["feature-display"] },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "Show me a map",
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.providerOutput.providerId).toBe("test-provider");
    expect(result.providerOutput.intent).toEqual({ targetDomains: ["feature-display"] });
    expect(result.providerOutput.promptHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(result.providerOutput.traceId).toMatch(/^provider\.test-provider\./);
  });

  it("includes sanitized confidence when present", async () => {
    const fetchImpl = mockFetchSuccess({
      intent: { targetDomains: ["feature-display"] },
      confidence: { level: "high", reasons: ["clear data source", "simple layer"] },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "Show me a map",
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.providerOutput.confidence).toBeDefined();
    expect(result.providerOutput.confidence!.level).toBe("high");
    expect(result.providerOutput.confidence!.reasons).toHaveLength(2);
  });

  it("parses JSON response wrapped in ```json``` fence", async () => {
    const fencedContent = '```json\n{"intent":{"targetDomains":["spatial-analysis"]}}\n```';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      body: null,
      text: () => Promise.resolve(JSON.stringify({
        choices: [{ message: { content: fencedContent } }],
      })),
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "Analyze spatial data",
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.providerOutput.intent).toEqual({ targetDomains: ["spatial-analysis"] });
  });
});

// ---------------------------------------------------------------------------
// Timeout
// ---------------------------------------------------------------------------

describe("provider-http-timeout", () => {
  it("returns timeout diagnostic when fetch exceeds timeout", async () => {
    const fetchImpl = mockFetchNeverResolve();

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
      timeoutMs: 50, // very short for testing
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].path).toBe("/providerRequest/timeout");
    expect(result.diagnostics[0].message).toContain("timed out");
  });

  it("uses default timeout of 20s when not specified", () => {
    expect(DEFAULT_PROVIDER_TIMEOUT_MS).toBe(20_000);
  });
});

// ---------------------------------------------------------------------------
// Byte cap
// ---------------------------------------------------------------------------

describe("provider-http-byte-cap", () => {
  it("uses default byte cap of 64KB", () => {
    expect(DEFAULT_PROVIDER_BYTE_CAP).toBe(64 * 1024);
  });
});

// ---------------------------------------------------------------------------
// HTTP errors
// ---------------------------------------------------------------------------

describe("provider-http-errors", () => {
  it("returns HTTP error diagnostic for non-2xx response", async () => {
    const fetchImpl = mockFetchHttpError(401);

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("HTTP 401");
  });

  it("returns error diagnostic for invalid JSON response body", async () => {
    const fetchImpl = mockFetchBadJson("not json at all {{{");

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("not valid JSON");
  });

  it("returns error when response has no choices array", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: null,
      text: () => Promise.resolve(JSON.stringify({ id: "test" })),
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("message content");
  });

  it("returns error when content is not a JSON object", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: null,
      text: () => Promise.resolve(JSON.stringify({
        choices: [{ message: { content: "just a plain string" } }],
      })),
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("must be a JSON object");
  });

  it("returns network error when fetch throws", async () => {
    const fetchImpl = mockFetchNetworkError();

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("failed before a valid JSON response");
  });
});

// ---------------------------------------------------------------------------
// Intent validation
// ---------------------------------------------------------------------------

describe("provider-http-intent-validation", () => {
  it("returns error when response has no intent field", async () => {
    const fetchImpl = mockFetchSuccess({ someOtherField: true });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("structured intent");
  });

  it("returns unsafe intent when intent echoes API key", async () => {
    const fetchImpl = mockFetchSuccess({
      intent: { data: TEST_API_KEY },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("sensitive content");
  });

  it("returns unsafe intent when intent echoes the raw prompt", async () => {
    const longPrompt = "Create a detailed map showing population density across major cities";
    const fetchImpl = mockFetchSuccess({
      intent: { description: longPrompt },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: longPrompt,
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("sensitive content");
  });

  it("returns unsafe intent when intent has unsafe key (rawPrompt)", async () => {
    const fetchImpl = mockFetchSuccess({
      intent: { rawPrompt: "some text" },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("sensitive content");
  });
});

// ---------------------------------------------------------------------------
// Confidence sanitization
// ---------------------------------------------------------------------------

describe("provider-http-confidence-sanitization", () => {
  it("filters confidence reasons containing API key", async () => {
    const fetchImpl = mockFetchSuccess({
      intent: { targetDomains: ["feature-display"] },
      confidence: {
        level: "medium",
        reasons: [`key is ${TEST_API_KEY}`, "valid geojson source"],
      },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.providerOutput.confidence).toBeDefined();
    // The reason containing the API key should be filtered out
    expect(result.providerOutput.confidence!.reasons).not.toContain(`key is ${TEST_API_KEY}`);
    expect(result.providerOutput.confidence!.reasons).toContain("valid geojson source");
  });

  it("truncates confidence reasons to max 3", async () => {
    const fetchImpl = mockFetchSuccess({
      intent: { targetDomains: ["feature-display"] },
      confidence: {
        level: "high",
        reasons: ["reason 1", "reason 2", "reason 3", "reason 4", "reason 5"],
      },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.providerOutput.confidence!.reasons).toHaveLength(3);
  });

  it("returns undefined confidence for invalid level", async () => {
    const fetchImpl = mockFetchSuccess({
      intent: { targetDomains: ["feature-display"] },
      confidence: { level: "extreme", reasons: ["reason"] },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.providerOutput.confidence).toBeUndefined();
  });

  it("returns undefined confidence for non-array reasons", async () => {
    const fetchImpl = mockFetchSuccess({
      intent: { targetDomains: ["feature-display"] },
      confidence: { level: "high", reasons: "not an array" },
    });

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: TEST_API_KEY,
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.providerOutput.confidence).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// No API key
// ---------------------------------------------------------------------------

describe("provider-http-no-api-key", () => {
  it("returns immediate error when apiKey is empty", async () => {
    const fetchImpl = vi.fn();

    const result = await callProvider({
      profile: TEST_PROFILE,
      apiKey: "",
      message: "test",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0].message).toContain("credential is not configured");
    // fetch should not have been called
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
