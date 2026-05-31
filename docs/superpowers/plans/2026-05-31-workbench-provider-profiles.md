# AI Map Workbench Provider Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let AI Map Workbench users choose a server-enabled DeepSeek or OpenAI-compatible API profile while keeping credentials server-only and all map edits behind `applyCommands`.

**Architecture:** Add a small server-side provider profile registry, an OpenAI-compatible planner adapter, and a safe provider selection API for the existing workbench. The UI selects provider ids only; the server owns credential lookup, model calls, structured intent parsing, normalization, generation evidence, and bounded audit.

**Tech Stack:** Node ESM example server, plain browser JavaScript, Vitest, existing `@gis-engine/ai` provider normalizer, existing `@gis-engine/engine` diagnostics and command path, OpenAI-compatible chat completions over `fetch`.

---

## File Structure

- Create `examples/ai-map-workbench/provider-profiles.mjs`: build server-side provider profiles from environment variables, project safe public provider metadata, and resolve a selected profile.
- Create `examples/ai-map-workbench/openai-compatible-provider.mjs`: call OpenAI-compatible chat completions, parse JSON model output, generate prompt hashes and trace ids, and return structured provider output.
- Modify `examples/ai-map-workbench/server.mjs`: add `/api/providers`, accept `providerId` on `/api/chat`, route selected profiles through the new adapter, keep injected-provider tests working, and convert provider failures into structured diagnostics without mutating the active spec.
- Modify `examples/ai-map-workbench/public/index.html`: add a provider selector to the chat panel.
- Modify `examples/ai-map-workbench/public/app.js`: load provider metadata, manage selected provider id, send it with chat requests, and render safe provider/model state.
- Modify `examples/ai-map-workbench/public/styles.css`: style the provider selector using the existing compact control language.
- Modify `examples/ai-map-workbench/README.md`: document env configuration, supported provider profile scope, and credential boundaries.
- Modify `docs/planning/task-burndown.md`: add or advance an AMW provider-profile task only after code/test evidence exists.
- Create or modify `docs/reviews/amw-005-provider-profiles-2026-05-31.md`: record implementation evidence, resource/credential boundary, verification commands, and the remaining product-promotion hold.
- Test `tests/examples/ai-map-workbench.test.ts`: add profile discovery, provider route, adapter success, adapter failure, and audit privacy coverage.

## Task 1: Provider Profile Registry

**Files:**
- Create: `examples/ai-map-workbench/provider-profiles.mjs`
- Test: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Write failing profile discovery tests**

Append these tests to `tests/examples/ai-map-workbench.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: FAIL with module resolution error for `provider-profiles.mjs`.

- [ ] **Step 3: Implement provider profile registry**

Create `examples/ai-map-workbench/provider-profiles.mjs`:

```js
export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

export function buildProviderProfiles(env = process.env) {
  const profiles = [
    {
      id: "mock-ai",
      label: "Mock AI",
      protocol: "mock",
      model: "deterministic-mock",
      enabled: true,
      missingCredential: false
    }
  ];

  profiles.push({
    id: "deepseek",
    label: "DeepSeek",
    protocol: "openai-chat-completions",
    baseUrl: env.GIS_WORKBENCH_DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL,
    model: env.GIS_WORKBENCH_DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL,
    apiKeyEnv: "DEEPSEEK_API_KEY",
    enabled: Boolean(env.DEEPSEEK_API_KEY),
    missingCredential: !env.DEEPSEEK_API_KEY
  });

  const customId = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_ID);
  if (customId) {
    const apiKeyEnv = readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV) ?? "GIS_WORKBENCH_CUSTOM_API_KEY";
    profiles.push({
      id: customId,
      label: readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL) ?? customId,
      protocol: "openai-chat-completions",
      baseUrl: readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL) ?? "",
      model: readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL) ?? "",
      apiKeyEnv,
      enabled: Boolean(readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL)) && Boolean(readNonEmpty(env.GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL)) && Boolean(env[apiKeyEnv]),
      missingCredential: !env[apiKeyEnv]
    });
  }

  return profiles;
}

