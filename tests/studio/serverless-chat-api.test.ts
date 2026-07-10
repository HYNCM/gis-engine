import { describe, expect, it, vi } from "vitest";
import chatHandler from "../../api/chat";
import providersHandler from "../../api/providers";
import appChatHandler from "../../apps/studio/api/chat";
import appProvidersHandler from "../../apps/studio/api/providers";

type MockReq = {
  body?: unknown;
  headers: Record<string, string>;
  method?: string;
};

type MockRes = {
  body: unknown;
  ended: boolean;
  headers: Record<string, string>;
  statusCode: number;
  end: () => void;
  json: (body: unknown) => MockRes;
  setHeader: (name: string, value: number | string) => void;
  status: (code: number) => MockRes;
};

type ResponseBody = {
  status?: string;
  spec?: {
    revision?: string;
    layers?: Array<{ id: string; paint?: Record<string, unknown> }>;
  };
  diagnostics?: Array<{ code?: string }>;
  commandEvidence?: { commandCount?: number; committed?: boolean; traceId?: string };
  providers?: Array<Record<string, unknown>>;
};

const baseSpec = {
  version: "0.1",
  id: "serverless-chat-test",
  revision: "0",
  sources: {
    points: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    },
  },
  layers: [
    {
      id: "points-layer",
      type: "circle",
      source: "points",
      paint: {
        "circle-color": "#2563eb",
      },
    },
  ],
  view: {
    center: [120.155, 30.274],
    zoom: 13,
  },
};

function cloneBaseSpec() {
  return JSON.parse(JSON.stringify(baseSpec));
}

function createRes(): MockRes {
  return {
    body: undefined,
    ended: false,
    headers: {},
    statusCode: 200,
    end() {
      this.ended = true;
    },
    json(body: unknown) {
      this.body = body;
      this.ended = true;
      return this;
    },
    setHeader(name: string, value: number | string) {
      this.headers[name.toLowerCase()] = String(value);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
  };
}

function createReq(overrides: Partial<MockReq>): MockReq {
  return {
    headers: { host: "localhost" },
    method: "POST",
    ...overrides,
  };
}

async function withEnv<T>(values: Record<string, string | undefined>, callback: () => Promise<T> | T): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return await callback();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("serverless Studio chat API guardrails", () => {
  it("applies mock edits through command evidence with traces on the root route", async () => {
    const res = createRes();

    await chatHandler(
      createReq({
        body: {
          message: "make points red",
          providerId: "mock-ai",
          spec: cloneBaseSpec(),
        },
      }) as never,
      res as never,
    );

    const body = res.body as ResponseBody;
    expect(res.statusCode).toBe(200);
    expect(body.status).toBe("applied");
    expect(body.spec?.revision).toBe("1");
    expect(body.spec?.layers?.find((layer) => layer.id === "points-layer")?.paint).toMatchObject({
      "circle-color": "#ef4444",
    });
    expect(body.diagnostics).toEqual([]);
    expect(body.commandEvidence).toMatchObject({
      commandCount: 1,
      committed: true,
      traceId: expect.stringContaining("studio.serverless"),
    });
  });

  it("applies mock edits through command evidence with traces on the app route", async () => {
    const response = await appChatHandler(
      new Request("https://studio.example/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "make points red",
          providerId: "mock-ai",
          spec: cloneBaseSpec(),
        }),
      }),
    );

    const body = (await response.json()) as ResponseBody;
    expect(response.status).toBe(200);
    expect(body.status).toBe("applied");
    expect(body.commandEvidence).toMatchObject({
      commandCount: 1,
      committed: true,
      traceId: expect.stringContaining("studio.serverless"),
    });
  });

  it("does not grant wildcard CORS to untrusted chat origins", async () => {
    const res = createRes();

    await chatHandler(
      createReq({
        headers: { host: "localhost", origin: "https://evil.example" },
        method: "OPTIONS",
      }) as never,
      res as never,
    );

    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).not.toBe("*");
  });

  it("keeps provider public metadata free of secret URLs on both serverless provider routes", async () => {
    await withEnv(
      {
        DEEPSEEK_API_KEY: "sk-secret-provider-key",
        DEEPSEEK_BASE_URL: "https://secret-provider.example",
        DEEPSEEK_MODEL: "deepseek-test-model",
      },
      async () => {
        const rootRes = createRes();
        providersHandler(createReq({ method: "GET" }) as never, rootRes as never);
        const appResponse = appProvidersHandler(new Request("https://studio.example/api/providers"));
        const appBody = (await appResponse.json()) as ResponseBody;

        for (const body of [rootRes.body as ResponseBody, appBody]) {
          const serialized = JSON.stringify(body.providers);
          expect(serialized).toContain("deepseek-test-model");
          expect(serialized).not.toContain("sk-secret-provider-key");
          expect(serialized).not.toContain("secret-provider.example");
          expect(serialized).not.toContain("baseUrl");
          expect(body.providers?.find((profile) => profile.id === "deepseek")).toMatchObject({
            id: "deepseek",
            enabled: false,
            missingCredential: false,
            disabledReason: "public-provider-disabled",
          });
        }
      },
    );
  });

  it("requires an explicit public-provider opt-in before DeepSeek can be called", async () => {
    await withEnv(
      {
        DEEPSEEK_API_KEY: "sk-secret-provider-key",
        DEEPSEEK_BASE_URL: "https://api.deepseek.com",
        GIS_ENGINE_ENABLE_PUBLIC_AI_PROVIDER: undefined,
      },
      async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const res = createRes();

        await chatHandler(
          createReq({
            body: {
              message: "make points red",
              providerId: "deepseek",
              spec: cloneBaseSpec(),
            },
          }) as never,
          res as never,
        );

        const body = res.body as ResponseBody;
        expect(fetchMock).not.toHaveBeenCalled();
        expect(body.status).toBe("blocked");
        expect(body.diagnostics?.[0]?.code).toBe("PROVIDER.DISABLED");
        vi.unstubAllGlobals();
      },
    );
  });

  it("blocks unsafe DeepSeek base URLs before any serverless fetch", async () => {
    await withEnv(
      {
        DEEPSEEK_API_KEY: "sk-secret-provider-key",
        DEEPSEEK_BASE_URL: "http://127.0.0.1:3333",
        GIS_ENGINE_ENABLE_PUBLIC_AI_PROVIDER: "1",
      },
      async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const response = await appChatHandler(
          new Request("https://studio.example/api/chat", {
            method: "POST",
            body: JSON.stringify({
              message: "make points red",
              providerId: "deepseek",
              spec: cloneBaseSpec(),
            }),
          }),
        );

        const body = (await response.json()) as ResponseBody;
        expect(fetchMock).not.toHaveBeenCalled();
        expect(body.status).toBe("blocked");
        expect(body.diagnostics?.[0]?.code).toBe("PROVIDER.BASE_URL_BLOCKED");
        vi.unstubAllGlobals();
      },
    );
  });
});
