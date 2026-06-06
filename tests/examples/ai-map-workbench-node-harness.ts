import { readFile } from "node:fs/promises";
import { createContext, Script } from "node:vm";

type HarnessOptions = {
  includeDisabledProvider?: boolean;
};

type ProviderProfile = {
  id: string;
  label: string;
  protocol: string;
  model: string;
  enabled: boolean;
  missingCredential: boolean;
};

type AuditRecord = {
  id: string;
  sessionId: string;
  timestamp: string;
  status: string;
  providerId: string;
  promptHash?: string;
  traceId?: string;
  commandCount: number;
  fromRevision: string;
  toRevision: string;
};

type ReviewDecision = {
  outcome: string;
  reasonCodes: string[];
  auditRecordId: string;
  providerId: string;
};

type ChatResponse =
  | {
      status: "applied";
      summary: {
        mapId: string;
        revision: string;
        sourceCount: number;
        layerCount: number;
        center: [number, number];
        zoom: number;
      };
      style: { version: number; sources: Record<string, never>; layers: [] };
      provider: {
        providerId: string;
        retainedRawPrompt: false;
        confidence?: { level: "low" | "medium" | "high"; reasons: string[] };
      };
      generationEvidence: unknown;
      diagnostics: [];
      commandEvidence: { commandCount: number; committed: boolean; rolledBack: boolean };
      results: Array<{ commandId: string; status: "applied" }>;
    }
  | {
      status: "unsupported" | "blocked" | "ready";
      summary: {
        mapId: string;
        revision: string;
        sourceCount: number;
        layerCount: number;
        center: [number, number];
        zoom: number;
      };
      style: { version: number; sources: Record<string, never>; layers: [] };
      provider?: {
        providerId: string;
        retainedRawPrompt: false;
        confidence?: { level: "low" | "medium" | "high"; reasons: string[] };
      };
      generationEvidence: unknown;
      diagnostics: [];
      commandEvidence: { commandCount: number; committed: boolean; rolledBack: boolean };
      results: Array<{ commandId: string; status: "applied" }>;
    };

export class WorkbenchNodeHarness {
  readonly chatRequests: Array<Record<string, unknown>> = [];
  readonly reviewRequests: Array<Record<string, unknown>> = [];
  readonly consoleErrors: string[] = [];
  readonly pageErrors: string[] = [];
  private readonly providers: ProviderProfile[];
  private readonly auditRecords: AuditRecord[] = [];
  private readonly reviewDecisions: ReviewDecision[] = [];
  private lastGenerationEvidence: any = null;
  private readonly context: Record<string, unknown>;
  private revision = 1;
  private providerFetchCount = 0;
  private readonly document: FakeDocument;
  private readonly window: FakeWindow;
  private readonly appJsPromise: Promise<string>;

