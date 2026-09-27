import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../App";

interface Props {
  messages: ChatMessage[];
  status: string;
  onSend: (text: string) => void;
}

const QUICK_ACTIONS = [
  { label: "Validate", prompt: "validate the current map spec", icon: "✓" },
  { label: "Explain", prompt: "explain the current map spec", icon: "?" },
  { label: "Optimize", prompt: "optimize the map layers", icon: "⚡" },
  { label: "Red points", prompt: "make points red", icon: "●" },
  { label: "Larger", prompt: "increase point size", icon: "⊕" },
  { label: "Reset", prompt: "reset", icon: "↺" },
];

export default function AIAssistant({ messages, status, onSend }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isThinking = status === "thinking";

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-blue-400 tracking-wide">AI ASSISTANT</p>
          <span className={`h-2 w-2 rounded-full ${isThinking ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
        </div>
        <span className="text-[10px] text-gray-600">{isThinking ? "Thinking…" : "Ready"}</span>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-800 px-3 py-2 shrink-0">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onSend(action.prompt)}
            disabled={isThinking}
            className="flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:bg-gray-700 hover:text-white disabled:opacity-40"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user" ? "bg-blue-700 text-white" : "bg-gray-800 text-gray-200"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>

              {/* Evidence section for assistant messages */}
              {msg.evidence && msg.role === "assistant" && (
                <div className="mt-2 border-t border-gray-700 pt-2">
                  {msg.evidence.diagnostics && msg.evidence.diagnostics.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Diagnostics</p>
                      {msg.evidence.diagnostics.slice(0, 5).map((d, di) => (
                        <div
                          key={di}
                          className={`rounded p-1.5 text-[11px] ${
                            d.severity === "error"
                              ? "bg-red-950/40 text-red-300"
                              : d.severity === "warning"
                                ? "bg-yellow-950/30 text-yellow-300"
                                : "bg-gray-900 text-gray-400"
                          }`}
                        >
                          <span className="font-mono">{d.code}</span>
                          <span className="mx-1 text-gray-600">·</span>
                          <span>{d.message}</span>
                        </div>
                      ))}
                      {msg.evidence.diagnostics.length > 5 && (
                        <p className="text-[10px] text-gray-600">+{msg.evidence.diagnostics.length - 5} more</p>
                      )}
                    </div>
                  )}
                  {msg.evidence.commandEvidence && (
                    <div className="mt-1.5 text-[11px] text-gray-500">
                      <span className="font-mono">{msg.evidence.commandEvidence.commandCount ?? 0} cmd</span>
                      <span className="mx-1">·</span>
                      <span className={msg.evidence.commandEvidence.committed ? "text-green-400" : "text-red-400"}>
                        {msg.evidence.commandEvidence.committed ? "committed" : "pending"}
                      </span>
                      <span className="mx-1">·</span>
                      <span>{msg.evidence.commandEvidence.changedPathCount} paths</span>
                    </div>
                  )}
                </div>
              )}

              {msg.status && msg.role === "assistant" && (
                <span
                  className={`mt-1 inline-block text-xs ${
                    msg.status === "applied"
                      ? "text-green-400"
                      : msg.status === "blocked"
                        ? "text-red-400"
                        : "text-gray-500"
                  }`}
                >
                  {msg.status}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 px-3 py-2.5 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isThinking ? "AI is thinking…" : "Ask AI about your map…"}
            disabled={isThinking}
            className="flex-1 rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
          >
            {isThinking ? "···" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
