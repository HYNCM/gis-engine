import { useState, useEffect, useCallback } from "react";
import ChatPanel from "./components/ChatPanel";
import MapStage from "./components/MapStage";
import EvidencePanel from "./components/EvidencePanel";

export interface ServerState {
  status: "ready" | "loading" | "blocked" | "applied";
  spec: Record<string, unknown>;
  style: Record<string, unknown> | null;
  summary: {
    mapId: string; revision: string; sourceCount: number; layerCount: number;
    center: [number, number] | null; zoom: number | null;
  };
  diagnostics: Array<{ code: string; severity: string; path?: string; message: string }>;
  commandEvidence?: { committed: boolean; rolledBack: boolean; changedPathCount: number };
  provider?: { providerId: string; confidence?: { score: number; level: string } };
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

export default function App() {
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data: ServerState = await res.json();
      setServerState(data); setStatus(data.status);
    } catch { setStatus("disconnected"); }
  }, []);

  useEffect(() => {
    fetchState();
    setMessages([{ role: "assistant", content: "Welcome to AI Map Studio. Try: 'make points red', 'zoom to Hangzhou'." }]);
  }, [fetchState]);

  const sendMessage = async (text: string) => {
    setMessages((p) => [...p, { role: "user", content: text }]);
    setStatus("thinking");
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const data: ServerState = await res.json();
      const cmd = data.commandEvidence; const diags = data.diagnostics || [];
      const errs = diags.filter((d) => d.severity === "error").length;
      const reply = data.status === "applied" ? `Done. ${cmd?.changedPathCount ?? 0} path(s) changed.` : data.status === "blocked" ? `Blocked${errs ? `: ${errs} error(s)` : ""}. See evidence.` : `Status: ${data.status}.`;

      setMessages((p) => [...p, { role: "assistant", content: reply, status: data.status, evidence: { commandEvidence: cmd, provider: data.provider, diagnostics: diags } }]);
      setStatus(data.status);
      if (data.status === "applied") setServerState(data);
    } catch (err) {
      setMessages((p) => [...p, { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Is the server running on port 4321?"}` }]);
      setStatus("blocked");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <div className={`panel bg-gray-900 border-r border-gray-800 flex flex-col transition-all ${leftOpen ? "w-96" : "w-0"}`}>
        {leftOpen && <ChatPanel messages={messages} status={status} onSend={sendMessage} onClose={() => setLeftOpen(false)} />}
      </div>
      {!leftOpen && <button onClick={() => setLeftOpen(true)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white px-1.5 py-5 rounded-r" title="Chat">▸</button>}
      <div className="flex-1 relative"><MapStage serverState={serverState} status={status} /></div>
      {!rightOpen && <button onClick={() => setRightOpen(true)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white px-1.5 py-5 rounded-l" title="Evidence">◂</button>}
      <div className={`panel bg-gray-900 border-l border-gray-800 flex flex-col transition-all ${rightOpen ? "w-80" : "w-0"}`}>
        {rightOpen && <EvidencePanel messages={messages} serverState={serverState} onClose={() => setRightOpen(false)} />}
      </div>
    </div>
  );
}