  constructor(options: HarnessOptions = {}) {
    this.providers = [
      {
        id: "mock-ai",
        label: "Mock AI",
        protocol: "mock",
        model: "deterministic-mock",
        enabled: true,
        missingCredential: false,
      },
      {
        id: "deepseek",
        label: "DeepSeek",
        protocol: "openai-chat-completions",
        model: "deepseek-v4-flash",
        enabled: true,
        missingCredential: false,
      },
      ...(options.includeDisabledProvider
        ? [
            {
              id: "disabled-provider",
              label: "Disabled Provider",
              protocol: "openai-chat-completions",
              model: "disabled-model",
              enabled: false,
              missingCredential: true,
            },
          ]
        : []),
    ];
    this.document = new FakeDocument();
    this.window = new FakeWindow(this.document);
    this.appJsPromise = readFile(new URL("../../examples/ai-map-workbench/public/app.js", import.meta.url), "utf8");
    this.readyPromise = Promise.resolve();
    this.context = createContext({
      window: this.window,
      document: this.document,
      fetch: this.fetch.bind(this),
      Response,
      Event: FakeEvent,
      console: {
        error: (...args: unknown[]) => this.consoleErrors.push(args.map(String).join(" ")),
        log: () => {},
        warn: (...args: unknown[]) => this.consoleErrors.push(args.map(String).join(" ")),
        info: () => {},
        debug: () => {},
      },
      setTimeout,
      clearTimeout,
      queueMicrotask,
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      },
      localStorage: this.window.localStorage,
      maplibregl: createMapLibreStub(this.document),
    });
  }

  async boot() {
    buildWorkbenchDom(this.document);
    const appJs = await this.appJsPromise;
    new Script(appJs).runInContext(this.context);
    await this.waitFor(() => this.document.querySelectorAll("#provider-select option").length > 0);
    await this.waitFor(() => this.getStatusText() === "Ready");
    await this.waitFor(() => this.document.querySelectorAll("canvas").length > 0);
    await this.waitFor(() => this.getText("#audit-list") === "No session records.");
    await this.waitFor(() => this.getText("#review-list") === "No review decisions.");
  }

  async close() {}

  getProviderFetchCount() {
    return this.providerFetchCount;
  }

  async selectProvider(value: string) {
    const select = this.mustGetElement("#provider-select") as FakeSelectElement;
    select.value = value;
    select.dispatchEvent(new FakeEvent("change", { bubbles: true }));
    await this.waitFor(
      () => this.getProviderStatus().includes("Mock AI") || this.getProviderStatus().includes("DeepSeek"),
    );
  }

  async submitChat(message: string) {
    const input = this.mustGetElement("#chat-input") as FakeInputElement;
    const form = this.mustGetElement("#chat-form");
    const requestCount = this.chatRequests.length;
    const beforeAuditText = this.getText("#audit-list");
    input.value = message;
    form.dispatchEvent(new FakeEvent("submit", { bubbles: true, cancelable: true }));
    await this.waitFor(() => {
      const status = this.getStatusText();
      return (
        this.chatRequests.length > requestCount &&
        (status === "Applied" || status === "Blocked" || status === "Unsupported") &&
        this.getText("#audit-list") !== beforeAuditText
      );
    });
    await this.flushMicrotasks();
  }

  async submitReviewDecision(outcome: string) {
    const button = this.mustGetElement(`[data-review-outcome="${outcome}"]`);
    const requestCount = this.reviewRequests.length;
    const beforeReviewText = this.getText("#review-list");
    const beforeDiagnosticsText = this.getText("#diagnostics-list");
    button.dispatchEvent(new FakeEvent("click", { bubbles: true }));
    await this.waitFor(() => {
      const status = this.getStatusText();
      const reviewChanged = this.getText("#review-list") !== beforeReviewText;
      const diagnosticsChanged = this.getText("#diagnostics-list") !== beforeDiagnosticsText;
      const requestComplete = this.reviewRequests.length > requestCount;

      if (outcome === "accepted") {
        return (
          requestComplete && ((status === "Reviewed" && reviewChanged) || (status === "Blocked" && diagnosticsChanged))
        );
      }

      return requestComplete && (status === "Reviewed" || reviewChanged);
    });
    await this.flushMicrotasks();
  }

  async waitForProviderStatusContains(fragment: string) {
    await this.waitFor(() => this.getProviderStatus().includes(fragment));
  }

  async waitForStatus(status: string) {
    await this.waitFor(() => this.getStatusText() === status);
  }

  async waitForReviewTextContains(fragment: string) {
    await this.waitFor(() => this.getText("#review-list").includes(fragment));
  }

  getProviderEvidenceRows() {
    return rowsFromDefinitionList(this.document, "#provider-list");
  }

  getEvidence() {
    return collectWorkbenchUiEvidence(this.document);
  }

  getStatusText() {
    return this.getText("#status-pill");
  }

  getProviderStatus() {
    return this.getText("#provider-status");
  }

  getText(selector: string) {
    return this.mustGetElement(selector).textContent.trim();
  }

  getSelectValue(selector: string) {
    return (this.mustGetElement(selector) as FakeSelectElement).value;
  }

  getOptionStates(selector: string) {
    return this.document.querySelectorAll(selector).map((element) => ({
      value: (element as FakeOptionElement).value,
      text: element.textContent.trim(),
      disabled: (element as FakeOptionElement).disabled,
    }));
  }

  getCommandJson() {
    return JSON.parse(this.getText("#command-json"));
  }

  private mustGetElement(selector: string) {
    const element = this.document.querySelector(selector);
    if (!element) throw new Error(`Missing element: ${selector}`);
    return element;
  }

  private async waitFor(predicate: () => boolean) {
    for (let i = 0; i < 100; i += 1) {
      if (predicate()) return;
      await Promise.resolve();
    }
    throw new Error("Timed out waiting for harness state.");
  }

  private async flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
  }

  private async fetch(url: string, init: { method?: string; body?: string } = {}) {
    const stringUrl = String(url);
    const method = String(init.method ?? "GET").toUpperCase();

    if (stringUrl.endsWith("/api/providers")) {
      return jsonResponse({ providers: this.providers });
    }

    if (stringUrl.endsWith("/api/state")) {
      return jsonResponse(
        this.buildStatePayload({
          status: "ready",
          revision: String(this.revision),
        }),
      );
    }

    if (stringUrl.endsWith("/api/audit")) {
      return jsonResponse({
        sessionId: "session_browser",
        records: this.auditRecords,
      });
    }

    if (stringUrl.endsWith("/api/review-decisions")) {
      return jsonResponse({
        sessionId: "session_browser",
        projectId: "project_demo",
        decisions: this.reviewDecisions,
      });
    }

    if (stringUrl.endsWith("/api/reset")) {
      this.revision = 1;
      this.auditRecords.splice(0, this.auditRecords.length);
      this.reviewDecisions.splice(0, this.reviewDecisions.length);
      this.lastGenerationEvidence = null;
      return jsonResponse(
        this.buildStatePayload({
          status: "reset",
          revision: "1",
        }),
      );
    }

    if (stringUrl.endsWith("/api/chat") && method === "POST") {
      const body = JSON.parse(init.body ?? "{}") as { message?: string; providerId?: string };
      this.chatRequests.push(body as Record<string, unknown>);
      const message = String(body.message ?? "");
      const providerId = String(body.providerId ?? "mock-ai");
      const fromRevision = String(this.revision);

      const response = this.buildChatResponse(message, providerId, fromRevision);
      this.lastGenerationEvidence = response.generationEvidence ?? null;
      this.auditRecords.push({
        id: `session_browser.${this.auditRecords.length + 1}`,
        sessionId: "session_browser",
        timestamp: new Date().toISOString(),
        status: response.status,
        providerId: response.status === "applied" && response.provider ? response.provider.providerId : "mock-ai",
        commandCount: response.commandEvidence.commandCount,
        fromRevision,
        toRevision: response.summary.revision,
      });
      this.revision = Number.parseInt(response.summary.revision, 10) || this.revision;
      return jsonResponse(response);
    }

    if (stringUrl.endsWith("/api/review-decision") && method === "POST") {
      const body = JSON.parse(init.body ?? "{}") as { outcome?: string; reasonCodes?: string[] };
      this.reviewRequests.push(body as Record<string, unknown>);
      const auditRecordId = this.auditRecords.at(-1)?.id ?? "no-audit";
      const providerId = this.auditRecords.at(-1)?.providerId ?? "provider";
      const reviewDiagnostics = this.validateReviewDecision(body.outcome ?? "accepted", body.reasonCodes ?? []);
      if (reviewDiagnostics.length > 0) {
        return jsonResponse(
          this.buildStatePayload({
            status: "blocked",
            revision: String(this.revision),
            decision: null,
            decisions: this.reviewDecisions,
            diagnostics: reviewDiagnostics,
            commandEvidence: { commandCount: 0, committed: false, rolledBack: false },
          }),
        );
      }

      const decision = {
        outcome: body.outcome ?? "accepted",
        reasonCodes: body.reasonCodes ?? [],
        auditRecordId,
        providerId,
      };
      this.reviewDecisions.push(decision);
      return jsonResponse(
        this.buildStatePayload({
          status: "reviewed",
          revision: String(this.revision),
          decision,
          decisions: this.reviewDecisions,
          diagnostics: [],
          commandEvidence: { commandCount: 0, committed: false, rolledBack: false },
        }),
      );
    }

    throw new Error(`Unexpected fetch: ${stringUrl}`);
  }

  private buildChatResponse(message: string, providerId: string, _fromRevision: string): ChatResponse {
    if (providerId === "deepseek" && /source promotion/i.test(message)) {
      this.providerFetchCount += 1;
      return {
        status: "applied",
        summary: {
          mapId: "ai-map-workbench",
          revision: "3",
          sourceCount: 1,
          layerCount: 2,
          center: [120.15, 30.28],
          zoom: 11,
        },
        style: { version: 8, sources: {}, layers: [] },
        provider: {
          providerId: "deepseek",
          retainedRawPrompt: false,
          confidence: {
            level: "medium",
            reasons: ["Structured PMTiles source promotion evidence."],
          },
        },
        generationEvidence: {
          promptHash: "sha256:pmtiles-local",
          status: "ready",
          delivery: {
            status: "follow-up-required",
            sourceReadiness: [
              {
                sourceId: "localPmtiles",
                type: "pmtiles",
                state: "readiness-only",
                queryReady: false,
                resourcePolicy: "passed",
                archiveContract: {
                  state: "explicit",
                  metadataFields: [
                    "specVersion",
                    "archiveBytes",
                    "rootDirectoryOffset",
                    "rootDirectoryLength",
                    "hasVectorTiles",
                    "hasRasterTiles",
                    "tileType",
                    "minZoom",
                    "maxZoom",
                    "bounds",
                  ],
                  policyFields: [
                    "maxArchiveBytes",
                    "maxRootDirectoryBytes",
                    "allowRangeRequests",
                    "maxRangeSegments",
                    "timeoutMs",
                  ],
                },
                confirmationReasons: ["external-resource", "archive-parsing"],
                notes: [
                  "PMTiles is URL-compatible for display/export evidence, while archive parsing and feature query support remain future contracts.",
                  "Promote only one format at a time; archive parsing stays blocked until the gate passes.",
                ],
              },
            ],
            sourcePromotionCandidates: [
              {
                candidateId: "source-promotion.pmtiles.localPmtiles",
                format: "pmtiles",
                state: "readiness-only",
                resourcePolicy: "passed",
                archiveContract: {
                  state: "explicit",
                  metadataFields: [
                    "specVersion",
                    "archiveBytes",
                    "rootDirectoryOffset",
                    "rootDirectoryLength",
                    "hasVectorTiles",
                    "hasRasterTiles",
                    "tileType",
                    "minZoom",
                    "maxZoom",
                    "bounds",
                  ],
                  policyFields: [
                    "maxArchiveBytes",
                    "maxRootDirectoryBytes",
                    "allowRangeRequests",
                    "maxRangeSegments",
                    "timeoutMs",
                  ],
                },
                target: "PMTiles archive metadata promotion gate",
                exitCondition:
                  "Schema, resource-policy, and manifest evidence must prove archive metadata is explicit while archive parsing and feature query remain blocked.",
                sourceIds: ["localPmtiles"],
              },
            ],
          },
        },
        diagnostics: [],
        commandEvidence: { commandCount: 2, committed: true, rolledBack: false },
        results: [
          { commandId: "gen-add-source-localPmtiles", status: "applied" },
          { commandId: "gen-add-layer-local-pmtiles-fill", status: "applied" },
        ],
      };
    }

    if (providerId === "deepseek" || /red/i.test(message)) {
      this.providerFetchCount += 1;
      return {
        status: "applied",
        summary: {
          mapId: "ai-map-workbench",
          revision: "2",
          sourceCount: 1,
          layerCount: 2,
          center: [120.15, 30.28],
          zoom: 11,
        },
        style: { version: 8, sources: {}, layers: [] },
        provider: {
          providerId: "deepseek",
          retainedRawPrompt: false,
          confidence: {
            level: "medium",
            reasons: ["DeepSeek selected a structured point style edit."],
          },
        },
        generationEvidence: {
          promptHash: "sha256:deepseek-red",
          status: "ready",
          delivery: {
            status: "ready",
            sourceReadiness: [
              {
                sourceId: "pois",
                type: "geojson",
                state: "supported",
                queryReady: true,
                resourcePolicy: "passed",
                notes: [
                  "Inline GeoJSON is schema-valid, display-ready, and eligible for deterministic point/bbox query evidence.",
                ],
              },
            ],
            sourcePromotionCandidates: [],
          },
        },
        diagnostics: [],
        commandEvidence: { commandCount: 2, committed: true, rolledBack: false },
        results: [
          { commandId: "cmd-deepseek-red-points", status: "applied" },
          { commandId: "cmd-deepseek-meta", status: "applied" },
        ],
      };
    }

    return {
      status: "applied",
      summary: {
        mapId: "ai-map-workbench",
        revision: "2",
        sourceCount: 1,
        layerCount: 2,
        center: [120.15, 30.28],
        zoom: 11,
      },
      style: { version: 8, sources: {}, layers: [] },
      generationEvidence: {
        promptHash: "sha256:mock-ai-edit",
        status: "ready",
        delivery: {
          status: "ready",
          sourceReadiness: [
            {
              sourceId: "pois",
              type: "geojson",
              state: "supported",
              queryReady: true,
              resourcePolicy: "passed",
              notes: [
                "Inline GeoJSON is schema-valid, display-ready, and eligible for deterministic point/bbox query evidence.",
              ],
            },
          ],
          sourcePromotionCandidates: [],
        },
      },
      diagnostics: [],
      commandEvidence: { commandCount: 1, committed: true, rolledBack: false },
      results: [{ commandId: "cmd-mock-blue-points", status: "applied" }],
    };
  }

  private buildStatePayload(input: {
    status: string;
    revision?: string;
    provider?: {
      providerId: string;
      retainedRawPrompt: false;
      confidence?: { level: "low" | "medium" | "high"; reasons: string[] };
    };
    generationEvidence?: unknown;
    diagnostics?: unknown[];
    commandEvidence?: { commandCount: number; committed: boolean; rolledBack: boolean };
    results?: Array<{ commandId: string; status: "applied" }>;
    decision?: unknown;
    decisions?: unknown[];
  }) {
    return {
      status: input.status,
      summary: {
        mapId: "ai-map-workbench",
        revision: input.revision ?? String(this.revision),
        sourceCount: 1,
        layerCount: 2,
        center: [120.15, 30.28],
        zoom: 11,
      },
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
      ...(input.provider ? { provider: input.provider } : {}),
      ...(input.generationEvidence !== undefined ? { generationEvidence: input.generationEvidence } : {}),
      diagnostics: input.diagnostics ?? [],
      ...(input.commandEvidence ? { commandEvidence: input.commandEvidence } : {}),
      ...(input.results ? { results: input.results } : {}),
      ...(input.decision ? { decision: input.decision } : {}),
      ...(input.decisions ? { decisions: input.decisions } : {}),
    };
  }

  private validateReviewDecision(outcome: string, reasonCodes: string[]) {
    if (outcome === "accepted") {
      const delivery = this.lastGenerationEvidence?.delivery;
      const sourceReadiness = Array.isArray(delivery?.sourceReadiness) ? delivery.sourceReadiness : [];
      const deliveryStatus = delivery?.status ?? "ready";
      const hasUnreadySource = sourceReadiness.some((entry: { state?: string }) => entry.state !== "supported");
      const hasEvidenceError = deliveryStatus !== "ready" || hasUnreadySource;
      if (hasEvidenceError) {
        return [
          {
            severity: "error",
            code: "REVIEW.CONTRACT_VIOLATION",
            message: "Accepted decisions require ready delivery and supported source readiness.",
            path: "/reviewAction/evidence",
          },
        ];
      }
      return [];
    }

    if (outcome === "follow-up-required" && reasonCodes.length === 0) {
      return [
        {
          severity: "error",
          code: "REVIEW.CONTRACT_VIOLATION",
          message: "Follow-up decisions require a reason code.",
          path: "/reviewAction/followUp",
        },
      ];
    }

    return [];
  }
}

