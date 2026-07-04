import { useCallback, useEffect, useRef, useState } from "react";
import AIAssistant from "./components/AIAssistant";
import MapSpecEditor, { type ValidationDiagnostic } from "./components/MapSpecEditor";
import MapStage from "./components/MapStage";
import TemplateBar from "./components/TemplateBar";
import { ALL_TEMPLATES, basicMapTemplate, type MapSpecTemplate } from "./templates";

// ────────────────────────────────────────────────────────────────────────────
// Types (kept from original Studio for server compatibility)
// ────────────────────────────────────────────────────────────────────────────

export interface ServerState {
  status: "ready" | "loading" | "blocked" | "applied" | "reviewed";
  spec: Record<string, unknown>;
  style: Record<string, unknown> | null;
  summary: {
    mapId: string;
    revision: string;
    sourceCount: number;
    layerCount: number;
    center: [number, number] | null;
    zoom: number | null;
    bounds?: [number, number, number, number] | null;
  };
  diagnostics: Array<{
    code: string;
    severity: string;
    path?: string;
    message: string;
  }>;
  commandEvidence?: {
    commandCount?: number;
    committed: boolean;
    rolledBack: boolean;
    failed?: boolean;
    changedPathCount: number;
  };
  provider?: {
    providerId: string;
    confidence?: { score: number; level: string };
    promptHash?: string;
    traceId?: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  status?: string;
  evidence?: {
    commandEvidence?: ServerState["commandEvidence"];
    provider?: ServerState["provider"];
    diagnostics?: ServerState["diagnostics"];
  };
}

export interface BasemapOption {
  id: string;
  label: string;
  enabled: boolean;
  missingCredential?: string;
}

export interface ProviderProfile {
  id: string;
  label: string;
  protocol: string;
  model?: string;
  enabled: boolean;
  missingCredential?: boolean;
}

export interface AuditRecord {
  recordVersion: string;
  id: string;
  sessionId: string;
  timestamp: string;
  status: "applied" | "blocked" | "ready" | "reviewed";
  providerId: string;
  promptHash?: string;
  traceId?: string;
  commandCount: number;
  diagnosticCounts: { error: number; warning: number; info: number };
  diagnosticCodes?: Array<{ code: string; path: string }>;
  fromRevision: string;
  toRevision: string;
}

export interface ReviewDecision {
  recordVersion: string;
  decisionId: string;
  createdAt: string;
  projectId: string;
  sessionId: string;
  auditRecordId: string;
  outcome: "accepted" | "blocked" | "follow-up-required";
  providerId: string;
  promptHash?: string;
  traceId?: string;
  deliveryStatus: string;
  commandEvidence: NonNullable<ServerState["commandEvidence"]>;
  diagnosticCounts: { error: number; warning: number; info: number };
  diagnosticCodes?: Array<{ code: string; path: string }>;
  reasonCodes: string[];
  followUpTaskIds?: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// App
// ────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Server state ──────────────────────────────────────────────────────────
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const [providerId, setProviderId] = useState("mock-ai");
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [basemaps, setBasemaps] = useState<BasemapOption[]>([]);
  const [currentBasemap, setCurrentBasemap] = useState("none");
  const [chatMode, setChatMode] = useState<"standard" | "agent">("standard");

  // ── Playground-specific state ─────────────────────────────────────────────
  const [specText, setSpecText] = useState<string>(() => JSON.stringify(basicMapTemplate.spec, null, 2));
  const [editorDiagnostics, setEditorDiagnostics] = useState<ValidationDiagnostic[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(basicMapTemplate.id);
  // The parsed spec that the map preview should render (updated from the editor)
  const [previewSpec, setPreviewSpec] = useState<ServerState | null>(null);

  // Track the last synced revision so we don't loop editor <-> server
  const lastSyncedRevisionRef = useRef<string>("__initial__");
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Server fetch helpers (same as original Studio) ────────────────────────

  const fetchState = useCallback(async () => {
    try {
      const response = await fetch("/api/state");
      const data: ServerState = await response.json();
      setServerState(data);
      setStatus(data.status);
    } catch {
      setStatus("disconnected");
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await fetch("/api/providers");
      const data = await response.json();
      const list = data.providers || [];
      setProviders(list);
      // Auto-select best available provider (first non-mock enabled provider)
      const bestProvider = list.find((p: ProviderProfile) => p.enabled && p.id !== "mock-ai");
      if (bestProvider) {
        setProviderId(bestProvider.id);
      }
    } catch {
      // keep last known
    }
  }, []);

  const fetchBasemaps = useCallback(async () => {
    try {
      const response = await fetch("/api/basemaps");
      const data = await response.json();
      setBasemaps(data.options || []);
      setCurrentBasemap(data.current || "none");
    } catch {
      // keep last known
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    void Promise.all([fetchState(), fetchProviders(), fetchBasemaps()]);
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome to the MapSpec Playground!\n\nEdit the JSON spec on the left, see the live map in the center, or ask me to make changes using the AI assistant.\n\nTry selecting a template below to get started.",
      },
    ]);
  }, [fetchBasemaps, fetchProviders, fetchState]);