export function publicProviderProfiles(profiles) {
  return profiles.map((profile) => ({
    id: profile.id,
    label: profile.label,
    protocol: profile.protocol,
    model: profile.model,
    enabled: profile.enabled,
    missingCredential: profile.missingCredential
  }));
}

export function resolveProviderProfile(profiles, providerId) {
  const selectedId = readNonEmpty(providerId) ?? "mock-ai";
  return profiles.find((profile) => profile.id === selectedId);
}

export function readProviderApiKey(profile, env = process.env) {
  if (!profile?.apiKeyEnv) return undefined;
  return readNonEmpty(env[profile.apiKeyEnv]);
}

function readNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
```

- [ ] **Step 4: Run the focused test and verify green**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: PASS for existing workbench tests plus the new provider profile tests.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add examples/ai-map-workbench/provider-profiles.mjs tests/examples/ai-map-workbench.test.ts
git commit -m "feat: add workbench provider profiles"
```

## Task 2: OpenAI-Compatible Provider Adapter

**Files:**
- Create: `examples/ai-map-workbench/openai-compatible-provider.mjs`
- Test: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Write failing adapter success and failure tests**

Append these tests to `tests/examples/ai-map-workbench.test.ts`:

```ts
describe("ai-map-workbench OpenAI-compatible provider adapter", () => {
  it("turns a chat completion JSON response into structured provider output", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile: {
        id: "deepseek",
        label: "DeepSeek",
        protocol: "openai-chat-completions",
        baseUrl: "https://api.deepseek.example",
        model: "deepseek-chat"
      },
      apiKey: "secret-key",
      message: "make points red",
      summary: { mapId: "ai-map-workbench", revision: "1", sourceCount: 1, layerCount: 2 },
      fetchImpl: async (url: string, init: RequestInit) => {
        expect(String(url)).toBe("https://api.deepseek.example/chat/completions");
        expect(init.headers).toMatchObject({
          authorization: "Bearer secret-key",
          "content-type": "application/json"
        });
        expect(JSON.stringify(init.body)).toContain("deepseek-chat");
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

  it("returns structured diagnostics for non-JSON model content", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile: {
        id: "deepseek",
        label: "DeepSeek",
        protocol: "openai-chat-completions",
        baseUrl: "https://api.deepseek.example",
        model: "deepseek-chat"
      },
      apiKey: "secret-key",
      message: "make points red",
      summary: { mapId: "ai-map-workbench", revision: "1", sourceCount: 1, layerCount: 2 },
      fetchImpl: async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: "I would make the points red." } }] }), {
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
  });
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: FAIL with module resolution error for `openai-compatible-provider.mjs`.

- [ ] **Step 3: Implement the provider adapter**

Create `examples/ai-map-workbench/openai-compatible-provider.mjs`:

```js
import { createHash, randomUUID } from "node:crypto";
import { DiagnosticCodes } from "@gis-engine/engine";