export function collectWorkbenchUiEvidence(document: FakeDocument) {
  const rectOf = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return { width: 0, height: 0 };
    const rect = element.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  };
  const rowsFromDefinitionList = (selector: string) => {
    const rows: Record<string, string> = {};
    for (const term of document.querySelectorAll(`${selector} dt`)) {
      const label = term.textContent.trim();
      const value = term.nextElementSibling?.textContent?.trim();
      if (label) rows[label] = value ?? "";
    }
    return rows;
  };
  return {
    status: document.querySelector("#status-pill")?.textContent.trim() ?? "",
    map: rectOf("#map"),
    canvasCount: document.querySelectorAll("canvas").length,
    canvas: rectOf("canvas"),
    sections: document.querySelectorAll(".evidence-section h3").map((heading) => heading.textContent.trim()),
    providerOptions: document.querySelectorAll("#provider-select option").map((option) => ({
      value: (option as FakeOptionElement).value,
      text: option.textContent.trim(),
      disabled: (option as FakeOptionElement).disabled,
    })),
    summaryRows: rowsFromDefinitionList("#summary-list"),
    providerRows: rowsFromDefinitionList("#provider-list"),
    diagnosticsText: document.querySelector("#diagnostics-list")?.textContent.trim() ?? "",
    sourceReadinessCards: document
      .querySelectorAll("#source-readiness-list article")
      .map((article) => article.textContent.trim()),
    sourceReadinessText: document.querySelector("#source-readiness-list")?.textContent.trim() ?? "",
    sourcePromotionCards: document
      .querySelectorAll("#source-promotion-list article")
      .map((article) => article.textContent.trim()),
    sourcePromotionText: document.querySelector("#source-promotion-list")?.textContent.trim() ?? "",
    auditText: document.querySelector("#audit-list")?.textContent.trim() ?? "",
    reviewText: document.querySelector("#review-list")?.textContent.trim() ?? "",
    commandJson: JSON.parse(document.querySelector("#command-json")?.textContent.trim() || "{}"),
  };
}

