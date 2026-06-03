import { useState, useRef, useEffect } from "react";
import type {
  ChatMessage,
  ProviderProfile,
  SavedMapReviewExport,
  SavedMapHandoff,
  SavedMapReviewLedger,
  SavedMapSummary,
} from "../App";

interface Props {
  messages: ChatMessage[];
  status: string;
  onSend: (text: string) => void;
  onClose: () => void;
  providerId: string;
  providers: ProviderProfile[];
  onProviderChange: (id: string) => void;
  savedMaps: SavedMapSummary[];
  currentMapId: string | null;
  selectedHandoff: SavedMapHandoff | null;
  selectedLedger: SavedMapReviewLedger | null;
  selectedExport: SavedMapReviewExport | null;
  onInspectMap: (id: string) => void;
  onInspectLedger: (id: string) => void;
  onInspectExport: (id: string, cursor?: number) => void;
  onLoadMap: (id: string) => void;
  onDeleteMap: (id: string) => void;
}

const PROMPTS = [
  { label: "Red", prompt: "make points red" },
  { label: "Blue", prompt: "make points blue" },
  { label: "Larger", prompt: "increase point size" },
  { label: "Smaller", prompt: "decrease point size" },
  { label: "Landmarks", prompt: "show only landmarks" },
  { label: "Zoom 12+", prompt: "make points visible above zoom 12" },
  { label: "Hangzhou", prompt: "zoom to Hangzhou" },
  { label: "Reset", prompt: "reset" },
];

