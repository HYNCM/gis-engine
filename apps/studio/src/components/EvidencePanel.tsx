import type { ChatMessage } from "../App";

interface Props {
  messages: ChatMessage[];
  onToggle: () => void;
}

export default function EvidencePanel({ messages, onToggle }: Props) {
  const evidenceMessages = messages.filter(
    (m) => m.role === "assistant" && m.evidence,
  );

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <p className="text-xs text-brand-500 font-medium">Evidence</p>
          <h2 className="text-sm font-semibold">Command Trail</h2>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-300 text-lg"
          title="Close panel"
        >
          &gt;&gt;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {evidenceMessages.length === 0 ? (
          <p className="text-xs text-gray-500">
            Send a map edit to see command evidence here.
          </p>
        ) : (
          evidenceMessages.map((msg, i) => (
            <div
              key={i}
              className="bg-gray-800 rounded-lg p-3 text-xs space-y-1"
            >
              <p className="text-gray-300 font-medium truncate">
                {msg.content.slice(0, 60)}
              </p>
              <div className="flex gap-2 text-gray-500">
                <span
                  className={
                    msg.status === "applied"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {msg.status}
                </span>
              </div>
              {msg.evidence && (
                <pre className="text-gray-500 overflow-x-auto text-[11px] mt-1">
                  {JSON.stringify(msg.evidence, null, 2).slice(0, 300)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
        <p>
          {evidenceMessages.length} evidence record
          {evidenceMessages.length !== 1 ? "s" : ""}
        </p>
      </div>
    </>
  );
}
