import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "../App";

interface Props {
  messages: ChatMessage[];
  status: string;
  onSend: (text: string) => void;
  onToggle: () => void;
}

const QUICK_PROMPTS = [
  { label: "Red Points", prompt: "make points red" },
  { label: "Blue Points", prompt: "make points blue" },
  { label: "Larger", prompt: "increase point size" },
  { label: "Zoom Hangzhou", prompt: "zoom to Hangzhou" },
  { label: "Reset", prompt: "reset" },
];

export default function ChatPanel({ messages, status, onSend, onToggle }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <p className="text-xs text-brand-500 font-medium">GIS Engine</p>
          <h1 className="text-lg font-semibold">AI Map Studio</h1>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-300 text-lg"
          title="Close panel"
        >
          &lt;&lt;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-brand-700 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              <p>{msg.content}</p>
              {msg.status && (
                <span
                  className={`text-xs mt-1 inline-block ${
                    msg.status === "applied"
                      ? "text-green-400"
                      : msg.status === "blocked"
                        ? "text-red-400"
                        : "text-gray-400"
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

      {/* Quick prompts */}
      <div className="px-4 py-2 flex gap-1 flex-wrap border-t border-gray-800">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => onSend(qp.prompt)}
            className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your map change..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
            disabled={status === "thinking"}
          />
          <button
            type="submit"
            disabled={status === "thinking" || !input.trim()}
            className="bg-brand-500 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
          >
            {status === "thinking" ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {status === "thinking"
            ? "AI is thinking..."
            : status === "ready"
              ? "Ready for next edit"
              : status}
        </p>
      </form>
    </>
  );
}
