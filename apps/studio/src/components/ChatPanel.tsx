import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ProviderProfile } from "../App";

interface Props {
  messages: ChatMessage[];
  status: string;
  onSend: (text: string) => void;
  onClose: () => void;
  providerId: string;
  providers: ProviderProfile[];
  onProviderChange: (id: string) => void;
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