function buildWorkbenchDom(document: FakeDocument) {
  const shell = element(document, "div", { className: "workbench-shell" });
  const chatPanel = element(document, "aside", { className: "chat-panel", attrs: { "aria-label": "AI chat sidebar" } });
  const chatToggle = element(document, "button", { id: "toggle-chat-panel", attrs: { type: "button" } });
  const chatContent = element(document, "div", { className: "panel-content" });
  const chatHeader = element(document, "header", { className: "panel-header" });
  const chatHeaderLine = element(document, "div", { className: "header-line" });
  const chatEye = element(document, "p", { className: "eyebrow", text: "Local mock AI" });
  const chatBadge = element(document, "span", { className: "tiny-badge", text: "Command only" });
  const h1 = element(document, "h1", { text: "AI Map Workbench" });
  const chatSubtle = element(document, "p", {
    className: "subtle",
    text: "Structured chat edits for the current GIS Engine.",
  });
  const messages = element(document, "div", {
    id: "messages",
    className: "messages",
    attrs: { "aria-live": "polite" },
  });
  const providerPicker = element(document, "section", {
    className: "provider-picker",
    attrs: { "aria-label": "Provider selection" },
  });
  const providerLabel = element(document, "label", { attrs: { for: "provider-select" }, text: "Provider" });
  const providerSelect = element(document, "select", {
    id: "provider-select",
    attrs: { "aria-describedby": "provider-status" },
  }) as FakeSelectElement;
  const providerStatus = element(document, "p", {
    id: "provider-status",
    className: "provider-status",
    attrs: { role: "status" },
    text: "Next request: Mock AI",
  });
  const promptBank = element(document, "div", {
    className: "prompt-bank",
    attrs: { "aria-label": "Prompt shortcuts" },
  });
  const prompts = ["make points red", "make points blue", "increase point size", "zoom to Hangzhou"];
  for (const prompt of prompts) {
    promptBank.append(
      element(document, "button", {
        attrs: { type: "button", "data-prompt": prompt },
        text:
          prompt === "make points red"
            ? "Red"
            : prompt === "make points blue"
              ? "Blue"
              : prompt === "increase point size"
                ? "Larger"
                : "Zoom",
      }),
    );
  }
  const chatForm = element(document, "form", { id: "chat-form", className: "chat-form" });
  const chatInputLabel = element(document, "label", {
    className: "sr-only",
    attrs: { for: "chat-input" },
    text: "Map instruction",
  });
  const chatInput = element(document, "input", {
    id: "chat-input",
    attrs: { name: "message", autocomplete: "off", placeholder: "Ask for a local map edit" },
  }) as FakeInputElement;
  const chatSubmit = element(document, "button", {
    attrs: { type: "submit", "aria-label": "Send instruction" },
    text: "Send",
  });

  const mapStage = element(document, "main", { className: "map-stage" });
  const stageBar = element(document, "header", { className: "stage-bar" });
  const stageTitleWrap = element(document, "div");
  const stageEyebrow = element(document, "p", { className: "eyebrow", text: "Map display" });
  const stageTitle = element(document, "h2", { id: "map-title", text: "Starter POI scene" });
  const stageMeta = element(document, "div", { className: "stage-meta", attrs: { "aria-label": "Renderer context" } });
  stageMeta.append(
    element(document, "span", { text: "MapLibre" }),
    element(document, "span", { text: "MapSpec v0.1" }),
  );
  const statusPill = element(document, "div", { id: "status-pill", className: "status-pill", text: "Loading" });
  const map = element(document, "div", { id: "map", className: "map-canvas", attrs: { "aria-label": "MapLibre map" } });
  const mapReadout = element(document, "div", {
    className: "map-readout",
    attrs: { "aria-label": "Current map state" },
  });
  mapReadout.append(
    element(document, "span", { id: "revision-readout", text: "revision --" }),
    element(document, "span", { id: "camera-readout", text: "camera --" }),
  );

  const evidencePanel = element(document, "aside", {
    className: "evidence-panel",
    attrs: { "aria-label": "Engine evidence" },
  });
  const evidenceToggle = element(document, "button", { id: "toggle-evidence-panel", attrs: { type: "button" } });
  const evidenceContent = element(document, "div", { className: "panel-content" });
  const evidenceHeader = element(document, "header", { className: "panel-header compact" });
  const evidenceHeaderLine = element(document, "div", { className: "header-line" });
  evidenceHeaderLine.append(
    element(document, "p", { className: "eyebrow", text: "Engine evidence" }),
    element(document, "span", { className: "tiny-badge live", text: "Live" }),
  );
  evidenceHeader.append(evidenceHeaderLine, element(document, "h2", { text: "Command trail" }));
  const evidenceScroll = element(document, "div", { className: "evidence-scroll" });
  const sections = [
    ["Summary", "summary-list", "summary-list"],
    ["Provider", "provider-list", "summary-list evidence-list"],
    ["Diagnostics", "diagnostics-list", "diagnostics-list"],
    ["Source readiness", "source-readiness-list", "audit-list"],
    ["Source promotion", "source-promotion-list", "audit-list"],
    ["Feature query", "feature-query", "feature-query"],
    ["Session audit", "audit-list", "audit-list"],
  ] as const;
  for (const [title, id, className] of sections) {
    const section = element(document, "section", { className: "evidence-section" });
    section.append(element(document, "h3", { text: title }), element(document, "div", { id, className }));
    evidenceScroll.append(section);
  }
  const reviewSection = element(document, "section", { className: "evidence-section" });
  const reviewActions = element(document, "div", {
    className: "review-actions",
    attrs: { "aria-label": "Review decision actions" },
  });
  reviewActions.append(
    element(document, "button", { attrs: { type: "button", "data-review-outcome": "accepted" }, text: "Accept" }),
    element(document, "button", { attrs: { type: "button", "data-review-outcome": "blocked" }, text: "Block" }),
    element(document, "button", {
      attrs: { type: "button", "data-review-outcome": "follow-up-required" },
      text: "Follow up",
    }),
  );
  reviewSection.append(
    element(document, "h3", { text: "Review decisions" }),
    reviewActions,
    element(document, "div", { id: "review-list", className: "audit-list" }),
  );
  evidenceScroll.append(reviewSection);
  evidenceScroll.append(
    element(document, "section", { className: "evidence-section" }, [
      element(document, "h3", { text: "Last command" }),
      element(document, "pre", { id: "command-json", className: "code-panel", text: "{}" }),
    ]),
  );
  const resetButton = element(document, "button", {
    id: "reset-button",
    className: "reset-button",
    attrs: { type: "button" },
    text: "Reset workbench",
  });
  evidenceContent.append(evidenceHeader, evidenceScroll);
  evidencePanel.append(evidenceToggle, evidenceContent);

  chatHeaderLine.append(chatEye, chatBadge);
  chatHeader.append(chatHeaderLine, h1, chatSubtle);
  providerPicker.append(providerLabel, providerSelect, providerStatus);
  chatForm.append(chatInputLabel, chatInput, chatSubmit);
  chatContent.append(chatHeader, messages, providerPicker, promptBank, chatForm);
  chatPanel.append(chatToggle, chatContent);
  stageTitleWrap.append(stageEyebrow, stageTitle);
  stageBar.append(stageTitleWrap, stageMeta, statusPill);
  mapStage.append(stageBar, map, mapReadout);
  shell.append(chatPanel, mapStage, evidencePanel);
  evidenceScroll.append(resetButton);
  document.body.append(shell);
}

