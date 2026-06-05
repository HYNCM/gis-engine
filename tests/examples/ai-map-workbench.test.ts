import { afterEach, describe, expect, it } from "vitest";
import { planMockAiEdit } from "../../examples/ai-map-workbench/mock-ai.mjs";
import { createWorkbenchServer } from "../../examples/ai-map-workbench/server.mjs";
import { WorkbenchNodeHarness } from "./ai-map-workbench-node-harness.ts";

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
    const providerToken = "secret unsafe provider token";
    const server = await createWorkbenchServer({
      port: 0,
      plannerProvider: async () => ({
        providerId: providerToken,
        promptHash: providerToken,
        traceId: providerToken,
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
    const auditResponse = await fetch(`${server.url}/api/audit`);
    const audit = await auditResponse.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.provider).toMatchObject({ providerId: "workbench-provider", retainedRawPrompt: false });
    expect(result.summary.revision).toBe("1");
    expect(result.diagnostics.map((diagnostic: { code: string }) => diagnostic.code)).toContain("CAPABILITY.UNSUPPORTED");
    const serialized = `${JSON.stringify(result)}\n${JSON.stringify(audit)}`;
    expect(serialized).not.toContain(providerToken);
  });

  it("does not echo unsafe injected provider ids into successful evidence or audit", async () => {
    const providerToken = "secret provider token private task label";
    const server = await createWorkbenchServer({
      port: 0,
      plannerProvider: async () => ({
        providerId: providerToken,
        promptHash: "sha256:server-provider",
        traceId: providerToken,
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
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make the point layer red with provider mode" })
    });
    const result = await response.json();
    const auditResponse = await fetch(`${server.url}/api/audit`);
    const audit = await auditResponse.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("applied");
    expect(result.provider).toMatchObject({ providerId: "workbench-provider", retainedRawPrompt: false });
    expect(result.generationEvidence.planner.plannerId).toBe("workbench-provider");
    expect(audit.records[0]).toMatchObject({ providerId: "workbench-provider", status: "applied" });
    const serialized = `${JSON.stringify(result)}\n${JSON.stringify(audit)}`;
    expect(serialized).not.toContain(providerToken);
    expect(serialized).not.toContain("make the point layer red");
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

describe("ai-map-workbench durable audit contract", () => {
  function compactAuditRecord(overrides: Record<string, unknown> = {}) {
    return {
      projectId: "project_demo",
      sessionId: "workbench-session",
      recordId: "record-1",
      createdAt: "2026-06-02T00:00:00Z",
      status: "applied",
      providerId: "mock-ai",
      promptHash: `sha256:${"a".repeat(64)}`,
      traceId: "trace-1",
      commandCount: 1,
      diagnosticCounts: { error: 0, warning: 0, info: 0 },
      diagnosticCodes: [{ code: "CAPABILITY.UNSUPPORTED", path: "/providerProfile" }],
      fromRevision: "1",
      toRevision: "2",
      ...overrides
    };
  }

  it("creates payload-free durable records and export envelopes", async () => {
    const { createAuditExportEnvelope, createDurableAuditRecord } = await import(
      "../../examples/ai-map-workbench/audit-contract.mjs"
    );

    const recordResult = createDurableAuditRecord(compactAuditRecord());
    expect(recordResult.ok).toBe(true);
    if (!recordResult.ok) throw new Error("Expected durable audit record to be accepted.");

    expect(recordResult.record).toMatchObject({
      recordVersion: "amw.audit.v1",
      projectId: "project_demo",
      sessionId: "workbench-session",
      recordId: "record-1",
      status: "applied",
      commandCount: 1
    });
    expect(recordResult.record.diagnosticCodes).toEqual([{ code: "CAPABILITY.UNSUPPORTED", path: "/providerProfile" }]);

    const exportResult = createAuditExportEnvelope({
      principal: { role: "reviewer", projectIds: ["project_demo"] },
      projectId: "project_demo",
      generatedAt: "2026-06-02T00:01:00Z",
      filters: { from: "2026-06-02T00:00:00Z", status: ["applied", "raw-provider-status"] },
      records: [recordResult.record],
      nextCursor: "cursor-1"
    });

    expect(exportResult.ok).toBe(true);
    if (!exportResult.ok) throw new Error("Expected audit export to be accepted.");
    expect(exportResult.envelope).toMatchObject({
      auditExportVersion: "amw.audit.export.v1",
      projectId: "project_demo",
      nextCursor: "cursor-1"
    });
    expect(exportResult.envelope.filters.status).toEqual(["applied"]);
    const serialized = JSON.stringify(exportResult.envelope);
    expect(serialized).not.toMatch(/make points red|secret-key|provider raw body|West Lake|MapSpec/i);
  });

  it("rejects raw or oversized durable audit payloads with stable diagnostics", async () => {
    const { createDurableAuditRecord } = await import("../../examples/ai-map-workbench/audit-contract.mjs");

    const rawResult = createDurableAuditRecord(
      compactAuditRecord({
        rawPrompt: "make points red",
        providerResponseBody: "provider raw body",
        spec: { id: "ai-map-workbench" }
      })
    );
    expect(rawResult.ok).toBe(false);
    expect(rawResult.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "AUDIT.CONTRACT_VIOLATION",
        path: expect.stringMatching(/^\/auditPayload\//)
      })
    );

    const tooManyDiagnostics = createDurableAuditRecord(
      compactAuditRecord({
        diagnosticCodes: Array.from({ length: 21 }, (_unused, index) => ({
          code: `CAPABILITY.UNSUPPORTED.${index}`,
          path: `/diagnostics/${index}`
        }))
      })
    );
    expect(tooManyDiagnostics.ok).toBe(false);
    expect(tooManyDiagnostics.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "AUDIT.CONTRACT_VIOLATION",
        path: "/auditPayload/diagnostics"
      })
    );
  });

  it("authorizes audit operations by role and project scope", async () => {
    const { authorizeAuditOperation, createAuditDeletionReceipt } = await import(
      "../../examples/ai-map-workbench/audit-contract.mjs"
    );

    expect(
      authorizeAuditOperation({
        operation: "export",
        principal: { role: "reviewer", projectIds: ["project_demo"] },
        projectId: "project_demo"
      })
    ).toEqual({ ok: true });

    const reviewerDelete = authorizeAuditOperation({
      operation: "delete",
      principal: { role: "reviewer", projectIds: ["project_demo"] },
      projectId: "project_demo"
    });
    expect(reviewerDelete.ok).toBe(false);
    expect(reviewerDelete.diagnostics).toContainEqual(expect.objectContaining({ path: "/auditAccess" }));

    const wrongProject = authorizeAuditOperation({
      operation: "export",
      principal: { role: "reviewer", projectIds: ["project_other"] },
      projectId: "project_demo"
    });
    expect(wrongProject.ok).toBe(false);
    expect(wrongProject.diagnostics).toContainEqual(expect.objectContaining({ path: "/auditAccess" }));

    const deletion = createAuditDeletionReceipt({
      principal: { role: "admin", projectIds: ["project_demo"] },
      projectId: "project_demo",
      deletedAt: "2026-06-02T00:02:00Z",
      actorId: "admin-1",
      reasonCode: "retention-expired",
      filterSummary: { sessionId: "workbench-session", status: "blocked" },
      deletedCount: 3
    });
    expect(deletion.ok).toBe(true);
    if (!deletion.ok) throw new Error("Expected deletion receipt to be accepted.");
    expect(deletion.receipt).toMatchObject({
      deletionReceiptVersion: "amw.audit.deletion.v1",
      projectId: "project_demo",
      deletedCount: 3
    });
    expect(JSON.stringify(deletion.receipt)).not.toMatch(/raw|prompt|providerResponse|MapSpec/i);
  });

  it("caps audit export pages and deletion batches", async () => {
    const { createAuditDeletionReceipt, createAuditExportEnvelope, createDurableAuditRecord } = await import(
      "../../examples/ai-map-workbench/audit-contract.mjs"
    );
    const recordResult = createDurableAuditRecord(compactAuditRecord());
    if (!recordResult.ok) throw new Error("Expected durable audit record to be accepted.");

    const oversizedExport = createAuditExportEnvelope({
      principal: { role: "reviewer", projectIds: ["project_demo"] },
      projectId: "project_demo",
      generatedAt: "2026-06-02T00:03:00Z",
      records: Array.from({ length: 501 }, () => recordResult.record)
    });
    expect(oversizedExport.ok).toBe(false);
    expect(oversizedExport.diagnostics).toContainEqual(expect.objectContaining({ path: "/auditExport/size" }));

    const mismatchedExport = createAuditExportEnvelope({
      principal: { role: "reviewer", projectIds: ["project_demo"] },
      projectId: "project_demo",
      generatedAt: "2026-06-02T00:03:00Z",
      records: [{ ...recordResult.record, projectId: "project_other" }]
    });
    expect(mismatchedExport.ok).toBe(false);
    expect(mismatchedExport.diagnostics).toContainEqual(expect.objectContaining({ path: "/auditExport" }));

    const oversizedDeletion = createAuditDeletionReceipt({
      principal: { role: "admin", projectIds: ["project_demo"] },
      projectId: "project_demo",
      deletedAt: "2026-06-02T00:04:00Z",
      actorId: "admin-1",
      reasonCode: "manual-purge",
      filterSummary: { sessionId: "workbench-session" },
      deletedCount: 10_001
    });
    expect(oversizedDeletion.ok).toBe(false);
    expect(oversizedDeletion.diagnostics).toContainEqual(expect.objectContaining({ path: "/auditDeletion/size" }));
  });
});

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
      expect.objectContaining({ id: "deepseek", enabled: true, missingCredential: false })
    );
    expect(JSON.stringify(result)).not.toContain("secret-deepseek-key");
  });

  it("uses selected provider output through the command path", async () => {
    const apiKey = "secret-deepseek-key";
    const rawProviderBody = JSON.stringify({
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
    });
    const server = await createWorkbenchServer({
      port: 0,
      env: { DEEPSEEK_API_KEY: apiKey },
      fetchImpl: async () =>
        new Response(rawProviderBody, { status: 200, headers: { "content-type": "application/json" } })
    });
    closeServer = server.close;

    const rawPrompt = "make points red";
    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: rawPrompt, providerId: "deepseek" })
    });
    const result = await response.json();
    const auditResponse = await fetch(`${server.url}/api/audit`);
    const audit = await auditResponse.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("applied");
    expect(result.provider).toMatchObject({ providerId: "deepseek", retainedRawPrompt: false });
    expect(result.summary.revision).toBe("2");
    expect(result.generationEvidence.planner.provided).toBe(true);
    expect(audit.records).toHaveLength(1);
    expect(audit.records[0]).toMatchObject({
      providerId: "deepseek",
      status: "applied",
      commandCount: 1,
      fromRevision: "1",
      toRevision: "2"
    });
    const serialized = `${JSON.stringify(result)}\n${JSON.stringify(audit)}`;
    expect(serialized).not.toContain(rawPrompt);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(rawProviderBody);
    expect(JSON.stringify(audit)).not.toContain("West Lake");
  });

  it("treats blank and padded mock provider ids as mock planner requests", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const blankResponse = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red", providerId: "   " })
    });
    const blankResult = await blankResponse.json();
    const paddedMockResponse = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "reset", providerId: " mock-ai " })
    });
    const paddedMockResult = await paddedMockResponse.json();

    expect(blankResponse.ok).toBe(true);
    expect(blankResult.status).toBe("applied");
    expect(blankResult.summary.revision).toBe("2");
    expect(paddedMockResponse.ok).toBe(true);
    expect(paddedMockResult.status).toBe("reset");
    expect(paddedMockResult.summary.revision).toBe("1");
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

  it("blocks selected providers with disallowed base URLs before fetch", async () => {
    const apiKey = "blocked-provider-secret";
    const blockedBaseUrl = "http://127.0.0.1:11434/v1";
    const rawPrompt = "make points red with private task label";
    const server = await createWorkbenchServer({
      port: 0,
      env: {
        GIS_WORKBENCH_CUSTOM_PROVIDER_ID: "blocked-provider",
        GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL: "Blocked Provider",
        GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL: blockedBaseUrl,
        GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL: "blocked-model",
        GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV: "BLOCKED_PROVIDER_API_KEY",
        BLOCKED_PROVIDER_API_KEY: apiKey
      },
      fetchImpl: async () => {
        throw new Error("fetch should not be called for blocked provider resources");
      }
    });
    closeServer = server.close;

    const providersResponse = await fetch(`${server.url}/api/providers`);
    const providers = await providersResponse.json();
    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: rawPrompt, providerId: "blocked-provider" })
    });
    const result = await response.json();
    const auditResponse = await fetch(`${server.url}/api/audit`);
    const audit = await auditResponse.json();

    expect(providers.providers).toContainEqual(
      expect.objectContaining({ id: "blocked-provider", enabled: false, missingCredential: false })
    );
    expect(response.ok).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.summary.revision).toBe("1");
    expect(result.commandEvidence).toMatchObject({ commandCount: 0, committed: false, failed: false });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ path: "/providerProfile/baseUrl" }));
    expect(audit.records).toHaveLength(1);
    expect(audit.records[0]).toMatchObject({
      providerId: "blocked-provider",
      status: "blocked",
      commandCount: 0,
      fromRevision: "1",
      toRevision: "1"
    });
    const serialized = `${JSON.stringify(providers)}\n${JSON.stringify(result)}\n${JSON.stringify(audit)}`;
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(blockedBaseUrl);
    expect(serialized).not.toContain(rawPrompt);
  });

  it("does not echo request-controlled unknown provider ids into response or audit", async () => {
    const providerToken = "secret-provider-token private task label";
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red", providerId: providerToken })
    });
    const result = await response.json();
    const auditResponse = await fetch(`${server.url}/api/audit`);
    const audit = await auditResponse.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.provider).toMatchObject({ providerId: "unknown-provider", retainedRawPrompt: false });
    expect(audit.records).toHaveLength(1);
    expect(audit.records[0]).toMatchObject({
      providerId: "unknown-provider",
      status: "blocked",
      commandCount: 0
    });
    const serialized = `${JSON.stringify(result)}\n${JSON.stringify(audit)}`;
    expect(serialized).not.toContain(providerToken);
    expect(serialized).not.toContain("make points red");
  });

  it("blocks provider HTTP failures without leaking prompt, credentials, or provider body into response or audit", async () => {
    const rawPrompt = "make points red with private task label";
    const apiKey = "secret-deepseek-key";
    const rawProviderBody = "raw provider body with private details";
    const server = await createWorkbenchServer({
      port: 0,
      env: { DEEPSEEK_API_KEY: apiKey },
      fetchImpl: async () =>
        new Response(rawProviderBody, {
          status: 429,
          headers: { "content-type": "text/plain" }
        })
    });
    closeServer = server.close;

    const response = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: rawPrompt, providerId: "deepseek" })
    });
    const result = await response.json();
    const auditResponse = await fetch(`${server.url}/api/audit`);
    const audit = await auditResponse.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.provider).toMatchObject({ providerId: "deepseek", retainedRawPrompt: false });
    expect(result.summary.revision).toBe("1");
    expect(result.commandEvidence).toMatchObject({ commandCount: 0, committed: false, failed: false });
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ path: "/providerRequest" }));
    expect(audit.records).toHaveLength(1);
    expect(audit.records[0]).toMatchObject({
      providerId: "deepseek",
      status: "blocked",
      commandCount: 0,
      fromRevision: "1",
      toRevision: "1"
    });
    const serialized = `${JSON.stringify(result)}\n${JSON.stringify(audit)}`;
    expect(serialized).not.toContain(rawPrompt);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(rawProviderBody);
    expect(JSON.stringify(audit)).not.toContain("West Lake");
  });

  it("blocks stale selected provider output when another chat changes the revision first", async () => {
    let resolveProviderResponse: ((response: Response) => void) | undefined;
    let providerStarted: (() => void) | undefined;
    const providerStartedPromise = new Promise<void>((resolve) => {
      providerStarted = resolve;
    });
    const server = await createWorkbenchServer({
      port: 0,
      env: { DEEPSEEK_API_KEY: "secret-deepseek-key" },
      fetchImpl: async () => {
        providerStarted?.();
        return new Promise<Response>((resolve) => {
          resolveProviderResponse = resolve;
        });
      }
    });
    closeServer = server.close;

    const staleProviderPromise = fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red through provider", providerId: "deepseek" })
    });
    await providerStartedPromise;

    const mockResponse = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red" })
    });
    const mockResult = await mockResponse.json();
    resolveProviderResponse?.(
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
                  }
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const staleProviderResponse = await staleProviderPromise;
    const staleProviderResult = await staleProviderResponse.json();
    const auditResponse = await fetch(`${server.url}/api/audit`);
    const audit = await auditResponse.json();

    expect(mockResult.status).toBe("applied");
    expect(mockResult.summary.revision).toBe("2");
    expect(staleProviderResponse.ok).toBe(true);
    expect(staleProviderResult.status).toBe("blocked");
    expect(staleProviderResult.summary.revision).toBe("2");
    expect(staleProviderResult.commandEvidence).toMatchObject({ commandCount: 0, committed: false, failed: false });
    expect(staleProviderResult.diagnostics).toContainEqual(expect.objectContaining({ path: "/providerRevision" }));
    expect(audit.records).toHaveLength(2);
    expect(audit.records[1]).toMatchObject({
      providerId: "deepseek",
      status: "blocked",
      commandCount: 0,
      fromRevision: "1",
      toRevision: "2"
    });
  });

  it("blocks stale provider output when reset restores the same revision while provider is pending", async () => {
    let resolveProviderResponse: ((response: Response) => void) | undefined;
    let providerStarted: (() => void) | undefined;
    const providerStartedPromise = new Promise<void>((resolve) => {
      providerStarted = resolve;
    });
    const server = await createWorkbenchServer({
      port: 0,
      env: { DEEPSEEK_API_KEY: "secret-deepseek-key" },
      fetchImpl: async () => {
        providerStarted?.();
        return new Promise<Response>((resolve) => {
          resolveProviderResponse = resolve;
        });
      }
    });
    closeServer = server.close;

    const staleProviderPromise = fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red through provider", providerId: "deepseek" })
    });
    await providerStartedPromise;

    const resetResponse = await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "reset" })
    });
    const resetResult = await resetResponse.json();
    resolveProviderResponse?.(
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
                  }
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const staleProviderResponse = await staleProviderPromise;
    const staleProviderResult = await staleProviderResponse.json();
    const currentStateResponse = await fetch(`${server.url}/api/state`);
    const currentState = await currentStateResponse.json();
    const auditResponse = await fetch(`${server.url}/api/audit`);
    const audit = await auditResponse.json();

    expect(resetResult.status).toBe("reset");
    expect(resetResult.summary.revision).toBe("1");
    expect(staleProviderResponse.ok).toBe(true);
    expect(staleProviderResult.status).toBe("blocked");
    expect(staleProviderResult.summary.revision).toBe("1");
    expect(staleProviderResult.commandEvidence).toMatchObject({ commandCount: 0, committed: false, failed: false });
    expect(staleProviderResult.diagnostics).toContainEqual(expect.objectContaining({ path: "/providerRevision" }));
    expect(
      currentState.spec.layers.find((layer: { id: string }) => layer.id === "poi-circles")?.paint?.["circle-color"]
    ).toBe("#2563eb");
    expect(audit.records).toHaveLength(2);
    expect(audit.records[1]).toMatchObject({
      providerId: "deepseek",
      status: "blocked",
      commandCount: 0,
      fromRevision: "1",
      toRevision: "1"
    });
  });
});