export async function callOpenAiCompatibleProvider(input) {
  const { profile, apiKey, message, summary, fetchImpl = fetch } = input;
  if (!apiKey) return providerError(profile, "/providerProfile", "Provider credential is not configured.");

  try {
    const response = await fetchImpl(`${trimTrailingSlash(profile.baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: profile.model,
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt(summary) },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      return providerError(profile, "/providerRequest", `Provider request failed with HTTP ${response.status}.`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return providerError(profile, "/providerResponse", "Provider response did not include message content.");
    }

    const parsed = parseJsonObject(content);
    if (!parsed.ok) return providerError(profile, "/providerResponse", "Provider response content must be a JSON object.");

    return {
      ok: true,
      providerOutput: {
        providerId: profile.id,
        promptHash: hashPrompt(message),
        traceId: `provider.${profile.id}.${randomUUID()}`,
        intent: parsed.value.intent,
        ...(parsed.value.confidence ? { confidence: parsed.value.confidence } : {})
      }
    };
  } catch (error) {
    return providerError(profile, "/providerRequest", "Provider request failed before a valid JSON response was received.");
  }
}

function systemPrompt(summary) {
  return [
    "You convert map-edit requests into JSON only.",
    "Return an object with intent and optional confidence.",
    "Do not return JavaScript, commands, MapSpec, patches, raw prompts, markdown, or prose.",
    `Current map summary: ${JSON.stringify(summary)}`
  ].join("\\n");
}

function parseJsonObject(content) {
  try {
    const value = JSON.parse(stripJsonFence(content));
    return value && typeof value === "object" && !Array.isArray(value) ? { ok: true, value } : { ok: false };
  } catch {
    return { ok: false };
  }
}

function stripJsonFence(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\\s*([\\s\\S]*?)\\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

function hashPrompt(message) {
  return `sha256:${createHash("sha256").update(message).digest("hex")}`;
}

function providerError(profile, path, message) {
  return {
    ok: false,
    provider: {
      providerId: profile?.id ?? "unknown-provider",
      retainedRawPrompt: false
    },
    diagnostics: [
      {
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        message,
        path,
        fix: { kind: "manual", confidence: "high", message: "Check provider configuration or return structured intent JSON." }
      }
    ]
  };
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
```

- [ ] **Step 4: Run the focused test and verify green**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add examples/ai-map-workbench/openai-compatible-provider.mjs tests/examples/ai-map-workbench.test.ts
git commit -m "feat: add OpenAI-compatible workbench provider adapter"
```

## Task 3: Server Provider Selection API

**Files:**
- Modify: `examples/ai-map-workbench/server.mjs`
- Test: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Write failing server route tests**

Append these tests to `tests/examples/ai-map-workbench.test.ts`:

```ts
describe("ai-map-workbench selected provider API", () => {
  it("serves safe provider metadata", async () => {
    const server = await createWorkbenchServer({
      port: 0,
      env: { DEEPSEEK_API_KEY: "secret-deepseek-key" }
    });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/providers`);
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.providers).toContainEqual(
      expect.objectContaining({
        id: "deepseek",
        enabled: true,
        missingCredential: false
      })
    );
    expect(JSON.stringify(result)).not.toContain("secret-deepseek-key");
  });

  it("uses selected provider output through the command path", async () => {
    const server = await createWorkbenchServer({
      port: 0,
      env: { DEEPSEEK_API_KEY: "secret-deepseek-key" },
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
                    confidence: { level: "medium", reasons: ["Provider returned red point intent."] }
                  })
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red", providerId: "deepseek" })
    });
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("applied");
    expect(result.provider).toMatchObject({ providerId: "deepseek", retainedRawPrompt: false });
    expect(result.summary.revision).toBe("2");
    expect(result.generationEvidence.planner.provided).toBe(true);
  });

  it("blocks missing selected providers without mutating the spec", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red", providerId: "missing-provider" })
    });
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.summary.revision).toBe("1");
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ path: "/providerProfile" }));
  });
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: FAIL because `/api/providers`, `env`, `fetchImpl`, and `providerId` routing are not implemented.

- [ ] **Step 3: Wire provider profiles into the server**

Modify imports at the top of `examples/ai-map-workbench/server.mjs`:

```js
import { callOpenAiCompatibleProvider } from "./openai-compatible-provider.mjs";
import {
  buildProviderProfiles,
  publicProviderProfiles,
  readProviderApiKey,
  resolveProviderProfile
} from "./provider-profiles.mjs";
```

Inside `createWorkbenchServer`, add:

```js
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const providerProfiles = buildProviderProfiles(env);
```

Add a route before `/api/chat`:

```js
      if (request.method === "GET" && url.pathname === "/api/providers") {
        return sendJson(response, {
          providers: publicProviderProfiles(providerProfiles)
        });
      }
```

At the start of `/api/chat`, after reading `message`, add:

```js
        const requestedProviderId = typeof body.providerId === "string" ? body.providerId : "mock-ai";
        const selectedProfile = resolveProviderProfile(providerProfiles, requestedProviderId);
```

Before the existing mock planner branch, add a profile branch that runs when
`selectedProfile?.protocol === "openai-chat-completions"`:

```js
        if (!selectedProfile) {
          return sendProviderBlocked({
            engine,
            response,
            auditRecords,
            sessionId,
            activeSpec,
            fromRevision,
            provider: { providerId: requestedProviderId, retainedRawPrompt: false },
            diagnostics: [providerDiagnostic("/providerProfile", "Selected provider profile is not configured.")]
          });
        }

        if (selectedProfile.protocol === "openai-chat-completions") {
          const apiKey = readProviderApiKey(selectedProfile, env);
          const providerCall = await callOpenAiCompatibleProvider({
            profile: selectedProfile,
            apiKey,
            message,
            summary: summarizeSpec(activeSpec),
            fetchImpl
          });

          if (!providerCall.ok) {
            return sendProviderBlocked({
              engine,
              response,
              auditRecords,
              sessionId,
              activeSpec,
              fromRevision,
              provider: providerCall.provider,
              diagnostics: providerCall.diagnostics
            });
          }

          return applyProviderOutput({
            ai,
            engine,
            response,
            auditRecords,
            sessionId,
            activeSpec,
            setActiveSpec: (nextSpec) => {
              activeSpec = nextSpec;
            },
            fromRevision,
            providerOutput: providerCall.providerOutput
          });
        }
```

Extract the duplicated injected-provider command path into `applyProviderOutput`
so both injected tests and selected profile calls use the same normalizer,
generation evidence, `applyCommands`, and audit behavior. Replace the current
injected-provider branch body with:

```js
          const providerOutput = await plannerProvider({
            message,
            spec: structuredClone(activeSpec),
            summary: summarizeSpec(activeSpec)
          });
          return applyProviderOutput({
            ai,
            engine,
            response,
            auditRecords,
            sessionId,
            activeSpec,
            setActiveSpec: (nextSpec) => {
              activeSpec = nextSpec;
            },
            fromRevision,
            providerOutput
          });
```

Add helper functions near the existing server helpers:

```js
async function applyProviderOutput(input) {
  const { ai, engine, response, auditRecords, sessionId, activeSpec, setActiveSpec, fromRevision, providerOutput } = input;
  const providerPlan = ai.normalizeWorkbenchProviderPlan(providerOutput);

  if (!providerPlan.ok) {
    const provider = blockedProviderEvidence(providerOutput);
    return sendProviderBlocked({
      engine,
      response,
      auditRecords,
      sessionId,
      activeSpec,
      fromRevision,
      provider,
      diagnostics: providerPlan.diagnostics,
      promptHash: readString(providerOutput, "promptHash"),
      traceId: readString(providerOutput, "traceId")
    });
  }

  const plan = providerPlan.result.plan;
  const skeleton = engine.createMapGenerationCommandSkeleton({
    ...plan.request,
    mapId: plan.request.mapId ?? activeSpec.id,
    baseSpec: activeSpec
  });

  if (skeleton.status === "blocked") {
    return sendProviderBlocked({
      engine,
      response,
      auditRecords,
      sessionId,
      activeSpec,
      fromRevision,
      provider: providerPlan.result.provider,
      diagnostics: skeleton.diagnostics,
      promptHash: plan.provenance.promptHash,
      traceId: skeleton.traceId
    });
  }

  const generationEvidence = await ai.createGenerationEvidenceBundle({
    promptHash: plan.provenance.promptHash,
    skeleton,
    planner: {
      plan,
      ...(providerPlan.result.provider.confidence
        ? { confidence: plannerConfidence(providerPlan.result.provider.confidence) }
        : {})
    }
  });

  if (!generationEvidence.ok) {
    return sendProviderBlocked({
      engine,
      response,
      auditRecords,
      sessionId,
      activeSpec,
      fromRevision,
      provider: providerPlan.result.provider,
      diagnostics: generationEvidence.diagnostics,
      promptHash: plan.provenance.promptHash,
      traceId: skeleton.traceId
    });
  }

  const applied = engine.applyCommands(activeSpec, skeleton.commands, {
    collectTrace: true,
    traceId: skeleton.traceId
  });
  const failed = applied.results.some((result) => result.status === "failed");
  const nextSpec = applied.committed && !applied.rolledBack ? applied.spec : activeSpec;
  if (nextSpec !== activeSpec) setActiveSpec(nextSpec);
  const status = failed ? "blocked" : "applied";

  appendAuditRecord(auditRecords, {
    sessionId,
    providerId: providerPlan.result.provider.providerId,
    promptHash: plan.provenance.promptHash,
    traceId: applied.traceId,
    status,
    commandCount: applied.results.length,
    diagnostics: applied.results.flatMap((result) => result.diagnostics),
    fromRevision,
    toRevision: nextSpec.revision ?? "0"
  });

  return sendJson(response, {
    ...statePayload(engine, status, nextSpec),
    provider: providerPlan.result.provider,
    plan,
    generationEvidence: compactGenerationEvidence(generationEvidence.result),
    results: applied.results,
    traces: applied.traces ?? [],
    commandEvidence: commandEvidence(applied.results, applied.committed, applied.rolledBack)
  });
}

function sendProviderBlocked(input) {
  const { engine, response, auditRecords, sessionId, activeSpec, fromRevision, provider, diagnostics, promptHash, traceId } = input;
  appendAuditRecord(auditRecords, {
    sessionId,
    providerId: provider.providerId,
    ...(promptHash ? { promptHash } : {}),
    ...(traceId ? { traceId } : {}),
    status: "blocked",
    commandCount: 0,
    diagnostics,
    fromRevision,
    toRevision: activeSpec.revision ?? "0"
  });
  return sendJson(response, {
    ...statePayload(engine, "blocked", activeSpec),
    provider,
    plan: null,
    results: [],
    traces: [],
    diagnostics,
    commandEvidence: commandEvidence([], false, false)
  });
}

function providerDiagnostic(path, message) {
  return {
    severity: "error",
    code: "CAPABILITY.UNSUPPORTED",
    message,
    path,
    fix: { kind: "manual", confidence: "high", message: "Select an enabled server provider profile." }
  };
}
```

- [ ] **Step 4: Run the focused test and verify green**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add examples/ai-map-workbench/server.mjs tests/examples/ai-map-workbench.test.ts
git commit -m "feat: route workbench chats through provider profiles"
```

## Task 4: Browser Provider Selector

**Files:**
- Modify: `examples/ai-map-workbench/public/index.html`
- Modify: `examples/ai-map-workbench/public/app.js`
- Modify: `examples/ai-map-workbench/public/styles.css`
- Test: `tests/examples/ai-map-workbench.test.ts`

- [ ] **Step 1: Write failing static UI contract tests**

Append this test to `tests/examples/ai-map-workbench.test.ts`:

```ts
describe("ai-map-workbench provider selector UI contract", () => {
  it("serves provider selector markup and browser code that sends providerId", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const htmlResponse = await fetch(`${server.url}/`);
    const html = await htmlResponse.text();
    const appResponse = await fetch(`${server.url}/app.js`);
    const appJs = await appResponse.text();

    expect(html).toContain('id="provider-select"');
    expect(html).toContain('id="provider-status"');
    expect(appJs).toContain('fetchJson("/api/providers")');
    expect(appJs).toContain("providerId: selectedProviderId");
  });
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: FAIL because provider selector markup and browser provider state are absent.

- [ ] **Step 3: Add provider selector markup**

In `examples/ai-map-workbench/public/index.html`, add this block between the
messages container and prompt bank:

```html
          <section class="provider-picker" aria-label="Provider selection">
            <label for="provider-select">Provider</label>
            <select id="provider-select"></select>
            <p id="provider-status" class="provider-status">Mock AI ready.</p>
          </section>
```

- [ ] **Step 4: Add browser provider state and request wiring**

In `examples/ai-map-workbench/public/app.js`, add element references and state:

```js
const providerSelect = document.querySelector("#provider-select");
const providerStatus = document.querySelector("#provider-status");
let providerProfiles = [];
let selectedProviderId = "mock-ai";
```

In `init()`, before fetching `/api/state`, add:

```js
  await loadProviders();
  providerSelect.addEventListener("change", () => {
    selectedProviderId = providerSelect.value;
    renderProviderStatus();
  });
```

Change `submitPrompt` to send the selected provider id:

```js
  const payload = await postJson("/api/chat", { message, providerId: selectedProviderId });
```

Add these functions near the existing render helpers:

```js
async function loadProviders() {
  const payload = await fetchJson("/api/providers");
  providerProfiles = payload.providers ?? [];
  selectedProviderId = providerProfiles.find((profile) => profile.enabled)?.id ?? "mock-ai";
  providerSelect.replaceChildren(
    ...providerProfiles.map((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = `${profile.label} / ${profile.model}`;
      option.disabled = !profile.enabled;
      return option;
    })
  );
  providerSelect.value = selectedProviderId;
  renderProviderStatus();
}

function renderProviderStatus() {
  const profile = providerProfiles.find((item) => item.id === selectedProviderId);
  if (!profile) {
    providerStatus.textContent = "Provider profile unavailable.";
    return;
  }
  providerStatus.textContent = profile.missingCredential
    ? `${profile.label} is missing its server credential.`
    : `${profile.label} ready with ${profile.model}.`;
}
```

In `renderProviderEvidence`, add model information from the selected profile:

```js
  const selectedProfile = providerProfiles.find((profile) => profile.id === selectedProviderId);
```

Add `["Model", selectedProfile?.model ?? "--"]` to the evidence rows.

- [ ] **Step 5: Add compact selector styling**

In `examples/ai-map-workbench/public/styles.css`, add:

```css
.provider-picker {
  display: grid;
  gap: 7px;
  padding: 0 22px 14px;
}

.provider-picker label {
  color: var(--muted);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.provider-picker select {
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  color: var(--ink);
  padding: 0 10px;
  font: inherit;
}

.provider-status {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}
```

- [ ] **Step 6: Run the focused test and verify green**

Run:

```bash
pnpm vitest run tests/examples/ai-map-workbench.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
git add examples/ai-map-workbench/public/index.html examples/ai-map-workbench/public/app.js examples/ai-map-workbench/public/styles.css tests/examples/ai-map-workbench.test.ts
git commit -m "feat: add workbench provider selector"
```

## Task 5: Documentation, Review Artifact, and Gates

**Files:**
- Modify: `examples/ai-map-workbench/README.md`
- Modify: `docs/planning/task-burndown.md`
- Create: `docs/reviews/amw-005-provider-profiles-2026-05-31.md`

- [ ] **Step 1: Update the workbench README**

Add this section to `examples/ai-map-workbench/README.md` after "Injected Provider Mode":

````md
## Server Provider Profiles

The workbench can expose server-enabled provider profiles to the UI. The browser
selects a provider id, but credentials stay on the server.

DeepSeek can be enabled with:

```bash
DEEPSEEK_API_KEY=... pnpm example:ai-map-workbench
```

Optional DeepSeek overrides:

```bash
GIS_WORKBENCH_DEEPSEEK_BASE_URL=https://api.deepseek.com
GIS_WORKBENCH_DEEPSEEK_MODEL=deepseek-chat
```

A custom OpenAI-compatible endpoint can be enabled with:

```bash
GIS_WORKBENCH_CUSTOM_PROVIDER_ID=my-provider
GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL="My Provider"
GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL=https://example.test/v1
GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL=my-model
GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV=MY_PROVIDER_API_KEY
MY_PROVIDER_API_KEY=...
pnpm example:ai-map-workbench
```

The provider must return JSON with structured `intent` and optional
`confidence`. Raw prompts, JavaScript, direct commands, raw `MapSpec`, and patch
payloads are blocked before mutation.
````

- [ ] **Step 2: Update planning state after evidence exists**

Add an AMW-005 row to `docs/planning/task-burndown.md` or update the existing
AMW section with:

```md
| TASK-2026W22-AMW-005 | Add server-side provider profiles | P1 | M | `@ai-agent`, `@docs-agent` | review | AMW-004 | Server-side DeepSeek/OpenAI-compatible provider profiles are implemented under `examples/ai-map-workbench`; API keys remain server-only; provider output still normalizes through `normalizeWorkbenchProviderPlan` and `applyCommands`. | provider/workbench tests; docs test; `pnpm check`; AMW-005 review |
```

- [ ] **Step 3: Create AMW-005 review artifact**

Before creating the review artifact, capture current values:

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
git rev-parse --short HEAD
```

Create `docs/reviews/amw-005-provider-profiles-2026-05-31.md` and refresh
`generated_at` plus `repo_revision` with the command values captured above:

````md
---
agent: quality-guardian
period: 2026-05-31
generated_at: 2026-05-31T09:18:45Z
repo_revision: "71f8e55"
inputs:
  - docs/superpowers/specs/2026-05-31-workbench-provider-profiles-design.md
  - docs/superpowers/plans/2026-05-31-workbench-provider-profiles.md
  - examples/ai-map-workbench
  - tests/examples/ai-map-workbench.test.ts
owner: "@quality-guardian"
decision_level: blocking
---

# AMW-005 Provider Profiles Review

## Decision

Server-side provider profiles are acceptable for the local AI Map Workbench
example when the implementation evidence below passes. This does not promote
the workbench to a hosted product app or durable review console.

## Findings

| Gate | Decision | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Credential boundary | pass | Provider profiles expose public metadata only; API keys are read from server environment variables. | Browser-visible state cannot leak provider credentials. | Keep provider keys out of UI state, responses, and audit records. | high |
| Command mutation boundary | pass | Provider output still flows through `normalizeWorkbenchProviderPlan`, `createMapGenerationCommandSkeleton`, and `applyCommands`. | Real APIs cannot directly mutate `MapSpec`. | Keep forbidden fields blocked at `/providerOutput`. | high |
| External provider scope | pass | The first slice supports OpenAI-compatible chat completions only. | Users can connect DeepSeek and compatible endpoints without arbitrary request templating. | Reassess resource policy before adding arbitrary HTTP templates. | medium |
| Product promotion | hold | The workbench remains under `examples/ai-map-workbench`. | Hosted usage still lacks durable audit, auth, retention, and product-app ownership. | Keep AMW-004 promotion hold in force. | high |

## Verification

- `pnpm vitest run tests/ai/workbench-provider-plan.test.ts tests/examples/ai-map-workbench.test.ts`
- `pnpm test:docs`
- `git diff --check`
- `pnpm check`
````

- [ ] **Step 4: Run docs and focused tests**

Run:

```bash
pnpm vitest run tests/ai/workbench-provider-plan.test.ts tests/examples/ai-map-workbench.test.ts
pnpm test:docs
git diff --check
```

Expected: all commands PASS.

- [ ] **Step 5: Run full deterministic gate**

Run:

```bash
pnpm check
```

Expected: PASS. If environment-only browser visual gates fail for unrelated
reasons, record the exact command output in the AMW-005 review and keep the
focused provider/workbench evidence intact.

- [ ] **Step 6: Commit Task 5**

Run:

```bash
git add examples/ai-map-workbench/README.md docs/planning/task-burndown.md docs/reviews/amw-005-provider-profiles-2026-05-31.md
git commit -m "docs: record workbench provider profile evidence"
```

## Plan Self-Review

- Spec coverage: Tasks 1-4 cover server-side profiles, DeepSeek/custom OpenAI-compatible selection, server-only credentials, provider output normalization, UI provider selection, provider diagnostics, and payload-free audit behavior. Task 5 covers README, review evidence, planning state, and gates.
- Type consistency: Provider profile fields use `id`, `label`, `protocol`, `baseUrl`, `model`, `apiKeyEnv`, `enabled`, and `missingCredential` consistently across registry, server, UI, and tests.
- Scope control: The plan excludes browser-entered API keys, arbitrary HTTP templating, plugin runtime, durable audit storage, hosted product promotion, new MCP tools, and direct model mutation paths.
- Verification: The plan requires focused provider/workbench tests, docs tests, whitespace checks, and `pnpm check`.