  // ── Sync server state → editor (only when server pushes a new revision) ──
  useEffect(() => {
    if (!serverState?.spec) return;
    const revision = serverState.summary.revision ?? "";
    if (revision === lastSyncedRevisionRef.current) return;
    // Only sync if the user hasn't been typing recently
    if (!isTypingRef.current) {
      lastSyncedRevisionRef.current = revision;
      setSpecText(JSON.stringify(serverState.spec, null, 2));
      // Also update previewSpec so the map picks up server-driven changes
      setPreviewSpec(serverState);
    }
  }, [serverState]);

  // ── Validate spec text on every keystroke ─────────────────────────────────
  useEffect(() => {
    const diags: ValidationDiagnostic[] = [];

    // JSON syntax check
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(specText);
    } catch (e) {
      diags.push({
        code: "JSON.SYNTAX_ERROR",
        severity: "error",
        message: e instanceof Error ? e.message : "Invalid JSON",
      });
      setEditorDiagnostics(diags);
      return;
    }

    // Basic MapSpec structure checks
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      diags.push({
        code: "MAPSPEC.ROOT_TYPE",
        severity: "error",
        message: "MapSpec root must be a JSON object.",
        path: "/",
      });
    } else {
      if (!parsed.version) {
        diags.push({
          code: "MAPSPEC.MISSING_VERSION",
          severity: "warning",
          message: "MapSpec should have a 'version' field.",
          path: "/version",
        });
      }
      if (!parsed.sources || typeof parsed.sources !== "object") {
        diags.push({
          code: "MAPSPEC.MISSING_SOURCES",
          severity: "warning",
          message: "MapSpec should have a 'sources' object.",
          path: "/sources",
        });
      }
      if (!Array.isArray(parsed.layers)) {
        diags.push({
          code: "MAPSPEC.MISSING_LAYERS",
          severity: "warning",
          message: "MapSpec should have a 'layers' array.",
          path: "/layers",
        });
      }
    }

    setEditorDiagnostics(diags);