function element(
  document: FakeDocument,
  tagName: string,
  options: { id?: string; className?: string; attrs?: Record<string, string>; text?: string } = {},
  children: Array<FakeElement | FakeTextNode> = [],
) {
  const el = document.createElement(tagName);
  if (options.id) el.id = options.id;
  if (options.className) el.className = options.className;
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) el.setAttribute(key, value);
  }
  if (options.text !== undefined) el.textContent = options.text;
  for (const child of children) el.append(child);
  return el;
}

function rowsFromDefinitionList(document: FakeDocument, selector: string) {
  const rows: Record<string, string> = {};
  for (const term of document.querySelectorAll(`${selector} dt`)) {
    const label = term.textContent.trim();
    const value = term.nextElementSibling?.textContent.trim();
    if (label) rows[label] = value ?? "";
  }
  return rows;
}

function createMapLibreStub(document: FakeDocument) {
  return {
    Map: class {
      constructor(options: { container: string }) {
        const container = document.getElementById(options.container);
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        container?.append(canvas);
      }
      addControl() {}
      getZoom() {
        return 11;
      }
      jumpTo() {}
      on() {}
      resize() {}
      setStyle() {}
    },
    NavigationControl: class {},
  };
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
  });
}

class FakeWindow {
  readonly localStorage = new FakeLocalStorage();
  document: FakeDocument;

