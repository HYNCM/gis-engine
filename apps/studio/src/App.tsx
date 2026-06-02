import { useCallback, useEffect, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import MapStage from "./components/MapStage";
import EvidencePanel from "./components/EvidencePanel";

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
  diagnosticCounts: {
    error: number;
    warning: number;
    info: number;
  };
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
  diagnosticCounts: {
    error: number;
    warning: number;
    info: number;
  };
  diagnosticCodes?: Array<{ code: string; path: string }>;
  reasonCodes: string[];
  followUpTaskIds?: string[];
}

const FOLLOW_UP_TASK_ID = "TASK-2026W23-SER-001";

export default function App() {
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");
  const [providerId, setProviderId] = useState("mock-ai");
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [basemaps, setBasemaps] = useState<BasemapOption[]>([]);
  const [currentBasemap, setCurrentBasemap] = useState("none");
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [reviewDecisions, setReviewDecisions] = useState<ReviewDecision[]>([]);

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
      setProviders(data.providers || []);
    } catch {
      // Keep the last known provider list when the request fails.
    }
  }, []);

  const fetchBasemaps = useCallback(async () => {
    try {
      const response = await fetch("/api/basemaps");
      const data = await response.json();
      setBasemaps(data.options || []);
      setCurrentBasemap(data.current || "none");
    } catch {
      // Keep the last known basemap list when the request fails.
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const response = await fetch("/api/audit");
      const data = await response.json();
      setAuditRecords(data.records || []);
    } catch {
      // Audit is supplemental evidence, so UI state can stay as-is on failure.
    }
  }, []);

  const fetchReviewDecisions = useCallback(async () => {
    try {
      const response = await fetch("/api/review-decisions");
      const data = await response.json();
      setReviewDecisions(data.decisions || []);
    } catch {
      // Review history is supplemental evidence, so UI state can stay as-is.
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      fetchState(),
      fetchProviders(),
      fetchBasemaps(),
      fetchAudit(),
      fetchReviewDecisions(),
    ]);
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome! Try: 'make points red', 'show only landmarks', or 'make points visible above zoom 12'.",
      },
    ]);
  }, [
    fetchAudit,
    fetchBasemaps,
    fetchProviders,
    fetchReviewDecisions,
    fetchState,
  ]);

  const sendMessage = async (text: string): Promise<ServerState | null> => {
    setMessages((previous) => [...previous, { role: "user", content: text }]);
    setStatus("thinking");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, providerId }),
      });
      const data: ServerState = await response.json();
      const commandEvidence = data.commandEvidence;
      const diagnostics = data.diagnostics || [];
      const errorCount = diagnostics.filter(
        (diagnostic) => diagnostic.severity === "error",
      ).length;
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
          evidence: {
            commandEvidence,
            provider: data.provider,
            diagnostics,
          },
        },
      ]);
      setServerState(data);
      setStatus(data.status);
      await Promise.all([fetchAudit(), fetchReviewDecisions(), fetchBasemaps()]);
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

  const submitReviewDecision = useCallback(
    async (outcome: ReviewDecision["outcome"]) => {
      const request =
        outcome === "accepted"
          ? { outcome, reasonCodes: ["review-accepted"] }
          : outcome === "blocked"
            ? { outcome, reasonCodes: ["manual-review-blocked"] }
            : {
                outcome,
                reasonCodes: ["delivery-needs-confirmation"],
                followUpTaskIds: [FOLLOW_UP_TASK_ID],
              };

      try {
        const response = await fetch("/api/review-decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        const data = await response.json();
        const diagnostics = data.diagnostics || [];
        const reply = data.decision
          ? `Review recorded: ${data.decision.outcome}.`
          : "Review could not be recorded. See evidence.";

        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content: reply,
            status: data.status,
            evidence: {
              commandEvidence: data.commandEvidence,
              diagnostics,
            },
          },
        ]);
        setStatus(data.status || "reviewed");
        if (Array.isArray(data.decisions)) {
          setReviewDecisions(data.decisions);
        }
      } catch (error) {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content: `Review error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ]);
        setStatus("blocked");
      }
    },
    [],
  );

  const saveMap = async () => {
    try {
      const name = `Map ${serverState?.summary.revision || "0"}`;
      const response = await fetch("/api/maps/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: serverState?.summary.mapId, name }),
      });
      const data = await response.json();
      if (data.ok) {
        setSavedMsg(`Saved: ${name}`);
        setTimeout(() => setSavedMsg(""), 2000);
      }
    } catch {
      setSavedMsg("Save failed");
    }
  };

  const changeBasemap = async (basemapId: string) => {
    setCurrentBasemap(basemapId);
    const data = await sendMessage(`switch to ${basemapId} basemap`);
    if (!data || data.status !== "applied") {
      await fetchBasemaps();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <div
        className={`panel flex flex-col border-r border-gray-800 bg-gray-900 transition-all ${leftOpen ? "w-96" : "w-0"}`}
      >
        {leftOpen && (
          <ChatPanel
            messages={messages}
            status={status}
            onSend={sendMessage}
            onClose={() => setLeftOpen(false)}
            providerId={providerId}
            providers={providers}
            onProviderChange={setProviderId}
          />
        )}
      </div>
      {!leftOpen && (
        <button
          onClick={() => setLeftOpen(true)}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-r bg-gray-800/80 px-1.5 py-5 text-gray-400 hover:bg-gray-700 hover:text-white"
          title="Chat"
        >
          ▸
        </button>
      )}
      <div className="relative flex-1">
        <MapStage
          serverState={serverState}
          status={status}
          onSave={saveMap}
          savedMsg={savedMsg}
          basemaps={basemaps}
          currentBasemap={currentBasemap}
          onChangeBasemap={changeBasemap}
        />
      </div>
      {!rightOpen && (
        <button
          onClick={() => setRightOpen(true)}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-l bg-gray-800/80 px-1.5 py-5 text-gray-400 hover:bg-gray-700 hover:text-white"
          title="Evidence"
        >
          ◂
        </button>
      )}
      <div
        className={`panel flex flex-col border-l border-gray-800 bg-gray-900 transition-all ${rightOpen ? "w-80" : "w-0"}`}
      >
        {rightOpen && (
          <EvidencePanel
            messages={messages}
            serverState={serverState}
            auditRecords={auditRecords}
            reviewDecisions={reviewDecisions}
            onReviewDecision={submitReviewDecision}
            onClose={() => setRightOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