    // If valid, update preview spec (debounced to avoid thrashing the renderer)
    if (diags.filter((d) => d.severity === "error").length === 0 && parsed) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setPreviewSpec({
          status: "ready",
          spec: parsed as Record<string, unknown>,
          style: null,
          summary: {
            mapId: String((parsed as Record<string, unknown>).id ?? "preview"),
            revision: String((parsed as Record<string, unknown>).revision ?? "0"),
            sourceCount: Object.keys(((parsed as Record<string, unknown>).sources as Record<string, unknown>) ?? {})
              .length,
            layerCount: Array.isArray((parsed as Record<string, unknown>).layers)
              ? ((parsed as Record<string, unknown>).layers as unknown[]).length
              : 0,
            center:
              (((parsed as Record<string, unknown>).view as Record<string, unknown> | undefined)?.center as
                | [number, number]
                | null) ?? null,
            zoom:
              (((parsed as Record<string, unknown>).view as Record<string, unknown> | undefined)?.zoom as
                | number
                | null) ?? null,
          },
          diagnostics: [],
        });
      }, 600);
    }

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [specText]);

  // ── Track when the user is typing to suppress server → editor sync ────────
  const handleSpecTextChange = useCallback((value: string) => {
    isTypingRef.current = true;
    setSpecText(value);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 2000);
  }, []);

  // ── Template selection ────────────────────────────────────────────────────
  const handleSelectTemplate = useCallback((template: MapSpecTemplate) => {
    setActiveTemplateId(template.id);
    const freshSpec = JSON.parse(JSON.stringify(template.spec)) as Record<string, unknown>;
    const specStr = JSON.stringify(freshSpec, null, 2);
    setSpecText(specStr);
    lastSyncedRevisionRef.current = String(freshSpec.revision ?? "__template__");
    isTypingRef.current = false;
    // Push to preview immediately
    setPreviewSpec({
      status: "ready",
      spec: freshSpec,
      style: null,
      summary: {
        mapId: String(freshSpec.id ?? "template"),
        revision: String(freshSpec.revision ?? "0"),
        sourceCount: Object.keys((freshSpec.sources as Record<string, unknown>) ?? {}).length,
        layerCount: Array.isArray(freshSpec.layers) ? (freshSpec.layers as unknown[]).length : 0,
        center: ((freshSpec.view as Record<string, unknown> | undefined)?.center as [number, number] | null) ?? null,
        zoom: ((freshSpec.view as Record<string, unknown> | undefined)?.zoom as number | null) ?? null,
      },
      diagnostics: [],
    });
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: `Loaded template: ${template.name}. ${template.description}` },
    ]);
  }, []);

  // ── AI chat (same protocol as original Studio) ────────────────────────────
  const sendMessage = async (text: string): Promise<ServerState | null> => {
    setMessages((previous) => [...previous, { role: "user", content: text }]);
    setStatus("thinking");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, providerId, mode: chatMode, spec: serverState?.spec }),
      });
      const data: ServerState = await response.json();
      const commandEvidence = data.commandEvidence;
      const diagnostics = data.diagnostics || [];
      const errorCount = diagnostics.filter((d) => d.severity === "error").length;
      const reply =
        data.status === "applied"
          ? `Done. ${commandEvidence?.changedPathCount ?? 0} path(s) changed.`
          : data.status === "blocked"
            ? `Blocked${errorCount ? `: ${errorCount} error(s)` : ""}. See evidence.`
            : `Status: ${data.status}.`;

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: reply,
          status: data.status,
          evidence: { commandEvidence, provider: data.provider, diagnostics },
        },
      ]);
      setServerState(data);
      setStatus(data.status);
      await fetchBasemaps();
      return data;
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Is the server running?"}`,
        },
      ]);
      setStatus("blocked");
      return null;
    }
  };

  const changeBasemap = async (basemapId: string) => {
    setCurrentBasemap(basemapId);
    await sendMessage(`switch to ${basemapId} basemap`);
    await fetchBasemaps();
  };

  // ── Derived state for the map preview ─────────────────────────────────────
  // Use previewSpec (from editor) if available; otherwise fall back to serverState
  const mapPreviewState = previewSpec ?? serverState;

  const statusBadgeColor =
    status === "ready" || status === "applied" || status === "reviewed"
      ? "bg-green-900/50 text-green-400"
      : status === "thinking"
        ? "bg-yellow-900/50 text-yellow-400"
        : "bg-red-900/50 text-red-400";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[11px] text-blue-400 font-medium tracking-wide leading-none">GIS ENGINE</p>
            <h1 className="text-sm font-semibold leading-tight">MapSpec Playground</h1>
          </div>
          <select
            value={currentBasemap}
            onChange={(e) => changeBasemap(e.target.value)}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            {basemaps.map((b) => (
              <option key={b.id} value={b.id} disabled={!b.enabled}>
                {b.missingCredential ? `${b.label} (${b.missingCredential})` : b.label}
              </option>
            ))}
          </select>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            {providers
              .filter((p) => p.enabled)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.model ? ` / ${p.model}` : ""}
                </option>
              ))}
          </select>
          <div className="flex overflow-hidden rounded border border-gray-700">
            <button
              onClick={() => setChatMode("standard")}
              className={`px-2 py-1 text-xs transition ${
                chatMode === "standard" ? "bg-blue-900/50 text-blue-100" : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              Std
            </button>
            <button
              onClick={() => setChatMode("agent")}
              className={`px-2 py-1 text-xs transition ${
                chatMode === "agent" ? "bg-blue-900/50 text-blue-100" : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              Agent
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {serverState && (
            <p className="font-mono text-[11px] text-gray-500">
              v{serverState.summary.revision} · {serverState.summary.layerCount} layers ·{" "}
              {serverState.summary.sourceCount} sources
            </p>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeColor}`}>{status}</span>
        </div>
      </header>

      {/* Main 3-column area */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — MapSpec Editor */}
        <div className="flex w-[30%] min-w-[280px] max-w-[480px] flex-col border-r border-gray-800 overflow-hidden">
          <MapSpecEditor value={specText} onChange={handleSpecTextChange} diagnostics={editorDiagnostics} />
        </div>

        {/* CENTER — Live Map Preview */}
        <div className="relative flex-1 overflow-hidden">
          <MapStage
            serverState={mapPreviewState}
            status={status}
            onSave={() => {}}
            savedMsg=""
            basemaps={basemaps}
            currentBasemap={currentBasemap}
            onChangeBasemap={changeBasemap}
          />
        </div>

        {/* RIGHT — AI Assistant */}
        <div className="flex w-[28%] min-w-[240px] max-w-[400px] flex-col border-l border-gray-800 overflow-hidden">
          <AIAssistant messages={messages} status={status} onSend={sendMessage} />
        </div>
      </div>

      {/* BOTTOM — Template Bar */}
      <TemplateBar templates={ALL_TEMPLATES} activeTemplateId={activeTemplateId} onSelect={handleSelectTemplate} />
    </div>
  );
}