  constructor(document: FakeDocument) {
    this.document = document;
  }
}

class FakeLocalStorage {
  private readonly store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

class FakeEvent {
  readonly type: string;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  defaultPrevented = false;
  currentTarget: FakeElement | null = null;
  target: FakeElement | null = null;
  constructor(type: string, options: { bubbles?: boolean; cancelable?: boolean } = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
    this.cancelable = Boolean(options.cancelable);
  }
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
}

class FakeDocument {
  readonly body: FakeElement;
  readonly documentElement: FakeElement;
  readonly allElements: FakeElement[] = [];

  constructor() {
    this.documentElement = new FakeElement("html", this);
    this.body = new FakeElement("body", this);
    this.documentElement.append(this.body);
  }

  createElement(tagName: string) {
    const element =
      tagName.toLowerCase() === "select"
        ? new FakeSelectElement(this)
        : tagName.toLowerCase() === "input"
          ? new FakeInputElement(tagName, this)
          : tagName.toLowerCase() === "option"
            ? new FakeOptionElement(this)
            : new FakeElement(tagName, this);
    this.allElements.push(element);
    return element;
  }

  getElementById(id: string) {
    return this.allElements.find((element) => element.id === id && element.isConnected) ?? null;
  }

  querySelector(selector: string) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string) {
    return this.allElements.filter((element) => element.isConnected && matchesSelector(element, selector));
  }
}