describe("ai-map-workbench review decision API", () => {
  it("records accepted review decisions without mutating the active spec", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red" })
    });
    const beforeState = await (await fetch(`${server.url}/api/state`)).json();
    const response = await fetch(`${server.url}/api/review-decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome: "accepted", reasonCodes: ["review-accepted"] })
    });
    const result = await response.json();
    const afterState = await (await fetch(`${server.url}/api/state`)).json();
    const decisions = await (await fetch(`${server.url}/api/review-decisions`)).json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("reviewed");
    expect(result.summary.revision).toBe("2");
    expect(result.spec).toBeUndefined();
    expect(result.style).toBeUndefined();
    expect(result.validation).toBeUndefined();
    expect(afterState.summary.revision).toBe(beforeState.summary.revision);
    expect(result.commandEvidence).toMatchObject({ commandCount: 0, committed: false, failed: false });
    expect(result.decision).toMatchObject({
      recordVersion: "amw.review.v1",
      outcome: "accepted",
      providerId: "mock-ai",
      auditRecordId: expect.stringMatching(/^workbench-/),
      commandEvidence: expect.objectContaining({ commandCount: 1, committed: true })
    });
    expect(decisions.decisions).toHaveLength(1);
    const serialized = `${JSON.stringify(result)}\n${JSON.stringify(decisions)}`;
    expect(serialized).not.toMatch(/make points red|West Lake|MapSpec|commandBody|patch/i);
  });

  it("blocks review decisions that attempt direct map mutation or raw payload retention", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red" })
    });
    const response = await fetch(`${server.url}/api/review-decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        outcome: "blocked",
        reasonCodes: ["manual-review-blocked"],
        rawPrompt: "make points red",
        commands: [{ type: "setPaint" }],
        spec: { id: "ai-map-workbench" }
      })
    });
    const result = await response.json();
    const decisions = await (await fetch(`${server.url}/api/review-decisions`)).json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.decision).toBeNull();
    expect(result.summary.revision).toBe("2");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "REVIEW.CONTRACT_VIOLATION",
        path: "/reviewAction/commandSafety"
      })
    );
    expect(decisions.decisions).toEqual([]);
    expect(JSON.stringify(result)).not.toContain("make points red");
    expect(result.spec).toBeUndefined();
    expect(result.style).toBeUndefined();
    expect(result.validation).toBeUndefined();
  });

  it("authorizes review decisions by project-scoped reviewer role", async () => {
    const server = await createWorkbenchServer({
      port: 0,
      reviewPrincipal: { role: "service", projectIds: ["project_demo"] }
    });
    closeServer = server.close;

    await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red" })
    });
    const response = await fetch(`${server.url}/api/review-decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome: "accepted", reasonCodes: ["review-accepted"] })
    });
    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.decision).toBeNull();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "REVIEW.CONTRACT_VIOLATION",
        path: "/reviewDecision/authorization"
      })
    );
    expect(result.spec).toBeUndefined();
    expect(result.style).toBeUndefined();
    expect(result.validation).toBeUndefined();
  });

  it("requires follow-up ids for follow-up review decisions", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "make points red" })
    });
    const blockedResponse = await fetch(`${server.url}/api/review-decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome: "follow-up-required", reasonCodes: ["visual-evidence-required"] })
    });
    const blocked = await blockedResponse.json();
    expect(blocked.status).toBe("blocked");
    expect(blocked.diagnostics).toContainEqual(expect.objectContaining({ path: "/reviewAction/followUp" }));

    const acceptedResponse = await fetch(`${server.url}/api/review-decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        outcome: "follow-up-required",
        reasonCodes: ["visual-evidence-required"],
        followUpTaskIds: ["TASK-2026W23-AWP-006"]
      })
    });
    const accepted = await acceptedResponse.json();
    expect(accepted.status).toBe("reviewed");
    expect(accepted.decision).toMatchObject({
      outcome: "follow-up-required",
      followUpTaskIds: ["TASK-2026W23-AWP-006"]
    });
  });

  it("does not accept blocked evidence as an accepted review decision", async () => {
    const server = await createWorkbenchServer({ port: 0 });
    closeServer = server.close;

    await fetch(`${server.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "build a terrain city" })
    });
    const response = await fetch(`${server.url}/api/review-decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome: "accepted", reasonCodes: ["review-accepted"] })
    });
    const result = await response.json();

    expect(result.status).toBe("blocked");
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ path: "/reviewAction/evidence" }));
    expect(result.summary.revision).toBe("1");
  });
});

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
    expect(html).toContain('id="review-list"');
    expect(html).toContain('data-review-outcome="accepted"');
    expect(html).toContain('data-review-outcome="blocked"');
    expect(html).toContain('data-review-outcome="follow-up-required"');
    expect(html).toContain('aria-describedby="provider-status"');
    expect(html).toContain('role="status"');
    expect(appJs).toContain('fetchJson("/api/providers")');
    expect(appJs).toContain("option.disabled = !provider.enabled");
    expect(appJs).toContain('provider.id === "mock-ai" && provider.enabled');
    expect(appJs).toContain("(missing credential)");
    expect(appJs).toContain("providerId: selectedProviderId");
    expect(appJs).toContain('postJson("/api/review-decision"');
    expect(appJs).toContain('fetchJson("/api/review-decisions")');
    const chatPostBody = /postJson\("\/api\/chat",\s*\{([^}]+)\}\)/.exec(appJs)?.[1] ?? "";
    expect(chatPostBody).toContain("message");
    expect(chatPostBody).toContain("providerId: selectedProviderId");
    expect(chatPostBody).not.toMatch(/apiKey|baseUrl|raw/i);
    expect(appJs).not.toContain("apiKey");
    expect(appJs).not.toContain("baseUrl");
    expect(appJs).not.toContain("renderProviderEvidence({})");
  });

  it("executes provider selection without leaking credentials or rewriting completed evidence", async () => {
    const harness = new WorkbenchNodeHarness({ includeDisabledProvider: true });
    await harness.boot();

    expect(harness.getSelectValue("#provider-select")).toBe("mock-ai");
    expect(harness.getProviderStatus()).toBe("Next request: Mock AI");
    expect(harness.getOptionStates("#provider-select option")).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: "disabled-provider", disabled: true })])
    );

    await harness.selectProvider("disabled-provider");
    expect(harness.getSelectValue("#provider-select")).toBe("mock-ai");
    expect(harness.getProviderStatus()).toBe("Next request: Mock AI");

    await harness.submitChat("make points blue");
    expect(harness.getProviderEvidenceRows()).toMatchObject({
      Provider: "mock"
    });

    await harness.selectProvider("deepseek");
    expect(harness.getSelectValue("#provider-select")).toBe("deepseek");
    expect(harness.getProviderStatus()).toBe("Next request: DeepSeek");
    expect(harness.getProviderEvidenceRows()).toMatchObject({
      Provider: "mock"
    });

    await harness.submitChat("make points red");
    expect(harness.getProviderFetchCount()).toBe(1);
    expect(harness.chatRequests.at(-1)).toEqual({ message: "make points red", providerId: "deepseek" });
    expect(JSON.stringify(harness.chatRequests.at(-1))).not.toMatch(/server-secret-key|apiKey|baseUrl|https:\/\//i);
    expect(harness.getProviderEvidenceRows()).toMatchObject({
      Provider: "deepseek"
    });

    await harness.submitReviewDecision("accepted");
    expect(harness.reviewRequests.at(-1)).toEqual({ outcome: "accepted", reasonCodes: ["review-accepted"] });
    expect(JSON.stringify(harness.reviewRequests.at(-1))).not.toMatch(/server-secret-key|apiKey|baseUrl|https:\/\/|raw|MapSpec/i);
    const reviewText = harness.getText("#review-list");
    expect(reviewText).toContain("accepted");
    expect(reviewText).toContain("review-accepted");

    await harness.selectProvider("mock-ai");
    expect(harness.getSelectValue("#provider-select")).toBe("mock-ai");
    expect(harness.getProviderStatus()).toBe("Next request: Mock AI");
    expect(harness.getProviderEvidenceRows()).toMatchObject({
      Provider: "deepseek"
    });
  }, 30_000);
});

describe("ai-map-workbench repeatable UI evidence", () => {
  it("captures provider, evidence rail, audit, and review decision states", async () => {
    const harness = new WorkbenchNodeHarness();
    await harness.boot();

    const initialEvidence = harness.getEvidence();
    expect(initialEvidence.status).toBe("Ready");
    expect(initialEvidence.canvasCount).toBe(1);
    expect(initialEvidence.map.width).toBeGreaterThan(300);
    expect(initialEvidence.map.height).toBeGreaterThan(300);
    expect(initialEvidence.sections).toEqual([
      "Summary",
      "Provider",
      "Diagnostics",
      "Source promotion",
      "Feature query",
      "Session audit",
      "Review decisions",
      "Last command"
    ]);
    expect(initialEvidence.providerOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "mock-ai", disabled: false }),
        expect.objectContaining({ value: "deepseek", disabled: false })
      ])
    );
    expect(initialEvidence.diagnosticsText).toBe("No diagnostics.");
    expect(initialEvidence.sourcePromotionText).toBe("No source promotion candidates.");
    expect(initialEvidence.auditText).toBe("No session records.");
    expect(initialEvidence.reviewText).toBe("No review decisions.");

    await harness.selectProvider("deepseek");
    expect(harness.getProviderStatus()).toContain("DeepSeek");
    await harness.submitChat("show source promotion candidates");

    expect(harness.chatRequests.at(-1)).toEqual({
      message: "show source promotion candidates",
      providerId: "deepseek"
    });

    const promotedEvidence = harness.getEvidence();
    expect(promotedEvidence.status).toBe("Applied");
    expect(promotedEvidence.providerRows).toMatchObject({
      Provider: "deepseek",
      Model: "deepseek-v4-flash",
      "Raw prompt": "not retained"
    });
    expect(promotedEvidence.summaryRows).toMatchObject({
      Revision: "3",
      Commands: "2"
    });
    expect(promotedEvidence.auditText).toContain("applied / 2 command(s)");
    expect(promotedEvidence.auditText).toContain("1 -> 3 / deepseek");
    expect(promotedEvidence.sourcePromotionCards).toEqual([expect.stringContaining("pmtiles / readiness-only")]);
    expect(promotedEvidence.sourcePromotionCards[0]).toContain("source-promotion.pmtiles.localPmtiles");
    expect(promotedEvidence.sourcePromotionCards[0]).toContain("PMTiles archive metadata promotion gate");
    expect(promotedEvidence.sourcePromotionCards[0]).toContain("archive parsing and feature query remain blocked");

    await harness.submitReviewDecision("accepted");
    await harness.submitReviewDecision("blocked");
    await harness.submitReviewDecision("follow-up-required");

    const finalEvidence = harness.getEvidence();
    expect(finalEvidence.status).toBe("Reviewed");
    expect(finalEvidence.summaryRows).toMatchObject({
      Revision: "3",
      Commands: "2"
    });
    expect(finalEvidence.providerRows).toMatchObject({
      Provider: "deepseek",
      Model: "deepseek-v4-flash",
      "Raw prompt": "not retained"
    });
    expect(finalEvidence.auditText).toContain("applied / 2 command(s)");
    expect(finalEvidence.auditText).toContain("1 -> 3 / deepseek");
    expect(finalEvidence.reviewText).toContain("accepted / review-accepted");
    expect(finalEvidence.reviewText).toContain("blocked / manual-review-blocked");
    expect(finalEvidence.reviewText).toContain("follow-up-required / visual-evidence-required");
    expect(finalEvidence.diagnosticsText).toBe("No diagnostics.");
    expect(finalEvidence.commandJson).toMatchObject({
      commandEvidence: expect.objectContaining({ commandCount: 2, committed: true }),
      results: expect.arrayContaining([
        expect.objectContaining({ commandId: "gen-add-source-localPmtiles", status: "applied" }),
        expect.objectContaining({ commandId: "gen-add-layer-local-pmtiles-fill", status: "applied" })
      ])
    });
    const serializedEvidence = JSON.stringify(finalEvidence);
    expect(serializedEvidence).not.toMatch(/apiKey|baseUrl|server-secret|provider raw body/i);
    expect(harness.consoleErrors).toEqual([]);
    expect(harness.pageErrors).toEqual([]);
  }, 30_000);
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

    expect(DEFAULT_DEEPSEEK_MODEL).toBe("deepseek-v4-flash");
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

  it.each([
    ["non-https", "http://example.test/v1"],
    ["localhost", "https://localhost/v1"],
    ["private-ip", "https://192.168.1.10/v1"],
    ["file-url", "file:///tmp/provider"]
  ])("blocks product-mode custom provider base URL: %s", async (_caseName, baseUrl) => {
    const { buildProviderProfiles, publicProviderProfiles } = await import(
      "../../examples/ai-map-workbench/provider-profiles.mjs"
    );
    const profiles = buildProviderProfiles({
      GIS_WORKBENCH_CUSTOM_PROVIDER_ID: "my-provider",
      GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL: "My Provider",
      GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL: baseUrl,
      GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL: "my-model",
      GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV: "MY_PROVIDER_API_KEY",
      MY_PROVIDER_API_KEY: "secret-custom-key"
    });
    const publicProfiles = publicProviderProfiles(profiles);

    expect(publicProfiles).toContainEqual(
      expect.objectContaining({
        id: "my-provider",
        enabled: false,
        missingCredential: false
      })
    );
    expect(JSON.stringify(publicProfiles)).not.toContain(baseUrl);
    expect(JSON.stringify(publicProfiles)).not.toContain("secret-custom-key");
  });

  it("allows local HTTP custom provider base URLs only outside product mode", async () => {
    const { buildProviderProfiles, publicProviderProfiles } = await import(
      "../../examples/ai-map-workbench/provider-profiles.mjs"
    );
    const profiles = buildProviderProfiles(
      {
        GIS_WORKBENCH_CUSTOM_PROVIDER_ID: "local-fixture",
        GIS_WORKBENCH_CUSTOM_PROVIDER_LABEL: "Local Fixture",
        GIS_WORKBENCH_CUSTOM_PROVIDER_BASE_URL: "http://127.0.0.1:9999/v1",
        GIS_WORKBENCH_CUSTOM_PROVIDER_MODEL: "fixture-model",
        GIS_WORKBENCH_CUSTOM_PROVIDER_API_KEY_ENV: "LOCAL_FIXTURE_API_KEY",
        LOCAL_FIXTURE_API_KEY: "secret-local-key"
      },
      { productMode: false }
    );

    expect(publicProviderProfiles(profiles)).toContainEqual(
      expect.objectContaining({
        id: "local-fixture",
        enabled: true,
        missingCredential: false
      })
    );
  });
});

describe("ai-map-workbench OpenAI-compatible provider adapter", () => {
  const profile = {
    id: "deepseek",
    label: "DeepSeek",
    protocol: "openai-chat-completions",
    baseUrl: "https://api.deepseek.example",
    model: "deepseek-v4-flash"
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
        expect(init.signal).toBeInstanceOf(AbortSignal);
        const requestBody = JSON.parse(String(init.body));
        expect(requestBody.model).toBe("deepseek-v4-flash");
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
    expect(response.providerOutput.promptHash).toBe(
      "sha256:98336f8f0b11f1b76c3b04b00534e48f3983a5e0434d6225c26299d06722b1ac"
    );
    expect(response.providerOutput.traceId).toMatch(/^provider\.deepseek\./);
  });

  it("keeps safe confidence reasons that mention structured intent values", async () => {
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
                      level: "high",
                      reasons: ["High confidence because the poi-circles layer is targeted for feature-display."]
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
      reasons: ["High confidence because the poi-circles layer is targeted for feature-display."]
    });
  });

  it("allows single-token prompts that match structured intent values", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: "poi-circles",
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
                      reasons: ["The poi-circles layer is the requested target."]
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
    expect(response.providerOutput.intent).toMatchObject({
      styleEdits: [{ layerId: "poi-circles", paint: { "circle-color": "#ef4444" } }]
    });
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

  it.each([
    "api_key",
    "api-key",
    "provider_trace",
    "provider_response",
    "response_body",
    "responseBody",
    "authorization",
    "access_token",
    "bearer_token",
    "credential",
    "password"
  ])(
    "returns diagnostics when provider intent contains unsafe separator key %s",
    async (unsafeKey) => {
      const { callOpenAiCompatibleProvider } = await import(
        "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
      );
      const providerMarker = `provider-private-marker-${unsafeKey}`;
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
                        [unsafeKey]: providerMarker
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
    }
  );

  it.each([
    ["missing", {}],
    ["null", { intent: null }],
    ["string", { intent: "show poi circles" }],
    ["array", { intent: [{ mapId: "ai-map-workbench" }] }]
  ])("returns diagnostics when provider intent is %s", async (_caseName, contentBody) => {
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
                    ...contentBody,
                    response_body: rawProviderBody
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
    expectProviderFailureSafe(response);
  });

  it.each(["api_key", "provider_trace", "provider_response"])(
    "omits confidence reasons that contain markers under unsafe separator key %s",
    async (unsafeKey) => {
      const { callOpenAiCompatibleProvider } = await import(
        "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
      );
      const providerMarker = `provider-private-marker-${unsafeKey}`;
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
                      [unsafeKey]: providerMarker,
                      confidence: {
                        level: "medium",
                        reasons: [providerMarker, "safe confidence reason"]
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
      expect(JSON.stringify(response.providerOutput)).not.toContain(providerMarker);
    }
  );

  it("omits confidence markers from unsafe alias fields while keeping structured intent references", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const providerMarker = "provider-private-authorization-marker";
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
                    authorization: providerMarker,
                    confidence: {
                      level: "high",
                      reasons: [
                        providerMarker,
                        "High confidence because the poi-circles layer is targeted for feature-display."
                      ]
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
      reasons: ["High confidence because the poi-circles layer is targeted for feature-display."]
    });
    expect(JSON.stringify(response.providerOutput)).not.toContain(providerMarker);
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

  it("returns timeout diagnostics and aborts slow provider requests", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    let sawAbort = false;
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      timeoutMs: 5,
      fetchImpl: async (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            sawAbort = true;
            reject(new DOMException("aborted", "AbortError"));
          });
        })
    });

    expect(response.ok).toBe(false);
    expect(sawAbort).toBe(true);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerRequest/timeout"
      })
    );
    expectProviderFailureSafe(response);
  });

  it("returns timeout diagnostics when provider response bodies do not finish", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const encoder = new TextEncoder();
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      timeoutMs: 5,
      fetchImpl: async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('{"choices":['));
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerRequest/timeout"
      })
    );
    expectProviderFailureSafe(response);
  });

  it("returns response size diagnostics before parsing oversized provider bodies", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const oversizedProviderBody = `${rawProviderBody} ${"x".repeat(128)}`;
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      responseByteCap: 32,
      fetchImpl: async () =>
        new Response(oversizedProviderBody, {
          status: 200,
          headers: {
            "content-type": "application/json",
            "content-length": String(Buffer.byteLength(oversizedProviderBody))
          }
        })
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerResponse/size"
      })
    );
    expectProviderFailureSafe(response);
  });

  it("caps chunked provider response bodies without content-length", async () => {
    const { callOpenAiCompatibleProvider } = await import(
      "../../examples/ai-map-workbench/openai-compatible-provider.mjs"
    );
    const encoder = new TextEncoder();
    const response = await callOpenAiCompatibleProvider({
      profile,
      apiKey,
      message: rawMessage,
      summary,
      responseByteCap: 32,
      fetchImpl: async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('{"choices":['));
              controller.enqueue(encoder.encode(`${rawProviderBody} ${"x".repeat(128)}`));
              controller.close();
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    });

    expect(response.ok).toBe(false);
    expect(response.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/providerResponse/size"
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
