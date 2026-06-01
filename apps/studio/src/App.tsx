import { useState, useEffect, useCallback } from "react";
import ChatPanel from "./components/ChatPanel";
import MapStage from "./components/MapStage";
import EvidencePanel from "./components/EvidencePanel";

export interface StudioState {
  spec: unknown;
  revision: string;
  epoch: number;
  status: "ready" | "loading" | "blocked";
  camera: { lng: number; lat: number; zoom: number };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  status?: "applied" | "blocked" | "ready";
  evidence?: Record<string, unknown>;
}

export default function App() {
  const [mapState, setMapState] = useState<StudioState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<string>("Connecting...");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      setMapState(data);
      setStatus(data.status);
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    fetchState();
    const welcome: ChatMessage = {
      role: "assistant",
      content:
        "Welcome to AI Map Studio. Describe what you want to change on the map — I'll handle it through safe, auditable commands.",
    };
    setMessages([welcome]);
  }, [fetchState]);

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setStatus("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.message || "Done.",
        status: data.status,
        evidence: data.evidence,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStatus(data.status || "ready");

      if (data.status === "applied") {
        await fetchState();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
      setStatus("blocked");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Chat Panel */}
      <div
        className={`panel bg-gray-900 border-r border-gray-800 flex flex-col ${
          leftPanelOpen ? "w-96" : "w-0"
        }`}
      >
        {leftPanelOpen && (
          <ChatPanel
            messages={messages}
            status={status}
            onSend={sendMessage}
            onToggle={() => setLeftPanelOpen(false)}
          />
        )}
      </div>

      {/* Toggle left panel */}
      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 text-gray-400 hover:text-white px-1 py-4 rounded-r"
        >
          ▸
        </button>
      )}

      {/* Center: Map Stage */}
      <div className="flex-1 relative">
        <MapStage state={mapState} status={status} />
      </div>

      {/* Toggle right panel */}
      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 text-gray-400 hover:text-white px-1 py-4 rounded-l"
        >
          ◂
        </button>
      )}

      {/* Right: Evidence Panel */}
      <div
        className={`panel bg-gray-900 border-l border-gray-800 flex flex-col ${
          rightPanelOpen ? "w-80" : "w-0"
        }`}
      >
        {rightPanelOpen && (
          <EvidencePanel
            messages={messages}
            onToggle={() => setRightPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
