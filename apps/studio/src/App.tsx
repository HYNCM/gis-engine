import { useState, useEffect, useCallback } from "react";
import ChatPanel from "./components/ChatPanel";
import MapStage from "./components/MapStage";
import EvidencePanel from "./components/EvidencePanel";

export interface ServerState {
  status: "ready" | "loading" | "blocked" | "applied";
  spec: Record<string, unknown>;
  style: Record<string, unknown> | null;
  summary: {
    mapId: string;
    revision: string;
    sourceCount: number;
    layerCount: number;
    center: [number, number] | null;
    zoom: number | null;
  };
  diagnostics: Array<{
    code: string;
    severity: string;
    path?: string;
    message: string;
  }>;
  commandEvidence?: {
    committed: boolean;
    rolledBack: boolean;
    changedPathCount: number;
  };
  provider?: {
    providerId: string;
    confidence?: { score: number; level: string };
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

export interface AuditRecord {
  sessionId: string;
  providerId: string;
  status: string;
  promptHash?: string;
  traceId?: string;
  commandCount: number;
  diagnostics: ServerState["diagnostics"];
  fromRevision: string;
  toRevision: string;
}

export interface ReviewDecision {
  outcome: "accepted" | "blocked" | "follow-up-required";
  decisionId: string;
  reasonCode: string;
  projectId: string;
  createdAt: string;
}

export default function App() {
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");
  const [providerId, setProviderId] = useState("mock-ai");
  const [providers, setProviders] = useState<
    Array<{ id: string; label: string; enabled: boolean }>
  >([]);
  const [basemaps, setBasemaps] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [currentBasemap, setCurrentBasemap] = useState("osm");

  const fetchState = useCallback(async () => {
    try {
      const r = await fetch("/api/state");
      const d: ServerState = await r.json();
      setServerState(d);
      setStatus(d.status);
    } catch {
      setStatus("disconnected");
    }
  }, []);
  const fetchProviders = useCallback(async () => {
    try {
      const r = await fetch("/api/providers");
      const d = await r.json();
      setProviders(d.providers || []);
    } catch {
      /* */
    }
  }, []);
  const fetchBasemaps = useCallback(async () => {
    try {
      const r = await fetch("/api/basemaps");
      const d = await r.json();
      setBasemaps(d.options || []);
      setCurrentBasemap(d.current || "osm");
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchProviders();
    fetchBasemaps();
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome! Try: 'make points red', 'switch to satellite basemap', 'zoom to Hangzhou'.",
      },
    ]);
  }, [fetchState, fetchProviders, fetchBasemaps]);

  const sendMessage = async (text: string) => {
    setMessages((p) => [...p, { role: "user", content: text }]);
    setStatus("thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, providerId }),
      });
      const data: ServerState = await res.json();
      const cmd = data.commandEvidence;
      const diags = data.diagnostics || [];
      const errs = diags.filter((d) => d.severity === "error").length;
      const reply =
        data.status === "applied"
          ? `Done. ${cmd?.changedPathCount ?? 0} path(s) changed.`
          : data.status === "blocked"
            ? `Blocked${errs ? `: ${errs} error(s)` : ""}. See evidence.`
            : `Status: ${data.status}.`;
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: reply,
          status: data.status,
          evidence: {
            commandEvidence: cmd,
            provider: data.provider,
            diagnostics: diags,
          },
        },
      ]);
      setStatus(data.status);
      if (data.status === "applied") setServerState(data);
    } catch (err) {
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Is the server running?"}`,
        },
      ]);
      setStatus("blocked");
    }
  };

  const saveMap = async () => {
    try {
      const name = `Map ${serverState?.summary.revision || "0"}`;
      const r = await fetch("/api/maps/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: serverState?.summary.mapId, name }),
      });
      const d = await r.json();
      if (d.ok) {
        setSavedMsg(`Saved: ${name}`);
        setTimeout(() => setSavedMsg(""), 2000);
      }
    } catch {
      setSavedMsg("Save failed");
    }
  };

  const changeBasemap = async (bmId: string) => {
    setCurrentBasemap(bmId);
    await sendMessage(`switch to ${bmId} basemap`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <div
        className={`panel bg-gray-900 border-r border-gray-800 flex flex-col transition-all ${leftOpen ? "w-96" : "w-0"}`}
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white px-1.5 py-5 rounded-r"
          title="Chat"
        >
          ▸
        </button>
      )}
      <div className="flex-1 relative">
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
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white px-1.5 py-5 rounded-l"
          title="Evidence"
        >
          ◂
        </button>
      )}
      <div
        className={`panel bg-gray-900 border-l border-gray-800 flex flex-col transition-all ${rightOpen ? "w-80" : "w-0"}`}
      >
        {rightOpen && (
          <EvidencePanel
            messages={messages}
            serverState={serverState}
            onClose={() => setRightOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