class FakeTextNode {
  readonly nodeType = 3;
  parentNode: FakeElement | null = null;
  private value = "";
  constructor(text: string) {
    this.value = text;
  }
  get textContent() {
    return this.value;
  }
  set textContent(value: string) {
    this.value = String(value);
  }
}

class FakeElement {
  readonly tagName: string;
  readonly ownerDocument: FakeDocument;
  parentNode: FakeElement | null = null;
  childNodes: Array<FakeElement | FakeTextNode> = [];
  style: Record<string, string> = {};
  scrollTop = 0;
  scrollHeight = 0;
  width = 0;
  height = 0;
  private textValue = "";
  private listeners = new Map<string, Array<(event: FakeEvent) => void>>();
  private attributes = new Map<string, string>();
  private classTokens = new Set<string>();
  private _value = "";
  private _disabled = false;
  readonly classList = {
    add: (...tokens: string[]) => {
      for (const token of tokens) this.classTokens.add(token);
      this.syncClassAttr();
    },
    remove: (...tokens: string[]) => {
      for (const token of tokens) this.classTokens.delete(token);
      this.syncClassAttr();
    },
    contains: (token: string) => this.classTokens.has(token),
    toggle: (token: string, force?: boolean) => {
      const next = force ?? !this.classTokens.has(token);
      if (next) this.classTokens.add(token);
      else this.classTokens.delete(token);
      this.syncClassAttr();
      return next;
    },
  };
  readonly dataset: Record<string, string>;

  constructor(tagName: string, ownerDocument: FakeDocument) {
    this.tagName = tagName.toLowerCase();
    this.ownerDocument = ownerDocument;
    this.dataset = new Proxy({} as Record<string, string>, {
      get: (_target, prop: string) => this.getAttribute(`data-${camelToKebab(prop)}`) ?? "",
      set: (_target, prop: string, value: string) => {
        this.setAttribute(`data-${camelToKebab(prop)}`, String(value));
        return true;
      },
    }) as Record<string, string>;
  }

  get id() {
    return this.getAttribute("id") ?? "";
  }
  set id(value: string) {
    this.setAttribute("id", value);
  }

  get className() {
    return [...this.classTokens].join(" ");
  }
  set className(value: string) {
    this.classTokens = new Set(String(value).split(/\s+/).filter(Boolean));
    this.syncClassAttr();
  }

  get value() {
    return this._value;
  }
  set value(value: string) {
    this._value = String(value);
  }

  get disabled() {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = Boolean(value);
    if (this._disabled) this.attributes.set("disabled", "");
    else this.attributes.delete("disabled");
  }

  get textContent() {
    return `${this.textValue}${this.childNodes.map((child) => child.textContent).join("")}`;
  }
  set textContent(value: string) {
    this.detachChildren();
    this.textValue = String(value);
    this.childNodes = [];
    this.scrollHeight = Math.max(this.scrollHeight, this.textValue.length);
  }