export default function ChatPanel({
  messages,
  status,
  onSend,
  onClose,
  providerId,
  providers,
  onProviderChange,
  savedMaps,
  currentMapId,
  selectedHandoff,
  selectedLedger,
  selectedExport,
  onInspectMap,
  onInspectLedger,
  onInspectExport,
  onLoadMap,
  onDeleteMap,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "thinking") return;
    onSend(input.trim());
    setInput("");
  };

  const enabledProviders = providers.filter((p) => p.enabled);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div>
          <p className="text-xs text-blue-400 font-medium tracking-wide">
            GIS ENGINE
          </p>
          <h1 className="text-base font-semibold">AI Map Studio</h1>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-sm px-1"
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Provider selector */}
      <div className="px-4 py-2 border-b border-gray-800 shrink-0">
        <label className="text-xs text-gray-500 block mb-1">AI Provider</label>
        <select
          value={providerId}
          onChange={(e) => onProviderChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
        >
          {enabledProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}{p.model ? ` / ${p.model}` : ""}
            </option>
          ))}
          {providers
            .filter((p) => !p.enabled)
            .map((p) => (
              <option key={p.id} value={p.id} disabled>
                {p.label}{p.model ? ` / ${p.model}` : ""} ({p.missingCredential ? "credential needed" : "unavailable"})
              </option>
            ))}
        </select>
      </div>

      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-gray-500">Saved Maps</label>
          <span className="text-[11px] text-gray-600">{savedMaps.length}</span>
        </div>
        {savedMaps.length === 0 ? (
          <p className="text-xs text-gray-600">No saved maps yet.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {savedMaps.map((map) => {
              const isCurrent = currentMapId === map.id;
              return (
                <div
                  key={map.id}
                  className={`rounded border px-2 py-2 ${isCurrent ? "border-blue-700 bg-blue-950/30" : "border-gray-800 bg-gray-900/70"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-200">
                        {map.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        v{map.revision} · {map.basemapId}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="rounded bg-blue-900/50 px-1.5 py-0.5 text-[10px] text-blue-200">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-600">
                    audit {map.auditRecordCount} · review {map.reviewDecisionCount}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-600">
                      {new Date(map.updatedAt).toLocaleString()}
                    </span>
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        onClick={() => onInspectExport(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => onInspectLedger(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                      >
                        Ledger
                      </button>
                      <button
                        onClick={() => onInspectMap(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onLoadMap(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onDeleteMap(map.id)}
                        disabled={status === "thinking"}
                        className="rounded bg-gray-800 px-2 py-1 text-[11px] text-red-200 transition hover:bg-red-950/50 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedHandoff && (
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-500">Workspace Handoff</label>
            <span className="text-[11px] text-gray-600">
              {selectedHandoff.handoff.status}
            </span>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900/70 p-2">
            <p className="text-xs font-medium text-gray-200">
              {selectedHandoff.workspace.name}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              v{selectedHandoff.workspace.revision} ·{" "}
              {selectedHandoff.workspace.basemapId} · audit{" "}
              {selectedHandoff.evidence.auditRecordCount} · review{" "}
              {selectedHandoff.evidence.reviewDecisionCount}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              {selectedHandoff.handoffVersion}
            </p>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-950 p-2 text-[10px] leading-4 text-gray-400">
              {JSON.stringify(selectedHandoff, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {selectedLedger && (
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-500">Review Ledger</label>
            <span className="text-[11px] text-gray-600">
              {selectedLedger.handoff.status}
            </span>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900/70 p-2">
            <p className="text-xs font-medium text-gray-200">
              {selectedLedger.workspace.name}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              v{selectedLedger.workspace.revision} ·{" "}
              {selectedLedger.workspace.basemapId} · audit{" "}
              {selectedLedger.audit.recordCount} · review{" "}
              {selectedLedger.review.decisionCount}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              accepted {selectedLedger.summary.reviewOutcomeCounts.accepted} ·
              blocked {selectedLedger.summary.reviewOutcomeCounts.blocked} ·
              follow-up {selectedLedger.summary.reviewOutcomeCounts.followUpRequired}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              {selectedLedger.reviewLedgerVersion}
            </p>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-950 p-2 text-[10px] leading-4 text-gray-400">
              {JSON.stringify(selectedLedger, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {selectedExport && (
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-500">Review Export</label>
            <span className="text-[11px] text-gray-600">
              {selectedExport.summary.returnedEventCount}/
              {selectedExport.summary.totalEventCount}
            </span>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900/70 p-2">
            <p className="text-xs font-medium text-gray-200">
              {selectedExport.workspace.name}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              v{selectedExport.workspace.revision} ·{" "}
              {selectedExport.workspace.basemapId} · audit{" "}
              {selectedExport.summary.auditEventCount} · review{" "}
              {selectedExport.summary.reviewEventCount}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              cursor {selectedExport.filters.cursor} · limit{" "}
              {selectedExport.filters.limit}
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              {selectedExport.reviewExportVersion}
            </p>
            {selectedExport.nextCursor !== null && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() =>
                    onInspectExport(
                      selectedExport.workspace.mapId,
                      selectedExport.nextCursor ?? 0,
                    )
                  }
                  disabled={status === "thinking"}
                  className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 disabled:opacity-40"
                >
                  Older
                </button>
              </div>
            )}
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-950 p-2 text-[10px] leading-4 text-gray-400">
              {JSON.stringify(selectedExport, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-blue-700 text-white" : "bg-gray-800 text-gray-200"}`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.status && msg.role === "assistant" && (
                <span
                  className={`text-xs mt-1 inline-block ${msg.status === "applied" ? "text-green-400" : msg.status === "blocked" ? "text-red-400" : "text-gray-500"}`}
                >
                  {msg.status}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-2 flex gap-1.5 flex-wrap border-t border-gray-800 shrink-0">
        {PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => onSend(p.prompt)}
            disabled={status === "thinking"}
            className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-gray-800 shrink-0"
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              status === "thinking"
                ? "AI is thinking..."
                : "Describe your map change..."
            }
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            disabled={status === "thinking"}
          />
          <button
            type="submit"
            disabled={status === "thinking" || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2 rounded text-sm font-medium transition"
          >
            {status === "thinking" ? "···" : "Send"}
          </button>
        </div>
      </form>
    </>
  );
}