  get nextElementSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes.filter((node): node is FakeElement => node instanceof FakeElement);
    const index = siblings.indexOf(this);
    return index >= 0 ? (siblings[index + 1] ?? null) : null;
  }

  get isConnected() {
    let node: FakeElement | null = this;
    while (node) {
      if (node === this.ownerDocument.body || node === this.ownerDocument.documentElement) return true;
      node = node.parentNode;
    }
    return false;
  }

  append(...nodes: Array<FakeElement | FakeTextNode | string>) {
    for (const node of nodes) {
      const child = typeof node === "string" ? new FakeTextNode(node) : node;
      child.parentNode = this;
      this.childNodes.push(child);
    }
    this.scrollHeight = Math.max(this.scrollHeight, this.childNodes.length * 20);
  }

  replaceChildren(...nodes: Array<FakeElement | FakeTextNode | string>) {
    this.detachChildren();
    this.childNodes = [];
    this.textValue = "";
    this.append(...nodes);
  }

  addEventListener(type: string, listener: (event: FakeEvent) => void) {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  dispatchEvent(event: FakeEvent) {
    event.target = this;
    event.currentTarget = this;
    for (const listener of this.listeners.get(event.type) ?? []) listener(event);
    return !event.defaultPrevented;
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, String(value));
    if (name === "class") {
      this.classTokens = new Set(String(value).split(/\s+/).filter(Boolean));
      this.syncClassAttr(false);
    }
    if (name === "value") this._value = String(value);
    if (name === "disabled") this._disabled = true;
  }

  getAttribute(name: string) {
    return this.attributes.has(name) ? (this.attributes.get(name) ?? null) : null;
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  querySelector(selector: string) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string) {
    return this.ownerDocument.querySelectorAll(selector).filter((element) => this.contains(element));
  }

  contains(element: FakeElement) {
    let node: FakeElement | null = element;
    while (node) {
      if (node === this) return true;
      node = node.parentNode;
    }
    return false;
  }

  getBoundingClientRect() {
    const size = elementSizeFor(this);
    return {
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      top: 0,
      left: 0,
      right: size.width,
      bottom: size.height,
    };
  }

  private syncClassAttr(syncAttr = true) {
    if (syncAttr) this.attributes.set("class", this.className);
    this.attributes.set("class", this.className);
  }

  private detachChildren() {
    for (const child of this.childNodes) {
      child.parentNode = null;
    }
  }
}

class FakeInputElement extends FakeElement {}

class FakeSelectElement extends FakeElement {
  constructor(ownerDocument: FakeDocument) {
    super("select", ownerDocument);
  }
}

class FakeOptionElement extends FakeElement {
  constructor(ownerDocument: FakeDocument) {
    super("option", ownerDocument);
  }
}

function elementSizeFor(element: FakeElement) {
  if (element.id === "map" || element.tagName === "canvas") return { width: 800, height: 600 };
  if (element.id === "status-pill" || element.id === "provider-status") return { width: 180, height: 36 };
  if (element.classList.contains("evidence-section")) return { width: 320, height: 220 };
  return { width: 360, height: 56 };
}

function matchesSelector(element: FakeElement, selector: string) {
  const parts = selector.trim().split(/\s+/).filter(Boolean);
  return matchSelectorParts(element, parts.length - 1, parts);
}

function matchSelectorParts(element: FakeElement | null, index: number, parts: string[]): boolean {
  if (!element) return false;
  if (!matchSimpleSelector(element, parts[index])) return false;
  if (index === 0) return true;
  let parent = element.parentNode;
  while (parent) {
    if (matchSelectorParts(parent, index - 1, parts)) return true;
    parent = parent.parentNode;
  }
  return false;
}

function matchSimpleSelector(element: FakeElement, selector: string) {
  const parsed = parseSelector(selector);
  if (parsed.tag && element.tagName !== parsed.tag) return false;
  if (parsed.id && element.id !== parsed.id) return false;
  for (const className of parsed.classes) if (!element.classList.contains(className)) return false;
  for (const attr of parsed.attrs) {
    const value = element.getAttribute(attr.name);
    if (attr.value === undefined) {
      if (value === null) return false;
    } else if (value !== attr.value) {
      return false;
    }
  }
  return true;
}

function parseSelector(selector: string) {
  const parsed: {
    tag?: string;
    id?: string;
    classes: string[];
    attrs: Array<{ name: string; value?: string }>;
  } = { classes: [], attrs: [] };
  let i = 0;
  const trimmed = selector.trim();
  const tagMatch = /^[a-zA-Z][\w-]*/.exec(trimmed);
  if (tagMatch) {
    parsed.tag = tagMatch[0].toLowerCase();
    i = tagMatch[0].length;
  }
  while (i < trimmed.length) {
    const ch = trimmed[i];
    if (ch === "#") {
      i += 1;
      const start = i;
      while (i < trimmed.length && !"[.#".includes(trimmed[i])) i += 1;
      parsed.id = trimmed.slice(start, i);
      continue;
    }
    if (ch === ".") {
      i += 1;
      const start = i;
      while (i < trimmed.length && !"[.#".includes(trimmed[i])) i += 1;
      parsed.classes.push(trimmed.slice(start, i));
      continue;
    }
    if (ch === "[") {
      const end = trimmed.indexOf("]", i);
      if (end < 0) break;
      const body = trimmed.slice(i + 1, end);
      const [name, rawValue] = body.split("=");
      parsed.attrs.push({
        name: name.trim(),
        value: rawValue === undefined ? undefined : rawValue.trim().replace(/^['"]|['"]$/g, ""),
      });
      i = end + 1;
      continue;
    }
    i += 1;
  }
  return parsed;
}

function camelToKebab(value: string) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
